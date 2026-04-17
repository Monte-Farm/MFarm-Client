import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AiMessageRole = 'user' | 'assistant';

export interface AiMessage {
    role: AiMessageRole;
    text: string;
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
    setSending,
    setLoadingHistory,
    setError,
    resetConversation,
} = aiSlice.actions;

export default aiSlice.reducer;
