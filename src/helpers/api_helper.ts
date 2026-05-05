import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import config from "../config";
import { emitPeriodClosed } from "../utils/periodClosedEvents";

const { api } = config;

// default
axios.defaults.baseURL = api.API_URL;
// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

const getInitialToken = (): string | null => {
  try {
    const raw = sessionStorage.getItem("authUser");
    if (!raw) return null;
    return JSON.parse(raw)?.token ?? null;
  } catch {
    return null;
  }
};

const token = getInitialToken();
if (token)
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;

// Response interceptor: catch 409 PERIOD_CLOSED and fire global event
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    if (error?.response?.status === 409 && data?.error === "PERIOD_CLOSED") {
      emitPeriodClosed({
        closingId: data.closingId,
        periodLabel: data.periodLabel,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        closedAt: data.closedAt,
        closedBy: data.closedBy || null,
        message: data.message || "No se puede operar en este periodo porque ya fue cerrado.",
      });
      // Mark the error so caller catches can skip showing their own generic error UI
      if (error) (error as any).__periodClosed = true;
    }
    return Promise.reject(error);
  }
);

/**
 * Helper for catch blocks: returns true if the error was already handled by the
 * global PERIOD_CLOSED modal and the caller should NOT show any additional UI.
 */
export const isPeriodClosedError = (err: any): boolean => {
  if (!err) return false;
  if (err.__periodClosed) return true;
  const data = err?.response?.data;
  return err?.response?.status === 409 && data?.error === "PERIOD_CLOSED";
};

/**
 * Sets the default authorization
 * @param {*} token
 */
const setAuthorization = (token: string) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

class APIClient {
  /**
   * Fetches data from the given URL
   */
  get = (url: string, params?: any): Promise<AxiosResponse> => {
    return axios.get(url, {
      params,
    });
  };

  getBlob = (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
    return axios.get(url, {
      ...config,
      responseType: 'blob',
    });
  };


  /**
   * Posts the given data to the URL
   */
  create = (url: string, data: any): Promise<AxiosResponse> => {
    return axios.post(url, data);
  };

  postBlob = (url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
    return axios.post(url, data, config);
  };

  /**
  * Uploads an image
  */
  uploadImage = (url: string, file: File): Promise<AxiosResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  /**
   * Updates data
   */
  update = (url: string, data: any): Promise<AxiosResponse> => {
    return axios.patch(url, data);
  };

  put = (url: string, data: any): Promise<AxiosResponse> => {
    return axios.put(url, data);
  };

  /**
   * Deletes data
   */
  delete = (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
    return axios.delete(url, { ...config });
  };
}

const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export { APIClient, setAuthorization, getLoggedinUser };