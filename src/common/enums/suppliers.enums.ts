export enum SUPPLIER_TYPES {
    CLEANING_PRODUCTS = 'cleaning_products',
    FOOD_AND_FEED = 'food_and_feed',
    MEDICINES_AND_VETERINARY = 'medicines_and_veterinary',
    EQUIPMENT_AND_TOOLS = 'equipment_and_tools',
    SERVICES = 'services'
}

export const getSupplierTypeLabel = (type: string): string => {
    switch (type) {
        case SUPPLIER_TYPES.CLEANING_PRODUCTS:
            return 'Productos de limpieza';
        case SUPPLIER_TYPES.FOOD_AND_FEED:
            return 'Alimentos y piensos';
        case SUPPLIER_TYPES.MEDICINES_AND_VETERINARY:
            return 'Medicamentos y veterinaria';
        case SUPPLIER_TYPES.EQUIPMENT_AND_TOOLS:
            return 'Equipamiento y herramientas';
        case SUPPLIER_TYPES.SERVICES:
            return 'Servicios';
        default:
            return 'Sin categoría';
    }
};

export const getSupplierTypeOptions = () => {
    return [
        { value: SUPPLIER_TYPES.CLEANING_PRODUCTS, label: 'Productos de limpieza' },
        { value: SUPPLIER_TYPES.FOOD_AND_FEED, label: 'Alimentos y piensos' },
        { value: SUPPLIER_TYPES.MEDICINES_AND_VETERINARY, label: 'Medicamentos y veterinaria' },
        { value: SUPPLIER_TYPES.EQUIPMENT_AND_TOOLS, label: 'Equipamiento y herramientas' },
        { value: SUPPLIER_TYPES.SERVICES, label: 'Servicios' }
    ];
};
