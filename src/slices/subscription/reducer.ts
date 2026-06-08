import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SubscriptionDetails } from "common/data_interfaces";

interface SubscriptionState {
    details: SubscriptionDetails | null;
    loading: boolean;
    submitting: boolean;
    error: string | null;
}

const initialState: SubscriptionState = {
    details: null,
    loading: false,
    submitting: false,
    error: null,
};

const subscriptionSlice = createSlice({
    name: "subscription",
    initialState,
    reducers: {
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setSubmitting(state, action: PayloadAction<boolean>) {
            state.submitting = action.payload;
        },
        setDetails(state, action: PayloadAction<SubscriptionDetails | null>) {
            state.details = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
    },
});

export const { setLoading, setSubmitting, setDetails, setError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
