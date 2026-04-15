import React, { useContext, useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Row, Col } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import FileUploader from "../Shared/FileUploader";
import { ProductCategory, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import AlertMessage from "../Shared/AlertMesagge";

interface ProductFormProps {
    initialData?: ProductData;
    onSubmit: (data: ProductData) => Promise<void>;
    onCancel: () => void;
    isCodeDisabled?: boolean,
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isCodeDisabled }) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const configContext = useContext(ConfigContext)
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory>()

    const validationSchema = Yup.object({
        id: Yup.string()
            .required("Por favor, ingrese el código")
            .test('unique_id', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (initialData) return true
                if (!value) return false
                try {
                    const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/product/product_id_exists/${value}`);
                    return !response?.data.data
                } catch (error) {
                    console.error(`Error al verificar el id: ${error}`)
                    return false
                }
            }),
        name: Yup.string().required("Por favor, ingrese el nombre del producto"),
        category: Yup.string().required("Por favor, seleccione una categoría"),
        unit_measurement: Yup.string().required("Por favor, seleccione una unidad de medida"),
        description: Yup.string().required("Por favor, ingrese la descripción"),
    });

    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            name: "",
            category: "",
            description: "",
            status: true,
            unit_measurement: "",
            image: "",
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
                if (fileToUpload) {
                    values.image = await fileUpload(fileToUpload)
                }
                await onSubmit(values);
            } catch (error) {
                console.error('Error sending product data: ', error);
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar el producto, por favor intentelo más tarde' });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fileUpload = async (file: File) => {
        if (!configContext) return;

        try {
            const uploadResponse = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/upload/upload_file/`, file);
            return uploadResponse.data.data;
        } catch (error) {
            console.error('Error uploading image: ', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar la imagen, por favor intentelo más tarde' });
        }
    };

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >

                {/* Imagen */}
                <div className="mb-4">
                    <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
                        Imagen
                    </div>
                    <FileUploader acceptedFileTypes={['image/*']} maxFiles={1} onFileUpload={(file) => setFileToUpload(file)} />
                </div>

                {/* Información del Producto */}
                <div className="mb-4">
                    <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
                        Información del Producto
                    </div>

                    <Row className="g-3">
                        <Col lg={4}>
                            <Label htmlFor="idInput" className="form-label">Código</Label>
                            <Input
                                type="text"
                                id="idInput"
                                name="id"
                                value={formik.values.id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.id && !!formik.errors.id}
                            />
                            {formik.touched.id && formik.errors.id && (
                                <FormFeedback>{formik.errors.id}</FormFeedback>
                            )}
                        </Col>

                        <Col lg={8}>
                            <Label htmlFor="nameInput" className="form-label">Nombre</Label>
                            <Input
                                type="text"
                                id="nameInput"
                                name="name"
                                placeholder="Ingrese el nombre del producto"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </Col>

                        <Col lg={6}>
                            <Label htmlFor="categoryInput" className="form-label">Categoría</Label>
                            <Input
                                type="select"
                                id="categoryInput"
                                name="category"
                                value={formik.values.category}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.category && !!formik.errors.category}
                                disabled={isCodeDisabled}
                            >
                                <option value="">Seleccione una categoría</option>
                                <option value="nutrition">Nutrición</option>
                                <option value="medications">Medicamentos</option>
                                <option value="vaccines">Vacunas</option>
                                <option value="vitamins">Vitaminas</option>
                                <option value="minerals">Minerales</option>
                                <option value="supplies">Insumos</option>
                                <option value="hygiene_cleaning">Higiene y desinfección</option>
                                <option value="equipment_tools">Equipamiento y herramientas</option>
                                <option value="spare_parts">Refacciones y repuestos</option>
                                <option value="office_supplies">Material de oficina</option>
                                <option value="others">Otros</option>
                            </Input>
                            {formik.touched.category && formik.errors.category && (
                                <FormFeedback>{formik.errors.category}</FormFeedback>
                            )}
                        </Col>

                        <Col lg={6}>
                            <Label htmlFor="unit_measurementInput" className="form-label">Unidad de Medida</Label>
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
                                <option value="kg">Kilogramo (kg)</option>
                                <option value="g">Gramo (g)</option>
                                <option value="l">Litro (l)</option>
                                <option value="ml">Mililitro (ml)</option>
                                <option value="unit">Unidad</option>
                                <option value="bag">Saco</option>
                                <option value="box">Caja</option>
                            </Input>
                            {formik.touched.unit_measurement && formik.errors.unit_measurement && (
                                <FormFeedback>{formik.errors.unit_measurement}</FormFeedback>
                            )}
                        </Col>

                        <Col lg={12}>
                            <Label htmlFor="descriptionInput" className="form-label">Descripción</Label>
                            <Input
                                type="textarea"
                                id="descriptionInput"
                                rows={3}
                                name="description"
                                placeholder="Describe brevemente el producto"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.description && !!formik.errors.description}
                            />
                            {formik.touched.description && formik.errors.description && (
                                <FormFeedback>{formik.errors.description}</FormFeedback>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 pt-3 gap-2 border-top">
                    <Button className="farm-secondary-button" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button className="farm-primary-button" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Producto" : "Registrar Producto"}
                    </Button>
                </div>
            </form>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            {/* Modal de confirmación de cancelación */}
            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Confirmación de Cancelación</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button className="farm-primary-button" onClick={() => setCancelModalOpen(false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ProductForm;
