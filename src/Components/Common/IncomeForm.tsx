import React, { useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Alert } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Flatpickr from "react-flatpickr";
import CustomTable from "./CustomTable";
import { APIClient } from "helpers/api_helper";
import SupplierForm from "./SupplierForm";
import ProductForm, { ProductData } from "./ProductForm";

interface IncomeFormProps {
    initialData?: IncomeData;
    onSubmit: (data: IncomeData) => Promise<void>;
    onCancel: () => void;
}

export interface IncomeData {
    id: string;
    date: string; // ISO string
    products: Array<string>;
    totalPrice: number;
    incomeType: string;
    supplier: string;
    documents: Array<string>;
    status: boolean;
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

const incomeTypeOptions = [
    { label: "Purchase", value: "purchase" },
    { label: "Sale", value: "sale" },
];

const columns = [
    {header: 'Código', accessor: 'id'},
    {header: 'Producto', accessor: 'productName'}
]

const validationSchema = Yup.object({
    id: Yup.string().required("Por favor, ingrese el ID"),
    date: Yup.date().required("Por favor, ingrese la fecha"),
    totalPrice: Yup.number().min(0, "El precio total debe ser positivo").required("Por favor, ingrese el precio total"),
    incomeType: Yup.string().required("Por favor, seleccione el tipo de ingreso"),
    supplier: Yup.string().required("Por favor, ingrese el nombre del proveedor"),
    documents: Yup.array().of(Yup.string()).required("Por favor, agregue al menos un documento"),
});

const IncomeForm: React.FC<IncomeFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const axiosHelper = new APIClient()
    const apiUrl = process.env.REACT_APP_API_URL

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [modals, setModals] = useState({ createSupplier: false, createProduct: false });
    const [products, setProducts] = useState([])
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axiosHelper.get(`${apiUrl}/supplier/`);
            setSuppliers(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener a los proveedores, intentelo más tarde')
        }
    };

    const fetchProducts = async () =>{
        try {
            const response = await axiosHelper.get(`${apiUrl}/product`)
            setProducts(response.data.data)
            console.log(products)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los productos, intentelo más tarde')
        }
    }


    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            date: "",
            products: [],
            totalPrice: 0,
            incomeType: "",
            supplier: "",
            documents: [],
            status: true,
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
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


    const handleCreateSupplier = async (supplierData: SupplierData) => {
        try {
            const response = await axiosHelper.create(`${apiUrl}/supplier/create_supplier`, supplierData);
            const newSupplier = response.data.data; 

            await fetchSuppliers();
            setSelectedSupplier(newSupplier);
            formik.setFieldValue("supplier", newSupplier.id);

            toggleModal("createSupplier");
            setAlertConfig({visible: true, color: 'success', message: 'Proveedor creado con éxito'})
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
        } catch (error) {
            console.error("Error al crear proveedor:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
    }, [])

    useEffect(() => {
        const supplier = suppliers.find((s) => s.id === formik.values.supplier) || null;
        setSelectedSupplier(supplier);
    }, [formik.values.supplier, suppliers]);


    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
                <Row>
                    {/* ID */}
                    <Col lg={4}>
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
                            />
                            {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
                        </div>
                    </Col>

                    {/* Fecha */}
                    <Col lg={8}>
                        <div className="">
                            <Label htmlFor="dateInput" className="form-label">Fecha</Label>
                            <Flatpickr
                                id="dateInput"
                                className="form-control"
                                value={formik.values.date}
                                options={{
                                    dateFormat: "d-m-Y",
                                    defaultDate: formik.values.date,
                                }}
                                onChange={(date) => formik.setFieldValue("date", date[0].toISOString())}
                            />
                            {formik.touched.date && formik.errors.date && <FormFeedback className="d-block">{formik.errors.date}</FormFeedback>}
                        </div>
                    </Col>
                </Row>

                <div className="d-flex mt-4">
                    <h5 className="me-auto">Datos del Proveedor</h5>
                    <Button color="secondary" className="h-50 mb-2" onClick={() => toggleModal('createSupplier')}>
                        <i className="ri-add-line me-2"></i>
                        Agregar Proveedor
                    </Button>
                </div>

                <div className="border"></div>

                {/* Proveedor */}
                <div className="mt-3">
                    <Label htmlFor="supplierInput" className="form-label">Proveedor</Label>
                    <Input
                        type="select"
                        id="supplierInput"
                        name="supplier"
                        value={formik.values.supplier} // Valor controlado por formik
                        onChange={(e) => handleSupplierChange(e.target.value)} // Sincroniza el cambio
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

                {/* Productos */}
                <div className="d-flex mt-4">
                    <h5 className="me-auto">Productos</h5>
                    <Button color="secondary" className="h-50 mb-2" onClick={() => {toggleModal('createProduct')}}>
                        <i className="ri-add-line me-2"></i>
                        Agregar Producto
                    </Button>
                </div>
                <div className="border"></div>

                {/* Tabla de productos */}
                <CustomTable columns={columns} data={products} showSearchAndFilter={false}></CustomTable>

                {/* Precio Total */}
                <div className="mt-4">
                    <Label htmlFor="totalPriceInput" className="form-label">Precio Total</Label>
                    <Input
                        type="number"
                        id="totalPriceInput"
                        name="totalPrice"
                        value={formik.values.totalPrice}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.totalPrice && !!formik.errors.totalPrice}
                    />
                    {formik.touched.totalPrice && formik.errors.totalPrice && <FormFeedback>{formik.errors.totalPrice}</FormFeedback>}
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
                        {incomeTypeOptions.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.incomeType && formik.errors.incomeType && <FormFeedback>{formik.errors.incomeType}</FormFeedback>}
                </div>



                {/* Documentos */}
                <div className="mt-4">
                    <Label htmlFor="documentsInput" className="form-label">Documentos</Label>
                    <Input
                        type="textarea"
                        id="documentsInput"
                        name="documents"
                        value={formik.values.documents.join(", ")}
                        onChange={(e) =>
                            formik.setFieldValue("documents", e.target.value.split(",").map((doc) => doc.trim()))
                        }
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.documents && !!formik.errors.documents}
                    />
                    {formik.touched.documents && formik.errors.documents && <FormFeedback>{formik.errors.documents}</FormFeedback>}
                </div>

                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button color="danger" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Transacción" : "Registrar Transacción"}
                    </Button>
                </div>
            </form>

            {/* Modal de Confirmación */}
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
                    <ProductForm onCancel={() => toggleModal("createProduct", false)} onSubmit={function (data: ProductData): Promise<void> {
                        throw new Error("Function not implemented.");
                    } } />
                </ModalBody>
            </Modal>

            {/* Alerta */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </>
    );
};

export default IncomeForm;
