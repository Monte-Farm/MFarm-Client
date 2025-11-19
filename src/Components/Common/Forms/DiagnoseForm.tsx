import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { Formik, useFormik } from "formik";
import * as Yup from "yup";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "App";
import DatePicker from "react-flatpickr";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import SuccessModal from "../Shared/SuccessModal";
import { HttpStatusCode } from "axios";
import FileUploader from "../Shared/FileUploader";
import AlertMessage from "../Shared/AlertMesagge";

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
    const [confirmationModalOpen, setConfirmationModalOpen] = useState<boolean>(false)

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

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

                if (result.status === HttpStatusCode.Ok) {
                    if (values.result === 'pregnant') {
                        const estimatedFarrowingDate = new Date(insemination.date);
                        estimatedFarrowingDate.setDate(estimatedFarrowingDate.getDate() + 115);

                        await configContext.axiosHelper.create(`${configContext.apiUrl}/pregnancies/create`, {
                            sow: insemination.sow._id,
                            insemination: insemination._id,
                            start_date: insemination.date,
                            farrowing_status: 'pregnant',
                            hasFarrowed: false,
                            status_history: [],
                            abortions: [],
                            estimated_farrowing_date: estimatedFarrowingDate,
                            farrowing_date: null,
                        });
                    }

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
        console.log(insemination)
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
                    <Button className="ms-auto" color="primary" type="button" onClick={() => setConfirmationModalOpen(true)}>
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

                <Modal size="md" isOpen={confirmationModalOpen} toggle={() => setConfirmationModalOpen(false)} centered>
                    <ModalHeader toggle={() => setConfirmationModalOpen(false)}> Confirmar diagnóstico</ModalHeader>
                    <ModalBody>
                        <div className="d-flex flex-column align-items-center text-center gap-3">
                            <FiCheckCircle size={50} />
                            <div>
                                <p className="mb-1 fs-5">
                                    ¿Desea registrar el diagnóstico:{" "}
                                    <strong>
                                        {{
                                            pregnant: "Preñada",
                                            empty: "Vacía",
                                            doubtful: "Dudosa",
                                            resorption: "Reabsorción",
                                            abortion: "Aborto"
                                        }[formik.values.result]}
                                    </strong>?
                                </p>
                                {formik.values.result === "pregnant" && (
                                    <p className="text-muted fs-5">
                                        Fecha de parto tentativa:{" "}
                                        {new Date(new Date(insemination.date).getTime() + 115 * 24 * 60 * 60 * 1000)
                                            .toLocaleDateString("es-MX")}
                                    </p>
                                )}
                                {formik.values.result !== "pregnant" && (
                                    <p className="text-muted fs-6">
                                    </p>
                                )}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <div className="d-flex gap-2 mt-3">
                            <Button color="secondary" onClick={() => setConfirmationModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button color="success" onClick={() => formik.handleSubmit()}>
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size='sm' />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        Confirmar
                                    </div>
                                )}
                            </Button>
                        </div>
                    </ModalFooter>
                </Modal>

            </form>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={false} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={"Diagnostico registrado con éxito"} />
        </>
    );
};

export default DiagnosisForm;