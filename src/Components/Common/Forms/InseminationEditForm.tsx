import { logger } from 'utils/logger';
import { Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "App";
import DatePicker from "react-flatpickr";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useTranslation } from "react-i18next";

interface InseminationEditFormProps {
    inseminationData: any;
    onSave: () => void;
    onCancel: () => void;
}

const InseminationEditForm = ({ inseminationData, onSave, onCancel }: InseminationEditFormProps) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const [users, setUsers] = useState<any[]>([]);
    const [successOpen, setSuccessOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const validationSchema = Yup.object({
        date: Yup.date().required(t('insemination.edit.validation.date')),
        responsible: Yup.string().required(t('insemination.edit.validation.responsible')),
    });

    const formik = useFormik({
        initialValues: {
            date: inseminationData.date ? new Date(inseminationData.date) : null,
            responsible: inseminationData.responsible?._id ?? inseminationData.responsible ?? '',
            notes: inseminationData.notes ?? '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                await configContext.axiosHelper.update(
                    `${configContext.apiUrl}/insemination/update/${inseminationData._id}`,
                    {
                        date: values.date,
                        responsible: values.responsible,
                        notes: values.notes,
                    }
                );
                setSuccessOpen(true);
            } catch (error: any) {
                logger.error('Error updating insemination:', error);
                const serverMessage = error?.response?.data?.message;
                if (serverMessage) {
                    setErrorMessage(serverMessage);
                } else {
                    setErrorMessage(t('insemination.edit.error'));
                }
                setErrorOpen(true);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fetchUsers = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user`);
            setUsers(response.data.data ?? response.data ?? []);
        } catch (error) {
            logger.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <>
            <form onSubmit={formik.handleSubmit}>
                <div className="d-flex gap-3 mt-2">
                    <div className="flex-fill">
                        <Label htmlFor="edit-date" className="form-label">
                            {t('insemination.edit.field.date')}
                        </Label>
                        <DatePicker
                            id="edit-date"
                            className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                            value={formik.values.date ?? undefined}
                            onChange={(dates: Date[]) => {
                                if (dates[0]) formik.setFieldValue('date', dates[0]);
                            }}
                            options={{ dateFormat: 'd/m/Y' }}
                        />
                        {formik.touched.date && formik.errors.date && (
                            <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                        )}
                    </div>

                    <div className="flex-fill">
                        <Label htmlFor="edit-responsible" className="form-label">
                            {t('insemination.edit.field.responsible')}
                        </Label>
                        <Input
                            type="select"
                            id="edit-responsible"
                            name="responsible"
                            value={formik.values.responsible}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.responsible && !!formik.errors.responsible}
                        >
                            <option value="">{t('common.select.placeholder', { defaultValue: '— Seleccionar —' })}</option>
                            {users.map((user: any) => (
                                <option key={user._id} value={user._id}>
                                    {user.name} {user.lastname}
                                </option>
                            ))}
                        </Input>
                        {formik.touched.responsible && formik.errors.responsible && (
                            <FormFeedback>{formik.errors.responsible as string}</FormFeedback>
                        )}
                    </div>
                </div>

                <div className="mt-3">
                    <Label htmlFor="edit-notes" className="form-label">
                        {t('insemination.edit.field.notes')}
                    </Label>
                    <Input
                        type="textarea"
                        id="edit-notes"
                        name="notes"
                        rows={3}
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t('insemination.edit.field.notesPlaceholder', { defaultValue: 'Observaciones adicionales...' })}
                    />
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                    <Button color="light" type="button" onClick={onCancel} disabled={formik.isSubmitting}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button color="primary" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting
                            ? <Spinner size="sm" className="me-2" />
                            : <i className="ri-save-line me-2" />
                        }
                        {t('common.button.save')}
                    </Button>
                </div>
            </form>

            <SuccessModal
                isOpen={successOpen}
                onClose={onSave}
                message={t('insemination.edit.success')}
            />
            <ErrorModal
                isOpen={errorOpen}
                onClose={() => setErrorOpen(false)}
                message={errorMessage}
            />
        </>
    );
};

export default InseminationEditForm;
