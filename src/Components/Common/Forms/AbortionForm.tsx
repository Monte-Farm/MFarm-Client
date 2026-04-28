import { Alert, Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import { Formik, useFormik } from "formik";
import * as Yup from "yup";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "App";
import DatePicker from "react-flatpickr";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";

import { HttpStatusCode } from "axios";
import FileUploader from "../Shared/FileUploader";
import SuccessModal from "../Shared/SuccessModal";
import AlertMessage from "../Shared/AlertMesagge";
import { useTranslation } from "react-i18next";


interface AbortionFormProps {
    pregnancy: any;
    onSave: () => void;
    onCancel: () => void;
}

const AbortionForm = ({ pregnancy, onSave, onCancel }: AbortionFormProps) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)

    const validationSchema = Yup.object({
        probable_cause: Yup.string().required(t('reproduction.form.abortion.validationCause', { defaultValue: 'El resultado es obligatorio' })),
        date: Yup.date().required(t('reproduction.form.abortion.validationDate', { defaultValue: 'La fecha es obligatoria' })),
    });

    const formik = useFormik({
        initialValues: {
            probable_cause: '',
            date: null,
            notes: '',
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

                const result = await configContext.axiosHelper.update(`${configContext.apiUrl}/pregnancies/register_abortion/${pregnancy._id}`,
                    {
                        probable_cause: values.probable_cause,
                        date: values.date,
                        notes: values.notes,
                        responsible: values.responsible,
                        attachments: values.attachments
                    }
                );

                if (result.data.status === HttpStatusCode.Ok) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Perdida de la inseminación: ${pregnancy} registrada`
                    });
                }
                setSuccessModalOpen(true)
            } catch (error) {
                console.error('Error saving data: ', { error })
                setAlertConfig({ visible: true, color: 'danger', message: t('reproduction.form.abortion.errorSave', { defaultValue: 'Ha ocurrido un error al guardar los datos, intentelo mas tarde' }) })
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
            setAlertConfig({ visible: true, color: 'danger', message: t('reproduction.form.abortion.errorUpload', { defaultValue: 'Ha ocurrido un error al subir el archivo, por favor intentelo más tarde' }) });
        }
    };

    useEffect(() => {
        formik.setFieldValue('date', new Date())
    }, [])


    return (
        <>
            <form onSubmit={formik.handleSubmit} className="">

                <div className="mt-4">
                    <Label htmlFor="imageInput" className="form-label">{t('reproduction.form.abortion.attachmentsLabel', { defaultValue: 'Archivos de perdida' })}</Label>
                    <FileUploader acceptedFileTypes={['image/*', 'application/pdf']} maxFiles={1} onFileUpload={(file) => setFileToUpload(file)} />
                </div>

                <div className="mt-4">
                    <Label htmlFor="probable_cause" className="form-label">{t('reproduction.form.abortion.probableCause', { defaultValue: 'Causa probable' })}</Label>
                    <Input
                        type="text"
                        id="probable_cause"
                        name="probable_cause"
                        value={formik.values.probable_cause}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.probable_cause && !!formik.errors.probable_cause}
                    />
                    {formik.touched.probable_cause && formik.errors.probable_cause && (
                        <FormFeedback>{formik.errors.probable_cause}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-2 mt-4">
                    <div className="w-50">
                        <Label htmlFor="date" className="form-label">{t('reproduction.form.abortion.dateLoss', { defaultValue: 'Fecha de perdida' })}</Label>
                        <DatePicker
                            id="date"
                            className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                            value={formik.values.date ?? undefined}
                            onChange={(date: Date[]) => {
                                if (date[0]) formik.setFieldValue('date', date[0]);
                            }}
                            options={{ dateFormat: 'd/m/Y' }}
                        />
                        {formik.touched.date && formik.errors.date && (
                            <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                        )}
                    </div>

                    <div className="w-50">
                        <Label htmlFor="responsible" className="form-label">{t('reproduction.form.abortion.responsible', { defaultValue: 'Responsable' })}</Label>
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
                    <Label htmlFor="notes" className="form-label">{t('reproduction.form.abortion.notes', { defaultValue: 'Notas' })}</Label>
                    <Input
                        type="text"
                        id="notes"
                        name="notes"
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.notes && !!formik.errors.notes}
                        placeholder={t('reproduction.form.abortion.notesPlaceholder', { defaultValue: 'Ej: Perdida sospechosa' })}
                    />
                    {formik.touched.notes && formik.errors.notes && (
                        <FormFeedback>{formik.errors.notes}</FormFeedback>
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
                                {t('reproduction.form.abortion.register', { defaultValue: 'Registrar' })}
                            </div>
                        )}
                    </Button>
                </div>
            </form>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={t('reproduction.form.abortion.success', { defaultValue: 'Perdida registrada con éxito' })} />
        </>
    );
};

export default AbortionForm;
