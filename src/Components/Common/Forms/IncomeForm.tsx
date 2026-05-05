import { logger } from 'utils/logger';
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
import { getEffectiveUser } from "helpers/impersonation_helper";
import CustomTable from "../Tables/CustomTable";
import SelectableTable from "../Tables/SelectableTable";
import SelectTable from "../Tables/SelectTable";
import ObjectDetails from "../Details/ObjectDetails";
import FileUploader from "../Shared/FileUploader";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";

interface IncomeFormProps {
    initialData?: IncomeData;
    onSave: () => void;
    onCancel: () => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ initialData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser();
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
    const [entryMode, setEntryMode] = useState<"purchase_order" | "direct" | null>(null)

    const incomeAttributes: Attribute[] = [
        { key: 'id', label: t('common.field.code', { defaultValue: 'Identificador de entrada' }) },
        { key: 'date', label: t('common.field.date', { defaultValue: 'Fecha de registro' }), type: 'date' },
        { key: 'emissionDate', label: t('warehouse.incomeForm.attr.emissionDate', { defaultValue: 'Fecha de emisión' }), type: 'date' },
        {
            key: 'subtotal',
            label: t('warehouse.incomeForm.attr.subtotal', { defaultValue: 'Subtotal' }),
            type: 'currency',
            render: (_, row) => {
                const subtotal = row.products.reduce((sum: number, product: any) => sum + (product.quantity * (product.price || 0)), 0);
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(subtotal);
            }
        },
        { key: 'tax', label: t('warehouse.incomeForm.attr.tax', { defaultValue: 'Impuesto' }), type: 'percentage' },
        { key: 'discount', label: t('warehouse.incomeForm.attr.discount', { defaultValue: 'Descuento' }), type: 'percentage' },
        { key: 'totalPrice', label: t('common.field.totalPrice', { defaultValue: 'Precio Total' }), type: 'currency' },
        {
            key: 'incomeType',
            label: t('warehouse.incomeForm.attr.incomeType', { defaultValue: 'Tipo de entrada' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "purchase":
                        color = "primary";
                        break;
                    case "donation":
                        color = "success";
                        break;
                    case "internal_transfer":
                        color = "info";
                        break;
                    case "own_production":
                        color = "warning";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.incomeType.${value}`, { defaultValue: value })}</Badge>;
            }
        }
    ];

    const purchaseOrderAttributes: Attribute[] = [
        { key: 'code', label: t('warehouse.purchaseOrders.col.orderNumber', { defaultValue: 'No. de Orden de Compra' }) },
        { key: 'date', label: t('common.field.date', { defaultValue: 'Fecha' }), type: 'date' },
        {
            key: 'supplier',
            label: t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' }),
            type: 'text',
            render: (_, row) => <span className="text-black">{row.supplier.name}</span>
        },
    ];

    const productColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: 'code',
            isFilterable: true,
            type: "text",
            render: (value, row) => <span>{row.code}</span>
        },
        { header: t('common.field.name', { defaultValue: 'Producto' }), accessor: 'name', isFilterable: true, type: "text" },
        {
            header: t('common.field.qty', { defaultValue: 'Cantidad' }),
            accessor: 'quantity',
            isFilterable: true,
            type: "number",
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>,
            bgColor: '#f0f0ff'
        },
        {
            header: t('common.field.unitPrice', { defaultValue: 'Precio Unitario' }),
            accessor: 'price',
            type: "currency",
            bgColor: '#e6f0ff'
        },
        {
            header: t('common.field.totalPrice', { defaultValue: 'Precio Total' }),
            accessor: 'totalPrice',
            type: 'currency',
            render: (_, row) => {
                const totalPrice = (row.quantity || 0) * (row.price || 0);
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(totalPrice);
            },
            bgColor: '#e6ffe6'
        },
        {
            header: t('warehouse.products.attr.category', { defaultValue: 'Categoria' }),
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "nutrition":
                        color = "info";
                        break;
                    case "medications":
                        color = "warning";
                        break;
                    case "vaccines":
                        color = "primary";
                        break;
                    case "vitamins":
                    case "minerals":
                    case "supplies":
                    case "hygiene_cleaning":
                    case "equipment_tools":
                    case "spare_parts":
                    case "office_supplies":
                    case "others":
                        color = "success";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ];

    const purchaseOrdersColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', isFilterable: true, type: "text" },
        { header: t('common.field.date', { defaultValue: 'Fecha' }), accessor: 'date', isFilterable: true, type: "date" },
        {
            header: t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' }),
            accessor: 'supplier.name',
            isFilterable: true,
            type: "text",
            render: (_, row) => <span className="text-black">{row.supplier.name}</span>
        },
    ]

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const validationSchema = Yup.object({
        id: Yup.string()
            .required(t('warehouse.incomeForm.validation.idRequired'))
            .test('unique_id', t('warehouse.incomeForm.validation.idExists'), async (value) => {
                if (!value) return false;
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/incomes/income_id_exists/${value}`);
                    return !result?.data.data;
                } catch (error) {
                    logger.error(`Error al validar el ID: ${error}`);
                    return false;
                }
            }),
        date: Yup.string().required(t('warehouse.incomeForm.validation.dateRequired')),
        emissionDate: Yup.string().required(t('warehouse.incomeForm.validation.dateRequired')),
        tax: Yup.number().min(0, t('warehouse.incomeForm.validation.taxPositive')).required(t('warehouse.incomeForm.validation.taxRequired')),
        discount: Yup.number().min(0, t('warehouse.incomeForm.validation.discountPositive')).required(t('warehouse.incomeForm.validation.discountRequired')),
        invoiceNumber: Yup.string().required(t('warehouse.incomeForm.validation.invoiceRequired')),
        fiscalRecord: Yup.string().required(t('warehouse.incomeForm.validation.fiscalRequired')),
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
            logger.error('Error fetching initial data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos iniciales, intentelo mas tarde' });
        }
    };

    const fetchSuppliers = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/find_supplier_status/${true}`);
            setSuppliers(response.data.data);
        } catch (error) {
            logger.error('Error obtaining suppliers:', error);
        }
    };

    const fetchCatalogProducts = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product`);
            const rawProducts = response.data.data.filter((p: any) => p.type === 'raw');
            setProducts(rawProducts);
        } catch (error) {
            logger.error('Error obtaining products:', error);
        }
    };

    const fetchPurchaseOrders = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_not_purchased/${mainWarehouseId}`);
            setPurchaseOrders(response.data.data);
        } catch (error) {
            logger.error('Error obtaining the purchase orders:', error);
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
                logger.error("Error al enviar el formulario:", error);
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
            logger.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar el archivo, intentelo mas tarde' })
        }
    }

    const handleProductSelect = (selectedProductsData: Array<{ id: string; quantity: number; price: number }>) => {
        if (entryMode === "direct") {
            const formikProducts = selectedProductsData.map((sp) => {
                const productData = products.find((p: any) => p.id === sp.id) as any | undefined;
                return { id: productData?._id || sp.id, quantity: sp.quantity, price: sp.price, totalPrice: sp.quantity * (sp.price || 0) };
            });
            formik.setFieldValue("products", formikProducts);

            const updatedSelectedProducts: any = selectedProductsData.map((sp) => {
                const productData = products.find((p: any) => p.id === sp.id) as any | undefined;
                return productData
                    ? { ...productData, code: productData.id, ...sp, id: productData._id }
                    : sp;
            });
            setSelectedProducts(updatedSelectedProducts);
        } else {
            formik.setFieldValue("products", selectedProductsData);

            const updatedSelectedProducts: any = selectedProductsData.map((selectedProduct) => {
                const productData = products.find((p: any) => p.id._id === selectedProduct.id) as any | undefined;
                return productData
                    ? { ...productData.id, code: productData.id.id, ...selectedProduct }
                    : selectedProduct;
            });
            setSelectedProducts(updatedSelectedProducts);
        }
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

    const selectEntryMode = (mode: "purchase_order" | "direct") => {
        setEntryMode(mode);
        if (mode === "direct") {
            fetchSuppliers();
            fetchCatalogProducts();
            formik.setFieldValue('purchaseOrder', '');
            setSelectedPurchaseOrder(null);
            setHasSelectedPurchaseOrder(false);
            toggleArrowTab(2);
        }
    };

    const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const supplierId = e.target.value;
        const supplier = suppliers.find((s: any) => s._id === supplierId);
        setSelectedSupplier(supplier || null);
        formik.setFieldValue('origin.id', supplierId);
    };

    const clicPurchaseOrder = (row: any) => {
        setEntryMode("purchase_order");
        setSelectedPurchaseOrder(row);
        setProducts(row.products);

        formik.setFieldValue('purchaseOrder', row._id);
        formik.setFieldValue('origin.id', row.supplier._id);

        const processedProducts = row.products.map((product: any) => ({
            id: product.id._id,
            quantity: product.quantity,
            price: product.unitPrice || 0,
            totalPrice: product.totalPrice || 0
        }));

        setSelectecOrderProducts(processedProducts);
        formik.setFieldValue("products", processedProducts);

        const updatedSelectedProducts = processedProducts.map((selectedProduct: { id: string; quantity: number; price: number; totalPrice: number }) => {
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
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className="form-steps" noValidate>
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
                                {entryMode === "direct"
                                    ? t('warehouse.incomeForm.step.directMode', { defaultValue: 'Modo de entrada' })
                                    : entryMode === "purchase_order"
                                        ? t('warehouse.incomeForm.step.purchaseOrder', { defaultValue: 'Orden de compra' })
                                        : t('warehouse.incomeForm.step.selectMode', { defaultValue: 'Seleccionar modo' })}
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
                                {t('warehouse.incomeForm.step.incomeInfo', { defaultValue: 'Información de entrada' })}
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
                                {t('warehouse.incomeForm.step.products', { defaultValue: 'Selección de productos' })}
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
                                {t('warehouse.incomeForm.step.summary', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-selectPurchaseOrder-tab" tabId={1}>
                        {!entryMode ? (
                            <div className="d-flex flex-column align-items-center gap-4 py-4">
                                <h5 className="text-muted">{t('warehouse.incomeForm.selectMode.title', { defaultValue: '¿Cómo desea registrar la entrada?' })}</h5>
                                <div className="d-flex gap-4 w-75">
                                    <Card
                                        className="w-50 text-center border cursor-pointer shadow-sm"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => selectEntryMode("purchase_order")}
                                    >
                                        <CardBody className="py-5">
                                            <i className="ri-file-list-3-line text-primary" style={{ fontSize: '3rem' }}></i>
                                            <h5 className="mt-3">{t('warehouse.incomeForm.selectMode.withOrder', { defaultValue: 'Con orden de compra' })}</h5>
                                            <p className="text-muted mb-0">{t('warehouse.incomeForm.selectMode.withOrderDesc', { defaultValue: 'Seleccione una orden de compra existente para registrar la entrada de productos.' })}</p>
                                        </CardBody>
                                    </Card>
                                    <Card
                                        className="w-50 text-center border cursor-pointer shadow-sm"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => selectEntryMode("direct")}
                                    >
                                        <CardBody className="py-5">
                                            <i className="ri-add-box-line text-success" style={{ fontSize: '3rem' }}></i>
                                            <h5 className="mt-3">{t('warehouse.incomeForm.selectMode.direct', { defaultValue: 'Entrada directa' })}</h5>
                                            <p className="text-muted mb-0">{t('warehouse.incomeForm.selectMode.directDesc', { defaultValue: 'Registre una entrada de productos sin necesidad de una orden de compra.' })}</p>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        ) : entryMode === "purchase_order" ? (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h5 className="text-muted">{t('warehouse.incomeForm.purchaseOrders.title', { defaultValue: 'Ordenes de Compra' })}</h5>
                                    <Button size="sm" className="btn" onClick={() => setEntryMode(null)}>
                                        <i className="ri-arrow-go-back-line me-1"></i>{t('warehouse.incomeForm.changeMode', { defaultValue: 'Cambiar modo' })}
                                    </Button>
                                </div>
                                <SelectableTable columns={purchaseOrdersColumns} data={purchaseOrders} onSelect={(rows: any[]) => rows?.[0] && clicPurchaseOrder(rows[0])} selectionMode="single" showSearchAndFilter={false} showPagination={false} />
                            </div>
                        ) : null}
                    </TabPane>

                    <TabPane id="step-incomeData-tab" tabId={2}>
                        <div>
                            {entryMode === "direct" && (
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="text-muted mb-0">{t('warehouse.incomeForm.selectMode.direct', { defaultValue: 'Entrada directa' })}</h5>
                                    <Button className="btn" size="sm" onClick={() => { setEntryMode(null); toggleArrowTab(1); }}>
                                        <i className="ri-arrow-go-back-line me-1"></i>{t('warehouse.incomeForm.changeMode', { defaultValue: 'Cambiar modo' })}
                                    </Button>
                                </div>
                            )}
                            {/* Datos generales */}
                            <Card className="shadow-sm">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0"><i className="ri-information-line me-2"></i>{t('warehouse.incomeForm.section.generalData', { defaultValue: 'Datos generales' })}</h6>
                                </CardHeader>
                                <CardBody>
                                    <Row className="g-3">
                                        <Col lg={entryMode === "direct" ? 3 : 6}>
                                            <Label htmlFor="id" className="form-label">{t('common.field.code', { defaultValue: 'Identificador' })}</Label>
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
                                        </Col>
                                        <Col lg={entryMode === "direct" ? 3 : 6}>
                                            <Label htmlFor="date" className="form-label">{t('warehouse.incomeForm.attr.entryDate', { defaultValue: 'Fecha de entrada' })}</Label>
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
                                        </Col>
                                        {entryMode === "direct" && (
                                            <Col lg={6}>
                                                <Label htmlFor="supplierSelect" className="form-label">{t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' })}</Label>
                                                <Input
                                                    type="select"
                                                    id="supplierSelect"
                                                    value={formik.values.origin.id}
                                                    onChange={handleSupplierChange}
                                                    invalid={formik.touched.origin?.id && !formik.values.origin.id}
                                                >
                                                    <option value="">{t('warehouse.incomeForm.placeholder.selectSupplier', { defaultValue: 'Seleccione un proveedor' })}</option>
                                                    {suppliers.map((supplier: any) => (
                                                        <option key={supplier._id} value={supplier._id}>
                                                            {supplier.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                                {formik.touched.origin?.id && !formik.values.origin.id && (
                                                    <FormFeedback className="d-block">{t('warehouse.incomeForm.validation.selectSupplier', { defaultValue: 'Por favor, seleccione un proveedor' })}</FormFeedback>
                                                )}
                                            </Col>
                                        )}
                                    </Row>
                                </CardBody>
                            </Card>

                            {/* Datos de facturación */}
                            <Card className="shadow-sm">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0"><i className="ri-file-text-line me-2"></i>{t('warehouse.incomeForm.section.billing', { defaultValue: 'Facturación' })}</h6>
                                </CardHeader>
                                <CardBody>
                                    <Row className="g-3">
                                        <Col lg={4}>
                                            <Label htmlFor="invoiceNumberInput" className="form-label">{t('warehouse.incomeForm.attr.invoiceNumber', { defaultValue: 'No. de Factura' })}</Label>
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
                                        </Col>
                                        <Col lg={4}>
                                            <Label htmlFor="emissionDateInput" className="form-label">{t('warehouse.incomeForm.attr.emissionDate', { defaultValue: 'Fecha de emisión' })}</Label>
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
                                        </Col>
                                        <Col lg={4}>
                                            <Label htmlFor="fiscalRecordInput" className="form-label">{t('warehouse.incomeForm.attr.fiscalRecord', { defaultValue: 'Registro Fiscal' })}</Label>
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
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            {/* Impuestos y descuentos */}
                            <Card className="shadow-sm">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0"><i className="ri-percent-line me-2"></i>{t('warehouse.incomeForm.section.taxDiscount', { defaultValue: 'Impuestos y descuentos' })}</h6>
                                </CardHeader>
                                <CardBody>
                                    <Row className="g-3">
                                        <Col lg={6}>
                                            <Label htmlFor="taxInput" className="form-label">{t('warehouse.incomeForm.attr.tax', { defaultValue: 'Impuesto' })}</Label>
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
                                        </Col>
                                        <Col lg={6}>
                                            <Label htmlFor="discountInput" className="form-label">{t('warehouse.incomeForm.attr.discount', { defaultValue: 'Descuento' })}</Label>
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
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            <div className="d-flex mt-4">
                                {entryMode !== "direct" && (
                                    <Button
                                        className="btn btn-light btn-label previestab farm-secondary-button"
                                        onClick={() => toggleArrowTab(activeStep - 1)}
                                    >
                                        <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                        {t('common.button.back', { defaultValue: 'Atras' })}
                                    </Button>
                                )}

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
                                    {t('warehouse.incomeForm.button.next', { defaultValue: 'Siguiente' })}
                                </Button>
                            </div>

                        </div>
                    </TabPane>

                    <TabPane id="step-products-tab" tabId={3}>
                        <div>
                            <div className="w-100 mb-4">
                                <Label className="form-label">{t('warehouse.incomeForm.attr.documents', { defaultValue: 'Documentos' })}</Label>
                                <FileUploader
                                    acceptedFileTypes={['image/*', 'application/pdf']}
                                    maxFiles={5}
                                    onFileUpload={(file) => setFileToUpload(file)}
                                />
                            </div>

                            <Label className="">{t('warehouse.incomeForm.attr.productsToAdd', { defaultValue: 'Productos para ingresar' })}</Label>
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
                                    {t('common.button.back', { defaultValue: 'Atras' })}
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
                                    {t('warehouse.incomeForm.button.next', { defaultValue: 'Siguiente' })}
                                </Button>

                            </div>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="d-flex flex-column gap-1 w-100">
                            <div className="d-flex gap-3">
                                {selectedPurchaseOrder ? (
                                    <Card className="w-50">
                                        <CardHeader className='bg-gradient' style={{ backgroundColor: bg('#e3f2fd') }}>
                                            <h5 className="mb-0 text-primary">{t('warehouse.incomeForm.summary.purchaseOrder', { defaultValue: 'Orden de compra' })}</h5>
                                        </CardHeader>
                                        <CardBody className="pt-4">
                                            <ObjectDetails attributes={purchaseOrderAttributes} object={selectedPurchaseOrder} />
                                        </CardBody>
                                    </Card>
                                ) : selectedSupplier ? (
                                    <Card className="w-50">
                                        <CardHeader className='bg-gradient' style={{ backgroundColor: bg('#e3f2fd') }}>
                                            <h5 className="mb-0 text-primary">{t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' })}</h5>
                                        </CardHeader>
                                        <CardBody className="pt-4">
                                            <ObjectDetails attributes={[
                                                { key: 'name', label: t('common.field.name', { defaultValue: 'Nombre' }) },
                                                { key: 'email', label: t('warehouse.incomeForm.attr.email', { defaultValue: 'Email' }) },
                                                { key: 'phone_number', label: t('warehouse.incomeForm.attr.phone', { defaultValue: 'Teléfono' }) },
                                            ]} object={selectedSupplier} />
                                        </CardBody>
                                    </Card>
                                ) : null}

                                <Card className={selectedPurchaseOrder || selectedSupplier ? "w-50" : "w-100"}>
                                    <CardHeader className='bg-gradient' style={{ backgroundColor: bg('#e8f5e9') }}>
                                        <h5 className="mb-0 text-success">{t('warehouse.incomeForm.summary.income', { defaultValue: 'Entrada' })}</h5>
                                    </CardHeader>
                                    <CardBody className="pt-4">
                                        <ObjectDetails attributes={incomeAttributes} object={formik.values} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="w-100">
                                <Card >
                                    <CardHeader className='bg-gradient' style={{ backgroundColor: bg('#f3e5f5') }}>
                                        <h5 className="mb-0 text-purple">{t('warehouse.incomeForm.summary.products', { defaultValue: 'Productos' })}</h5>
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
                                {t('common.button.back', { defaultValue: 'Atras' })}
                            </Button>

                            <Button className="farm-primary-button ms-auto" type="submit" disabled={formik.isSubmitting}>
                                {formik.isSubmitting ?
                                    <>
                                        <Spinner size='sm' className="me-3" />
                                        {t('common.button.saving', { defaultValue: 'Guardando...' })}</>
                                    : initialData ?
                                        t('warehouse.incomeForm.button.update', { defaultValue: 'Actualizar entrada' })
                                        : t('warehouse.incomeForm.button.register', { defaultValue: 'Registrar Entrada' })}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>{t('warehouse.productForm.cancelModal.title', { defaultValue: 'Confirmación' })}</ModalHeader>
                <ModalBody>{t('warehouse.productForm.cancelModal.message', { defaultValue: '¿Estás seguro de que deseas cancelar? Los datos no se guardarán.' })}</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>{t('warehouse.productForm.cancelModal.confirm', { defaultValue: 'Sí, cancelar' })}</Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>{t('warehouse.productForm.cancelModal.deny', { defaultValue: 'No, continuar' })}</Button>
                </ModalFooter>
            </Modal>

            <Modal size="xl" isOpen={modals.createPurchaseOrder} toggle={() => toggleModal("createPurchaseOrder")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createPurchaseOrder")}>{t('warehouse.incomeForm.modal.newPurchaseOrder', { defaultValue: 'Nueva orden de compra' })}</ModalHeader>
                <ModalBody>
                    <PurchaseOrderForm onSave={() => { toggleModal('createPurchaseOrder'); fetchPurchaseOrders(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('warehouse.incomeForm.success', { defaultValue: 'Entrada creada con exito' })} />
        </>
    );
};

export default IncomeForm;
