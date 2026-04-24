import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FarmConfiguration, GlobalConfiguration } from 'common/data_interfaces';

interface ConfigurationsState {
    globalConfig: GlobalConfiguration | null;
    farmConfig: FarmConfiguration | null;
    loadingGlobal: boolean;
    loadingFarm: boolean;
    error: string | null;
}

const initialState: ConfigurationsState = {
    globalConfig: null,
    farmConfig: null,
    loadingGlobal: false,
    loadingFarm: false,
    error: null,
};

const configurationsSlice = createSlice({
    name: 'configurations',
    initialState,
    reducers: {
        setLoadingGlobal(state, action: PayloadAction<boolean>) {
            state.loadingGlobal = action.payload;
        },
        setLoadingFarm(state, action: PayloadAction<boolean>) {
            state.loadingFarm = action.payload;
        },
        setGlobalConfig(state, action: PayloadAction<GlobalConfiguration>) {
            state.globalConfig = action.payload;
            state.error = null;
        },
        setFarmConfig(state, action: PayloadAction<FarmConfiguration>) {
            state.farmConfig = action.payload;
            state.error = null;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        resetConfigurations(state) {
            state.globalConfig = null;
            state.farmConfig = null;
            state.loadingGlobal = false;
            state.loadingFarm = false;
            state.error = null;
        },
    },
});

export const {
    setLoadingGlobal,
    setLoadingFarm,
    setGlobalConfig,
    setFarmConfig,
    setError,
    resetConfigurations,
} = configurationsSlice.actions;

export default configurationsSlice.reducer;
