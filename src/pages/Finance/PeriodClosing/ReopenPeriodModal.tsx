import { useState } from "react";
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
    const dispatch = useDispatch<any>();
    const submitting = useSelector((state: any) => state.PeriodClosing.submitting);
    const [apiError, setApiError] = useState<string | null>(null);

    const formik = useFormik({
        initialValues: { reason: "" },
        validationSchema: Yup.object({
            reason: Yup.string()
                .trim()
                .required("La razón es obligatoria")
                .min(10, "Mínimo 10 caracteres")
                .max(500, "Máximo 500 caracteres"),
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
            <ModalHeader toggle={handleClose}>Reabrir cierre</ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody>
                    <Alert color="warning">
                        <i className="ri-alert-line me-2 text-warning" />
                        Vas a reabrir el cierre de <strong>{periodLabel}</strong>. Las cifras dejarán
                        de ser oficiales hasta que se vuelva a cerrar.
                    </Alert>

                    <FormGroup>
                        <Label for="reason">Razón de la reapertura *</Label>
                        <Input
                            type="textarea"
                            id="reason"
                            name="reason"
                            rows={4}
                            maxLength={500}
                            placeholder="Explica por qué se necesita reabrir este cierre..."
                            value={formik.values.reason}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={!!(formik.touched.reason && formik.errors.reason)}
                        />
                        {formik.touched.reason && formik.errors.reason && (
                            <FormFeedback>{formik.errors.reason as string}</FormFeedback>
                        )}
                        <small className="text-muted">Mínimo 10 caracteres. Queda registrada en la auditoría.</small>
                    </FormGroup>

                    {apiError && <Alert color="danger" className="mb-0">{apiError}</Alert>}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={handleClose} disabled={submitting}>Cancelar</Button>
                    <Button type="submit" color="warning" disabled={submitting}>
                        {submitting ? (<><i className="ri-loader-4-line ri-spin me-1" />Reabriendo...</>) : "Reabrir cierre"}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default ReopenPeriodModal;
