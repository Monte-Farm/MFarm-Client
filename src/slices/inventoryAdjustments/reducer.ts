import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryAdjustment } from 'common/data_interfaces';

interface InventoryAdjustmentsState {
    items: InventoryAdjustment[];
    loading: boolean;
    submitting: boolean;
    reverting: boolean;
    error: string | null;
}

const initialState: InventoryAdjustmentsState = {
    items: [],
    loading: false,
    submitting: false,
    reverting: false,
    error: null,
};

const inventoryAdjustmentsSlice = createSlice({
    name: 'inventoryAdjustments',
    initialState,
    reducers: {
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setSubmitting(state, action: PayloadAction<boolean>) {
            state.submitting = action.payload;
        },
        setReverting(state, action: PayloadAction<boolean>) {
            state.reverting = action.payload;
        },
        setItems(state, action: PayloadAction<InventoryAdjustment[]>) {
            state.items = action.payload;
        },
        upsertItem(state, action: PayloadAction<InventoryAdjustment>) {
            const idx = state.items.findIndex(i => i._id === action.payload._id);
            if (idx >= 0) {
                state.items[idx] = action.payload;
            } else {
                state.items.unshift(action.payload);
            }
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        resetAdjustments(state) {
            state.items = [];
            state.error = null;
        },
    },
});

export const {
    setLoading,
    setSubmitting,
    setReverting,
    setItems,
    upsertItem,
    setError,
    resetAdjustments,
} = inventoryAdjustmentsSlice.actions;

export default inventoryAdjustmentsSlice.reducer;
