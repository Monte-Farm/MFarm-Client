import { Alert, Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "App";
import DatePicker from "react-flatpickr";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import SuccessModal from "./SuccessModal";
import { HttpStatusCode } from "axios";

interface HeatFormProps {
    insemination: any;
    onSave: () => void;
    onCancel: () => void;
}

const HeatForm = ({ insemination, onSave, onCancel }: HeatFormProps) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);

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
        heatDetected: Yup.boolean().required("Debe indicar si se detectó celo"),
        date: Yup.date().required("La fecha es obligatoria"),
    });

    const formik = useFormik({
        initialValues: {
            heatDetected: false,
            date: null,
            notes: "",
            responsible: userLogged?._id || "",
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                setSubmitting(true);

                const response = await configContext.axiosHelper.update(
                    `${configContext.apiUrl}/insemination/register_heat/${insemination._id}`,
                    {
                        heatDetected: values.heatDetected,
                        date: values.date,
                        notes: values.notes,
                        responsible: values.responsible,
                    }
                );

                if (response.data.statusCode === HttpStatusCode.Ok) {
                    setSuccessModalOpen(true);
                }
            } catch (error) {
                handleError(error, "Ha ocurrido un error al registrar el celo");
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        formik.setFieldValue('date', new Date())
    }, [])

    return (
        <>
            <form onSubmit={formik.handleSubmit}>
                <div className="mt-4">
                    <Label htmlFor="heatDetected" className="form-label">Celo detectado</Label>
                    <Input
                        type="select"
                        id="heatDetected"
                        name="heatDetected"
                        value={formik.values.heatDetected ? "true" : "false"}
                        onChange={(e) => formik.setFieldValue("heatDetected", e.target.value === "true")}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.heatDetected && !!formik.errors.heatDetected}
                    >
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                    </Input>
                    {formik.touched.heatDetected && formik.errors.heatDetected && (
                        <FormFeedback>{formik.errors.heatDetected}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-2 mt-4">
                    <div className="w-50">
                        <Label htmlFor="date" className="form-label">Fecha del registro</Label>
                        <DatePicker
                            id="date"
                            className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                            value={formik.values.date ?? undefined}
                            onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('date', date[0]); }}
                            options={{ dateFormat: 'd/m/Y' }}
                        />
                        {formik.touched.date && formik.errors.date && (
                            <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
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

                <div className="mt-4">
                    <Label htmlFor="notes" className="form-label">Notas</Label>
                    <Input
                        type="text"
                        id="notes"
                        name="notes"
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.notes && !!formik.errors.notes}
                        placeholder="Ej: Celo leve, comportamiento dudoso"
                    />
                    {formik.touched.notes && formik.errors.notes && (
                        <FormFeedback>{formik.errors.notes}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-2 mt-3">
                    <Button className="ms-auto" color="primary" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner size="sm" /> : <><i className="ri-check-line me-2" />Registrar</>}
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

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message="Registro de celo realizado con éxito" />
        </>
    );
};

export default HeatForm;