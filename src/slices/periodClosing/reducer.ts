import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    PeriodClosing,
    PeriodClosingListItem,
    PeriodClosingAuditEvent,
    PeriodClosingPagination,
    PeriodClosingByPeriod,
    PrecheckResponse,
} from 'common/data_interfaces';

interface PeriodClosingState {
    items: PeriodClosingListItem[];
    pagination: PeriodClosingPagination;
    loadingList: boolean;
    current: PeriodClosing | null;
    loadingDetail: boolean;
    audit: PeriodClosingAuditEvent[];
    loadingAudit: boolean;
    byPeriod: PeriodClosingByPeriod | null;
    loadingByPeriod: boolean;
    precheck: PrecheckResponse | null;
    loadingPrecheck: boolean;
    precheckError: string | null;
    submitting: boolean;
    error: string | null;
}

const initialState: PeriodClosingState = {
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loadingList: false,
    current: null,
    loadingDetail: false,
    audit: [],
    loadingAudit: false,
    byPeriod: null,
    loadingByPeriod: false,
    precheck: null,
    loadingPrecheck: false,
    precheckError: null,
    submitting: false,
    error: null,
};

const periodClosingSlice = createSlice({
    name: 'periodClosing',
    initialState,
    reducers: {
        setLoadingList(state, action: PayloadAction<boolean>) {
            state.loadingList = action.payload;
        },
        setList(state, action: PayloadAction<{ items: PeriodClosingListItem[]; pagination: PeriodClosingPagination }>) {
            state.items = action.payload.items;
            state.pagination = action.payload.pagination;
        },
        setLoadingDetail(state, action: PayloadAction<boolean>) {
            state.loadingDetail = action.payload;
        },
        setCurrent(state, action: PayloadAction<PeriodClosing | null>) {
            state.current = action.payload;
        },
        setLoadingAudit(state, action: PayloadAction<boolean>) {
            state.loadingAudit = action.payload;
        },
        setAudit(state, action: PayloadAction<PeriodClosingAuditEvent[]>) {
            state.audit = action.payload;
        },
        setLoadingByPeriod(state, action: PayloadAction<boolean>) {
            state.loadingByPeriod = action.payload;
        },
        setByPeriod(state, action: PayloadAction<PeriodClosingByPeriod | null>) {
            state.byPeriod = action.payload;
        },
        setLoadingPrecheck(state, action: PayloadAction<boolean>) {
            state.loadingPrecheck = action.payload;
        },
        setPrecheck(state, action: PayloadAction<PrecheckResponse | null>) {
            state.precheck = action.payload;
        },
        setPrecheckError(state, action: PayloadAction<string | null>) {
            state.precheckError = action.payload;
        },
        setSubmitting(state, action: PayloadAction<boolean>) {
            state.submitting = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        resetPeriodClosing(state) {
            state.items = [];
            state.pagination = initialState.pagination;
            state.current = null;
            state.audit = [];
            state.byPeriod = null;
            state.precheck = null;
            state.error = null;
        },
    },
});

export const {
    setLoadingList,
    setList,
    setLoadingDetail,
    setCurrent,
    setLoadingAudit,
    setAudit,
    setLoadingByPeriod,
    setByPeriod,
    setLoadingPrecheck,
    setPrecheck,
    setPrecheckError,
    setSubmitting,
    setError,
    resetPeriodClosing,
} = periodClosingSlice.actions;

export default periodClosingSlice.reducer;
