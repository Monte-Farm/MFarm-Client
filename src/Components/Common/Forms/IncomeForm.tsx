import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Alert, Nav, NavItem, NavLink, TabContent, TabPane, Card, CardBody, CardHeader, Spinner } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import SupplierForm from "./SupplierForm";
import DatePicker from "react-flatpickr";

import { Attribute, IncomeData, ProductData, PurchaseOrderData, SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";
import classnames from "classnames";
import ObjectDetailsHorizontal from "../Details/ObjectDetailsHorizontal";
import PurchaseOrderProductsTable from "../Tables/PurchaseOrderProductsTable";
import { currencies } from "common/data/currencies";
import Select from "react-select";
import { Column } from "common/data/data_types";
import AlertMessage from "../Shared/AlertMesagge";
import PurchaseOrderForm from "./PurchaseOrderForm";
import SuccessModal from "../Shared/SuccessModal";
import { getLoggedinUser } from "helpers/api_helper";
import ProductForm from "./ProductForm";
import CustomTable from "../Tables/CustomTable";
import SelectableTable from "../Tables/SelectableTable";
import SelectTable from "../Tables/SelectTable";

interface IncomeFormProps {
    initialData?: IncomeData;
    onSave: () => void;
    onCancel: () => void;
}

const incomeAttributes: Attribute[] = [
    { key: 'id', label: 'Identificador de entrada' },
    { key: 'date', label: 'Fecha de registro', type: 'date' },
    { key: 'emissionDate', label: 'Fecha de emisión', type: 'date' },
    { key: 'totalPrice', label: 'Precio Total', type: 'currency' },
    { key: 'incomeType', label: 'Tipo de entrada' }
];

const purchaseOrderAttributes: Attribute[] = [
    { key: 'code', label: 'No. de Orden de Compra' },
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'tax', label: 'Impuesto (%)', type: 'percentage' },
    { key: 'discount', label: 'Descuento (%)', type: 'percentage' },
    { key: 'subtotal', label: 'Subtotal', type: 'currency' },
    { key: 'totalPrice', label: 'Total', type: 'currency' },
];

const productColumns: Column<any>[] = [
    { header: 'Código', accessor: 'id', isFilterable: true, type: "text" },
    { header: 'Producto', accessor: 'name', isFilterable: true, type: "text" },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: true, type: "number" },
    { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: "text" },
    { header: 'Precio Unitario', accessor: 'price', type: "currency" },
    { header: 'Categoría', accessor: 'category', isFilterable: true, type: "text" },
];

const IncomeForm: React.FC<IncomeFormProps> = ({ initialData, onSave, onCancel }) => {
    const userLogged = getLoggedinUser();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ success: false, createSupplier: false, createProduct: false, selectPurchaseOrder: false, createPurchaseOrder: false });
    const [products, setProducts] = useState([])
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [selectedProducts, setSelectedProducts] = useState([])
    const configContext = useContext(ConfigContext)
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderData | null>(null)
    const [selectedOrderProducts, setSelectecOrderProducts] = useState([])
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
        { header: 'Total', accessor: 'totalPrice', isFilterable: true, type: "currency" },
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

    const fetchWarehouseId = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            const warehouseId = response.data.data;
            setMainWarehouseId(warehouseId)
            formik.setFieldValue('warehouse', warehouseId);
        } catch (error) {
            console.error('Error fetching main warehouse ID:', error);
        }
    }

    const fetchSuppliers = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/find_supplier_status/${true}`);
            setSuppliers(response.data.data);
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        }
    };


    const fetchProducts = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product`);
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        }
    };


    const fetchNextId = async () => {
        try {
            if (!initialData && configContext) {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_next_id`);
                const nextId = response.data.data;
                formik.setFieldValue('id', nextId);
            }
        } catch (error) {
            console.error("Ha ocurrido un error obteniendo el id");
        }
    };


    const fetchPurchaseOrders = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_not_purchased/${mainWarehouseId}`)
            setPurchaseOrders(response.data.data)
        } catch (error) {
            console.error(error, 'Error obtaining the purchase orders')
        }
    }


    const formik = useFormik<IncomeData>({
        initialValues: initialData || {
            id: "",
            warehouse: '',
            date: null,
            emissionDate: null,
            products: [],
            totalPrice: 0,
            incomeType: "",
            origin: {
                originType: 'Supplier',
                id: ""
            },
            documents: [],
            status: true,
            purchaseOrder: "",
            invoiceNumber: "",
            fiscalRecord: "",
            currency: "",
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

    function handleSelectSingle(selectedSingle: any) {
        setSelectecCurrency(selectedSingle)
        formik.setFieldValue('currency', selectedSingle.value);
    }

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

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find((s) => s.id === supplierId) || null;
        setSelectedSupplier(supplier);
        formik.setFieldValue("origin.id", supplier._id);
    };

    const handleCreateSupplier = async (supplierData: SupplierData) => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/supplier/create_supplier`, supplierData);
            const newSupplier = response.data.data;

            await fetchSuppliers();
            setSelectedSupplier(newSupplier);
            formik.setFieldValue("origin.id", newSupplier._id);

            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor guardado con exito' })
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar el proveedor, intentelo mas tarde' })
        } finally {
            toggleModal('createSupplier')
        }
    };

    const handleCreateProduct = async (productData: ProductData) => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/create_product`, productData);

            await fetchProducts();
            setAlertConfig({ visible: true, color: 'success', message: 'Producto guardado con exito' })
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar el producto, intentelo mas tarde' })
        } finally {
            toggleModal('createProduct')
        }
    };

    const handleProductSelect = (selectedProductsData: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("products", selectedProductsData);

        const updatedSelectedProducts: any = selectedProductsData.map((selectedProduct) => {
            const productData = products.find((p: any) => p.id === selectedProduct.id) as ProductData | undefined;

            return productData
                ? { ...productData, ...selectedProduct }
                : selectedProduct;
        });

        setSelectedProducts(updatedSelectedProducts);
    };

    const handleSupplierChangeByName = (supplierName: string) => {
        const supplier = suppliers.find((s) => s.name === supplierName) || null;
        setSelectedSupplier(supplier);
        formik.setFieldValue("origin.id", supplier?._id);
    };

    const clicPurchaseOrder = (row: any) => {
        setSelectedPurchaseOrder(row);
        handleSupplierChangeByName(row.supplier.name);
        formik.setFieldValue('purchaseOrder', row._id)

        setSelectecOrderProducts(row.products);
        formik.setFieldValue("products", row.products);
        handleProductSelect(row.products)

        setHasSelectedPurchaseOrder(true);
        toggleArrowTab(2)
    };

    useEffect(() => {
        fetchWarehouseId();
        fetchProducts();
        fetchSuppliers();
        fetchNextId();
    }, [])

    useEffect(() => {
        fetchPurchaseOrders();
    }, [mainWarehouseId])

    useEffect(() => {
        const supplier = suppliers.find((s) => s._id === formik.values.origin.id) || null;
        setSelectedSupplier(supplier);
    }, [formik.values.origin.id, suppliers]);

    useEffect(() => {
        const subtotal = formik.values.products.reduce((sum, product) => sum + (product.quantity * (product.price ?? 0)), 0);
        const totalWithTax = subtotal * 1;
        formik.setFieldValue("totalPrice", parseFloat(totalWithTax.toFixed(2)));
    }, [formik.values.products]);

    useEffect(() => {
        formik.validateForm();
    }, [formik.values]);

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
                className="form-steps"
            >
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
                        <div className="d-flex gap-2 mb-4">
                            <h4>Ordenes de Compra</h4>

                            <Button className="farm-primary-button ms-auto" onClick={() => toggleModal('createPurchaseOrder')}>
                                <i className="ri-add-line me-3" />
                                Crear Orden de Compra
                            </Button>
                        </div>
                        <SelectableTable columns={purchaseOrdersColumns} data={purchaseOrders} onSelect={(rows: any[]) => rows?.[0] && clicPurchaseOrder(rows[0])} selectionMode="single" />
                    </TabPane>

                    <TabPane id="step-incomeData-tab" tabId={2}>

                        <div>
                            <Card style={{ backgroundColor: '#A3C293' }}>
                                <CardBody className="pt-4">
                                    {selectedPurchaseOrder && (
                                        <ObjectDetailsHorizontal attributes={purchaseOrderAttributes} object={selectedPurchaseOrder} />
                                    )}
                                </CardBody>
                            </Card>
                            <Row>
                                <Col lg={6}>
                                    <div className="">
                                        <Label htmlFor="idInput" className="form-label">Identificador</Label>
                                        <Input
                                            type="text"
                                            id="idInput"
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
                                <div className="w-25">
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

                                <div className="w-25">
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

                                <div className="w-25">
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

                                <div className="w-25">
                                    <Label htmlFor="choices-single-default" className="form-label">Moneda</Label>
                                    <Select
                                        value={selectedCurrency}
                                        onChange={(selectedSingle: any) => {
                                            handleSelectSingle(selectedSingle);
                                        }}
                                        options={currencies}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.currency && !!formik.errors.currency}
                                        placeholder={'Seleccione una moneda'}
                                    />
                                    {formik.touched.currency && formik.errors.currency && <FormFeedback>{formik.errors.currency}</FormFeedback>}
                                </div>
                            </div>


                            {/* Tipo de Ingreso */}
                            <div className="mt-4">
                                <Label htmlFor="incomeTypeInput" className="form-label">Tipo de Ingreso</Label>
                                <Input
                                    type="select"
                                    id="incomeTypeInput"
                                    name="incomeType"
                                    value={formik.values.incomeType}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.incomeType && !!formik.errors.incomeType}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    <option value="purchase">Compra</option>
                                    <option value="donation">Donación</option>
                                    <option value="internal_transfer">Transferencia interna</option>
                                    <option value="own_production">Producción propia</option>
                                </Input>
                                {formik.touched.incomeType && formik.errors.incomeType && <FormFeedback>{formik.errors.incomeType}</FormFeedback>}
                            </div>

                            {/* Datos del proveedor */}
                            <div className="d-flex mt-4">
                                <h5 className="me-auto">Datos del Proveedor</h5>
                                <Button className="h-50 mb-2 farm-primary-button" onClick={() => toggleModal('createSupplier')} disabled>
                                    <i className="ri-add-line me-2"></i>
                                    Nuevo Proveedor
                                </Button>
                            </div>

                            <div className="border"></div>

                            {/* Proveedor */}
                            <div className="mt-3">
                                <Label htmlFor="supplierInput" className="form-label">Proveedor</Label>
                                <Input
                                    type="select"
                                    id="supplierInput"
                                    name="origin.id"
                                    value={formik.values.origin.id}
                                    onChange={(e) => handleSupplierChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.origin?.id && !!formik.errors.origin?.id}
                                    disabled
                                >
                                    <option value=''>Seleccione un proveedor</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier._id} value={supplier._id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </Input>

                                {formik.touched.origin?.id && formik.errors.origin?.id && <FormFeedback>{formik.errors.origin?.id}</FormFeedback>}
                            </div>

                            <div className="d-flex gap-3 mt-4">
                                <div className="w-25">
                                    <Label htmlFor="supplierRNC" className="form-label">RNC</Label>
                                    <Input type="text" className="form-control" id="supplierRNC" value={selectedSupplier?.rnc} disabled></Input>
                                </div>

                                <div className="w-25">
                                    <Label htmlFor="supplierAddress" className="form-label">Dirección</Label>
                                    <Input type="text" className="form-control" id="supplierAddress" value={selectedSupplier?.address} disabled></Input>
                                </div>

                                <div className="w-25">
                                    <Label htmlFor="supplierPhoneNumber" className="form-label">Número Telefonico</Label>
                                    <Input type="text" className="form-control" id="supplierPhoneNumber" value={selectedSupplier?.phone_number} disabled></Input>
                                </div>

                                <div className="w-25">
                                    <Label htmlFor="supplierType" className="form-label">Tipo de Proveedor</Label>
                                    <Input type="text" className="form-control" id="supplierType" value={selectedSupplier?.supplier_type} disabled></Input>
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
                            {/* Productos */}
                            <Row className="mb-3">
                                <Col lg={4}>
                                    <div className="">
                                        <Label htmlFor="totalPriceInput" className="form-label">Precio Total</Label>
                                        <div className="form-icon">
                                            <Input
                                                className="form-control form-control-icon"
                                                type="number"
                                                id="totalPriceInput"
                                                name="totalPrice"
                                                value={formik.values.totalPrice}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.totalPrice && !!formik.errors.totalPrice}
                                                disabled={true}
                                            />
                                            <i>$</i>
                                        </div>
                                        {formik.touched.totalPrice && formik.errors.totalPrice && <FormFeedback>{formik.errors.totalPrice}</FormFeedback>}
                                    </div>
                                </Col>

                                <Col lg={4}>
                                    {/* Documentos */}
                                    <div className="">
                                        <Label htmlFor="documentsInput" className="form-label">Documentos</Label>
                                        <Input
                                            type="file"
                                            id="documentsInput"
                                            accept="image/*, application/pdf"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setFileToUpload(e.target.files[0]); // Guarda el archivo seleccionado
                                                }
                                            }}
                                        />
                                    </div>
                                </Col>

                                <Col lg={4} className=" d-flex justify-content-end">
                                    <Button className="mb-2 farm-primary-button" onClick={() => { toggleModal('createProduct') }}>
                                        <i className="ri-add-line me-2"></i>
                                        Nuevo Producto
                                    </Button>
                                </Col>
                            </Row>


                            {/* Tabla de productos */}
                            <div className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(61vh - 100px)', overflowY: 'hidden' }}>
                                {hasSelectedPurchaseOrder ? (
                                    <PurchaseOrderProductsTable
                                        data={products}
                                        productsDelivered={selectedOrderProducts}
                                        onProductEdit={handleProductSelect}
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
                        <Card style={{ backgroundColor: '#A3C293' }}>
                            <CardBody className="pt-4">
                                {selectedPurchaseOrder && (
                                    <ObjectDetailsHorizontal attributes={purchaseOrderAttributes} object={selectedPurchaseOrder} />
                                )}
                            </CardBody>
                        </Card>
                        <Card style={{ backgroundColor: '#A3C293' }}>
                            <CardBody className="pt-4">
                                <ObjectDetailsHorizontal attributes={incomeAttributes} object={formik.values} />
                            </CardBody>
                        </Card>


                        <Card style={{ height: '43vh' }}>
                            <CardBody className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(62vh - 100px)', overflowY: 'auto' }}>
                                <CustomTable columns={productColumns} data={selectedProducts} showSearchAndFilter={false} showPagination={false} />
                            </CardBody>
                        </Card>

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

            <Modal size="lg" isOpen={modals.createSupplier} toggle={() => toggleModal("createSupplier")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createSupplier")}>Nuevo Proveedor</ModalHeader>
                <ModalBody>
                    <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => toggleModal("createSupplier", false)} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.createProduct} toggle={() => toggleModal("createProduct")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createProduct")}>Nuevo Producto</ModalHeader>
                <ModalBody>
                    <ProductForm onCancel={() => toggleModal("createProduct", false)} onSubmit={handleCreateProduct} />
                </ModalBody>
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
