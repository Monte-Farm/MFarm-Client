import React, { useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";

interface ProductFormProps {
    initialData?: ProductData;
    onSubmit: (data: ProductData) => Promise<void>;
    onCancel: () => void;
}

export interface ProductData {
    id: string;
    productName: string;
    quantity: number;
    category: string;
    description: string;
    status: string;
    price: number;
    unit_measurement: string;
}

const categories = [
    { label: "Alimentos", value: "Alimentos" },
    { label: "Medicamentos", value: "Medicamentos" },
    { label: "Suministros", value: "Suministros" },
    { label: "Equipamiento", value: "Equipamiento" },
];

const unitMeasurements = [
    "Galones",
    "Litros",
    "Frascos",
    "Piezas",
    "Kilos",
    "Dosis",
    "Paquetes",
    "Cajas",
    "Metros",
];

const validationSchema = Yup.object({
    id: Yup.string().required("Por favor, ingrese el código"),
    productName: Yup.string().required("Por favor, ingrese el nombre del producto"),
    quantity: Yup.number().required("Por favor, ingrese la cantidad del producto"),
    category: Yup.string().required("Por favor, seleccione una categoría"),
    unit_measurement: Yup.string().required("Por favor, seleccione una unidad de medida"),
    price: Yup.number().required("Por favor, ingrese el precio"),
    description: Yup.string().required("Por favor, ingrese la descripción"),
});

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            productName: "",
            quantity: 0,
            category: "",
            description: "",
            status: "Active",
            price: 0,
            unit_measurement: "",
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
                setShowErrorAlert(true);
                setTimeout(() => setShowErrorAlert(false), 5000);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
                {/* Campo Código */}
                <div className="mt-4">
                    <Label htmlFor="idInput" className="form-label">Código</Label>
                    <Input
                        type="text"
                        id="idInput"
                        className="form-control w-50"
                        name="id"
                        value={formik.values.id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.id && !!formik.errors.id}
                    />
                    {formik.touched.id && formik.errors.id && (
                        <FormFeedback>{formik.errors.id}</FormFeedback>
                    )}
                </div>

                {/* Campo Nombre del producto */}
                <div className="mt-4">
                    <Label htmlFor="productNameInput" className="form-label">Nombre del producto</Label>
                    <Input
                        type="text"
                        id="productNameInput"
                        className="form-control"
                        name="productName"
                        value={formik.values.productName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.productName && !!formik.errors.productName}
                    />
                    {formik.touched.productName && formik.errors.productName && (
                        <FormFeedback>{formik.errors.productName}</FormFeedback>
                    )}
                </div>

                <Row className="mt-4">
                    {/* Campo Cantidad */}
                    <Col lg={4}>
                        <div>
                            <Label htmlFor="quantityInput" className="form-label">Cantidad</Label>
                            <Input
                                type="number"
                                id="quantityInput"
                                className="form-input"
                                name="quantity"
                                value={formik.values.quantity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.quantity && !!formik.errors.quantity}
                            />
                            {formik.touched.quantity && formik.errors.quantity && (
                                <FormFeedback>{formik.errors.quantity}</FormFeedback>
                            )}
                        </div>
                    </Col>

                    {/* Campo Unidad de Medida */}
                    <Col lg={4}>
                        <div>
                            <Label htmlFor="unit_measurementInput" className="form-label">Unidad de medida</Label>
                            <Input
                                type="select"
                                id="unit_measurementInput"
                                name="unit_measurement"
                                value={formik.values.unit_measurement}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.unit_measurement && !!formik.errors.unit_measurement}
                            >
                                <option value="">Seleccione una unidad</option>
                                {unitMeasurements.map((unit) => (
                                    <option key={unit} value={unit}>
                                        {unit}
                                    </option>
                                ))}
                            </Input>
                            {formik.touched.unit_measurement && formik.errors.unit_measurement && (
                                <FormFeedback>{formik.errors.unit_measurement}</FormFeedback>
                            )}
                        </div>
                    </Col>

                    {/* Campo Precio */}
                    <Col lg={4}>
                        <div>
                            <Label htmlFor="priceInput" className="form-label">Precio</Label>
                            <Input
                                type="number"
                                id="priceInput"
                                className="form-control"
                                name="price"
                                value={formik.values.price}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                step="0.01"
                                invalid={formik.touched.price && !!formik.errors.price}
                            />
                            {formik.touched.price && formik.errors.price && (
                                <FormFeedback>{formik.errors.price}</FormFeedback>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* Campo Categoría */}
                <div className="mt-4">
                    <Label htmlFor="categoryInput" className="form-label">Categoría</Label>
                    <Input
                        type="select"
                        id="categoryInput"
                        name="category"
                        value={formik.values.category}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.category && !!formik.errors.category}
                    >
                        <option value="">Seleccione una categoría</option>
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.category && formik.errors.category && (
                        <FormFeedback>{formik.errors.category}</FormFeedback>
                    )}
                </div>

                {/* Campo Descripción */}
                <div className="mt-4">
                    <Label htmlFor="descriptionInput" className="form-label">Descripción</Label>
                    <Input
                        type="textarea"
                        id="descriptionInput"
                        className="form-control"
                        rows={2}
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.description && !!formik.errors.description}
                    />
                    {formik.touched.description && formik.errors.description && (
                        <FormFeedback>{formik.errors.description}</FormFeedback>
                    )}
                </div>

                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button color="danger" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Producto" : "Registrar Producto"}
                    </Button>
                </div>
            </form>

            {/* Alerta de error */}
            {showErrorAlert && (
                <div
                    className="position-fixed bottom-0 start-50 translate-middle-x bg-danger text-white text-center p-3 rounded"
                    style={{
                        zIndex: 1050,
                        width: "90%",
                        maxWidth: "500px",
                    }}
                >
                    <span>El servicio no está disponible. Inténtelo de nuevo más tarde.</span>
                </div>
            )}

            {/* Modal de confirmación de cancelación */}
            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Confirmación de Cancelación</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ProductForm;
