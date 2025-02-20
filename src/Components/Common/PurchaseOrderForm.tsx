import { ProductData, PurchaseOrderData, SupplierData } from "common/data_interfaces";
import classnames from "classnames";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, FormFeedback, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { ConfigContext } from "App";
import * as Yup from "yup";
import { useFormik } from "formik";
import Flatpickr from 'react-flatpickr';
import SelectTable from "./SelectTable";
import CustomTable from "./CustomTable";
import ObjectDetailsHorizontal from "./ObjectDetailsHorizontal";

interface PurchaseOrderFormProps {
    initialData?: PurchaseOrderData;
    onSubmit: (data: PurchaseOrderData) => Promise<void>;
    onCancel: () => void;
}

const purchaseOrderAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'date', label: 'Fecha de registro' },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'totalPrice', label: 'Total' },

];

const productColumns = [
    { header: 'Código', accessor: 'id', isFilterable: true },
    { header: 'Producto', accessor: 'name', isFilterable: true },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: true },
    { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true },
    { header: 'Precio Unitario', accessor: 'price' },
    { header: 'Categoría', accessor: 'category', isFilterable: true },
];

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ createSupplier: false, createProduct: false });
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])
    const configContext = useContext(ConfigContext)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

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
        id: Yup.string()
            .required("Por favor, ingrese el ID")
            .test('unique_id', "Este identificador ya existe, por favor ingrese otro", async (value) => {
                if (!value) return false;
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/purchase_order_id_exists/${value}`);
                    return !result?.data.data;
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`);
                    return false;
                }
            }),
        date: Yup.string().required("Por favor, ingrese la fecha"),
        supplier: Yup.string().required("Por favor, seleccione un proveedor"),
        tax: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese un impuesto"),
        discount: Yup.number().min(0, "El precio total debe ser positivo").required('Por favor, ingrese un descuento'),
        totalPrice: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese el precio total"),
    });

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
                formik.setFieldValue('id', nextId);
            }
        } catch (error) {
            console.error("Ha ocurrido un error obteniendo el id");
        }
    };


    const calculateSubtotal = (products: any[]) => {
        return products.reduce((acc, product) => {
            return acc + (product.price * product.quantity);
        }, 0);
    };

    // Función para calcular el total con impuesto y descuento como porcentajes
    const calculateTotal = (subtotal: number, tax: number, discount: number) => {
        const totalAfterDiscount = subtotal - (subtotal * (discount / 100));
        return totalAfterDiscount + (totalAfterDiscount * (tax / 100));
    };


    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            date: new Date().toLocaleDateString(),
            products: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            totalPrice: 0,
            supplier: "",
            status: true,
            warehouse: 'AG001',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find((s) => s.id === supplierId) || null;
        setSelectedSupplier(supplier);
        formik.setFieldValue("supplier", supplierId);
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
        console.log(updatedSelectedProducts)
    };


    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
        fetchNextId();
    }, [])

    useEffect(() => {
        const supplier = suppliers.find((s) => s.id === formik.values.supplier) || null;
        setSelectedSupplier(supplier);
    }, [formik.values.supplier, suppliers]);

    useEffect(() => {
        formik.validateForm();
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
                                <Label htmlFor="idInput" className="form-label">Identificador</Label>
                                <Input
                                    type="text"
                                    id="idInput"
                                    name="id"
                                    value={formik.values.id}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.id && !!formik.errors.id}
                                />
                                {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="dateInput" className="form-label">Fecha de registro</Label>
                                <Flatpickr
                                    id="dateInput"
                                    className="form-control"
                                    value={formik.values.date}
                                    options={{
                                        dateFormat: "d-m-Y",
                                        defaultDate: formik.values.date,
                                    }}
                                    onChange={(date) => {
                                        const formattedDate = date[0].toLocaleDateString("es-ES");
                                        formik.setFieldValue("date", formattedDate);
                                    }}
                                />
                                {formik.touched.date && formik.errors.date && <FormFeedback className="d-block">{formik.errors.date}</FormFeedback>}

                            </div>
                        </div>

                        <div className="mt-3">
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
                                    <option key={supplier.id} value={supplier.id}>
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
                                    !formik.values.id ||
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
                                <ObjectDetailsHorizontal attributes={purchaseOrderAttributes} object={formik.values} />
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
                                {formik.isSubmitting ? "Guardando..." : "Registrar Orden de compra"}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            {/* Alerta */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </>
    )
}


export default PurchaseOrderForm