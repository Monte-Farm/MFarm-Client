import { logger } from 'utils/logger';
import React, { useContext, useEffect, useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback, Row, Col } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import FileUploader from "../Shared/FileUploader";
import { ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { PRODUCT_TYPES } from "common/enums/products.enums";
import AlertMessage from "../Shared/AlertMesagge";
import { useGlobalConfig } from "hooks/useGlobalConfig";

interface ProductFormProps {
    initialData?: ProductData;
    onSubmit: (data: ProductData) => Promise<void>;
    onCancel: () => void;
    isCodeDisabled?: boolean,
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, isCodeDisabled }) => {
    const { t } = useTranslation();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const configContext = useContext(ConfigContext)
    const { globalConfig } = useGlobalConfig();
    const unitOptions = globalConfig?.unitMeasurements ?? [];

    const fetchNextId = async () => {
        try {
            const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/product/product_next_id`);
            if (response?.data?.data) {
                formik.setFieldValue('id', response.data.data);
            }
        } catch (error) {
            logger.error('Error fetching next product id:', error);
        }
    };

    useEffect(() => {
        if (!initialData) fetchNextId();
    }, []);

    const validationSchema = Yup.object({
        id: Yup.string()
            .required(t('warehouse.productForm.validation.codeRequired'))
            .test('unique_id', t('warehouse.productForm.validation.codeExists'), async (value) => {
                if (initialData) return true
                if (!value) return false
                try {
                    const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/product/product_id_exists/${value}`);
                    return !response?.data.data
                } catch (error) {
                    logger.error(`Error al verificar el id: ${error}`)
                    return false
                }
            }),
        name: Yup.string().required(t('warehouse.productForm.validation.nameRequired')),
        category: Yup.string().required(t('warehouse.productForm.validation.categoryRequired')),
        unit_measurement: Yup.string().required(t('warehouse.productForm.validation.unitRequired')),
        description: Yup.string().required(t('warehouse.productForm.validation.descriptionRequired')),
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
            type: PRODUCT_TYPES.RAW,
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
                logger.error('Error sending product data: ', error);
                setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.productForm.error.save') });
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
            logger.error('Error uploading image: ', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.productForm.error.uploadImage') });
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
                        {t('warehouse.productForm.section.image')}
                    </div>
                    <FileUploader acceptedFileTypes={['image/*']} maxFiles={1} onFileUpload={(file) => setFileToUpload(file)} />
                </div>

                {/* Información del Producto */}
                <div className="mb-4">
                    <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
                        {t('warehouse.productForm.section.info')}
                    </div>

                    <Row className="g-3">
                        <Col lg={4}>
                            <Label htmlFor="idInput" className="form-label">{t('common.field.code')}</Label>
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
                            <Label htmlFor="nameInput" className="form-label">{t('common.field.name')}</Label>
                            <Input
                                type="text"
                                id="nameInput"
                                name="name"
                                placeholder={t('warehouse.productForm.field.namePlaceholder')}
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
                            <Label htmlFor="categoryInput" className="form-label">{t('warehouse.products.attr.category')}</Label>
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
                                <option value="">{t('warehouse.productForm.field.selectCategory')}</option>
                                <option value="nutrition">{t('warehouse.common.productCategory.nutrition')}</option>
                                <option value="medications">{t('warehouse.common.productCategory.medications')}</option>
                                <option value="vaccines">{t('warehouse.common.productCategory.vaccines')}</option>
                                <option value="vitamins">{t('warehouse.common.productCategory.vitamins')}</option>
                                <option value="minerals">{t('warehouse.common.productCategory.minerals')}</option>
                                <option value="supplies">{t('warehouse.common.productCategory.supplies')}</option>
                                <option value="hygiene_cleaning">{t('warehouse.common.productCategory.hygiene_cleaning')}</option>
                                <option value="equipment_tools">{t('warehouse.common.productCategory.equipment_tools')}</option>
                                <option value="spare_parts">{t('warehouse.common.productCategory.spare_parts')}</option>
                                <option value="office_supplies">{t('warehouse.common.productCategory.office_supplies')}</option>
                                <option value="others">{t('warehouse.common.productCategory.others')}</option>
                                <option value="laboratory">{t('warehouse.common.productCategory.laboratory')}</option>
                            </Input>
                            {formik.touched.category && formik.errors.category && (
                                <FormFeedback>{formik.errors.category}</FormFeedback>
                            )}
                        </Col>

                        <Col lg={6}>
                            <Label htmlFor="unit_measurementInput" className="form-label">{t('warehouse.products.attr.unit')}</Label>
                            <Input
                                type="select"
                                id="unit_measurementInput"
                                name="unit_measurement"
                                value={formik.values.unit_measurement}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.unit_measurement && !!formik.errors.unit_measurement}
                            >
                                <option value="">{t('warehouse.productForm.field.selectUnit')}</option>
                                {unitOptions.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </Input>
                            {formik.touched.unit_measurement && formik.errors.unit_measurement && (
                                <FormFeedback>{formik.errors.unit_measurement}</FormFeedback>
                            )}
                        </Col>

                        <Col lg={12}>
                            <Label htmlFor="descriptionInput" className="form-label">{t('warehouse.inventoryDetails.attr.description')}</Label>
                            <Input
                                type="textarea"
                                id="descriptionInput"
                                rows={3}
                                name="description"
                                placeholder={t('warehouse.productForm.field.descriptionPlaceholder')}
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
                        {t('common.button.cancel')}
                    </Button>
                    <Button className="farm-primary-button" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? t('common.button.saving') : initialData ? t('warehouse.productForm.button.update') : t('warehouse.productForm.button.register')}
                    </Button>
                </div>
            </form>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            {/* Modal de confirmación de cancelación */}
            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>{t('warehouse.productForm.cancelModal.title')}</ModalHeader>
                <ModalBody>
                    {t('warehouse.productForm.cancelModal.body')}
                </ModalBody>
                <ModalFooter>
                    <Button className="btn-cancel" onClick={onCancel}>
                        {t('warehouse.productForm.cancelModal.confirm')}
                    </Button>
                    <Button className="farm-primary-button" onClick={() => setCancelModalOpen(false)}>
                        {t('warehouse.productForm.cancelModal.reject')}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ProductForm;
