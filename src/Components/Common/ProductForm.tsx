import React, { useContext, useEffect, useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Alert } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import FileUploader from "./FileUploader";
import { ProductCategory, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";

interface ProductFormProps {
    initialData?: ProductData;
    onSubmit: (data: ProductData) => Promise<void>;
    onCancel: () => void;
    isCodeDisabled?: boolean,
    foldersArray?: string[]
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isCodeDisabled, foldersArray }) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const configContext = useContext(ConfigContext)
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory>()

    const handleError = (error: any, message: string) => {
        console.error(error, message)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

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
                    await fileUpload(fileToUpload)
                }
                await onSubmit(values);
            } catch (error) {
                handleError(error, "Error al enviar el formulario")
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fileUpload = async (file: File) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/google_drive/create_folders`, foldersArray);
            const folderId = response.data.data;

            const uploadResponse = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/google_drive/upload_file/${folderId}`, file);
            formik.values.image = uploadResponse.data.data;
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al subir el archivo, por favor intentelo más tarde');
        }
    };


    const getImageProduct = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/google_drive/download_file/${initialData?.image}`, { responseType: 'blob' });
            setImagePreview(URL.createObjectURL(response.data));
        } catch (error) {
            console.error('Error al recuperar la imagen: ', error);
        }
    };


    const changeSelectedCategory = (e: any) => {
        const selectedCategory = JSON.parse(e)
        setSelectedCategory(selectedCategory)
        formik.setFieldValue('category', selectedCategory.value)
    }

    const handleFetchNextId = async () => {
        if (!configContext || !selectedCategory) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/product_next_id/${selectedCategory.prefix}`)
            const nextProductId = response.data.data
            formik.setFieldValue('id', nextProductId)
        } catch (error) {
            console.error(error, 'Error al obtener el id')
        }
    }

    useEffect(() => {
        if (initialData && initialData.image) {
            getImageProduct();
        }

        if(configContext && configContext.configurationData && initialData && initialData.category){
            const foundCategory = configContext?.configurationData?.productCategories.find((category) => category.value === initialData.category)
            if(foundCategory) setSelectedCategory(foundCategory)
        }
    }, [initialData]);

    useEffect(() => {
        handleFetchNextId()
    }, [selectedCategory])

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

                {/* Campo Categoría */}
                <div className="mt-4">
                    <Label htmlFor="categoryInput" className="form-label">Categoría</Label>
                    <Input
                        type="select"
                        id="categoryInput"
                        name="category"
                        value={selectedCategory ? JSON.stringify(selectedCategory) : ""}
                        onChange={(e) => changeSelectedCategory(e.target.value)}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.category && !!formik.errors.category}
                        disabled={isCodeDisabled}
                    >
                        <option value="">Seleccione una categoría</option>
                        {configContext?.configurationData?.productCategories.map((category) => (
                            <option key={category.prefix} value={JSON.stringify(category)}>
                                {category.value}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.category && formik.errors.category && (
                        <FormFeedback>{formik.errors.category}</FormFeedback>
                    )}
                </div>

                {/* Campo codigo */}
                <div className="w-100 mt-4">
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
                        disabled
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
                    <Button className="farm-secondary-button" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button className="farm-primary-button" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Producto" : "Registrar Producto"}
                    </Button>
                </div>
            </form>

            {/* Alerta de error */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}

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
