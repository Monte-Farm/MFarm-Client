export interface SubscriptionLimitEventPayload {
    message: string;
    error: string;
}

type Listener = (payload: SubscriptionLimitEventPayload) => void;

const listeners = new Set<Listener>();

export const emitSubscriptionLimit = (payload: SubscriptionLimitEventPayload) => {
    listeners.forEach((fn) => {
        try { fn(payload); } catch { /* ignore listener errors */ }
    });
};

export const onSubscriptionLimit = (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
