type Listener = () => void;

const listeners = new Set<Listener>();

export const emitSubscriptionWriteBlocked = () => {
    listeners.forEach((fn) => {
        try { fn(); } catch { /* ignore */ }
    });
};

export const onSubscriptionWriteBlocked = (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
