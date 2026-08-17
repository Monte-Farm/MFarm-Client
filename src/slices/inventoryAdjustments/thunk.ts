import { APIClient } from 'helpers/api_helper';
import { INVENTORY_ADJUSTMENT_URLS } from 'helpers/inventory_adjustments_urls';
import { AdjustmentDirection, AdjustmentType } from 'common/data_interfaces';
import { setLoading, setSubmitting, setReverting, setItems, upsertItem, setError } from './reducer';

const api = new APIClient();

export interface FetchAdjustmentsParams {
    farmId: string;
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
}

export interface CreateAdjustmentPayload {
    farmId: string;
    warehouseId: string;
    date: string;
    direction: AdjustmentDirection;
    adjustmentType: AdjustmentType;
    reason: string;
    products: Array<{ productId: string; adjustedQuantity: number }>;
    notes?: string;
}

export interface RevertAdjustmentPayload {
    revertReason: string;
}

export const fetchAdjustments = (params: FetchAdjustmentsParams) => async (dispatch: any) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const query: Record<string, any> = { farmId: params.farmId };
        if (params.warehouseId) query.warehouseId = params.warehouseId;
        if (params.startDate) query.startDate = params.startDate;
        if (params.endDate) query.endDate = params.endDate;

        const res = await api.get(INVENTORY_ADJUSTMENT_URLS.list, query);
        dispatch(setItems(res.data.data || res.data || []));
    } catch (err: any) {
        dispatch(setError(err?.response?.data?.message || 'Error al cargar los ajustes'));
    } finally {
        dispatch(setLoading(false));
    }
};

export const createAdjustment = (payload: CreateAdjustmentPayload) => async (dispatch: any) => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
        const res = await api.create(INVENTORY_ADJUSTMENT_URLS.create, payload);
        const created = res.data.data || res.data;
        dispatch(upsertItem(created));
        return created;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al crear el ajuste';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const revertAdjustment = (id: string, payload: RevertAdjustmentPayload) => async (dispatch: any) => {
    dispatch(setReverting(true));
    dispatch(setError(null));
    try {
        const res = await api.update(INVENTORY_ADJUSTMENT_URLS.revert(id), payload);
        const updated = res.data.data || res.data;
        dispatch(upsertItem(updated));
        return updated;
    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al revertir el ajuste';
        dispatch(setError(msg));
        throw err;
    } finally {
        dispatch(setReverting(false));
    }
};
