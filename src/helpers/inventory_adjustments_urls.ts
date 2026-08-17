export const INVENTORY_ADJUSTMENT_URLS = {
    create: '/inventory-adjustments',
    list: '/inventory-adjustments',
    detail: (id: string) => `/inventory-adjustments/${id}`,
    revert: (id: string) => `/inventory-adjustments/${id}/revert`,
};
