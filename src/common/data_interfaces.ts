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
    username: string;
    password: string;
    name: string;
    lastname: string;
    phoneNumber: string;
    email: string;
    role: string;
    assigment?: string | null
    status: boolean;
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
