import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
    Button,
    Form,
    FormFeedback,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
} from 'reactstrap';
import { APIClient } from 'helpers/api_helper';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';

const api = new APIClient();

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [visibleFields, setVisibleFields] = useState({ current: false, new: false, confirm: false });

    const toggleVisibility = (field: keyof typeof visibleFields) => {
        setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const formik = useFormik({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            currentPassword: Yup.string().required(t('auth.changePassword.validation.currentPasswordRequired')),
            newPassword: Yup.string()
                .min(8, t('auth.changePassword.validation.newPasswordMin'))
                .required(t('auth.changePassword.validation.newPasswordRequired')),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword')], t('auth.changePassword.validation.passwordsMustMatch'))
                .required(t('auth.changePassword.validation.confirmPasswordRequired')),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                await api.create('/auth/change-password', {
                    current_password: values.currentPassword,
                    new_password: values.newPassword,
                });
                resetForm();
                onClose();
                setShowSuccess(true);
            } catch (error: any) {
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    setErrorMessage(t('auth.changePassword.errorWrongCurrent'));
                } else {
                    setErrorMessage(t('auth.changePassword.errorGeneric'));
                }
                setShowError(true);
            }
        },
    });

    const handleClose = () => {
        formik.resetForm();
        setVisibleFields({ current: false, new: false, confirm: false });
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={handleClose}>
                    <i className="ri-lock-password-line me-2 text-primary"></i>
                    {t('auth.changePassword.title')}
                </ModalHeader>
                <Form onSubmit={formik.handleSubmit}>
                    <ModalBody>
                        <FormGroup>
                            <Label for="currentPassword">{t('auth.changePassword.field.currentPassword')}</Label>
                            <div className="position-relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={visibleFields.current ? 'text' : 'password'}
                                    placeholder={t('auth.changePassword.field.currentPasswordPlaceholder')}
                                    value={formik.values.currentPassword}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={!!(formik.touched.currentPassword && formik.errors.currentPassword)}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-2 text-muted"
                                    style={{ zIndex: 5, background: 'none', border: 'none' }}
                                    onClick={() => toggleVisibility('current')}
                                    tabIndex={-1}
                                >
                                    <i className={visibleFields.current ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                                </button>
                                <FormFeedback>{formik.errors.currentPassword}</FormFeedback>
                            </div>
                        </FormGroup>

                        <FormGroup>
                            <Label for="newPassword">{t('auth.changePassword.field.newPassword')}</Label>
                            <div className="position-relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={visibleFields.new ? 'text' : 'password'}
                                    placeholder={t('auth.changePassword.field.newPasswordPlaceholder')}
                                    value={formik.values.newPassword}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={!!(formik.touched.newPassword && formik.errors.newPassword)}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-2 text-muted"
                                    style={{ zIndex: 5, background: 'none', border: 'none' }}
                                    onClick={() => toggleVisibility('new')}
                                    tabIndex={-1}
                                >
                                    <i className={visibleFields.new ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                                </button>
                                <FormFeedback>{formik.errors.newPassword}</FormFeedback>
                            </div>
                        </FormGroup>

                        <FormGroup className="mb-0">
                            <Label for="confirmPassword">{t('auth.changePassword.field.confirmPassword')}</Label>
                            <div className="position-relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={visibleFields.confirm ? 'text' : 'password'}
                                    placeholder={t('auth.changePassword.field.confirmPasswordPlaceholder')}
                                    value={formik.values.confirmPassword}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={!!(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-2 text-muted"
                                    style={{ zIndex: 5, background: 'none', border: 'none' }}
                                    onClick={() => toggleVisibility('confirm')}
                                    tabIndex={-1}
                                >
                                    <i className={visibleFields.confirm ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                                </button>
                                <FormFeedback>{formik.errors.confirmPassword}</FormFeedback>
                            </div>
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" type="button" onClick={handleClose} disabled={formik.isSubmitting}>
                            {t('common.button.cancel')}
                        </Button>
                        <Button className="farm-primary-button" type="submit" disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <><Spinner size="sm" className="me-2" />{t('common.button.saving', { defaultValue: 'Guardando...' })}</>
                            ) : (
                                t('auth.changePassword.submitButton')
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                message={t('auth.changePassword.success')}
            />
            <ErrorModal
                isOpen={showError}
                onClose={() => setShowError(false)}
                message={errorMessage}
            />
        </>
    );
};

export default ChangePasswordModal;
