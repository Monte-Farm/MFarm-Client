import { APIClient } from 'helpers/api_helper';
import { CONFIGURATION_URLS } from 'helpers/configurations_urls';
import { FarmConfiguration, GlobalConfiguration } from 'common/data_interfaces';
import {
    setLoadingGlobal,
    setLoadingFarm,
    setGlobalConfig,
    setFarmConfig,
    setError,
} from './reducer';

const api = new APIClient();

export const fetchGlobalConfig = () => async (dispatch: any) => {
    dispatch(setLoadingGlobal(true));
    try {
        const res = await api.get(CONFIGURATION_URLS.getGlobal);
        dispatch(setGlobalConfig(res.data.data));
    } catch (error: any) {
        dispatch(setError(error?.message ?? 'Error fetching global configuration'));
    } finally {
        dispatch(setLoadingGlobal(false));
    }
};

export const updateGlobalConfig = (payload: Partial<GlobalConfiguration>) => async (dispatch: any) => {
    dispatch(setLoadingGlobal(true));
    try {
        const res = await api.put(CONFIGURATION_URLS.updateGlobal, payload);
        dispatch(setGlobalConfig(res.data.data));
        return { ok: true as const, data: res.data.data as GlobalConfiguration };
    } catch (error: any) {
        dispatch(setError(error?.message ?? 'Error updating global configuration'));
        return { ok: false as const, error };
    } finally {
        dispatch(setLoadingGlobal(false));
    }
};

export const fetchFarmConfig = (farmId: string) => async (dispatch: any) => {
    dispatch(setLoadingFarm(true));
    try {
        const res = await api.get(CONFIGURATION_URLS.getFarm(farmId));
        dispatch(setFarmConfig(res.data.data));
    } catch (error: any) {
        dispatch(setError(error?.message ?? 'Error fetching farm configuration'));
    } finally {
        dispatch(setLoadingFarm(false));
    }
};

export const updateFarmConfig = (farmId: string, payload: Partial<FarmConfiguration>) => async (dispatch: any) => {
    dispatch(setLoadingFarm(true));
    try {
        const res = await api.put(CONFIGURATION_URLS.updateFarm(farmId), payload);
        dispatch(setFarmConfig(res.data.data));
        return { ok: true as const, data: res.data.data as FarmConfiguration };
    } catch (error: any) {
        dispatch(setError(error?.message ?? 'Error updating farm configuration'));
        return { ok: false as const, error };
    } finally {
        dispatch(setLoadingFarm(false));
    }
};
