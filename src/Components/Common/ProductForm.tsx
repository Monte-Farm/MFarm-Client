import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import axios, { AxiosHeaders } from "axios";
import { APIClient } from "helpers/api_helper";
import FileUploader from "./FileUploader";
import { error } from "console";
import { ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";

const axiosHelper = new APIClient();
const apiUrl = process.env.REACT_APP_API_URL;

interface ProductFormProps {
    initialData?: ProductData;
    onSubmit: (data: ProductData) => Promise<void>;
    onCancel: () => void;
    isCodeDisabled?: boolean,
    foldersArray?: string[]
}


const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isCodeDisabled, foldersArray }) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const configContext = useContext(ConfigContext)

    const validationSchema = Yup.object({
        id: Yup.string()
            .required("Por favor, ingrese el código")
            .test('unique_id', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (initialData) return true
                if (!value) return false
                try {
                    const response = await axiosHelper.get(`${apiUrl}/product/product_id_exists/${value}`);
                    return !response.data.data
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
                    await fileUpload(fileToUpload)
                }
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

    const fileUpload = async (file: File) => {
        await axiosHelper.create(`${apiUrl}/google_drive/create_folders`, foldersArray)
            .then(async (response) => {
                const folderId = response.data.data;

                await axiosHelper.uploadImage(`${apiUrl}/google_drive/upload_file/${folderId}`, file)
                    .then((response) => {
                        const imageId = response.data.data;
                        formik.values.image = imageId;
                    })
                    .catch((error) => {
                        throw error
                    })
            })
            .catch((error) => {
                setShowErrorAlert(true);
                setTimeout(() => setShowErrorAlert(false), 5000)
                console.log(error)
            })


    }

    const getImageProduct = async () => {
        try {
            const response = await axiosHelper.get(`${apiUrl}/google_drive/download_file/${initialData?.image}`, { responseType: 'blob' });

            const imageUrl = URL.createObjectURL(response.data);
            setImagePreview(imageUrl);
        } catch (error) {
            console.error('Error al recuperar la imagen: ', error);
        }
    }

    useEffect(() => {
        if (initialData && initialData.image) {
            getImageProduct();
        }
    }, [initialData]);

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >

                {/* Imagen */}
                <div className="mt-4">
                    <Label htmlFor="imageInput" className="form-label">Imagen del producto</Label>
                    <FileUploader acceptedFileTypes={['image/*']} maxFiles={1} onFileUpload={(file) => setFileToUpload(file)} />
                </div>


                {/* Campo Código */}
                <div className="mt-4">
                    <Label htmlFor="idInput" className="form-label">Código</Label>
                    <Input
                        type="text"
                        id="idInput"
                        className="form-control"
                        name="id"
                        value={formik.values.id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.id && !!formik.errors.id}
                        disabled={isCodeDisabled}
                    />
                    {formik.touched.id && formik.errors.id && (
                        <FormFeedback>{formik.errors.id}</FormFeedback>
                    )}
                </div>

                {/* Campo Nombre del producto */}
                <div className="mt-4">
                    <Label htmlFor="nameInput" className="form-label">Nombre</Label>
                    <Input
                        type="text"
                        id="nameInput"
                        className="form-control"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.name && !!formik.errors.name}
                    />
                    {formik.touched.name && formik.errors.name && (
                        <FormFeedback>{formik.errors.name}</FormFeedback>
                    )}
                </div>

                <div className="mt-4">
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
                        {configContext?.configurationData?.unitMeasurements.map((unit) => (
                            <option key={unit} value={unit}>
                                {unit}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.unit_measurement && formik.errors.unit_measurement && (
                        <FormFeedback>{formik.errors.unit_measurement}</FormFeedback>
                    )}
                </div>

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
                        {configContext?.configurationData?.categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
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
