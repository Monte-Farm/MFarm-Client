import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CapitalAsset, CapitalAssetsSummary } from 'common/data_interfaces';

interface CapitalAssetsPagination {
    total: number;
    page: number;
    limit: number;
}

interface CapitalAssetsState {
    items: CapitalAsset[];
    pagination: CapitalAssetsPagination;
    loading: boolean;
    current: CapitalAsset | null;
    loadingDetail: boolean;
    summary: CapitalAssetsSummary | null;
    loadingSummary: boolean;
    submitting: boolean;
    error: string | null;
}

const initialState: CapitalAssetsState = {
    items: [],
    pagination: { total: 0, page: 1, limit: 20 },
    loading: false,
    current: null,
    loadingDetail: false,
    summary: null,
    loadingSummary: false,
    submitting: false,
    error: null,
};

const capitalAssetsSlice = createSlice({
    name: 'capitalAssets',
    initialState,
    reducers: {
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setList(state, action: PayloadAction<{ data: CapitalAsset[]; total: number; page: number; limit: number }>) {
            state.items = action.payload.data;
            state.pagination = {
                total: action.payload.total,
                page: action.payload.page,
                limit: action.payload.limit,
            };
        },
        setLoadingDetail(state, action: PayloadAction<boolean>) {
            state.loadingDetail = action.payload;
        },
        setCurrent(state, action: PayloadAction<CapitalAsset | null>) {
            state.current = action.payload;
        },
        setLoadingSummary(state, action: PayloadAction<boolean>) {
            state.loadingSummary = action.payload;
        },
        setSummary(state, action: PayloadAction<CapitalAssetsSummary | null>) {
            state.summary = action.payload;
        },
        setSubmitting(state, action: PayloadAction<boolean>) {
            state.submitting = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        resetCapitalAssets(state) {
            state.items = [];
            state.pagination = initialState.pagination;
            state.current = null;
            state.summary = null;
            state.error = null;
        },
    },
});

export const {
    setLoading,
    setList,
    setLoadingDetail,
    setCurrent,
    setLoadingSummary,
    setSummary,
    setSubmitting,
    setError,
    resetCapitalAssets,
} = capitalAssetsSlice.actions;

export default capitalAssetsSlice.reducer;
