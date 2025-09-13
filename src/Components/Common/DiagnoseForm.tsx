import { Alert, Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import { Formik, useFormik } from "formik";
import * as Yup from "yup";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "App";
import DatePicker from "react-flatpickr";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import SuccessModal from "./SuccessModal";
import { HttpStatusCode } from "axios";
import FileUploader from "./FileUploader";

interface DiagnosisFormProps {
    insemination: any;
    onSave: () => void;
    onCancel: () => void;
}

const DiagnosisForm = ({ insemination, onSave, onCancel }: DiagnosisFormProps) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const validationSchema = Yup.object({
        result: Yup.string()
            .oneOf(['pregnant', 'empty', 'doubtful', 'resorption', 'abortion'])
            .required('El resultado es obligatorio'),
        diagnosisDate: Yup.date().required('La fecha es obligatoria'),
    });

    const formik = useFormik({
        initialValues: {
            result: 'pregnant',
            diagnosisDate: null,
            diagnose_notes: '',
            responsible: userLogged?._id || '',
            attachments: [] as string[]
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return
            try {
                setSubmitting(true);
                if (fileToUpload) {
                    await fileUpload(fileToUpload);
                }

                const result = await configContext.axiosHelper.update(`${configContext.apiUrl}/insemination/diagnose_insemination/${insemination._id}`,
                    {
                        result: values.result,
                        diagnosisDate: values.diagnosisDate,
                        diagnose_notes: values.diagnose_notes,
                        diagnose_responsible: values.responsible,
                        attachments: values.attachments
                    }
                );

                if (result.data.status === HttpStatusCode.Ok) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Diagnostico de inseminación ${insemination} registrada`
                    });
                }
                setSuccessModalOpen(true)
            } catch (error) {
                handleError(error, 'Ha ocurrido un error al guardar los datos, intentelo mas tarde')
            } finally {
                setSubmitting(false)
            }
        },
    });

    const fileUpload = async (file: File) => {
        if (!configContext) return;

        try {
            const uploadResponse = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/upload/upload_file/`, file);
            formik.values.attachments.push(uploadResponse.data.data)

        } catch (error) {
            handleError(error, 'Ha ocurrido un error al subir el archivo, por favor intentelo más tarde');
        }
    };

    useEffect(() => {
        formik.setFieldValue('diagnosisDate', new Date())
    }, [])


    return (
        <>
            <form onSubmit={formik.handleSubmit} className="">

                <div className="mt-4">
                    <Label htmlFor="imageInput" className="form-label">Archivos de diagnostico</Label>
                    <FileUploader acceptedFileTypes={['image/*', 'application/pdf']} maxFiles={1} onFileUpload={(file) => setFileToUpload(file)} />
                </div>

                <div className="mt-4">
                    <Label htmlFor="result" className="form-label">Diagnostico</Label>
                    <Input
                        type="select"
                        id="conservation_method"
                        name="result"
                        value={formik.values.result}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.result && !!formik.errors.result}
                    >
                        <option value="pregnant">Preñada</option>
                        <option value="empty">Vacía</option>
                        <option value="doubtful">Dudosa</option>
                        <option value="resorption">Reabsorción</option>
                        <option value="abortion">Aborto</option>
                    </Input>
                    {formik.touched.result && formik.errors.result && (
                        <FormFeedback>{formik.errors.result}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-2 mt-4">
                    <div className="w-50">
                        <Label htmlFor="diagnosisDate" className="form-label">Fecha de diagnostico</Label>
                        <DatePicker
                            id="diagnosisDate"
                            className={`form-control ${formik.touched.diagnosisDate && formik.errors.diagnosisDate ? 'is-invalid' : ''}`}
                            value={formik.values.diagnosisDate ?? undefined}
                            onChange={(date: Date[]) => {
                                if (date[0]) formik.setFieldValue('diagnosisDate', date[0]);
                            }}
                            options={{ dateFormat: 'd/m/Y' }}
                        />
                        {formik.touched.diagnosisDate && formik.errors.diagnosisDate && (
                            <FormFeedback className="d-block">{formik.errors.diagnosisDate as string}</FormFeedback>
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
                    <Label htmlFor="diagnose_notes" className="form-label">Notas</Label>
                    <Input
                        type="text"
                        id="diagnose_notes"
                        name="diagnose_notes"
                        value={formik.values.diagnose_notes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.diagnose_notes && !!formik.errors.diagnose_notes}
                        placeholder="Ej: Extracción parcial"
                    />
                    {formik.touched.diagnose_notes && formik.errors.diagnose_notes && (
                        <FormFeedback>{formik.errors.diagnose_notes}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-2 mt-3">
                    <Button className="ms-auto" color="primary" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <div>
                                <Spinner size='sm' />
                            </div>
                        ) : (
                            <div>
                                <i className="ri-check-line me-2" />
                                Registrar
                            </div>
                        )}
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

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={"Diagnostico registrado con éxito"} />
        </>
    );
};

export default DiagnosisForm;