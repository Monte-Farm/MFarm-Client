export const OUTCOME_TYPES = {
    TRANSFER: 'transfer',
    SALE: 'sale',
    LOSS: 'loss',
    ADJUSTMENT: 'adjustment',
    RETURN: 'return',
    CONSUMPTION: 'consumption',
    WAREHOUSE_ORDER: 'warehouse_order'
} as const;

export type OutcomeType = typeof OUTCOME_TYPES[keyof typeof OUTCOME_TYPES];

export const getOutcomeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
        [OUTCOME_TYPES.TRANSFER]: 'Transferencia',
        [OUTCOME_TYPES.SALE]: 'Venta',
        [OUTCOME_TYPES.LOSS]: 'Pérdida',
        [OUTCOME_TYPES.ADJUSTMENT]: 'Ajuste de inventario',
        [OUTCOME_TYPES.RETURN]: 'Devolución',
        [OUTCOME_TYPES.CONSUMPTION]: 'Consumo interno',
        [OUTCOME_TYPES.WAREHOUSE_ORDER]: 'Orden de almacén'
    };
    return labels[type] || type;
};
