import { APIClient } from 'helpers/api_helper';
import config from 'config';
import { getEffectiveUser } from 'helpers/impersonation_helper';
import {
    appendDeltaToLastAssistant,
    appendMessage,
    resetConversation,
    setActiveConversationId,
    setActiveRequestId,
    setChartOnLastAssistant,
    setError,
    setLoadingHistory,
    setMessages,
    setReportOnLastAssistant,
    setSending,
    AiMessage,
    AiReport,
    ChartSpec,
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

const getAuthToken = (): string | null => {
    try {
        const raw = sessionStorage.getItem('authUser');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token ?? null;
    } catch {
        return null;
    }
};

export const sendMessage = (message: string) => async (dispatch: any, getState: any) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const { activeConversationId } = getState().Ai;

    dispatch(appendMessage({ role: 'user', text: trimmed }));
    dispatch(setSending(true));
    dispatch(setError(null));

    const token = getAuthToken();
    let assistantStarted = false;
    let fullReply = '';
    let chartApplied = false;
    let reportApplied = false;
    let streamConversationId: string | null = activeConversationId;

    try {
        const effectiveUser = getEffectiveUser();
        const farmId: string | null = effectiveUser?.farm_assigned ?? null;

        const body: { message: string; conversationId?: string; farmId?: string | null } = {
            message: trimmed,
            farmId,
        };
        if (activeConversationId) body.conversationId = activeConversationId;

        const res = await fetch(`${config.api.API_URL}/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token ?? ''}`,
                Accept: 'text/event-stream',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok || !res.body) {
            const backendMessage = await res.text().catch(() => undefined);
            dispatch(setError(errorMessageFromStatus(res.status, backendMessage)));
            dispatch(setSending(false));
            return;
        }

        const ensureAssistantBubble = () => {
            if (!assistantStarted) {
                dispatch(appendMessage({ role: 'assistant', text: '' }));
                assistantStarted = true;
            }
        };

        const handleEvent = (evt: any) => {
            switch (evt?.type) {
                case 'start':
                    if (evt.requestId) {
                        dispatch(setActiveRequestId(evt.requestId));
                    }
                    if (evt.conversationId) {
                        streamConversationId = evt.conversationId;
                        if (evt.conversationId !== activeConversationId) {
                            dispatch(setActiveConversationId(evt.conversationId));
                            persistConversationId(evt.conversationId);
                        }
                    }
                    break;
                case 'cancelled':
                    dispatch(setActiveRequestId(null));
                    dispatch(setSending(false));
                    break;
                case 'text_delta':
                    if (typeof evt.text === 'string' && evt.text) {
                        ensureAssistantBubble();
                        fullReply += evt.text;
                        dispatch(appendDeltaToLastAssistant(evt.text));
                    }
                    break;
                case 'chart_spec':
                    if (evt.chart) {
                        ensureAssistantBubble();
                        dispatch(setChartOnLastAssistant(evt.chart as ChartSpec));
                        chartApplied = true;
                    }
                    break;
                case 'report_ready':
                    if (evt.report) {
                        ensureAssistantBubble();
                        dispatch(setReportOnLastAssistant(evt.report as AiReport));
                        reportApplied = true;
                    }
                    break;
                case 'done':
                    if (evt.conversationId && evt.conversationId !== streamConversationId) {
                        streamConversationId = evt.conversationId;
                        dispatch(setActiveConversationId(evt.conversationId));
                        persistConversationId(evt.conversationId);
                    }
                    // Fallback: if we got no deltas but a final reply, use it.
                    if (!fullReply && typeof evt.reply === 'string' && evt.reply) {
                        ensureAssistantBubble();
                        dispatch(appendDeltaToLastAssistant(evt.reply));
                    }
                    // Fallback: chart_spec may not have arrived; done carries it too.
                    if (!chartApplied && evt.chart) {
                        ensureAssistantBubble();
                        dispatch(setChartOnLastAssistant(evt.chart as ChartSpec));
                    }
                    if (!reportApplied && evt.report) {
                        ensureAssistantBubble();
                        dispatch(setReportOnLastAssistant(evt.report as AiReport));
                    }
                    break;
                case 'error':
                    dispatch(setActiveRequestId(null));
                    dispatch(setError(evt.message || errorMessageFromStatus()));
                    break;
                default:
                    // Ignore thinking_*, tool_*, iteration — not rendered in MVP.
                    break;
            }
        };

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
                const frame = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);
                for (const line of frame.split('\n')) {
                    if (!line.startsWith('data:')) continue;
                    const payload = line.slice(5).trim();
                    if (!payload) continue;
                    try {
                        handleEvent(JSON.parse(payload));
                    } catch {
                        // ignore malformed frame
                    }
                }
            }
        }
    } catch (err: any) {
        const status = err?.response?.status;
        const backendMessage = err?.response?.data?.statusMessage ?? err?.message;
        dispatch(setError(errorMessageFromStatus(status, backendMessage)));
    } finally {
        dispatch(setActiveRequestId(null));
        dispatch(setSending(false));
    }
};

export const cancelStream = () => async (dispatch: any, getState: any) => {
    const { activeRequestId } = getState().Ai;
    if (!activeRequestId) return;
    const token = getAuthToken();
    try {
        await fetch(`${config.api.API_URL}/ai/chat/stream/${activeRequestId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token ?? ''}` },
        });
        // The `cancelled` SSE event will arrive and clean up state.
    } catch {
        // If the request fails (e.g. network error), clean up manually.
        dispatch(setActiveRequestId(null));
        dispatch(setSending(false));
    }
};

export const startNewConversation = () => (dispatch: any) => {
    persistConversationId(null);
    dispatch(resetConversation());
};
