import { ClosingSnapshotMeta } from "common/data_interfaces";

const CURRENCY_LOCALE_MAP: Record<string, string> = {
    MXN: "es-MX",
    USD: "en-US",
    EUR: "es-ES",
};

export const formatCurrency = (value: number | null | undefined, meta?: Partial<ClosingSnapshotMeta>): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    const currency = meta?.currency || "MXN";
    const locale = CURRENCY_LOCALE_MAP[currency] || "es-MX";
    try {
        return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
    } catch {
        const symbol = meta?.currencySymbol || "$";
        return `${symbol}${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
};

export const formatNumber = (value: number | null | undefined, fractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    return value.toLocaleString("es-MX", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

export const formatWeightKg = (value: number | null | undefined, fractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    return `${value.toLocaleString("es-MX", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} kg`;
};

/**
 * Values come as decimals from backend (0.0425 = 4.25%). This multiplies ×100.
 */
export const formatPercentDecimal = (value: number | null | undefined, fractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    return `${(value * 100).toFixed(fractionDigits)}%`;
};

/**
 * Values already expressed as whole percents (ej operatingMargin: 30.0 → "30.0%").
 */
export const formatPercent = (value: number | null | undefined, fractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    return `${value.toFixed(fractionDigits)}%`;
};

export const STAGE_LABELS: Record<string, string> = {
    piglet: "Lechones",
    weaning: "Destete",
    fattening: "Engorda",
    gestation: "Gestación",
    breeder: "Reproductores",
    lactation: "Lactancia",
    replacement: "Reemplazo",
};

export const stageLabel = (stage: string): string => STAGE_LABELS[stage] || stage;
