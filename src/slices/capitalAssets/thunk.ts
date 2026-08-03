import { APIClient } from 'helpers/api_helper';
import { CAPITAL_ASSET_URLS } from 'helpers/capital_assets_urls';
import {
    setLoading,
    setList,
    setLoadingDetail,
    setCurrent,
    setLoadingSummary,
    setSummary,
    setSubmitting,
    setError,
} from './reducer';

const api = new APIClient();

interface FetchAssetsParams {
    status?: 'active' | 'amortized';
    category?: string;
    page?: number;
    limit?: number;
}

export const fetchCapitalAssets = (farmId: string, params?: FetchAssetsParams) => async (dispatch: any) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const query: Record<string, any> = {};
        if (params?.status) query.status = params.status;
        if (params?.category) query.category = params.category;
        if (params?.page) query.page = params.page;
        if (params?.limit) query.limit = params.limit;

        const res = await api.get(CAPITAL_ASSET_URLS.list(farmId), query);
        const data = res.data.data;
        dispatch(setList({
            data: data.data || [],
            total: data.total || 0,
            page: data.page || 1,
            limit: data.limit || 20,
        }));
    } catch (err: any) {
        dispatch(setError(err?.response?.data?.message || 'Error al cargar los activos de capital'));
    } finally {
        dispatch(setLoading(false));
    }
};

export const fetchCapitalAssetDetail = (assetId: string) => async (dispatch: any) => {
    dispatch(setLoadingDetail(true));
    dispatch(setError(null));
    try {
        const res = await api.get(CAPITAL_ASSET_URLS.detail(assetId));
        dispatch(setCurrent(res.data.data));
    } catch (err: any) {
        dispatch(setError(err?.response?.data?.message || 'Error al cargar el activo'));
        dispatch(setCurrent(null));
    } finally {
        dispatch(setLoadingDetail(false));
    }
};

export const fetchCapitalAssetsSummary = (farmId: string) => async (dispatch: any) => {
    dispatch(setLoadingSummary(true));
    try {
        const res = await api.get(CAPITAL_ASSET_URLS.summary(farmId));
        dispatch(setSummary(res.data.data));
    } catch {
        dispatch(setSummary(null));
    } finally {
        dispatch(setLoadingSummary(false));
    }
};

interface CreateAssetPayload {
    farm: string;
    name: string;
    description?: string;
    category: string;
    acquisitionDate: string;
    acquisitionCost: number;
    amortizationStartDate: string;
    totalMonths: number;
}

export const createCapitalAsset = (payload: CreateAssetPayload) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const res = await api.create(CAPITAL_ASSET_URLS.create, payload);
        return res.data.data;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al crear el activo de capital';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};

interface UpdateAssetPayload {
    name?: string;
    description?: string;
    category?: string;
}

export const updateCapitalAsset = (assetId: string, payload: UpdateAssetPayload) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const res = await api.update(CAPITAL_ASSET_URLS.update(assetId), payload);
        return res.data.data;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al actualizar el activo';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};

interface AdjustAssetPayload {
    newRemainingMonths: number;
    reason?: string;
}

export const adjustCapitalAsset = (assetId: string, payload: AdjustAssetPayload) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const res = await api.update(CAPITAL_ASSET_URLS.adjust(assetId), payload);
        return res.data.data;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al ajustar los meses del activo';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const deleteCapitalAsset = (assetId: string) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        await api.delete(CAPITAL_ASSET_URLS.delete(assetId));
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al eliminar el activo';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const triggerBackfill = (farmId?: string) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const url = farmId
            ? `${CAPITAL_ASSET_URLS.backfill}?farmId=${farmId}`
            : CAPITAL_ASSET_URLS.backfill;
        const res = await api.create(url, {});
        return res.data.data;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al ejecutar el backfill';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};
