import { logger } from 'utils/logger';
import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Spinner, FormFeedback, Row, Col, Card, CardBody, CardImg, CardText, Modal, ModalBody, ModalHeader, Alert } from 'reactstrap';
import { FarmData, UserData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import defaultProfile from '../../../assets/images/default-profile-mage.jpg';
import { getEffectiveUser } from "helpers/impersonation_helper";
import FileUploader from '../Shared/FileUploader';
import UserForm from './UserForm';
import { useTranslation } from 'react-i18next';

interface FarmFormProps {
    data?: Partial<FarmData> & { _id?: string };
    onSave: () => void;
    onCancel: () => void;
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const FarmForm: React.FC<FarmFormProps> = ({ data, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [managers, setManagers] = useState<UserData[]>([]);
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [hasNewImage, setHasNewImage] = useState(false);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        logger.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const validationSchema = Yup.object({
        name: Yup.string().required(t('farms.form.validationName')),
        code: Yup.string()
            .required(t('farms.form.validationCode'))
            .test('unique_code', t('farms.form.validationCodeExists'), async (value) => {
                if (data) return true
                if (!value) return false
                if (!configContext) return true
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/check_code_exists/${value}`)
                    return !response.data.data.exists
                } catch (error) {
                    logger.error('Error checking farm code:', error);
                    return false;
                }
            }),
        location: Yup.string().required(t('farms.form.validationLocation')),
    });

    const formik = useFormik({
        initialValues: {
            image: data?.image || null,
            name: data?.name || '',
            code: data?.code || '',
            location: data?.location || '',
            status: data?.status ?? true,
            manager: (typeof data?.manager === 'object' && data?.manager !== null) ? (data.manager as UserData)._id : (data?.manager || ''),
            main_warehouse: data?.main_warehouse || '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            if (!values.manager) {
                handleError(null, t('farms.form.errorNoManager'));
                setSubmitting(false);
                return;
            }

            try {
                if (fileToUpload) {
                    await fileUpload(fileToUpload);
                }
                if (data && data._id) {
                    await configContext.axiosHelper.update(`${configContext.apiUrl}/farm/update/${data?._id}`, values);
                } else {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/farm/create`, values);
                }
                onSave();
            } catch (error) {
                logger.error('Error al guardar la granja:', error);
                handleError(error, t('farms.form.errorSave'));
            } finally {
                setSubmitting(false);
            }
        },
    });

    const getNextCode = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/next_code`);
            formik.setFieldValue('code', response.data.data)
        } catch (error) {
            logger.error('Error fetching next farm code:', error);
            setAlertConfig({ visible: true, color: "danger", message: t('farms.form.errorNextCode') });
        }
    }

    const fetchManagerUsers = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_role/farm_manager`);
            const allManagers: UserData[] = response.data.data;

            let filtered = allManagers.filter(
                (manager) => manager.status === true && manager.farm_assigned === null
            );

            if (data?.manager) {
                const currentManagerId = typeof data.manager === 'object' ? (data.manager as UserData)._id : data.manager;
                const currentManager = allManagers.find((m) => m._id === currentManagerId);
                if (currentManager && !filtered.find((m) => m._id === currentManager._id)) {
                    filtered.push(currentManager);
                }
            }

            setManagers(filtered);
        } catch (error) {
            logger.error('Error fetching manager users:', error);
        }
    };

    const fileUpload = async (file: File) => {
        if (!configContext) return;

        try {
            const uploadResponse = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/upload/upload_file/`, file);
            formik.values.image = uploadResponse.data.data;
        } catch (error) {
            handleError(error, t('farms.form.errorUpload'));
        }
    };

    const handleCreateUser = () => {
        showAlert('success', t('farms.form.userCreated'));
        fetchManagerUsers();
        toggleModal('create', false);
    };

    useEffect(() => {
        getNextCode();
        fetchManagerUsers();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isSelected = (id: string) => formik.values.manager === id;

    return (
        <Form onSubmit={formik.handleSubmit}>

            {/* — Sección 1: Info de la granja — */}
            <div className="farm-form-section mb-4">
                <div className="farm-form-section-header mb-3">
                    <i className="ri-store-3-line me-2 text-primary" />
                    <span className="fw-semibold fs-6">{t('farms.form.sectionInfo')}</span>
                </div>

                <Row className="g-3 align-items-start">
                    <Col md={12}>
                        <Label className="form-label text-muted small">{t('farms.form.imageLabel')}</Label>
                        {formik.values.image && !hasNewImage && (
                            <img
                                src={formik.values.image}
                                alt=""
                                className="mb-2 w-100"
                                style={{ borderRadius: 8, maxHeight: 140, objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}
                        <FileUploader
                            acceptedFileTypes={['image/*']}
                            maxFiles={1}
                            onFileUpload={(file) => { setFileToUpload(file); setHasNewImage(true); }}
                            onUpdateFiles={(files) => { if (files.length === 0) { setHasNewImage(false); setFileToUpload(null); } }}
                        />
                    </Col>

                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label className="form-label text-muted small">{t('farms.form.fieldCode')}</Label>
                            <Input
                                name="code"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.code && !!formik.errors.code}
                            />
                            {formik.touched.code && formik.errors.code && (
                                <FormFeedback>{formik.errors.code}</FormFeedback>
                            )}
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label className="form-label text-muted small">{t('farms.form.fieldName')}</Label>
                            <Input
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </FormGroup>
                    </Col>
                    <Col md={12}>
                        <FormGroup className="mb-0">
                            <Label className="form-label text-muted small">{t('farms.form.fieldLocation')}</Label>
                            <Input
                                name="location"
                                value={formik.values.location}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.location && !!formik.errors.location}
                            />
                            {formik.touched.location && formik.errors.location && (
                                <FormFeedback>{formik.errors.location}</FormFeedback>
                            )}
                        </FormGroup>
                    </Col>
                </Row>
            </div>

            {/* Divisor */}
            <hr className="my-3" />

            {/* — Sección 2: Encargado — */}
            <div className="farm-form-section">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="farm-form-section-header">
                        <i className="ri-user-line me-2 text-primary" />
                        <span className="fw-semibold fs-6">{t('farms.form.sectionManager')}</span>
                    </div>
                    <Button size="sm" color="light" className="border" onClick={() => toggleModal('create')}>
                        <i className="ri-add-line me-1" />
                        {t('farms.form.buttonNewManager')}
                    </Button>
                </div>

                {managers.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
                        <i className="ri-user-search-line mb-2" style={{ fontSize: 36, opacity: 0.4 }} />
                        <span className="small">{t('farms.form.noManagers')}</span>
                    </div>
                ) : (
                    <div className="farm-form-managers-list">
                        {managers.map(manager => {
                            const selected = isSelected(manager._id || "");
                            return (
                                <div
                                    key={manager._id}
                                    className={`farm-form-manager-row${selected ? ' selected' : ''}`}
                                    onClick={() => formik.setFieldValue('manager', manager._id)}
                                >
                                    <img
                                        src={manager.profile_image || defaultProfile}
                                        alt=""
                                        className="farm-form-manager-avatar"
                                        onError={e => { (e.target as HTMLImageElement).src = defaultProfile; }}
                                    />
                                    <div className="farm-form-manager-info">
                                        <span className="fw-semibold">{manager.name} {manager.lastname}</span>
                                        <span className="text-muted small">{manager.email}</span>
                                    </div>
                                    <div className={`farm-form-manager-check${selected ? ' visible' : ''}`}>
                                        <i className="ri-checkbox-circle-fill text-primary" style={{ fontSize: 22 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="d-flex gap-2 mt-4">
                <Button className="ms-auto btn-cancel" color="secondary" type="button" onClick={onCancel}>
                    {t('common.button.cancel')}
                </Button>
                <Button color="primary" type="submit" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner size="sm" /> : t('common.button.save')}
                </Button>
            </div>

            <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop="static" centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('create')}>{t('farms.form.modalNewUser')}</ModalHeader>
                <ModalBody>
                    <UserForm
                        onSave={handleCreateUser}
                        onCancel={() => toggleModal('create', false)}
                        defaultRole="farm_manager"
                        currentUserRole={userLogged.role}
                    />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="mt-3">
                    {alertConfig.message}
                </Alert>
            )}
        </Form>
    );
};

export default FarmForm;
