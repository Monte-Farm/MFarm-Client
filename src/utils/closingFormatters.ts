import { ClosingSnapshotMeta } from "common/data_interfaces";

const CURRENCY_LOCALE_MAP: Record<string, string> = {
    MXN: "es-MX",
    USD: "en-US",
    EUR: "es-ES",
};

export type WeightUnit = 'kg' | 'lb';
export const KG_TO_LB = 2.20462;

/** Convert a value stored in kg to the display unit. */
export const convertWeightFromKg = (value: number | null | undefined, unit: WeightUnit): number | null => {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    return unit === 'lb' ? value * KG_TO_LB : value;
};

/** Format a weight value (stored in kg) into the display unit with its label. */
export const formatWeight = (value: number | null | undefined, unit: WeightUnit = 'kg', fractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    const converted = unit === 'lb' ? value * KG_TO_LB : value;
    return `${converted.toLocaleString("es-MX", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} ${unit}`;
};

/**
 * Format a price-per-kg value into the display unit.
 * price/kg → price/lb means dividing by 2.20462.
 */
export const formatPricePerWeight = (
    value: number | null | undefined,
    unit: WeightUnit = 'kg',
    meta?: Partial<ClosingSnapshotMeta>
): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "Sin datos";
    const converted = unit === 'lb' ? value / KG_TO_LB : value;
    const currency = meta?.currency || "MXN";
    const locale = CURRENCY_LOCALE_MAP[currency] || "es-MX";
    const symbol = meta?.currencySymbol || "$";
    try {
        const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted);
        return `${symbol}${formatted}/${unit}`;
    } catch {
        return `${symbol}${converted.toFixed(2)}/${unit}`;
    }
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
