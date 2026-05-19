import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Form, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { isTablet } from "./closingModalUtils";

export interface ForceCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onForced: (reason: string) => void | Promise<void>;
    periodLabel: string;
    blockingLabels: string[];
    submitting: boolean;
}

const ForceCloseModal = ({ isOpen, onClose, onForced, periodLabel, blockingLabels, submitting }: ForceCloseModalProps) => {
    const { t } = useTranslation();
    const [tabletMode, setTabletMode] = useState(isTablet);

    useEffect(() => {
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const formik = useFormik({
        initialValues: { reason: "" },
        validationSchema: Yup.object({
            reason: Yup.string()
                .trim()
                .required(t("finance.periodClosing.modal.shared.validation.required"))
                .min(10, t("finance.periodClosing.modal.shared.validation.min"))
                .max(500, t("finance.periodClosing.modal.shared.validation.max")),
        }),
        onSubmit: async (values) => {
            await onForced(values.reason.trim());
        },
    });

    const handleClose = () => {
        if (submitting) return;
        formik.resetForm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} toggle={handleClose} backdrop="static" keyboard={false} centered size="md" fullscreen={tabletMode}>
            <ModalHeader toggle={handleClose}>
                <i className="ri-alert-line me-2 text-warning" />
                {t("finance.periodClosing.modal.forceClose.header")}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody>
                    <Alert color="warning" className="d-flex align-items-start mb-3">
                        <i className="ri-error-warning-line me-2 fs-5 text-warning mt-1" />
                        <div>
                            <div className="fw-semibold mb-1">{t("finance.periodClosing.modal.forceClose.alertTitle", { val: periodLabel })}</div>
                            <small>
                                <Trans
                                    i18nKey="finance.periodClosing.modal.forceClose.alertBody"
                                    components={{ 1: <strong /> }}
                                />
                            </small>
                        </div>
                    </Alert>

                    {blockingLabels.length > 0 && (
                        <div className="mb-3">
                            <div className="text-muted small fw-semibold mb-2">{t("finance.periodClosing.modal.forceClose.errorsTitle")}</div>
                            <ul className="mb-0">
                                {blockingLabels.map((label, i) => (
                                    <li key={i} className="text-danger">{label}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <FormGroup>
                        <Label for="forceReason">{t("finance.periodClosing.modal.forceClose.field.reason")}</Label>
                        <Input
                            type="textarea"
                            id="forceReason"
                            name="reason"
                            rows={3}
                            maxLength={500}
                            placeholder={t("finance.periodClosing.modal.forceClose.field.reasonPlaceholder")}
                            value={formik.values.reason}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={!!(formik.touched.reason && formik.errors.reason)}
                        />
                        {formik.touched.reason && formik.errors.reason && (
                            <FormFeedback>{formik.errors.reason as string}</FormFeedback>
                        )}
                        <small className="text-muted">{t("finance.periodClosing.modal.shared.validation.hint")}</small>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={handleClose} disabled={submitting}>{t("common.button.cancel")}</Button>
                    <Button type="submit" color="warning" disabled={submitting}>
                        {submitting
                            ? (<><i className="ri-loader-4-line ri-spin me-1" />{t("finance.periodClosing.modal.forceClose.button.submitting")}</>)
                            : (<><i className="ri-alert-line me-1" />{t("finance.periodClosing.modal.forceClose.button.submit")}</>)}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default ForceCloseModal;
