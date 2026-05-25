import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { PigData } from "common/data_interfaces";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useFormik } from "formik";
import React, { useContext, useState } from "react";
import { Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface AssignEarTagFormProps {
    pig: PigData;
    onSave: () => void;
    onCancel: () => void;
}

const AssignEarTagForm: React.FC<AssignEarTagFormProps> = ({ pig, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (name: keyof typeof modals, state?: boolean) => {
        setModals(prev => ({ ...prev, [name]: state ?? !prev[name] }));
    };

    const isMale = pig.sex === 'male';
    const accentColor = isMale ? '#0d6efd' : '#d63384';
    const accentColorLight = isMale ? '#e6f0ff' : '#fde8f2';

    const validationSchema = Yup.object({
        earTag: Yup.string().required(t('replacement.earTag.required')),
    });

    const formik = useFormik({
        initialValues: { earTag: pig.earTag ?? '' },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return;
            try {
                setSubmitting(true);
                await configContext.axiosHelper.update(
                    `${configContext.apiUrl}/pig/update/${pig._id}/${userLogged._id}`,
                    { earTag: values.earTag }
                );
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                    { event: `Arete ${values.earTag} asignado al cerdo ${pig.code}` }
                );
                toggleModal('success');
            } catch (error) {
                logger.error('Error assigning ear tag:', { error });
                toggleModal('error');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const formattedBirthdate = pig.birthdate
        ? new Date(pig.birthdate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

                {/* Tarjeta de información del cerdo */}
                <div
                    className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
                    style={{ background: accentColorLight, border: `1.5px solid ${accentColor}22` }}
                >
                    {/* Avatar */}
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 64, height: 64, background: accentColor + '22' }}
                    >
                        <i
                            className={`ri-${isMale ? 'men-line' : 'women-line'} fs-2`}
                            style={{ color: accentColor }}
                        />
                    </div>

                    {/* Datos */}
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-bold text-dark fs-6">{pig.code}</span>
                            <span
                                className="badge rounded-pill px-2 py-1"
                                style={{ background: accentColor, fontSize: '0.7rem' }}
                            >
                                {isMale ? `♂ ${t('common.sex.male')}` : `♀ ${t('common.sex.female')}`}
                            </span>
                        </div>

                        <div className="d-flex flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-1 text-muted small">
                                <i className="ri-seedling-line" style={{ color: accentColor }} />
                                <span>{t('pigs.field.breed')}:</span>
                                <span className="fw-semibold text-dark">{pig.breed || '—'}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1 text-muted small">
                                <i className="ri-calendar-line" style={{ color: accentColor }} />
                                <span>{t('pigs.field.birthDate')}:</span>
                                <span className="fw-semibold text-dark">{formattedBirthdate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campo de arete */}
                <div className="mb-1">
                    <Label htmlFor="earTag" className="fw-semibold">
                        <i className="ri-price-tag-3-line me-1" style={{ color: accentColor }} />
                        {t('pigs.field.earTag')}
                    </Label>
                    <Input
                        type="text"
                        id="earTag"
                        name="earTag"
                        value={formik.values.earTag}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t('pigs.field.earTagPlaceholder')}
                        invalid={formik.touched.earTag && !!formik.errors.earTag}
                        autoFocus
                    />
                    {formik.touched.earTag && formik.errors.earTag && (
                        <FormFeedback>{formik.errors.earTag as string}</FormFeedback>
                    )}
                </div>

                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <Button type="button" className="farm-secondary-button" onClick={onCancel}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button type="submit" className="farm-primary-button" disabled={formik.isSubmitting}>
                        {formik.isSubmitting
                            ? <Spinner size="sm" />
                            : <><i className="ri-price-tag-3-line me-2" />{t('replacement.earTag.assign')}</>
                        }
                    </Button>
                </div>
            </form>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('replacement.earTag.success')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('replacement.earTag.error')} />
        </>
    );
};

export default AssignEarTagForm;
