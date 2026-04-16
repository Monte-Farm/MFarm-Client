export enum PRODUCT_TYPES {
    RAW = 'raw',
    PREPARED_FEED = 'prepared_feed'
}

export const getProductTypeLabel = (type: string): string => {
    switch (type) {
        case PRODUCT_TYPES.RAW:
            return 'Materia prima';
        case PRODUCT_TYPES.PREPARED_FEED:
            return 'Alimento preparado';
        default:
            return 'Sin tipo';
    }
};

export const getProductTypeOptions = () => {
    return [
        { value: PRODUCT_TYPES.RAW, label: 'Materia prima' },
        { value: PRODUCT_TYPES.PREPARED_FEED, label: 'Alimento preparado' }
    ];
};

export enum PRODUCT_CATEGORIES {
    NUTRITION = 'nutrition',
    MEDICATIONS = 'medications',
    VACCINES = 'vaccines',
    VITAMINS = 'vitamins',
    MINERALS = 'minerals',
    SUPPLIES = 'supplies',
    HYGIENE_CLEANING = 'hygiene_cleaning',
    EQUIPMENT_TOOLS = 'equipment_tools',
    SPARE_PARTS = 'spare_parts',
    OFFICE_SUPPLIES = 'office_supplies',
    OTHERS = 'others'
}

export const getProductCategoryLabel = (category: string): string => {
    switch (category) {
        case PRODUCT_CATEGORIES.NUTRITION:
            return 'Nutrición';
        case PRODUCT_CATEGORIES.MEDICATIONS:
            return 'Medicamentos';
        case PRODUCT_CATEGORIES.VACCINES:
            return 'Vacunas';
        case PRODUCT_CATEGORIES.VITAMINS:
            return 'Vitaminas';
        case PRODUCT_CATEGORIES.MINERALS:
            return 'Minerales';
        case PRODUCT_CATEGORIES.SUPPLIES:
            return 'Insumos';
        case PRODUCT_CATEGORIES.HYGIENE_CLEANING:
            return 'Higiene y desinfección';
        case PRODUCT_CATEGORIES.EQUIPMENT_TOOLS:
            return 'Equipamiento y herramientas';
        case PRODUCT_CATEGORIES.SPARE_PARTS:
            return 'Refacciones y repuestos';
        case PRODUCT_CATEGORIES.OFFICE_SUPPLIES:
            return 'Material de oficina';
        case PRODUCT_CATEGORIES.OTHERS:
            return 'Otros';
        default:
            return 'Sin categoría';
    }
};

export const getProductCategoryOptions = () => {
    return [
        { value: PRODUCT_CATEGORIES.NUTRITION, label: 'Nutrición' },
        { value: PRODUCT_CATEGORIES.MEDICATIONS, label: 'Medicamentos' },
        { value: PRODUCT_CATEGORIES.VACCINES, label: 'Vacunas' },
        { value: PRODUCT_CATEGORIES.VITAMINS, label: 'Vitaminas' },
        { value: PRODUCT_CATEGORIES.MINERALS, label: 'Minerales' },
        { value: PRODUCT_CATEGORIES.SUPPLIES, label: 'Insumos' },
        { value: PRODUCT_CATEGORIES.HYGIENE_CLEANING, label: 'Higiene y desinfección' },
        { value: PRODUCT_CATEGORIES.EQUIPMENT_TOOLS, label: 'Equipamiento y herramientas' },
        { value: PRODUCT_CATEGORIES.SPARE_PARTS, label: 'Refacciones y repuestos' },
        { value: PRODUCT_CATEGORIES.OFFICE_SUPPLIES, label: 'Material de oficina' },
        { value: PRODUCT_CATEGORIES.OTHERS, label: 'Otros' }
    ];
};
