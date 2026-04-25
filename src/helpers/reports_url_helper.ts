export type ReportVariant = 'json' | 'pdf' | 'excel';

export interface BuildReportUrlParams {
    apiUrl: string;
    basePath: string;
    isGlobal: boolean;
    farmId?: string;
    variant?: ReportVariant;
    query?: Record<string, string | number | undefined>;
}

const buildQuery = (query?: Record<string, string | number | undefined>): string => {
    if (!query) return '';
    const parts = Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    return parts.length ? `?${parts.join('&')}` : '';
};

/**
 * basePath is the path from the API root *without* the farm_id segment or variant suffix.
 * Examples:
 *   - reports/production/inseminations-births
 *   - reports/finance/cash-flow
 *   - dashboard/executive
 *   - reports/catalogs          (no sub-report)
 *   - reports/audit
 *
 * Per-farm:  {apiUrl}/{basePath}[/{variant}]/{farmId}
 * Global:    {apiUrl}/{baseModule}/global[/{rest}][/{variant}]
 *
 * For JSON variant, no suffix is added.
 * For pdf/excel, the suffix is inserted before the farmId (per-farm) or appended at the end (global).
 */
export const buildReportUrl = ({
    apiUrl,
    basePath,
    isGlobal,
    farmId,
    variant = 'json',
    query,
}: BuildReportUrlParams): string => {
    const cleanBase = basePath.replace(/^\/+|\/+$/g, '');
    const variantSeg = variant === 'json' ? '' : `/${variant}`;
    const qs = buildQuery(query);

    if (!isGlobal) {
        return `${apiUrl}/${cleanBase}${variantSeg}/${farmId}${qs}`;
    }

    // Global: insert /global after the module segment.
    // Module is the first 2 segments for `reports/*` (reports/<module>) and the first segment for `dashboard`.
    const segments = cleanBase.split('/');
    let globalPath: string;
    if (segments[0] === 'reports' && segments.length >= 2) {
        const moduleHead = segments.slice(0, 2).join('/'); // e.g. reports/production
        const rest = segments.slice(2).join('/');          // e.g. inseminations-births  (may be empty)
        globalPath = rest
            ? `${moduleHead}/global/${rest}`
            : `${moduleHead}/global`;
    } else if (segments[0] === 'dashboard' && segments.length >= 2) {
        const rest = segments.slice(1).join('/');
        globalPath = `dashboard/global/${rest}`;
    } else {
        globalPath = `${cleanBase}/global`;
    }

    return `${apiUrl}/${globalPath}${variantSeg}${qs}`;
};
