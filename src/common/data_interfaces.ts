interface Product {
    id: string;
    quantity: number;
    price?: number;
}

interface Origin {
    originType: string,
    id: string
}

interface ProductComplete {
    id: string;
    name: string;
    quantity: string;
    category: string;
    description: string;
    status: boolean;
    unit_measurement: string
}

export interface IncomeData {
    id: string;
    warehouse: string;
    date: Date | null;
    emissionDate: Date | null;
    products: Array<Product>;
    totalPrice: number;
    incomeType: string;
    origin: Origin;
    documents: Array<string>;
    status: boolean;
    purchaseOrder: string;
    invoiceNumber: string;
    fiscalRecord: string;
    currency: string;
}

export interface SupplierData {
    id: string;
    name: string;
    address: string;
    phone_number: string;
    email: string;
    supplier_type: string;
    status: boolean;
    rnc: string;
}

interface ProductId {
    id: string;
    quantity: number;
}

export interface OrderData {
    id: string;
    date: Date | null;
    user: string;
    productsRequested: Array<ProductId>;
    status: string;
    orderDestiny: string;
    orderOrigin: string;
    productsDelivered: Array<ProductId>;
}

export interface OutcomeData {
    code: string;
    date: Date | null;
    products: Array<Product>;
    outcomeType: string;
    status: boolean;
    warehouseDestiny: string;
    warehouseOrigin: string;
    totalPrice: number;
    description: string;
}

export interface ProductData {
    id: string;
    name: string;
    category: string;
    description: string;
    status: boolean;
    unit_measurement: string;
    image: string;
}

export interface SubwarehouseData {
    code: string;
    name: string;
    location?: string;
    manager: string;
    status: boolean;
    products: ProductComplete[]
    incomes: string[]
    outcomes: string[]
    isSubwarehouse: boolean
    farm: string
    type: string
}

export interface SupplierData {
    id: string;
    name: string;
    address: string;
    phone_number: string;
    email: string;
    supplier_type: string;
    status: boolean;
    rnc: string;
}

export interface Tax {
    taxName: string;
    percentage: number;
}

export interface ProductCategory {
    prefix: string;
    value: string;
}

export interface ConfigurationData {
    farmName: string;
    farmLogo: string;
    farmIcon: string;
    unitMeasurements: string[];
    productCategories: ProductCategory[];
    incomeTypes: string[];
    outcomeTypes: string[];
    userRoles: string[];
    taxes: Tax[];
    supplierCategories: string[];
}


export interface UserData {
    _id?: string
    profile_image?: string
    username?: string;
    name: string;
    lastname: string;
    farm_assigned: string | null;
    email: string;
    role: string[];
    assigment?: string | null
    status: boolean;
    history: {
        date: Date;
        event: string;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}


export interface PurchaseOrderData {
    code: string;
    date: Date | null;
    products: Array<Product>;
    subtotal: number;
    tax: number;
    discount: number;
    totalPrice: number;
    supplier: string;
    status: boolean;
    warehouse: string;
}

type AttributeType = "text" | "currency" | "percentage" | "status" | "date" | "datetime" | "boolean" | "uppercase" | "lowercase" | "phone";
export interface Attribute {
    key: string;
    label: string;
    type?: AttributeType;
    render?: (value: any, object: Record<string, any>) => React.ReactNode;
}


export interface PigFeedingEntry {
    category: string;
    name: string;
    dailyAmount: number;
    unit: string;
    observations?: string;
}

export interface PigMedicationEntry {
    medication: string;
    dose?: number;
    unit_measurement?: string;
    administration_route?: string;
    applicationDate?: Date;
    observations?: string;
}

export interface PigReproductionEntry {
    date: Date;
    type: string;
    responsible?: string;
    description: string;
    eventRef?: string;
    eventModel: string;
}

export interface medicationPackagesEntry {
    packageId: string;
    name: string;
    stage: string;
    medications: {
        medication: string;
        quantity: number;
        administration_route: string;
    }[];
    applicationDate: Date | null;
    appliedBy: string;
    observations?: string;
};

export interface VaccinationPlanEntry {
    planId: string;
    name: string;
    stage: string;
    vaccines: {
        vaccine: string;
        dose: number;
        administration_route: string;
        age_objective: number;
        frequency: string;
    }[];
    applicationDate: Date | null;
    appliedBy: string;
    observations?: string;
    is_active: boolean;
};

export interface SicknessHistory {
    name: string;
    status: string;
    startDate: Date | null;
    endDate?: Date | null;
    symptoms?: string[];
    severity?: string
    detectedBy: string;
    treatment?: {
        medication: string;
        dose?: number;
        unit_measurement?: string;
        administration_route?: string;
        startDate?: Date | null;
        endDate?: Date | null;
    }[];
    observations?: string;
    is_active: boolean;
}[];

export interface PigData {
    _id: string;
    code: string;
    farmId: string;
    birthdate: Date | null;
    breed: string;
    origin: 'born' | 'purchased' | 'donated' | 'other';
    originDetail?: string;
    sourceFarm?: string;
    arrivalDate?: Date | null;
    status: 'alive' | 'sold' | 'slaughtered' | 'dead' | 'discarded';
    currentStage: 'piglet' | 'weaning' | 'fattening' | 'breeder';
    sex: 'male' | 'female' | '';
    weight: number;
    observations?: string;
    discard?: {
        isDiscarded: boolean;
        reason?: string | null;
        destination?: string | null;
        date: Date;
        responsible?: string | null;
        observations?: string | null;
    };
    historyChanges: PigHistoryChanges[];
    feedings: PigFeedingEntry[];
    medications: PigMedicationEntry[];
    medicationPackagesHistory: medicationPackagesEntry[];
    vaccinationPlansHistory: VaccinationPlanEntry[];
    sicknessHistory: SicknessHistory[];
    reproduction: PigReproductionEntry[];
    registration_date: Date | null;
    registered_by: string;
}

export interface PigHistoryChanges {
    date: Date;
    userId: {
        _id: string;
        name: string;
        lastname: string;
        email: string
    };
    action: string;
    changes: {
        field: string;
        oldValue: any | null;
        newValue: any;
    }[];
}

export interface FarmData {
    _id?: string;
    image: string | null;
    name: string;
    code: string;
    location: string;
    status: boolean;
    manager: string;
    createdAt: Date;
    updatedAt: Date;
    main_warehouse: string;
}

export interface GroupData {
    code: string;
    name: string;
    area: string;
    stage: string;
    creation_date: Date | null;
    group_mother?: string;
    observations?: string;
    observations_history?: {
        date: Date;
        userId: string;
        observation: string;
    }[];
    responsible: string;
    farm: string;
    group_history?: {
        date: Date;
        userId: string;
        action: string;
        description: string;
    }[];
    pigCount: number;
    maleCount: number;
    femaleCount: number;
    avg_weight?: number;
    pigsInGroup?: string[];
    feedings?: {
        date: Date;
        userId: string;
        feedType: string;
        amount: number;
        unit_measurement: string;
        average_p_pig: number;
        notes?: string;
        periodicity: string;
        name: string;
    }[];
    medical_treatments?: {
        applicationDate: Date;
        userId: string;
        treatmentType: string;
        medication: string;
        dosage: number;
        average_p_pig?: number;
        notes?: string;
        periodicity: string;
        unit_measurement: string;
        application_method: string;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ExtractionData {
    _id?: string;
    date: Date | null;
    technician: string;
    farm: string;
    boar: string;
    extraction_location: string;
    batch: string;
    notes?: string;
    is_sample_registered: boolean
    volume: number;
    unit_measurement: string;
    appearance: string;
}

export interface SemenSample {
    extraction_id: string
    concentration_million: number;
    motility_percent: number;
    vitality_percent: number;
    abnormal_percent: number;
    pH: number;
    temperature: number;
    diluent: {
        type: string;
        lot: string;
        volume: number;
        unit_measurement: string;
    };
    conservation_method: string;
    expiration_date: Date | null;
    post_dilution_motility?: number;
    technician: string;
    doses: {
        code: string;
        total_volume: number;
        semen_volume: number;
        diluent_volume: number;
        unit_measurement: string;
        status: "available" | "used" | "discarded" | "expired";
    }[];
    total_doses: number;
    available_doses: number;

    lot_status: "available" | "near_expiration" | "expired" | "out_of_stock" | "discarded";
    discard_reason?: string;
    discarded_by?: string;

    alert_hours_before_expiration: number;
}

export interface InseminationData {
    sow: string;
    date: Date | null;
    responsible: string
    status: 'active' | 'completed';
    result?: 'pregnant' | 'empty' | 'doubtful' | 'resorption' | 'abortion';
    diagnosis_date?: Date;
    estimated_farrowing_date?: Date;
    notes?: string;
    attachments?: string[];
    doses: {
        order: number;
        time: Date;
        dose: string
        notes?: string;
    }[];
    heats: {
        date: Date | null;
        heat_detected: boolean;
        notes?: string;
        responsible: string;
    }[];
    farrowind_status?: string;
}

export interface MedicationPackage {
    code: string;
    name: string;
    description?: string;
    farm: string;
    creation_date: Date | null;
    creation_responsible: string;
    is_active: boolean;
    stage: string;
    medications: {
        medication: string;
        quantity: number;
        administration_route: string
    }[]
}

export interface VaccinationPlan {
    code: string;
    name: string;
    description?: string;
    farm: string;
    creation_date: Date | null;
    creation_responsible: string
    is_active: boolean;
    stage: string;
    vaccines: {
        vaccine: string
        dose: number;
        administration_route: string;
        age_objective: number;
        frequency: string;
    }[]
}

export interface FeedingPackage {
    code: string;
    name: string;
    description?: string;
    farm: string;
    creation_date: Date | null;
    creation_responsible: string;
    is_active: boolean;
    destination_area: string;
    feedings: {
        feeding: string;
        quantity: number;
        administration_route: string
    }[]
    objective_use: string;
    periodicity: string;
}

export interface FeedingPackagesEntry {
    packageId: string;
    name: string;
    objective: 'individual' | 'group';
    destinationArea: string;
    feedings: {
        feeding: string;
        quantity: number;
    }[];
    applicationDate: Date | null;
    appliedBy: string;
    observations?: string;
    periodicity: string;
    is_active: boolean;
};