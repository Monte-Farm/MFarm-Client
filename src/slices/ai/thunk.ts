import { APIClient } from 'helpers/api_helper';
import {
    appendMessage,
    resetConversation,
    setActiveConversationId,
    setError,
    setLoadingHistory,
    setMessages,
    setSending,
    AiMessage,
} from './reducer';

const api = new APIClient();

const STORAGE_KEY = 'mfarm_ai_conversationId';

export const loadPersistedConversationId = (): string | null => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const persistConversationId = (id: string | null) => {
    try {
        if (id) localStorage.setItem(STORAGE_KEY, id);
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore storage errors
    }
};

const errorMessageFromStatus = (status?: number, backendMessage?: string): string => {
    switch (status) {
        case 400:
            if (backendMessage && backendMessage.toLowerCase().includes('farm')) {
                return 'Debes tener una granja asignada para usar el asistente.';
            }
            return 'No se pudo procesar la solicitud. Intenta de nuevo.';
        case 401:
            return 'Tu sesión expiró. Inicia sesión de nuevo.';
        case 429:
            return 'Has hecho muchas preguntas seguidas. Espera un momento e intenta de nuevo.';
        case 500:
        default:
            return 'No se pudo conectar con el asistente. Intenta de nuevo.';
    }
};

export const loadConversation = (conversationId: string) => async (dispatch: any) => {
    dispatch(setLoadingHistory(true));
    dispatch(setError(null));
    try {
        const res = await api.get(`/ai/conversations/${conversationId}`);
        const data = res.data.data;
        const messages: AiMessage[] = Array.isArray(data?.messages) ? data.messages : [];
        dispatch(setMessages(messages));
        dispatch(setActiveConversationId(conversationId));
    } catch (err: any) {
        const status = err?.response?.status;
        if (status === 400) {
            persistConversationId(null);
            dispatch(resetConversation());
        } else {
            dispatch(setError(errorMessageFromStatus(status)));
        }
    } finally {
        dispatch(setLoadingHistory(false));
    }
};

export const sendMessage = (message: string) => async (dispatch: any, getState: any) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const { activeConversationId } = getState().Ai;

    dispatch(appendMessage({ role: 'user', text: trimmed }));
    dispatch(setSending(true));
    dispatch(setError(null));

    try {
        const body: { message: string; conversationId?: string } = { message: trimmed };
        if (activeConversationId) body.conversationId = activeConversationId;

        const res = await api.create('/ai/chat', body);
        const data = res.data.data;

        if (data?.conversationId && data.conversationId !== activeConversationId) {
            dispatch(setActiveConversationId(data.conversationId));
            persistConversationId(data.conversationId);
        }
        dispatch(appendMessage({ role: 'assistant', text: data?.reply ?? '' }));
    } catch (err: any) {
        const status = err?.response?.status;
        const backendMessage = err?.response?.data?.statusMessage;
        dispatch(setError(errorMessageFromStatus(status, backendMessage)));
    } finally {
        dispatch(setSending(false));
    }
};

export const startNewConversation = () => (dispatch: any) => {
    persistConversationId(null);
    dispatch(resetConversation());
};
