type IntlWithSupported = typeof Intl & {
    supportedValuesOf?: (key: 'currency' | 'timeZone' | 'calendar' | 'collation' | 'numberingSystem' | 'unit') => string[];
};

const CURRENCY_FALLBACK = ['MXN', 'USD', 'EUR', 'BRL', 'COP', 'ARS', 'CLP', 'PEN', 'GTQ'];
const TIMEZONE_FALLBACK = [
    'America/Mexico_City',
    'America/Bogota',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'America/Lima',
    'America/Guatemala',
    'America/Santiago',
    'America/New_York',
    'Europe/Madrid',
    'UTC',
];

const LOCALES = [
    { value: 'es-MX', label: 'Español (México)' },
    { value: 'es-CO', label: 'Español (Colombia)' },
    { value: 'es-AR', label: 'Español (Argentina)' },
    { value: 'es-CL', label: 'Español (Chile)' },
    { value: 'es-PE', label: 'Español (Perú)' },
    { value: 'es-GT', label: 'Español (Guatemala)' },
    { value: 'es-ES', label: 'Español (España)' },
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' },
];

export const getCurrencyOptions = (): { value: string; label: string }[] => {
    const intl = Intl as IntlWithSupported;
    const codes = intl.supportedValuesOf ? intl.supportedValuesOf('currency') : CURRENCY_FALLBACK;
    const displayNames = typeof Intl.DisplayNames === 'function'
        ? new Intl.DisplayNames(['es'], { type: 'currency' })
        : null;
    return codes
        .map((code) => {
            const name = displayNames ? displayNames.of(code) : code;
            return { value: code, label: `${code} — ${name}` };
        })
        .sort((a, b) => a.value.localeCompare(b.value));
};

export const getTimezoneOptions = (): { value: string; label: string }[] => {
    const intl = Intl as IntlWithSupported;
    const zones = intl.supportedValuesOf ? intl.supportedValuesOf('timeZone') : TIMEZONE_FALLBACK;
    return zones.map((zone) => ({ value: zone, label: zone })).sort((a, b) => a.value.localeCompare(b.value));
};

export const getLocaleOptions = (): { value: string; label: string }[] => LOCALES;

export const deriveCurrencySymbol = (currency: string, locale: string = 'es-MX'): string => {
    try {
        const parts = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
        }).formatToParts(0);
        const symbol = parts.find((p) => p.type === 'currency');
        return symbol?.value ?? currency;
    } catch {
        return currency;
    }
};
