import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AiMessageRole = 'user' | 'assistant';

export type ChartType = 'bar' | 'line' | 'pie' | 'stacked-bar';

export interface ChartPoint {
    x: string | number;
    y: number;
}

export interface ChartSeries {
    name: string;
    data: ChartPoint[];
}

export interface ChartSpec {
    type: ChartType;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    unit?: string;
    series: ChartSeries[];
}

export interface AiReport {
    section: string;
    format: 'pdf';
    filename: string;
    reportUrl: string;
    bytes: number;
    expiresAt: string;
}

export interface AiMessage {
    role: AiMessageRole;
    text: string;
    chart?: ChartSpec | null;
    report?: AiReport | null;
}

interface AiState {
    isOpen: boolean;
    activeConversationId: string | null;
    messages: AiMessage[];
    sending: boolean;
    loadingHistory: boolean;
    error: string | null;
}

const initialState: AiState = {
    isOpen: false,
    activeConversationId: null,
    messages: [],
    sending: false,
    loadingHistory: false,
    error: null,
};

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        setOpen(state, action: PayloadAction<boolean>) {
            state.isOpen = action.payload;
        },
        toggleOpen(state) {
            state.isOpen = !state.isOpen;
        },
        setActiveConversationId(state, action: PayloadAction<string | null>) {
            state.activeConversationId = action.payload;
        },
        setMessages(state, action: PayloadAction<AiMessage[]>) {
            state.messages = action.payload;
        },
        appendMessage(state, action: PayloadAction<AiMessage>) {
            state.messages.push(action.payload);
        },
        appendDeltaToLastAssistant(state, action: PayloadAction<string>) {
            const last = state.messages[state.messages.length - 1];
            if (last && last.role === 'assistant') {
                last.text += action.payload;
            } else {
                state.messages.push({ role: 'assistant', text: action.payload });
            }
        },
        setChartOnLastAssistant(state, action: PayloadAction<ChartSpec | null>) {
            const last = state.messages[state.messages.length - 1];
            if (last && last.role === 'assistant') {
                last.chart = action.payload;
            } else {
                state.messages.push({ role: 'assistant', text: '', chart: action.payload });
            }
        },
        setReportOnLastAssistant(state, action: PayloadAction<AiReport | null>) {
            const last = state.messages[state.messages.length - 1];
            if (last && last.role === 'assistant') {
                last.report = action.payload;
            } else {
                state.messages.push({ role: 'assistant', text: '', report: action.payload });
            }
        },
        setSending(state, action: PayloadAction<boolean>) {
            state.sending = action.payload;
        },
        setLoadingHistory(state, action: PayloadAction<boolean>) {
            state.loadingHistory = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        resetConversation(state) {
            state.activeConversationId = null;
            state.messages = [];
            state.error = null;
        },
    },
});

export const {
    setOpen,
    toggleOpen,
    setActiveConversationId,
    setMessages,
    appendMessage,
    appendDeltaToLastAssistant,
    setChartOnLastAssistant,
    setReportOnLastAssistant,
    setSending,
    setLoadingHistory,
    setError,
    resetConversation,
} = aiSlice.actions;

export default aiSlice.reducer;
