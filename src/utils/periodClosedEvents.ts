export interface PeriodClosedEventPayload {
    closingId: string;
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    closedAt: string;
    closedBy: { _id: string; name: string; lastname: string } | null;
    message: string;
}

type Listener = (payload: PeriodClosedEventPayload) => void;

const listeners = new Set<Listener>();
let lastEmittedAt = 0;

/**
 * Window (ms) during which a generic ErrorModal should auto-suppress itself
 * because the PERIOD_CLOSED global modal is taking over.
 */
export const PERIOD_CLOSED_SUPPRESSION_MS = 1500;

export const emitPeriodClosed = (payload: PeriodClosedEventPayload) => {
    lastEmittedAt = Date.now();
    listeners.forEach((fn) => {
        try { fn(payload); } catch { /* ignore listener errors */ }
    });
};

export const onPeriodClosed = (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};

/**
 * True if a PERIOD_CLOSED event was emitted within the suppression window.
 * Used by ErrorModal to hide itself so only the global modal is visible.
 */
export const wasPeriodClosedRecently = (): boolean => {
    return Date.now() - lastEmittedAt < PERIOD_CLOSED_SUPPRESSION_MS;
};
