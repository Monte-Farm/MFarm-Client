import { APIClient } from "helpers/api_helper";
import { SUBSCRIPTION_URLS } from "helpers/subscription_urls";
import { setLoading, setSubmitting, setDetails, setError } from "./reducer";
import { setSubscriptionStatus } from "utils/subscriptionStore";

const api = new APIClient();

export const fetchSubscriptionDetails = () => async (dispatch: any) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await api.get(SUBSCRIPTION_URLS.details());
        const details = res.data.data;
        dispatch(setDetails(details));
        setSubscriptionStatus(details?.status ?? null);
    } catch (err: any) {
        dispatch(setError(err?.response?.data?.message || "Error al cargar la suscripción"));
    } finally {
        dispatch(setLoading(false));
    }
};

export const updateSubscription = (payload: Record<string, any>) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        await api.update(SUBSCRIPTION_URLS.update(), payload);
        dispatch(fetchSubscriptionDetails());
    } catch (err: any) {
        const msg = err?.response?.data?.message || "Error al actualizar la suscripción";
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};
