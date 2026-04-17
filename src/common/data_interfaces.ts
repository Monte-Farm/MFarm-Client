interface Product {
    id: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
    totalPrice?: number;
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
    tax: number;
    discount: number;
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
    _id?: string;
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
    warehouseDestiny?: string;
    products: Array<Product>;
    totalPrice: number;
    outcomeType: string;
    warehouseOrigin: string;
    groupId?: string;
    litterId?: string;
    description: string;
    status: boolean;
}

export interface ProductData {
    _id?: string;
    id: string;
    name: string;
    category: string;
    description: string;
    status: boolean;
    unit_measurement: string;
    image: string;
    type?: 'raw' | 'prepared_feed';
    recipeId?: string;
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
    _id?: string;
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
    origin: 'born' | 'purchased' | 'donated' | 'other' | '';
    originDetail?: string;
    sourceFarm?: string;
    arrivalDate?: Date | null;
    purchasePrice?: number;
    status: 'alive' | 'sold' | 'slaughtered' | 'dead' | 'discarded';
    currentStage: 'piglet' | 'weaning' | 'fattening' | 'breeder' | '';
    sex: 'male' | 'female' | '';
    weight: number | '';
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
    feedings: any[];
    feedAdministrationHistory: FeedAdministrationHistoryEntry[];
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

export interface GroupMedicationPackagesHistory {
    packageId: string;
    name: string;
    stage?: string;
    medications: {
        medication: string;
        dosePerPig: number;
        administrationRoute: string;
        totalDose: number;
        totalCost?: number;
        unitPrice?: number;
    }[];
    applicationDate: Date | null;
    appliedBy: string;
    observations?: string;
    isActive: boolean;
    estimatedTotal: number
}

export interface GroupMedications {
    medication: string;
    dosePerPig?: number;
    administrationRoute?: string;
    applicationDate: Date | null;
    appliedBy: string;
    observations?: string;
    isActive: boolean;
    totalDose: number;
}

export interface GroupVaccinationPlansHistory {
    planId: string;
    name: string;
    stage?: string;
    vaccines: {
        vaccine: string;
        dosePerPig: number;
        administrationRoute: string;
        ageObjective?: number;
        frequency?: string;
        totalDose: number;
    }[];
    applicationDate: Date | null;
    appliedBy: string;
    observations?: string;
    isActive: boolean;
}

export interface GroupHealthEvents {
    name: string;
    status: 'active' | 'controlled' | 'resolved' | '';
    startDate: Date | null;
    endDate?: Date | null;
    scope: {
        type: 'total' | 'partial' | '';
        affectedCount: number;
    };
    severity?: 'low' | 'medium' | 'high' | '';
    symptoms?: string[];
    treatments?: {
        medication: string;
        quantityPerPig: number;
        totalQuantity?: number;
        administrationRoute: string;
        appliedBy: string;
    }[];
    observations?: string;
    isActive?: boolean;
    detectedBy: string;
}[];

export interface GroupData {
    _id?: string;
    code: string;
    name: string;
    farm: string;
    area: string;
    creationDate: Date | null;
    stage: | 'general' | 'lactation' | 'weaning' | 'fattening' | 'gestation' | 'breeder' | 'exit' | 'sale' | "";
    status?: 'weaning' | 'ready_to_grow' | 'grow_overdue' | 'growing' | 'ready_for_sale' | 'replacement' | 'sale' | 'sold'
    groupMode: 'linked' | 'count' | '';
    pigsInGroup?: string[];
    pigCount?: number;
    maleCount?: number;
    femaleCount?: number;
    avgWeight?: number;
    responsible: string;
    observations?: string;
    observationsHistory?: {
        date: Date;
        userId: string;
        observation: string;
    }[];
    groupHistory?: {
        date: Date;
        userId: string;
        action: string;
        description: string;
    }[];
    feedAdministrationHistory?: FeedAdministrationHistoryEntry[];
    medications?: GroupMedications[];
    medicationPackagesHistory?: GroupMedicationPackagesHistory[];
    vaccinationPlansHistory?: GroupVaccinationPlansHistory[];
    healthEvents?: GroupHealthEvents[];
    isActive: boolean
    isReadyForReplacement?: boolean;
    litterIds?: string[];
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
    _id?: string;
    id?: string;
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
    _id?: string;
    code: string;
    name: string;
    description?: string;
    farm: string;
    creation_date: Date | null;
    creation_responsible: string;
    is_active: boolean;
    stage: string;
    expectedYield: number;
    feedings: {
        feeding: string;
        percentage: number;
    }[];
}

export interface FeedPreparationIngredientUsed {
    product: {
        _id: string;
        name: string;
        unit_measurement: string;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface FeedPreparation {
    _id?: string;
    code: string;
    farm: string;
    recipe: string | { _id: string; code: string; name: string; stage: string };
    preparedProduct: string | { _id: string; name: string; unit_measurement: string };
    preparationDate: Date | null;
    batchSize: number;
    actualYield: number;
    shrinkage: number;
    shrinkagePercentage: number;
    subwarehouse: string;
    ingredientsUsed: FeedPreparationIngredientUsed[];
    totalCost: number;
    costPerKg: number;
    responsible: string | { _id: string; name: string; lastname: string; username?: string };
    notes?: string;
}

export interface FeedAdministrationHistoryEntry {
    _id: string;
    administrationId: string;
    preparedProduct: {
        _id: string;
        name: string;
        unit_measurement: string;
        category: string;
    };
    recipe: {
        _id: string;
        code: string;
        name: string;
        stage: string;
    };
    quantity: number;
    unitCost: number;
    totalCost: number;
    applicationDate: Date | string;
    appliedBy: {
        _id: string;
        name: string;
        lastname: string;
        username?: string;
    };
    observations?: string;
}

export interface FeedAdministration {
    _id?: string;
    code: string;
    farm: string;
    targetType: 'group' | 'litter' | 'pig';
    targetId: string;
    preparedProduct: string | { _id: string; name: string; unit_measurement: string };
    recipe: string | { _id: string; code: string; name: string; stage: string };
    quantity: number;
    unitCost: number;
    totalCost: number;
    date: Date | string | null;
    responsible: string | { _id: string; name: string; lastname: string };
    observations?: string;
}

export interface PigletSnapshot {
    sex: 'male' | 'female' | '';
    weight: number | '';
    status: 'alive' | 'dead';
    recordedAt: Date | null;
}

export interface LitterEvent {
    type: 'MORTALITY_SUMMARY' | 'AVERAGE_WEIGHT' | 'WEANING' | 'LOCATION_CHANGE' | 'GROUP_TREATMENT' | 'OBSERVATION' | 'DISCARD' | '';
    date: Date | null;
    data: string;
    registeredBy: string;
}

export interface Litter {
    code: string;
    farm: string;
    mother: string;
    birth: string;
    birthDate: Date | null;
    initialMale: number;
    initialFemale: number;
    currentMale: number;
    currentFemale: number;
    averageWeight: number;
    status: 'active' | 'ready_to_wean' | 'weaned' | 'wean_overdue' | '';
    piglets: PigletSnapshot[];
    observations?: string;
    responsible: string;
    events: LitterEvent[];
    feedAdministrationHistory: FeedAdministrationHistoryEntry[];
    medications: GroupMedications[];
    medicationPackagesHistory: GroupMedicationPackagesHistory[];
    vaccinationPlansHistory: GroupVaccinationPlansHistory[];
}