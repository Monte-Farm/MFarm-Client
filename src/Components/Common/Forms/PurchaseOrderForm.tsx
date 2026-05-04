import { Attribute, ProductData, PurchaseOrderData, SupplierData } from "common/data_interfaces";
import { SUPPLIER_TYPES } from "common/enums/suppliers.enums";
import classnames from "classnames";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap";
import { ConfigContext } from "App";
import * as Yup from "yup";
import { useFormik } from "formik";
import SupplierForm from "./SupplierForm";
import { Column } from "common/data/data_types";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import DatePicker from "react-flatpickr";
import { getEffectiveUser } from "helpers/impersonation_helper";
import CustomTable from "../Tables/CustomTable";
import SelectableTable from "../Tables/SelectableTable";
import ObjectDetails from "../Details/ObjectDetails";
import SelectableCustomTable from "../Tables/SelectableTable";

interface PurchaseOrderFormProps {
    initialData?: PurchaseOrderData;
    onSave: () => void;
    onCancel: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ initialData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ success: false, createSupplier: false, createProduct: false });
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState<any[]>([])
    const configContext = useContext(ConfigContext)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [displayInfo, setDisplayInfo] = useState({})
    const [productErrors, setProductErrors] = useState<Record<string, any>>({});
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);

    const purchaseOrderAttributes: Attribute[] = [
        { key: 'code', label: t('warehouse.purchaseOrders.attr.identifier', { defaultValue: 'Identificador' }) },
        { key: 'date', label: t('warehouse.purchaseOrders.attr.registrationDate', { defaultValue: 'Fecha de registro' }), type: 'date' },
        { key: 'supplier', label: t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' }) }
    ];

    const summaryProductColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'id', type: 'text' },
        { header: t('common.field.name'), accessor: 'name', type: 'text' },
        {
            header: t('warehouse.purchaseOrders.col.category', { defaultValue: 'Categoría' }),
            accessor: 'category',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "nutrition": color = "info"; break;
                    case "medications": color = "warning"; break;
                    case "vaccines": color = "primary"; break;
                    case "vitamins":
                    case "minerals":
                    case "supplies":
                    case "hygiene_cleaning":
                    case "equipment_tools":
                    case "spare_parts":
                    case "office_supplies":
                    case "others":
                        color = "success"; break;
                }

                return <Badge color={color}>{t(`warehouse.common.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('warehouse.purchaseOrders.col.quantity', { defaultValue: 'Cantidad' }),
            accessor: 'quantity',
            type: 'number',
            render: (value: number, row: any) => `${value} ${row.unit_measurement || ''}`,
            bgColor: '#f0f0ff'
        },
        {
            header: t('warehouse.purchaseOrders.col.unitPrice', { defaultValue: 'Precio Unitario' }),
            accessor: 'unitPrice',
            type: 'currency',
            bgColor: '#e6f0ff'
        },
        {
            header: t('warehouse.purchaseOrders.col.totalPrice', { defaultValue: 'Precio Total' }),
            accessor: 'totalPrice',
            type: 'currency',
            bgColor: '#e6ffe6'
        },
    ];

    const supplierColumns: Column<any>[] = [
        { header: t('common.field.name'), accessor: 'name', isFilterable: true, type: "text" },
        { header: t('warehouse.supplierForm.field.rnc', { defaultValue: 'RNC' }), accessor: 'rnc', isFilterable: true, type: "text" },
        { header: t('warehouse.supplierForm.field.address', { defaultValue: 'Dirección' }), accessor: 'address', isFilterable: true, type: "text" },
        { header: t('warehouse.supplierForm.field.phone', { defaultValue: 'Teléfono' }), accessor: 'phone_number', isFilterable: true, type: "text" },
        {
            header: t('warehouse.suppliers.attr.supplierType', { defaultValue: 'Tipo de Proveedor' }),
            accessor: 'supplier_type',
            isFilterable: true,
            type: "text",
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case SUPPLIER_TYPES.CLEANING_PRODUCTS: color = "info"; break;
                    case SUPPLIER_TYPES.FOOD_AND_FEED: color = "success"; break;
                    case SUPPLIER_TYPES.MEDICINES_AND_VETERINARY: color = "warning"; break;
                    case SUPPLIER_TYPES.EQUIPMENT_AND_TOOLS: color = "primary"; break;
                    case SUPPLIER_TYPES.SERVICES: color = "secondary"; break;
                    default: color = "secondary"; break;
                }

                return <Badge color={color}>{t(`warehouse.common.supplierType.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ];

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const productColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'id', isFilterable: true, type: 'text' },
        { header: t('common.field.name'), accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: t('warehouse.purchaseOrders.col.quantity', { defaultValue: 'Cantidad' }),
            accessor: "quantity",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = selectedProducts.find(p => p.id === row._id);

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantity === 0 ? "" : (selected?.quantity ?? "")}
                            invalid={productErrors[row._id]?.quantity}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const updatedProducts = selectedProducts.map(p => {
                                    if (p.id === row._id) {
                                        const totalPrice = newValue * (p.unitPrice || 0);
                                        return { ...p, quantity: newValue, totalPrice };
                                    }
                                    return p;
                                });
                                setSelectedProducts(updatedProducts);

                                if (newValue > 0) {
                                    setProductErrors(prev => {
                                        const newErrors = { ...prev };
                                        if (newErrors[row._id]) {
                                            delete newErrors[row._id].quantity;
                                            if (Object.keys(newErrors[row._id]).length === 0) {
                                                delete newErrors[row._id];
                                            }
                                        }
                                        return newErrors;
                                    });
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-describedby="unit-addon"
                        />
                        <span className="input-group-text" id="unit-addon">{row.unit_measurement}</span>
                    </div>

                );
            },
        },
        {
            header: t('warehouse.purchaseOrders.col.unitPrice', { defaultValue: 'Precio Unitario' }),
            accessor: 'price',
            type: 'number',
            render: (value, row, isSelected) => {
                const selected = selectedProducts.find(p => p.id === row._id);

                return (
                    <div className="input-group">
                        <span className="input-group-text">$</span>
                        <Input
                            type="number"
                            step="0.01"
                            disabled={!isSelected}
                            value={selected?.unitPrice === 0 ? "" : (selected?.unitPrice ?? "")}
                            invalid={productErrors[row._id]?.unitPrice}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const updatedProducts = selectedProducts.map(p => {
                                    if (p.id === row._id) {
                                        const totalPrice = (p.quantity || 0) * newValue;
                                        return { ...p, unitPrice: newValue, totalPrice };
                                    }
                                    return p;
                                });
                                setSelectedProducts(updatedProducts);

                                if (newValue > 0) {
                                    setProductErrors(prev => {
                                        const newErrors = { ...prev };
                                        if (newErrors[row._id]) {
                                            delete newErrors[row._id].unitPrice;
                                            if (Object.keys(newErrors[row._id]).length === 0) {
                                                delete newErrors[row._id];
                                            }
                                        }
                                        return newErrors;
                                    });
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                );
            },
        },
        {
            header: t('warehouse.purchaseOrders.col.totalPrice', { defaultValue: 'Precio Total' }),
            accessor: 'totalPrice',
            type: 'number',
            render: (value, row, isSelected) => {
                const selected = selectedProducts.find(p => p.id === row._id);

                return (
                    <div className="input-group">
                        <span className="input-group-text">$</span>
                        <Input
                            type="number"
                            step="0.01"
                            disabled={!isSelected}
                            value={selected?.totalPrice === 0 ? "" : (selected?.totalPrice ?? "")}
                            invalid={productErrors[row._id]?.totalPrice}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const updatedProducts = selectedProducts.map(p => {
                                    if (p.id === row._id) {
                                        const unitPrice = (p.quantity && p.quantity > 0) ? newValue / p.quantity : 0;
                                        return { ...p, totalPrice: newValue, unitPrice };
                                    }
                                    return p;
                                });
                                setSelectedProducts(updatedProducts);

                                if (newValue > 0) {
                                    setProductErrors(prev => {
                                        const newErrors = { ...prev };
                                        if (newErrors[row._id]) {
                                            delete newErrors[row._id].totalPrice;
                                            if (Object.keys(newErrors[row._id]).length === 0) {
                                                delete newErrors[row._id];
                                            }
                                        }
                                        return newErrors;
                                    });
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                );
            }
        },
        {
            header: t('warehouse.purchaseOrders.col.category', { defaultValue: 'Categoría' }),
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "nutrition": color = "info"; break;
                    case "medications": color = "warning"; break;
                    case "vaccines": color = "primary"; break;
                    case "vitamins":
                    case "minerals":
                    case "supplies":
                    case "hygiene_cleaning":
                    case "equipment_tools":
                    case "spare_parts":
                    case "office_supplies":
                    case "others":
                        color = "success"; break;
                }

                return <Badge color={color}>{t(`warehouse.common.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ];

    const validationSchema = Yup.object({
        code: Yup.string()
            .required(t('warehouse.purchaseOrders.validation.codeRequired', { defaultValue: 'Por favor, ingrese el codigo' }))
            .test('unique_id', t('warehouse.purchaseOrders.validation.codeExists', { defaultValue: 'Este codigo ya existe, por favor ingrese otro' }), async (value) => {
                if (!value) return false;
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/purchase_order_id_exists/${value}`);
                    return !result?.data.data;
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`);
                    return false;
                }
            }),
        date: Yup.date().required(t('warehouse.purchaseOrders.validation.dateRequired', { defaultValue: 'Por favor, ingrese la fecha' })),
        supplier: Yup.string().required(t('warehouse.purchaseOrders.validation.supplierRequired', { defaultValue: 'Por favor, seleccione un proveedor' })),
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchWarehouseId = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            formik.setFieldValue('warehouse', response.data.data);
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
            console.error(error, 'Error obtaining the suppliers')
        }
    };

    const fetchProducts = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product`);
            setProducts(response.data.data);
        } catch (error) {
            console.error(error, 'Error obtaining the products')
        }
    };

    const fetchNextId = async () => {
        try {
            if (!initialData && configContext) {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/next_id`);
                const nextId = response.data.data;
                formik.setFieldValue('code', nextId);
            }
        } catch (error) {
            console.error("Ha ocurrido un error obteniendo el id");
        }
    };

    const validateSelectedProducts = () => {
        const errors: Record<string, any> = {};

        selectedProducts.forEach(product => {
            if (product.quantity === 0 || product.quantity === "" || !product.quantity) {
                errors[product.id] = {
                    ...errors[product.id],
                    quantity: t('warehouse.purchaseOrders.validation.quantityRequired', { defaultValue: 'La cantidad es requerida' })
                };
            }
            if (product.unitPrice === 0 || product.unitPrice === "" || !product.unitPrice) {
                errors[product.id] = {
                    ...errors[product.id],
                    unitPrice: t('warehouse.purchaseOrders.validation.priceRequired', { defaultValue: 'El precio es requerido' })
                };
            }
        });

        setProductErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const formik = useFormik({
        initialValues: initialData || {
            code: "",
            date: null,
            products: [],
            supplier: "",
            status: true,
            warehouse: '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            if (!configContext) return
            try {
                setSubmitting(true);
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/purchase_orders/create_purchase_order`, values);
                toggleModal('success')
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
                setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.purchaseOrders.error.save', { defaultValue: 'Ha ocurrido un error al guardar los datos, intentelo mas tarde' }) })
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleSupplierSelect = (selectedSuppliers: any[]) => {
        if (selectedSuppliers.length > 0) {
            const supplier = selectedSuppliers[0];
            setSelectedSupplier(supplier);
            formik.setFieldValue("supplier", supplier._id);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
        fetchProducts();
        fetchSuppliers();
        fetchNextId();
        formik.setFieldValue('date', new Date())
    }, [])

    useEffect(() => {
        const supplier = suppliers.find((s) => s._id === formik.values.supplier) || null;
        setSelectedSupplier(supplier);
    }, [formik.values.supplier, suppliers]);

    useEffect(() => {
        formik.validateForm();
        setDisplayInfo({ ...formik.values, supplier: selectedSupplier?.name })
    }, [formik.values]);

    useEffect(() => {
        formik.setFieldValue('products', selectedProducts)
    }, [selectedProducts]);


    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className="form-steps">
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-purchaseOrderData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-purchaseOrderData-tab"
                                disabled
                            >
                                {t('warehouse.purchaseOrders.step.orderInfo', { defaultValue: 'Informacion de Orden de Compra' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-products-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-products-tab"
                                disabled
                            >
                                {t('warehouse.purchaseOrders.step.productSelection', { defaultValue: 'Selección de productos' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-summary-tab"
                                disabled
                            >
                                {t('warehouse.purchaseOrders.step.summary', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-purchaseOrderData-tab" tabId={1}>
                        <div className="d-flex gap-3 mb-4">
                            <div className="w-50">
                                <Label htmlFor="codeInput" className="form-label">{t('common.field.code')}</Label>
                                <Input
                                    type="text"
                                    id="codeInput"
                                    name="code"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                />
                                {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="dateInput" className="form-label">{t('warehouse.purchaseOrders.attr.registrationDate', { defaultValue: 'Fecha de registro' })}</Label>
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
                        </div>

                        <div className="">
                            <Label className="form-label">{t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' })}</Label>
                            <div className="border rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                <SelectableTable
                                    columns={supplierColumns}
                                    data={suppliers}
                                    onSelect={handleSupplierSelect}
                                    selectionMode="single"
                                    showSearchAndFilter={true}
                                    showPagination={false}
                                />
                            </div>
                            {formik.touched.supplier && formik.errors.supplier &&
                                <div className="text-danger mt-1">{formik.errors.supplier}</div>
                            }
                        </div>

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => toggleArrowTab(activeStep + 1)}
                                disabled={
                                    !formik.values.code ||
                                    !formik.values.date ||
                                    !formik.values.supplier ||
                                    !!formik.errors.code ||
                                    !!formik.errors.date ||
                                    !!formik.errors.supplier
                                }
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-products-tab" tabId={2}>
                        <div className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(60vh - 100px)', overflowY: 'hidden' }}>
                            <SelectableCustomTable
                                columns={productColumns}
                                data={products}
                                showPagination={true}
                                rowsPerPage={6}
                                onSelect={(rows) => {
                                    setSelectedProducts(prev => {
                                        const newRows = rows.map(r => {
                                            const existing = prev.find(p => p.id === r._id);
                                            if (existing) return existing;

                                            return {
                                                id: r._id,
                                                quantity: 0,
                                                unitPrice: 0,
                                                totalPrice: 0,
                                            };
                                        });
                                        return newRows;
                                    });
                                }}
                            />
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
                                onClick={() => {
                                    if (validateSelectedProducts()) {
                                        toggleArrowTab(activeStep + 1);
                                    }
                                }}
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                            </Button>

                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className="d-flex flex-grow-1 gap-3 w-100">
                            <Card>
                                <CardHeader>
                                    <h5 className="mb-0">{t('warehouse.purchaseOrders.step.orderInfo', { defaultValue: 'Información de la Orden de Compra' })}</h5>
                                </CardHeader>
                                <CardBody className="pt-4">
                                    <ObjectDetails attributes={purchaseOrderAttributes} object={displayInfo} />
                                </CardBody>
                            </Card>

                            <Card className="w-100">
                                <CardHeader>
                                    <h5 className="mb-0">{t('warehouse.purchaseOrders.attr.productInfo', { defaultValue: 'Información de Productos' })}</h5>
                                </CardHeader>
                                <CardBody className="border border-0 d-flex flex-column flex-grow-1 p-0">
                                    <CustomTable
                                        columns={summaryProductColumns}
                                        data={selectedProducts.map(selectedProduct => {
                                            const fullProductData = products.find((p: any) => p._id === selectedProduct.id);
                                            return {
                                                ...(fullProductData || {}),
                                                unitPrice: selectedProduct.unitPrice,
                                                quantity: selectedProduct.quantity,
                                                totalPrice: selectedProduct.totalPrice,
                                            };
                                        })}
                                        showSearchAndFilter={false}
                                        showPagination={true}
                                        rowsPerPage={10}
                                    />

                                    {/* Total General */}
                                    <div className="p-3 border-top">
                                        <Row className="justify-content-end">
                                            <Col sm={6} md={4}>
                                                <div className="d-flex justify-content-between align-items-center p-3 rounded grand-total-box">
                                                    <h5 className="mb-0 fw-bold">{t('warehouse.purchaseOrders.attr.grandTotal', { defaultValue: 'Total General:' })}</h5>
                                                    <h4 className="mb-0 text-primary fw-bold">
                                                        {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD',
                                                        }).format(
                                                            selectedProducts.reduce((sum, product) => sum + (product.totalPrice || 0), 0)
                                                        )}
                                                    </h4>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </CardBody>
                            </Card>

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
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size='sm' />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        {t('warehouse.purchaseOrders.button.register', { defaultValue: 'Registrar' })}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('warehouse.purchaseOrders.success.created', { defaultValue: 'Orden de compra creada con exito' })} />
        </>
    )
}


export default PurchaseOrderForm
