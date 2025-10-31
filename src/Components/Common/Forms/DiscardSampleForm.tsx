import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { Alert, Button, FormFeedback, Input, Label, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import * as Yup from "yup";
import SuccessModal from "../SuccessModal";

interface DiscardSampleFormProps {
    sample: any;
    onSave: () => void;
    onCancel: () => void;
}

const DiscardSampleForm = ({ sample, onSave, onCancel }: DiscardSampleFormProps) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const validationSchema = Yup.object({
        discard_reason: Yup.string().required("Por favor ingrese el motivo del descarte"),
        discard_date: Yup.date().required("La fecha es obligatoria"),
    });

    const formik = useFormik({
        initialValues: {
            discard_reason: "",
            discard_date: null,
            discarded_by: userLogged?._id || "",
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                setSubmitting(true);

                const response = await configContext.axiosHelper.update(
                    `${configContext.apiUrl}/semen_sample/discard_sample_lot/${sample._id}`,
                    {
                        discard_reason: values.discard_reason,
                        discard_date: values.discard_date,
                        discarded_by: values.discarded_by,
                    }
                );

                if (response.data.statusCode === HttpStatusCode.Ok) {
                    setSuccessModalOpen(true);
                }
            } catch (error) {
                handleError(error, "Ha ocurrido un error al descartar el lote");
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        formik.setFieldValue('discard_date', new Date());
    }, []);

    const handleConfirm = () => setConfirmModalOpen(true);
    const handleCancelConfirm = () => setConfirmModalOpen(false);
    const handleAcceptConfirm = () => {
        setConfirmModalOpen(false);
        formik.handleSubmit();
    };

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
                <div className="mt-4">
                    <Label htmlFor="discard_reason" className="form-label">Razón del descarte</Label>
                    <Input
                        type="text"
                        id="discard_reason"
                        name="discard_reason"
                        value={formik.values.discard_reason}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.discard_reason && !!formik.errors.discard_reason}
                    />
                    {formik.touched.discard_reason && formik.errors.discard_reason && (
                        <FormFeedback>{formik.errors.discard_reason}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-2 mt-4">
                    <div className="w-50">
                        <Label htmlFor="discard_date" className="form-label">Fecha del descarte</Label>
                        <DatePicker
                            id="discard_date"
                            className={`form-control ${formik.touched.discard_date && formik.errors.discard_date ? 'is-invalid' : ''}`}
                            value={formik.values.discard_date ?? undefined}
                            onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('discard_date', date[0]); }}
                            options={{ dateFormat: 'd/m/Y' }}
                        />
                        {formik.touched.discard_date && formik.errors.discard_date && (
                            <FormFeedback className="d-block">{formik.errors.discard_date as string}</FormFeedback>
                        )}
                    </div>

                    <div className="w-50">
                        <Label htmlFor="responsible" className="form-label">Responsable</Label>
                        <Input
                            type="text"
                            id="responsible"
                            name="responsible"
                            value={`${userLogged?.name} ${userLogged?.lastname}`}
                            disabled
                        />
                    </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                    <Button className="ms-auto" color="primary" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner size="sm" /> : <><i className="ri-check-line me-2" />Aceptar</>}
                    </Button>
                </div>
            </form>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-4">
                    {alertConfig.color === "success" && <FiCheckCircle size={22} />}
                    {alertConfig.color === "danger" && <FiXCircle size={22} />}
                    {alertConfig.color === "warning" && <FiAlertCircle size={22} />}
                    {alertConfig.color === "info" && <FiInfo size={22} />}
                    <span className="flex-grow-1 text-black">{alertConfig.message}</span>
                    <Button close onClick={() => setAlertConfig({ ...alertConfig, visible: false })} />
                </Alert>
            )}

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message="Lote de genética líquida descartado con éxito" />

            {/* Modal de confirmación */}
            <Modal isOpen={confirmModalOpen} toggle={handleCancelConfirm} centered>
                <ModalHeader toggle={handleCancelConfirm}>Confirmar descarte</ModalHeader>
                <ModalBody>
                    Esta a punto de descartar el lote {sample.extraction_id.batch} de genética líquida. Las dosis de este lote no se podrán usar más.
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={handleCancelConfirm}>Cancelar</Button>
                    <Button color="danger" onClick={handleAcceptConfirm}>Confirmar</Button>
                </ModalFooter>
            </Modal>
        </>
    );
}

export default DiscardSampleForm;