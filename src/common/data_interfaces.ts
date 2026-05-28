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
    _id?: string;
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
    approvalStatus: 'pending' | 'approved' | 'released';
    cancelled?: boolean;
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
    farmId?: string;
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
    cancelled?: boolean;
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
    farmId?: string;
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

export interface Tax {
    taxName: string;
    percentage: number;
}

export interface ProductCategory {
    prefix: string;
    value: string;
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
    earTag?: string;
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
    origin?: 'internal' | 'external';
    farm?: string;
    extraction_id: string;
    supplier?: {
        name: string;
        lot: string;
        purchase_date: Date | null;
    };
    concentration_million: number;
    motility_percent: number;
    vitality_percent: number;
    abnormal_percent: number;
    pH: number;
    temperature: number;
    lab_supplies: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_measurement: string;
        unit_price: number;
    }[];
    semen_product_id?: string;
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
    warehouseSource?: string;
    doses: {
        order: number;
        time: Date;
        dose: string;
        notes?: string;
        semen_product_id?: string;
        total_volume?: number;
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

export type NotificationType =
    | 'birth_approaching'
    | 'reproduction'
    | 'stage_change'
    | 'weight_goal'
    | 'feeding_alert'
    | 'health_alert'
    | 'group_management'
    | 'inventory'
    | 'system';

export type NotificationEntityType =
    | 'birth'
    | 'pregnancy'
    | 'insemination'
    | 'pig'
    | 'group'
    | 'income';

export interface NotificationEntity {
    type: NotificationEntityType;
    id: string;
    code?: string;
}

export interface NotificationData {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    entity?: NotificationEntity;
    createdAt: string;
    updatedAt: string;
}

export interface GlobalConfiguration {
    _id?: string;
    companyName: string;
    logoUrl?: string | null;
    currency: string;
    currencySymbol: string;
    decimals: number;
    locale: string;
    timezone: string;
    dateFormat: string;
    unitMeasurements: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface GestationThresholds {
    closeToFarrowDays: number;
    farrowingPendingDays: number;
    overdueFarrowingDays: number;
}

export interface LactationThresholds {
    weanReadyDays: number;
    weanOverdueDays: number;
}

export interface WeaningThresholds {
    fatteningReadyDays: number;
    fatteningOverdueDays: number;
}

export interface FatteningThresholds {
    saleReadyDays: number;
    saleOverdueDays: number;
}

export interface ReplacementThresholds {
    minAge: number;
    maxAge: number;
}

export interface ProductionCycles {
    gestation: GestationThresholds;
    lactation: LactationThresholds;
    weaning: WeaningThresholds;
    fattening: FatteningThresholds;
    replacement: ReplacementThresholds;
}

export interface NotificationsConfig {
    farrowingAdvanceNotificationDays: number;
    stageChangeAdvanceNotificationDays: number;
}

export interface FarmConfiguration {
    _id?: string;
    farmId: string;
    productionCycles: ProductionCycles;
    notifications: NotificationsConfig;
    createdAt?: string;
    updatedAt?: string;
}

// ===================== Period Closing =====================

export type PeriodClosingStatus = 'closed' | 'reopened' | 'archived';
export type PeriodType = 'monthly' | 'annual';

export interface PeriodClosingUser {
    _id: string;
    name: string;
    lastname: string;
}

export interface ClosingKpis {
    totalIncome: number;
    totalCosts: number;
    operatingResult: number;
    operatingMargin: number;
    totalKgSold: number;
    totalPigsSold: number;
}

export interface ClosingCostItem {
    category: string;
    description: string;
    amount: number;
}

export interface ClosingSalesSummary {
    type: string;
    pigCount: number;
    totalWeight: number;
    totalAmount: number;
    avgPricePerKg: number;
}

export interface ClosingMonthlySummary {
    month: string;
    income: number;
    costs: number;
    result: number;
}

export interface ClosingSnapshotMeta {
    generatedAt: string;
    periodStart: string;
    periodEnd: string;
    farmId: string;
    farmName: string;
    timezone: string;
    currency?: string;
    currencySymbol?: string;
}

// --- Inventory ---
export type InventoryStage = 'piglet' | 'weaning' | 'fattening' | 'gestation' | 'breeder' | 'lactation' | 'replacement';

export interface InventoryByStageItem {
    stage: InventoryStage;
    count: number;
    totalWeightKg: number;
    avgWeightKg: number;
}

export interface InventorySnapshotSide {
    date: string;
    totalPigs: number;
    totalWeightKg: number;
    byStage: InventoryByStageItem[];
}

export interface InventoryMovementCounts {
    count: number;
    totalWeightKg: number;
}

export interface InventoryMovements {
    births: InventoryMovementCounts;
    purchases: InventoryMovementCounts;
    sales: InventoryMovementCounts;
    deaths: InventoryMovementCounts;
    discards: InventoryMovementCounts;
    transfersIn: InventoryMovementCounts;
    transfersOut: InventoryMovementCounts;
}

export interface InventoryReconciliation {
    expectedFinal: number;
    actualFinal: number;
    diff: number;
    note: string;
}

export interface InventoryValuationByStage {
    stage: InventoryStage;
    totalWeightKg: number;
    value: number;
}

export interface InventoryValuation {
    pricePerKg: number;
    pricePerKgSource: 'market_avg' | 'system_config' | 'manual' | string;
    totalValue: number;
    byStage: InventoryValuationByStage[];
}

export interface InventorySection {
    initial: InventorySnapshotSide;
    final: InventorySnapshotSide;
    movements: InventoryMovements;
    reconciliation: InventoryReconciliation;
    valuation: InventoryValuation | null;
}

// --- Sales Detail ---
export interface SalesByClient {
    clientId: string | null;
    clientName: string;
    saleCount: number;
    pigCount: number;
    totalWeightKg: number;
    totalAmount: number;
    avgPricePerKg: number;
}

export interface SalesByType {
    type: 'standing_pig' | 'slaughtered' | 'group_sale' | string;
    label: string;
    pigCount: number;
    totalWeightKg: number;
    totalAmount: number;
    avgPricePerKg: number;
    avgWeightPerPig: number;
}

export interface SalesAverages {
    avgWeightAtSaleKg: number | null;
    avgAgeAtSaleDays: number | null;
    avgPricePerKg: number | null;
    avgRevenuePerPig: number | null;
}

export interface SalesDetailSection {
    byClient: SalesByClient[];
    byType: SalesByType[];
    averages: SalesAverages;
}

// --- Production ---
export interface ProductionBirths {
    litterCount: number;
    pigletsBornAlive: number;
    pigletsBornDead: number;
    avgLitterSize: number | null;
    avgPigletBirthWeightKg: number | null;
}

export interface ProductionWeanings {
    litterCount: number;
    pigletsWeaned: number;
    avgLitterSizeAtWeaning: number | null;
    avgWeaningAgeDays: number | null;
    avgWeaningWeightKg: number | null;
    preWeaningMortality: number | null;
}

export interface MortalityByStage {
    stage: InventoryStage;
    count: number;
    rate: number | null;
}

export interface MortalityByCause {
    cause: string;
    count: number;
}

export interface ProductionMortality {
    totalDeaths: number;
    mortalityRate: number | null;
    byStage: MortalityByStage[];
    byCause: MortalityByCause[];
}

export interface FeedConversionByStage {
    stage: InventoryStage;
    fcr: number | null;
}

export interface FeedConversion {
    overall: number | null;
    byStage: FeedConversionByStage[] | null;
}

export interface AvgDaysPerStageItem {
    stage: InventoryStage;
    avgDays: number | null;
}

export interface ProductionSection {
    births: ProductionBirths;
    weanings: ProductionWeanings;
    mortality: ProductionMortality;
    feedConversion: FeedConversion;
    avgDaysPerStage: AvgDaysPerStageItem[];
}

// --- Feeding ---
export interface FeedingByPhase {
    phase: 'starter' | 'grower' | 'finisher' | 'gestation' | 'lactation' | 'breeder' | 'other' | string;
    label: string;
    consumedKg: number;
    cost: number;
}

export interface FeedingPerAnimal {
    avgDailyConsumptionKg: number | null;
    avgCostPerPigInInventory: number | null;
    avgCostPerKgProduced: number | null;
}

export interface FeedingSection {
    totalConsumedKg: number;
    totalCost: number;
    avgCostPerKgFeed: number | null;
    byPhase: FeedingByPhase[];
    perAnimal: FeedingPerAnimal;
}

// --- Health ---
export interface HealthMedication {
    productId: string | null;
    productName: string;
    applicationCount: number;
    totalQuantity: number;
    unit: string;
    totalCost: number;
}

export interface HealthSection {
    totalCost: number;
    medications: HealthMedication[];
    treatmentEvents: number;
    vaccinationEvents: number;
    mortalityByCause: MortalityByCause[];
}

// --- Reproduction ---
export interface ReproductionInseminations {
    count: number;
    successRate: number | null;
}

export interface ReproductionActivePregnancies {
    atPeriodStart: number;
    atPeriodEnd: number;
    confirmedInPeriod: number;
}

export interface ReproductionFarrowings {
    count: number;
    totalPigletsBorn: number;
    avgLitterSize: number | null;
}

export interface ReproductionSows {
    activeAtPeriodEnd: number;
    newlyFarrowed: number;
    weanedInPeriod: number;
}

export interface ReproductionSection {
    inseminations: ReproductionInseminations;
    activePregnancies: ReproductionActivePregnancies;
    farrowings: ReproductionFarrowings;
    sows: ReproductionSows;
}

// --- Workforce ---
export interface WorkforceCostByRole {
    role: string;
    count: number;
    totalCost: number;
}

export interface WorkforceHoursWorked {
    total: number;
    avgPerEmployee: number;
}

export interface WorkforceSection {
    totalLaborCost: number;
    employeeCount: number;
    costByRole: WorkforceCostByRole[] | null;
    hoursWorked: WorkforceHoursWorked | null;
}

// --- Comparisons ---
export type ComparisonSource = 'closed_snapshot' | 'live_computation' | 'not_available' | 'mixed';

export interface ComparisonVariation {
    totalIncome: number | null;
    totalCosts: number | null;
    operatingResult: number | null;
    operatingMargin: number | null;
    totalKgSold: number | null;
    totalPigsSold: number | null;
}

export interface ComparisonBlock {
    periodLabel: string;
    source: ComparisonSource;
    kpis: ClosingKpis | null;
    variation: ComparisonVariation | null;
}

export interface TrailingBlock {
    periodRange: string;
    source: ComparisonSource;
    avgKpis: ClosingKpis | null;
}

export interface ComparisonsSection {
    previousMonth: ComparisonBlock;
    sameMonthLastYear: ComparisonBlock;
    trailingThreeMonths: TrailingBlock;
    previousYear?: ComparisonBlock;
}

export interface MonthlyEvolutionItem {
    month: number;
    monthLabel: string;
    closingId: string | null;
    kpis: ClosingKpis | null;
}

export interface ClosingSnapshot {
    kpis: ClosingKpis;
    costBreakdown: ClosingCostItem[];
    salesSummary: ClosingSalesSummary[];
    monthlySummary: ClosingMonthlySummary[];
    meta: ClosingSnapshotMeta;

    // Extended sections (optional for backward-compat with old closings)
    inventory?: InventorySection;
    salesDetail?: SalesDetailSection;
    production?: ProductionSection;
    feeding?: FeedingSection;
    health?: HealthSection;
    reproduction?: ReproductionSection;
    workforce?: WorkforceSection;
    comparisons?: ComparisonsSection;
    monthlyEvolution?: MonthlyEvolutionItem[];
}

export interface PeriodClosing {
    _id: string;
    farmId: string;
    periodType: PeriodType;
    year: number;
    month: number | null;
    periodStart: string;
    periodEnd: string;
    status: PeriodClosingStatus;
    snapshot: ClosingSnapshot;
    closedBy: PeriodClosingUser | null;
    closedAt: string;
    notes?: string | null;
    reopenedBy?: PeriodClosingUser | null;
    reopenedAt?: string | null;
    reopenReason?: string | null;
    forced?: boolean;
    forcedReason?: string | null;
    forcedWarnings?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface PeriodClosingListItem {
    _id: string;
    farmId: string;
    periodType: PeriodType;
    year: number;
    month: number | null;
    periodStart: string;
    periodEnd: string;
    status: PeriodClosingStatus;
    closedBy: PeriodClosingUser | null;
    closedAt: string;
    kpis: ClosingKpis;
    farm?: { _id: string; name: string };
}

export interface PeriodClosingByPeriod {
    _id: string;
    status: PeriodClosingStatus;
    closedAt: string;
    closedBy: PeriodClosingUser | null;
    reopenedAt: string | null;
    reopenedBy: PeriodClosingUser | null;
    reopenReason: string | null;
}

export interface PeriodClosingAuditEvent {
    _id: string;
    closingId: string;
    action: 'close' | 'reopen' | 'reclose';
    performedBy: PeriodClosingUser | null;
    performedAt: string;
    reason: string | null;
    hasSnapshot: boolean;
}

export interface PeriodClosingPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ===================== Precheck (Phase 4) =====================

export type PrecheckStatus = 'ok' | 'warning' | 'error';
export type PrecheckSeverity = 'error' | 'warning';

export interface PrecheckItem {
    key: string;
    label: string;
    status: PrecheckStatus;
    severity: PrecheckSeverity;
    detail: string;
    actionUrl: string | null;
}

export interface PrecheckSummary {
    total: number;
    ok: number;
    warning: number;
    error: number;
}

export interface PrecheckResponse {
    periodType: PeriodType;
    year: number;
    month: number | null;
    periodStart: string;
    periodEnd: string;
    items: PrecheckItem[];
    summary: PrecheckSummary;
    canClose: boolean;
    canForceClose: boolean;
    blockingErrors: string[];
}