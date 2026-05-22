import { APIClient } from 'helpers/api_helper';
import { PERIOD_CLOSING_URLS } from 'helpers/period_closing_urls';
import {
    setLoadingList,
    setList,
    setLoadingDetail,
    setCurrent,
    setLoadingAudit,
    setAudit,
    setLoadingByPeriod,
    setByPeriod,
    setSubmitting,
    setError,
} from './reducer';

const api = new APIClient();

interface FetchListParams {
    farmId?: string;
    isGlobal?: boolean;
    periodType?: string;
    year?: number;
    status?: string;
    page?: number;
    limit?: number;
}

export const fetchPeriodClosings = (params: FetchListParams) => async (dispatch: any) => {
    const { farmId, isGlobal, ...query } = params;
    dispatch(setLoadingList(true));
    dispatch(setError(null));
    try {
        const cleaned: Record<string, any> = {};
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') cleaned[k === 'periodType' ? 'period_type' : k] = v;
        });
        const url = isGlobal ? PERIOD_CLOSING_URLS.listGlobal() : PERIOD_CLOSING_URLS.list(farmId || '');
        const res = await api.get(url, cleaned);
        const data = res.data;
        dispatch(setList({
            items: data.items || [],
            pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
        }));
    } catch (err: any) {
        dispatch(setError(err?.response?.data?.message || 'Error al cargar los cierres'));
    } finally {
        dispatch(setLoadingList(false));
    }
};

export const fetchPeriodClosingDetail = (closingId: string) => async (dispatch: any) => {
    dispatch(setLoadingDetail(true));
    dispatch(setError(null));
    try {
        const res = await api.get(PERIOD_CLOSING_URLS.detail(closingId));
        dispatch(setCurrent(res.data.data));
    } catch (err: any) {
        dispatch(setError(err?.response?.data?.message || 'Error al cargar el cierre'));
        dispatch(setCurrent(null));
    } finally {
        dispatch(setLoadingDetail(false));
    }
};

export const fetchPeriodClosingAudit = (closingId: string) => async (dispatch: any) => {
    dispatch(setLoadingAudit(true));
    try {
        const res = await api.get(PERIOD_CLOSING_URLS.audit(closingId));
        dispatch(setAudit(res.data.items || []));
    } catch {
        dispatch(setAudit([]));
    } finally {
        dispatch(setLoadingAudit(false));
    }
};

export const fetchClosingByPeriod = (farmId: string, periodType: string, year: number, month: number) =>
    async (dispatch: any) => {
        dispatch(setLoadingByPeriod(true));
        try {
            const res = await api.get(PERIOD_CLOSING_URLS.byPeriod(farmId), {
                period_type: periodType,
                year,
                month,
            });
            dispatch(setByPeriod(res.data.data));
        } catch {
            dispatch(setByPeriod(null));
        } finally {
            dispatch(setLoadingByPeriod(false));
        }
    };

interface ClosePeriodPayload {
    period_type: 'monthly' | 'annual';
    year: number;
    month?: number;
    notes?: string;
    force?: boolean;
    forceReason?: string;
}

export const closePeriod = (farmId: string, payload: ClosePeriodPayload) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const res = await api.create(PERIOD_CLOSING_URLS.close(farmId), payload);
        return res.data.data;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al cerrar el periodo';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const reopenPeriod = (closingId: string, reason: string) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const res = await api.create(PERIOD_CLOSING_URLS.reopen(closingId), { reason });
        return res.data.data;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al reabrir el cierre';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};
