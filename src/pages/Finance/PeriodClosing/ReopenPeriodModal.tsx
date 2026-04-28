import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Form, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { reopenPeriod } from "slices/periodClosing/thunk";

interface ReopenPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    closingId: string;
    periodLabel: string;
}

const ReopenPeriodModal = ({ isOpen, onClose, onSuccess, closingId, periodLabel }: ReopenPeriodModalProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
    const submitting = useSelector((state: any) => state.PeriodClosing.submitting);
    const [apiError, setApiError] = useState<string | null>(null);

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
            setApiError(null);
            try {
                await dispatch(reopenPeriod(closingId, values.reason.trim()));
                formik.resetForm();
                onSuccess();
            } catch (err: any) {
                setApiError(err?.response?.data?.message || "Error al reabrir el cierre");
            }
        },
    });

    const handleClose = () => {
        if (submitting) return;
        formik.resetForm();
        setApiError(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} toggle={handleClose} backdrop="static" keyboard={false} centered>
            <ModalHeader toggle={handleClose}>{t("finance.periodClosing.modal.reopen.header")}</ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody>
                    <Alert color="warning">
                        <i className="ri-alert-line me-2 text-warning" />
                        <Trans
                            i18nKey="finance.periodClosing.modal.reopen.alert"
                            values={{ val: periodLabel }}
                            components={{ 1: <strong /> }}
                        />
                    </Alert>

                    <FormGroup>
                        <Label for="reason">{t("finance.periodClosing.modal.reopen.field.reason")}</Label>
                        <Input
                            type="textarea"
                            id="reason"
                            name="reason"
                            rows={4}
                            maxLength={500}
                            placeholder={t("finance.periodClosing.modal.reopen.field.reasonPlaceholder")}
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

                    {apiError && <Alert color="danger" className="mb-0">{apiError}</Alert>}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={handleClose} disabled={submitting}>{t("common.button.cancel")}</Button>
                    <Button type="submit" color="warning" disabled={submitting}>
                        {submitting
                            ? (<><i className="ri-loader-4-line ri-spin me-1" />{t("finance.periodClosing.modal.reopen.button.submitting")}</>)
                            : t("finance.periodClosing.modal.reopen.button.submit")}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default ReopenPeriodModal;
