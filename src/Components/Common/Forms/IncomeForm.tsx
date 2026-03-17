import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Nav, NavItem, NavLink, TabContent, TabPane, Card, CardBody, Spinner, Badge, CardHeader } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import DatePicker from "react-flatpickr";
import { Attribute, IncomeData, PurchaseOrderData, SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";
import classnames from "classnames";
import PurchaseOrderProductsTable from "../Tables/PurchaseOrderProductsTable";
import { Column } from "common/data/data_types";
import AlertMessage from "../Shared/AlertMesagge";
import PurchaseOrderForm from "./PurchaseOrderForm";
import SuccessModal from "../Shared/SuccessModal";
import { getLoggedinUser } from "helpers/api_helper";
import CustomTable from "../Tables/CustomTable";
import SelectableTable from "../Tables/SelectableTable";
import SelectTable from "../Tables/SelectTable";
import ObjectDetails from "../Details/ObjectDetails";

interface IncomeFormProps {
    initialData?: IncomeData;
    onSave: () => void;
    onCancel: () => void;
}

const incomeAttributes: Attribute[] = [
    { key: 'id', label: 'Identificador de entrada' },
    { key: 'date', label: 'Fecha de registro', type: 'date' },
    { key: 'emissionDate', label: 'Fecha de emisión', type: 'date' },
    {
        key: 'subtotal',
        label: 'Subtotal',
        type: 'currency',
        render: (_, row) => {
            const subtotal = row.products.reduce((sum: number, product: any) => sum + (product.quantity * (product.price || 0)), 0);
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(subtotal);
        }
    },
    { key: 'tax', label: 'Impuesto', type: 'percentage' },
    { key: 'discount', label: 'Descuento', type: 'percentage' },
    { key: 'totalPrice', label: 'Precio Total', type: 'currency' },
    {
        key: 'incomeType',
        label: 'Tipo de entrada',
        type: 'text',
        render: (value: string) => {
            let color = "secondary";
            let label = value;

            switch (value) {
                case "purchase":
                    color = "primary";
                    label = "Compra";
                    break;
                case "donation":
                    color = "success";
                    label = "Donación";
                    break;
                case "internal_transfer":
                    color = "info";
                    label = "Transferencia interna";
                    break;
                case "own_production":
                    color = "warning";
                    label = "Producción propia";
                    break;
            }

            return <Badge color={color}>{label}</Badge>;
        }
    }
];

const purchaseOrderAttributes: Attribute[] = [
    { key: 'code', label: 'No. de Orden de Compra' },
    { key: 'date', label: 'Fecha', type: 'date' },
    {
        key: 'supplier',
        label: 'Proveedor',
        type: 'text',
        render: (_, row) => <span className="text-black">{row.supplier.name}</span>
    },
];

const productColumns: Column<any>[] = [
    {
        header: 'Código',
        accessor: 'code',
        isFilterable: true,
        type: "text",
        render: (value, row) => <span>{row.code}</span>
    },
    { header: 'Producto', accessor: 'name', isFilterable: true, type: "text" },
    {
        header: 'Cantidad',
        accessor: 'quantity',
        isFilterable: true,
        type: "number",
        render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
    },
    { header: 'Precio Unitario', accessor: 'price', type: "currency" },
    {
        header: 'Precio Total',
        accessor: 'totalPrice',
        type: 'currency',
        render: (_, row) => {
            const totalPrice = (row.quantity || 0) * (row.price || 0);
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(totalPrice);
        }
    },
    {
        header: 'Categoria',
        accessor: 'category',
        isFilterable: true,
        type: 'text',
        render: (value: string) => {
            let color = "secondary";
            let label = value;

            switch (value) {
                case "nutrition":
                    color = "info";
                    label = "Nutrición";
                    break;
                case "medications":
                    color = "warning";
                    label = "Medicamentos";
                    break;
                case "vaccines":
                    color = "primary";
                    label = "Vacunas";
                    break;
                case "vitamins":
                    color = "success";
                    label = "Vitaminas";
                    break;
                case "minerals":
                    color = "success";
                    label = "Minerales";
                    break;
                case "supplies":
                    color = "success";
                    label = "Insumos";
                    break;
                case "hygiene_cleaning":
                    color = "success";
                    label = "Higiene y desinfección";
                    break;
                case "equipment_tools":
                    color = "success";
                    label = "Equipamiento y herramientas";
                    break;
                case "spare_parts":
                    color = "success";
                    label = "Refacciones y repuestos";
                    break;
                case "office_supplies":
                    color = "success";
                    label = "Material de oficina";
                    break;
                case "others":
                    color = "success";
                    label = "Otros";
                    break;
            }

            return <Badge color={color}>{label}</Badge>;
        },
    },
];

const IncomeForm: React.FC<IncomeFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ success: false, createSupplier: false, createProduct: false, selectPurchaseOrder: false, createPurchaseOrder: false });
    const [products, setProducts] = useState([])
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [selectedProducts, setSelectedProducts] = useState<Array<any>>([])
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderData | null>(null)
    const [selectedOrderProducts, setSelectecOrderProducts] = useState<Array<{ id: string; quantity: number; price: number }>>([])
    const [hasSelectedPurchaseOrder, setHasSelectedPurchaseOrder] = useState<boolean>(false);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [selectedCurrency, setSelectecCurrency] = useState()
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const purchaseOrdersColumns: Column<any>[] = [
        { header: 'Código', accessor: 'code', isFilterable: true, type: "text" },
        { header: 'Fecha', accessor: 'date', isFilterable: true, type: "date" },
        {
            header: 'Proveedor',
            accessor: 'supplier.name',
            isFilterable: true,
            type: "text",
            render: (_, row) => <span className="text-black">{row.supplier.name}</span>
        },
    ]

    const validationSchema = Yup.object({
        id: Yup.string()
            .required("Por favor, ingrese el ID")
            .test('unique_id', "Este identificador ya existe, por favor ingrese otro", async (value) => {
                if (!value) return false;
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/incomes/income_id_exists/${value}`);
                    return !result?.data.data;
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`);
                    return false;
                }
            }),
        date: Yup.string().required("Por favor, ingrese la fecha"),
        emissionDate: Yup.string().required("Por favor, ingrese la fecha"),
        totalPrice: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese el precio total"),
        tax: Yup.number().min(0, "El impuesto debe ser positivo").required("Por favor, ingrese el impuesto"),
        discount: Yup.number().min(0, "El descuento debe ser positivo").required("Por favor, ingrese el descuento"),
        incomeType: Yup.string().required("Por favor, seleccione el tipo de ingreso"),
        origin: Yup.object({
            id: Yup.string().required("Por favor, seleccione un proveedor"),
        }),
        documents: Yup.array().of(Yup.string()).required("Por favor, agregue al menos un documento"),
        invoiceNumber: Yup.string().required("Por favor, ingrese el número de factura"),
        fiscalRecord: Yup.string().required('Por favor, ingrese el registro fiscal'),
        currency: Yup.string().required('Por favor, seleccione la moneda')
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchAllInitialData = async () => {
        if (!configContext || !userLogged) return;

        try {
            const [warehouseResponse, nextIdResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_next_id`)
            ]);

            const warehouseId = warehouseResponse.data.data;
            setMainWarehouseId(warehouseId);
            formik.setFieldValue('warehouse', warehouseId);

            formik.setFieldValue('id', nextIdResponse.data.data);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos iniciales, intentelo mas tarde' });
        }
    };

    const fetchPurchaseOrders = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_not_purchased/${mainWarehouseId}`);
            setPurchaseOrders(response.data.data);
        } catch (error) {
            console.error('Error obtaining the purchase orders:', error);
        }
    };

    const formik = useFormik<IncomeData>({
        initialValues: initialData || {
            id: "",
            warehouse: '',
            date: null,
            emissionDate: null,
            products: [],
            totalPrice: 0,
            tax: 0,
            discount: 0,
            incomeType: "purchase",
            origin: {
                originType: 'Supplier',
                id: ""
            },
            documents: [],
            status: true,
            purchaseOrder: "",
            invoiceNumber: "",
            fiscalRecord: "",
            currency: "MXN",
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            if (!configContext) return;
            try {
                setSubmitting(true);
                if (fileToUpload) {
                    await uploadFile(fileToUpload)
                }

                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/incomes/create_income`, values);
                toggleModal('success');
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const uploadFile = async (file: File) => {
        try {
            if (!configContext) return;

            try {
                const uploadResponse = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/upload/upload_file/`, file);
                formik.setFieldValue('documents', [...formik.values.documents, uploadResponse.data.data]);
            } catch (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar el archivo, intentelo mas tarde' })
        }
    }

    const handleProductSelect = (selectedProductsData: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("products", selectedProductsData);

        const updatedSelectedProducts: any = selectedProductsData.map((selectedProduct) => {
            const productData = products.find((p: any) => p.id._id === selectedProduct.id) as any | undefined;
            return productData
                ? { ...productData.id, code: productData.id.id, ...selectedProduct }
                : selectedProduct;
        });

        setSelectedProducts(updatedSelectedProducts);
    };

    const handleProductEdit = (updatedProducts: Array<{ id: string; quantity: number; price: number }>) => {
        setSelectecOrderProducts(updatedProducts);
        formik.setFieldValue("products", updatedProducts);

        const updatedSelectedProducts = updatedProducts.map((updatedProduct) => {
            const productData = products.find((p: any) => p.id._id === updatedProduct.id) as any | undefined;
            return productData
                ? { ...productData.id, code: productData.id.id, ...updatedProduct }
                : updatedProduct;
        });

        setSelectedProducts(updatedSelectedProducts);
    };

    const clicPurchaseOrder = (row: any) => {
        setSelectedPurchaseOrder(row);
        setProducts(row.products);

        formik.setFieldValue('purchaseOrder', row._id);
        formik.setFieldValue('origin.id', row.supplier._id);

        const processedProducts = row.products.map((product: any) => ({
            id: product.id._id,
            quantity: product.quantity,
            price: 0
        }));

        setSelectecOrderProducts(processedProducts);
        formik.setFieldValue("products", processedProducts);

        const updatedSelectedProducts = processedProducts.map((selectedProduct: { id: string; quantity: number; price: number }) => {
            const productData = row.products.find((p: any) => p.id._id === selectedProduct.id);
            return productData
                ? { ...productData.id, code: productData.id.id, ...selectedProduct }
                : selectedProduct;
        });

        setSelectedProducts(updatedSelectedProducts);

        setHasSelectedPurchaseOrder(true);
        toggleArrowTab(2);
    };

    useEffect(() => {
        fetchAllInitialData();
        formik.setFieldValue('date', new Date())
    }, [])

    useEffect(() => {
        fetchPurchaseOrders();
    }, [mainWarehouseId])

    useEffect(() => {
        const subtotal = formik.values.products.reduce((sum, product) => sum + (product.quantity * (product.price ?? 0)), 0);
        const totalAfterDiscount = subtotal - (subtotal * (formik.values.discount / 100));
        const totalWithTax = totalAfterDiscount + (totalAfterDiscount * (formik.values.tax / 100));
        formik.setFieldValue("totalPrice", parseFloat(totalWithTax.toFixed(2)));
    }, [formik.values.products, formik.values.tax, formik.values.discount]);

    useEffect(() => {
        formik.validateForm();
    }, [formik.values]);

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className="form-steps">
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-selectPurchaseOrder-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-selectPurchaseOrder-tab"
                                disabled
                            >
                                Seleccionar orden de compra
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-incomeData-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-incomeData-tab"
                                disabled
                            >
                                Información de entrada
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-products-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-products-tab"
                                disabled
                            >
                                Selección de productos
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 4,
                                })}
                                onClick={() => toggleArrowTab(4)}
                                aria-selected={activeStep === 4}
                                aria-controls="step-summary-tab"
                                disabled
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-selectPurchaseOrder-tab" tabId={1}>
                        <div className="d-flex gap-2 mb-1">
                            <h5 className="text-muted">Ordenes de Compra</h5>
                        </div>
                        <SelectableTable columns={purchaseOrdersColumns} data={purchaseOrders} onSelect={(rows: any[]) => rows?.[0] && clicPurchaseOrder(rows[0])} selectionMode="single" showSearchAndFilter={false} showPagination={false} />
                    </TabPane>

                    <TabPane id="step-incomeData-tab" tabId={2}>
                        <div>
                            <Row>
                                <Col lg={6}>
                                    <div className="">
                                        <Label htmlFor="id" className="form-label">Identificador</Label>
                                        <Input
                                            type="text"
                                            id="id"
                                            name="id"
                                            value={formik.values.id}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.id && !!formik.errors.id}
                                            disabled
                                        />
                                        {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
                                    </div>
                                </Col>

                                {/* Fecha de registro */}
                                <Col lg={6}>
                                    <div className="">
                                        <Label htmlFor="date" className="form-label">Fecha de entrada</Label>
                                        <DatePicker
                                            id="date"
                                            className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                                            value={formik.values.date ?? undefined}
                                            onChange={(date: Date[]) => {
                                                if (date[0]) formik.setFieldValue('date', date[0]);
                                            }}
                                            options={{ dateFormat: 'd/m/Y' }}
                                        />
                                        {formik.touched.date && formik.errors.date && (
                                            <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            <div className="d-flex gap-3 mt-4">
                                <div className="w-100">
                                    <Label htmlFor="invoiceNumberInput" className="form-label">No.de Factura</Label>
                                    <Input
                                        type="text"
                                        id="invoiceNumberInput"
                                        name="invoiceNumber"
                                        value={formik.values.invoiceNumber}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.invoiceNumber && !!formik.errors.invoiceNumber}
                                    />
                                    {formik.touched.invoiceNumber && formik.errors.invoiceNumber && <FormFeedback>{formik.errors.invoiceNumber}</FormFeedback>}
                                </div>

                                <div className="w-100">
                                    <Label htmlFor="emissionDateInput" className="form-label">Fecha de emisión de factura</Label>
                                    <DatePicker
                                        id="emissionDateInput"
                                        className={`form-control ${formik.touched.emissionDate && formik.errors.emissionDate ? 'is-invalid' : ''}`}
                                        value={formik.values.emissionDate ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) formik.setFieldValue('emissionDate', date[0]);
                                        }}
                                        options={{ dateFormat: 'd/m/Y' }}
                                    />
                                    {formik.touched.emissionDate && formik.errors.emissionDate && (
                                        <FormFeedback className="d-block">{formik.errors.emissionDate as string}</FormFeedback>
                                    )}
                                </div>

                                <div className="w-100">
                                    <Label htmlFor="fiscalRecordInput" className="form-label">Registro Fiscal</Label>
                                    <Input
                                        type="text"
                                        id="fiscalRecordInput"
                                        name="fiscalRecord"
                                        value={formik.values.fiscalRecord}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.fiscalRecord && !!formik.errors.fiscalRecord}
                                    />
                                    {formik.touched.fiscalRecord && formik.errors.fiscalRecord && <FormFeedback>{formik.errors.fiscalRecord}</FormFeedback>}
                                </div>
                            </div>

                            <div className="d-flex gap-3 mt-4">
                                <div className="w-50">
                                    <Label htmlFor="taxInput" className="form-label">Impuesto (%)</Label>
                                    <div className="input-group">
                                        <Input
                                            type="number"
                                            id="taxInput"
                                            name="tax"
                                            value={formik.values.tax}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.tax && !!formik.errors.tax}
                                            min={0}
                                            step="0.01"
                                        />
                                        <span className="input-group-text">%</span>
                                    </div>
                                    {formik.touched.tax && formik.errors.tax && <FormFeedback>{formik.errors.tax}</FormFeedback>}
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="discountInput" className="form-label">Descuento (%)</Label>
                                    <div className="input-group">
                                        <Input
                                            type="number"
                                            id="discountInput"
                                            name="discount"
                                            value={formik.values.discount}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.discount && !!formik.errors.discount}
                                            min={0}
                                            step="0.01"
                                        />
                                        <span className="input-group-text">%</span>
                                    </div>
                                    {formik.touched.discount && formik.errors.discount && <FormFeedback>{formik.errors.discount}</FormFeedback>}
                                </div>
                            </div>

                            <div className="d-flex mt-4">
                                <Button
                                    className="btn btn-light btn-label previestab farm-secondary-button"
                                    onClick={() => {
                                        toggleArrowTab(activeStep - 1);
                                    }}
                                >
                                    <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                    Atras
                                </Button>

                                <Button
                                    className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                    onClick={() => toggleArrowTab(activeStep + 1)}
                                    disabled={
                                        !formik.values.id ||
                                        !formik.values.date ||
                                        !formik.values.emissionDate ||
                                        !formik.values.incomeType ||
                                        !formik.values.origin.id ||
                                        !formik.values.fiscalRecord ||
                                        !formik.values.currency ||
                                        !formik.values.invoiceNumber ||
                                        formik.values.tax === null ||
                                        formik.values.tax === undefined ||
                                        formik.values.discount === null ||
                                        formik.values.discount === undefined ||
                                        Object.keys(formik.errors).length > 0
                                    }
                                >
                                    <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                    Siguiente
                                </Button>
                            </div>

                        </div>
                    </TabPane>

                    <TabPane id="step-products-tab" tabId={3}>
                        <div>
                            <div className="w-100 mb-4">
                                <Label htmlFor="documentsInput" className="form-label">Documentos</Label>
                                <Input
                                    type="file"
                                    id="documentsInput"
                                    accept="image/*, application/pdf"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFileToUpload(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>

                            <Label className="">Productos para ingresar</Label>
                            {/* Tabla de productos */}
                            <div className="border border-0 d-flex flex-column flex-grow-1">
                                {hasSelectedPurchaseOrder ? (
                                    <PurchaseOrderProductsTable
                                        data={products}
                                        productsDelivered={selectedOrderProducts}
                                        onProductEdit={handleProductEdit}
                                    />
                                ) : (
                                    <SelectTable
                                        data={products}
                                        onProductSelect={handleProductSelect}
                                        showPagination={false}
                                    />
                                )}
                            </div>

                            <div className="d-flex mt-4">
                                <Button
                                    className="btn btn-light btn-label previestab farm-secondary-button"
                                    onClick={() => {
                                        toggleArrowTab(activeStep - 1);
                                    }}
                                >
                                    <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                    Atras
                                </Button>

                                <Button
                                    className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                    onClick={() => toggleArrowTab(activeStep + 1)}
                                    disabled={
                                        formik.values.products.length === 0 ||
                                        formik.values.products.some(product => !product.quantity || product.quantity <= 0 || !product.price || product.price <= 0)
                                    }
                                >
                                    <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                    Siguiente
                                </Button>

                            </div>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="d-flex flex-column gap-1 w-100">
                            <div className="d-flex gap-3">
                                <Card className="w-50">
                                    <CardHeader style={{ backgroundColor: '#f8f9fa' }}>
                                        <h5>Orden de compra</h5>
                                    </CardHeader>
                                    <CardBody className="pt-4">
                                        {selectedPurchaseOrder && (
                                            <ObjectDetails attributes={purchaseOrderAttributes} object={selectedPurchaseOrder} />
                                        )}
                                    </CardBody>
                                </Card>

                                <Card className="w-50">
                                    <CardHeader style={{ backgroundColor: '#f8f9fa' }}>
                                        <h5>Entrada</h5>
                                    </CardHeader>
                                    <CardBody className="pt-4">
                                        <ObjectDetails attributes={incomeAttributes} object={formik.values} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="w-100">
                                <Card >
                                    <CardHeader style={{ backgroundColor: '#f8f9fa' }}>
                                        <h5>Productos</h5>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <CustomTable columns={productColumns} data={selectedProducts} showSearchAndFilter={false} showPagination={false} />
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="d-flex mt-4 gap-2">
                            <Button
                                className="btn btn-light btn-label previestab farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep - 1);
                                }}
                            >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>

                            <Button className="farm-primary-button ms-auto" type="submit" disabled={formik.isSubmitting}>
                                {formik.isSubmitting ?
                                    <>
                                        <Spinner size='sm' className="me-3" />
                                        Guardando...</>
                                    : initialData ?
                                        "Actualizar entrada" : "Registrar Entrada"}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <Modal size="xl" isOpen={modals.createPurchaseOrder} toggle={() => toggleModal("createPurchaseOrder")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createPurchaseOrder")}>Nueva orden de compra</ModalHeader>
                <ModalBody>
                    <PurchaseOrderForm onSave={() => { toggleModal('createPurchaseOrder'); fetchPurchaseOrders(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

            <SuccessModal isOpen={modals.success} onClose={onSave} message={"Entrada creada con exito"} />
        </>
    );
};

export default IncomeForm;
