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
    date: string;
    emissionDate: string;
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
    date: string;
    user: string;
    productsRequested: Array<ProductId>;
    status: string;
    orderDestiny: string;
    orderOrigin: string;
    productsDelivered: Array<ProductId>;
}

export interface OutcomeData {
    id: string;
    date: string;
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
    id: string;
    name: string;
    location: string;
    manager: string;
    status: boolean;
    products: ProductComplete[]
    incomes: string[]
    outcomes: string[]
    isSubwarehouse: boolean
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
    username: string;
    password: string;
    name: string;
    lastname: string;
    farm_assigned: string | null;
    email: string;
    role: string;
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
    id: string;
    date: string;
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
}


export interface PigData {
    _id: string;
    code: string;
    farmId: string;
    birthdate: Date | null;
    breed: string;
    origin: 'nacido' | 'comprado' | 'donado' | 'otro';
    originDetail?: string;
    sourceFarm?: string;
    arrivalDate?: Date | null;
    status: 'vivo' | 'vendido' | 'sacrificado' | 'muerto' | 'descartado';
    currentStage: 'lechón' | 'destete' | 'engorda' | 'reproductor';
    sex: 'macho' | 'hembra';
    weight: number;
    observations?: string;
    historyChanges: PigHistoryChanges[];
    discarded: boolean;
    discardReason?: string | null;
    discardDestination?: string | null;
    discardDeathCause?: string;
    discardResponsible?: string;
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
    name: string,
    code: string,
    location: string,
    status: boolean,
    manager: string,
    createdAt: Date,
    updatedAt: Date,
}