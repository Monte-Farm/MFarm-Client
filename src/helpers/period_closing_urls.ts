export const PERIOD_CLOSING_URLS = {
    close: (farmId: string) => `/period-closings/close/${farmId}`,
    list: (farmId: string) => `/period-closings/${farmId}`,
    listGlobal: () => `/period-closings/global`,
    detail: (closingId: string) => `/period-closings/detail/${closingId}`,
    byPeriod: (farmId: string) => `/period-closings/by-period/${farmId}`,
    audit: (closingId: string) => `/period-closings/${closingId}/audit`,
    reopen: (closingId: string) => `/period-closings/reopen/${closingId}`,
    precheck: (farmId: string) => `/period-closings/precheck/${farmId}`,
    closingPreview: (farmId: string) => `/reports/finance/operations-closing/${farmId}`,
};
