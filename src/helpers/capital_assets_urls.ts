export const CAPITAL_ASSET_URLS = {
    create: '/capital-assets',
    list: (farmId: string) => `/capital-assets/farm/${farmId}`,
    detail: (assetId: string) => `/capital-assets/${assetId}`,
    update: (assetId: string) => `/capital-assets/${assetId}`,
    adjust: (assetId: string) => `/capital-assets/${assetId}/adjust`,
    delete: (assetId: string) => `/capital-assets/${assetId}`,
    summary: (farmId: string) => `/capital-assets/farm/${farmId}/summary`,
    backfill: '/capital-assets/backfill',
};
