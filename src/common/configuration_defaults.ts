import { FarmConfiguration, GlobalConfiguration } from './data_interfaces';

export const DEFAULT_GLOBAL_CONFIG: Omit<GlobalConfiguration, '_id' | 'createdAt' | 'updatedAt'> = {
    companyName: '',
    currency: 'MXN',
    currencySymbol: '$',
    decimals: 2,
    locale: 'es-MX',
    timezone: 'America/Mexico_City',
    dateFormat: 'DD/MM/YYYY',
    unitMeasurements: ['kg', 'g', 'l', 'ml', 'pz'],
};

export const DEFAULT_FARM_CONFIG: Omit<FarmConfiguration, '_id' | 'farmId' | 'createdAt' | 'updatedAt'> = {
    productionCycles: {
        gestation: {
            closeToFarrowDays: 107,
            farrowingPendingDays: 112,
            overdueFarrowingDays: 117,
        },
        lactation: {
            weanReadyDays: 21,
            weanOverdueDays: 28,
        },
        weaning: {
            fatteningReadyDays: 42,
            fatteningOverdueDays: 56,
        },
        fattening: {
            saleReadyDays: 84,
            saleOverdueDays: 112,
        },
        replacement: {
            minAge: 140,
            maxAge: 170,
        },
    },
    notifications: {
        farrowingAdvanceNotificationDays: 5,
        stageChangeAdvanceNotificationDays: 3,
    },
};

export const DATE_FORMAT_OPTIONS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY HH:mm', label: 'DD/MM/YYYY HH:mm' },
    { value: 'HH:mm', label: 'HH:mm' },
];
