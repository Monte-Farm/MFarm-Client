import { Attribute, ProductData, PurchaseOrderData, SupplierData } from "common/data_interfaces";
import classnames from "classnames";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap";
import { ConfigContext } from "App";
import * as Yup from "yup";
import { useFormik } from "formik";
import ObjectDetailsHorizontal from "../Details/ObjectDetailsHorizontal";
import SupplierForm from "./SupplierForm";
import { Column } from "common/data/data_types";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import DatePicker from "react-flatpickr";
import { getLoggedinUser } from "helpers/api_helper";
import CustomTable from "../Tables/CustomTable";
import SelectTable from "../Tables/SelectTable";

interface PurchaseOrderFormProps {
    initialData?: PurchaseOrderData;
    onSave: () => void;
    onCancel: () => void;
}

const purchaseOrderAttributes: Attribute[] = [
    { key: 'code', label: 'Identificador' },
    { key: 'date', label: 'Fecha de registro', type: 'date' },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'subtotal', label: 'Subtotal', type: 'currency' },
    { key: 'totalPrice', label: 'Total', type: 'currency' },

];

const productColumns: Column<any>[] = [
    { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
    { header: 'Producto', accessor: 'name', isFilterable: true, type: 'text' },
    {
        header: 'Cantidad',
        accessor: 'quantity',
        isFilterable: true,
        type: 'number',
        render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>,
    },
    { header: 'Precio Unitario', accessor: 'price', type: 'currency' },
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

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ initialData, onSave, onCancel }) => {
    const userLogged = getLoggedinUser();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ success: false, createSupplier: false, createProduct: false });
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])
    const configContext = useContext(ConfigContext)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [displayInfo, setDisplayInfo] = useState({})

    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 3) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const validationSchema = Yup.object({
        code: Yup.string()
            .required("Por favor, ingrese el codigo")
            .test('unique_id', "Este codigo ya existe, por favor ingrese otro", async (value) => {
                if (!value) return false;
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/purchase_order_id_exists/${value}`);
                    return !result?.data.data;
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`);
                    return false;
                }
            }),
        date: Yup.date().required("Por favor, ingrese la fecha"),
        supplier: Yup.string().required("Por favor, seleccione un proveedor"),
        tax: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese un impuesto"),
        discount: Yup.number().min(0, "El precio total debe ser positivo").required('Por favor, ingrese un descuento'),
        totalPrice: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese el precio total"),
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

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


    const handleCreateSupplier = async (supplierData: SupplierData) => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/supplier/create_supplier`, supplierData);
            const newSupplier = response.data.data;

            await fetchSuppliers();
            setSelectedSupplier(newSupplier);
            formik.setFieldValue("supplier", newSupplier._id);

            showAlert('success', 'El proveedor ha sido creado con éxito')
        } catch (error) {
            handleError(error, "Ha ocurrido un error al crear al proveedor, inténtelo más tarde");
        } finally {
            toggleModal('createSupplier')
        }
    };


    const calculateSubtotal = (products: any[]) => {
        return products.reduce((acc, product) => {
            return acc + (product.price * product.quantity);
        }, 0);
    };

    const calculateTotal = (subtotal: number, tax: number, discount: number) => {
        const totalAfterDiscount = subtotal - (subtotal * (discount / 100));
        return totalAfterDiscount + (totalAfterDiscount * (tax / 100));
    };


    const formik = useFormik({
        initialValues: initialData || {
            code: "",
            date: null,
            products: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            totalPrice: 0,
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
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar los datos, intentelo mas tarde' })
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find((s) => s._id === supplierId) || null;
        setSelectedSupplier(supplier);
        formik.setFieldValue("supplier", supplier._id);
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
        const subtotal = calculateSubtotal(formik.values.products);
        const totalPrice = calculateTotal(subtotal, formik.values.tax, formik.values.discount);

        formik.setFieldValue("subtotal", subtotal);
        formik.setFieldValue("totalPrice", totalPrice);
    }, [formik.values.products, formik.values.tax, formik.values.discount]);


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
                                Informacion de Orden de Compra
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
                                Selección de productos
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
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-purchaseOrderData-tab" tabId={1}>
                        <div className="d-flex gap-3">
                            <div className="w-50">
                                <Label htmlFor="codeInput" className="form-label">Codigo</Label>
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
                                <Label htmlFor="dateInput" className="form-label">Fecha de registro</Label>
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

                        <div className="d-flex mt-3">
                            <Button className="h-50 farm-primary-button ms-auto" onClick={() => toggleModal('createSupplier')}>
                                <i className="ri-add-line me-2"></i>
                                Nuevo Proveedor
                            </Button>
                        </div>

                        <div className="">
                            <Label htmlFor="supplierInput" className="form-label">Proveedor</Label>
                            <Input
                                type="select"
                                id="supplierInput"
                                name="supplier"
                                value={formik.values.supplier}
                                onChange={(e) => handleSupplierChange(e.target.value)}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.supplier && !!formik.errors.supplier}
                            >
                                <option value=''>Seleccione un proveedor</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier._id} value={supplier._id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </Input>

                            {formik.touched.supplier && formik.errors.supplier && <FormFeedback>{formik.errors.supplier}</FormFeedback>}
                        </div>

                        <Row className="mt-4">
                            <Col lg={6}>
                                <Label htmlFor="supplierAddress" className="form-label">Dirección</Label>
                                <Input type="text" className="form-control" id="supplierAddress" value={selectedSupplier?.address} disabled></Input>
                            </Col>

                            <Col lg={6}>
                                <Label htmlFor="supplierEmail" className="form-label">Correo Electrónico</Label>
                                <Input type="text" className="form-control" id="supplierEmail" value={selectedSupplier?.email} disabled></Input>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col lg={4}>
                                <Label htmlFor="supplierRNC" className="form-label">RNC</Label>
                                <Input type="text" className="form-control" id="supplierRNC" value={selectedSupplier?.rnc} disabled></Input>
                            </Col>
                            <Col lg={4}>
                                <Label htmlFor="supplierPhoneNumber" className="form-label">Número Telefonico</Label>
                                <Input type="text" className="form-control" id="supplierPhoneNumber" value={selectedSupplier?.phone_number} disabled></Input>
                            </Col>
                            <Col lg={4}>
                                <Label htmlFor="supplierType" className="form-label">Tipo de Proveedor</Label>
                                <Input type="text" className="form-control" id="supplierType" value={selectedSupplier?.supplier_type} disabled></Input>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col lg={6}>
                                <Label htmlFor="taxInput" className="form-label">Impuesto</Label>
                                <div className="input-group">
                                    <Input
                                        type="number"
                                        id="taxInput"
                                        name="tax"
                                        value={formik.values.tax}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.tax && !!formik.errors.tax}
                                    />
                                    <span className="input-group-text">%</span>
                                </div>

                                {formik.touched.tax && formik.errors.tax && <FormFeedback>{formik.errors.tax}</FormFeedback>}
                            </Col>

                            <Col lg={6}>
                                <Label htmlFor="discountInput" className="form-label">Descuento</Label>
                                <div className="input-group">
                                    <Input
                                        type="number"
                                        id="discountInput"
                                        name="discount"
                                        value={formik.values.discount}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.discount && !!formik.errors.discount}
                                    />
                                    <span className="input-group-text">%</span>
                                </div>

                                {formik.touched.discount && formik.errors.discount && <FormFeedback>{formik.errors.discount}</FormFeedback>}
                            </Col>
                        </Row>

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => toggleArrowTab(activeStep + 1)}
                                disabled={
                                    !formik.values.code ||
                                    !formik.values.date ||
                                    !formik.values.supplier ||
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
                    </TabPane>

                    <TabPane id="step-products-tab" tabId={2}>
                        <div className="d-flex gap-3 mb-3">
                            <div className="w-50">
                                <Label htmlFor="subtotalInput" className="form-label">Subtotal</Label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <Input
                                        type="number"
                                        id="subtotalInput"
                                        name="subtotal"
                                        value={formik.values.subtotal}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.subtotal && !!formik.errors.subtotal}
                                        disabled
                                    />
                                </div>

                                {formik.touched.subtotal && formik.errors.subtotal && <FormFeedback>{formik.errors.subtotal}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="totalInput" className="form-label">Total</Label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <Input
                                        type="number"
                                        id="totalPriceInput"
                                        name="totalPrice"
                                        value={formik.values.totalPrice}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.totalPrice && !!formik.errors.totalPrice}
                                        disabled
                                    />
                                </div>

                                {formik.touched.totalPrice && formik.errors.totalPrice && <FormFeedback>{formik.errors.totalPrice}</FormFeedback>}

                            </div>
                        </div>

                        <div className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(60vh - 100px)', overflowY: 'hidden' }}>
                            <SelectTable data={products} onProductSelect={handleProductSelect} showPagination={false}></SelectTable>
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
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <Card style={{ backgroundColor: '#A3C293' }}>
                            <CardBody className="pt-4">
                                <ObjectDetailsHorizontal attributes={purchaseOrderAttributes} object={displayInfo} />
                            </CardBody>
                        </Card>

                        <Card style={{ height: '49vh' }}>
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
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size='sm' />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        Registrar
                                    </div>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal size="lg" isOpen={modals.createSupplier} toggle={() => toggleModal("createSupplier")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createSupplier")}>Nuevo Proveedor</ModalHeader>
                <ModalBody>
                    <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => toggleModal("createSupplier", false)} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

            <SuccessModal isOpen={modals.success} onClose={onSave} message={"Orden de compra creada con exito"} />
        </>
    )
}


export default PurchaseOrderForm