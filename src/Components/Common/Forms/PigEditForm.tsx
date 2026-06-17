import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import React, { useContext, useState } from "react";
import DatePicker from "react-flatpickr";
import { Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import * as Yup from "yup";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useTranslation } from "react-i18next";

interface PigEditFormProps {
    pigData: PigData;
    onSave: () => void;
    onCancel: () => void;
}

const PigEditForm: React.FC<PigEditFormProps> = ({ pigData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false, error: false, cancel: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const validationSchema = Yup.object({
        code: Yup.string().required(t('pigs.field.code')),
        birthdate: Yup.date().max(new Date()).required(t('pigs.field.birthDate')),
        breed: Yup.string().required(t('pigs.field.breed')),
        origin: Yup.mixed<'born' | 'purchased' | 'donated' | 'other'>().oneOf(["born", "purchased", "donated", "other"]).required(t('pigs.field.origin')),
        originDetail: Yup.string().when("origin", { is: "other", then: (schema) => schema.required(t('pigs.field.originDetail')), otherwise: (schema) => schema.notRequired() }),
        arrivalDate: Yup.date().when("origin", { is: (val: string) => val !== "born", then: (schema) => schema.max(new Date()).required(t('pigs.field.arrivalDate')), otherwise: (schema) => schema.notRequired() }),
        sourceFarm: Yup.string().when("origin", { is: (val: string) => val === "purchased" || val === "donated", then: (schema) => schema.required(t('pigs.field.originFarm')), otherwise: (schema) => schema.notRequired() }),
        observations: Yup.string().notRequired(),
    });

    const formik = useFormik<PigData>({
        initialValues: pigData,
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
                if (!configContext || !userLogged) return;
                const response = await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update/${values._id}/${userLogged._id}`, values);
                if (response.status === HttpStatusCode.Ok) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, { event: `Edición de cerdo ${values.code}` });
                    toggleModal('success');
                }
            } catch (error) {
                logger.error('Error saving data: ', { error });
                setAlertConfig({ visible: true, color: 'danger', message: t('form.pig.error.update') });
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
                <div className="mt-4">
                    <Label htmlFor="code">{t('pigs.field.code')}</Label>
                    <Input type="text" id="code" name="code" value={formik.values.code} disabled />
                </div>

                <div className="d-flex gap-3">
                    <div className="mt-4 w-50">
                        <Label htmlFor="birthdate">{t('pigs.field.birthDate')}</Label>
                        <DatePicker
                            id="birthdate"
                            className={`form-control ${formik.touched.birthdate && formik.errors.birthdate ? "is-invalid" : ""}`}
                            value={formik.values.birthdate ?? undefined}
                            onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue("birthdate", date[0]); }}
                            options={{ dateFormat: "d/m/Y" }}
                        />
                        {formik.touched.birthdate && formik.errors.birthdate && <FormFeedback className="d-block">{formik.errors.birthdate as string}</FormFeedback>}
                    </div>
                    <div className="mt-4 w-50">
                        <Label htmlFor="breed">{t('pigs.field.breed')}</Label>
                        <Input type="select" id="breed" name="breed" value={formik.values.breed} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.breed && !!formik.errors.breed}>
                            <option value="">{t('form.pig.placeholder.selectBreed')}</option>
                            {["Yorkshire", "Landrace", "Duroc", "Hampshire", "Pietrain", "Berkshire", "Large White", "Chester White", "Poland China", "Tamworth"].map(b => <option key={b} value={b}>{b}</option>)}
                        </Input>
                        {formik.touched.breed && formik.errors.breed && <FormFeedback>{formik.errors.breed}</FormFeedback>}
                    </div>
                </div>

                <div className="mt-4">
                    <Label htmlFor="origin">{t('pigs.field.origin')}</Label>
                    <Input type="select" id="origin" name="origin" value={formik.values.origin} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.origin && !!formik.errors.origin}>
                        <option value="born">{t('pigs.origin.born')}</option>
                        <option value="purchased">{t('pigs.origin.purchased')}</option>
                        <option value="donated">{t('pigs.origin.donated')}</option>
                        <option value="other">{t('pigs.origin.other')}</option>
                    </Input>
                    {formik.touched.origin && formik.errors.origin && <FormFeedback>{formik.errors.origin}</FormFeedback>}
                </div>

                {formik.values.origin === "other" && (
                    <div className="mt-4">
                        <Label htmlFor="originDetail">{t('pigs.field.originDetail')}</Label>
                        <Input type="text" id="originDetail" name="originDetail" value={formik.values.originDetail} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.originDetail && !!formik.errors.originDetail} />
                        {formik.touched.originDetail && formik.errors.originDetail && <FormFeedback>{formik.errors.originDetail as string}</FormFeedback>}
                    </div>
                )}

                {formik.values.origin !== "born" && (
                    <div className="mt-4">
                        <Label htmlFor="arrivalDate">{t('pigs.field.arrivalDate')}</Label>
                        <DatePicker id="arrivalDate" className={`form-control ${formik.touched.arrivalDate && formik.errors.arrivalDate ? "is-invalid" : ""}`} value={formik.values.arrivalDate ?? undefined} onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue("arrivalDate", date[0]); }} options={{ dateFormat: "d/m/Y" }} />
                        {formik.touched.arrivalDate && formik.errors.arrivalDate && <FormFeedback className="d-block">{formik.errors.arrivalDate as string}</FormFeedback>}
                    </div>
                )}

                {(formik.values.origin === "purchased" || formik.values.origin === "donated") && (
                    <div className="mt-4">
                        <Label htmlFor="sourceFarm">{t('pigs.field.originFarm')}</Label>
                        <Input type="text" id="sourceFarm" name="sourceFarm" value={formik.values.sourceFarm} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.sourceFarm && !!formik.errors.sourceFarm} />
                        {formik.touched.sourceFarm && formik.errors.sourceFarm && <FormFeedback>{formik.errors.sourceFarm as string}</FormFeedback>}
                    </div>
                )}

                <div className="mt-4">
                    <Label htmlFor="observations">{t('pigs.field.observations')}</Label>
                    <Input type="textarea" id="observations" name="observations" value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                </div>

                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <Button type="button" className="farm-secondary-button" onClick={() => toggleModal('cancel')}>{t('common.button.cancel')}</Button>
                    <Button type="submit" className="farm-primary-button" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner size="sm" /> : <><i className="ri-check-line me-2" />{t('form.pig.action.register')}</>}
                    </Button>
                </div>
            </form>

            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel')}>
                <ModalHeader>{t('form.pig.action.cancelEdit')}</ModalHeader>
                <ModalBody>{t('form.pig.action.cancelConfirm')}</ModalBody>
                <ModalFooter>
                    <Button className="btn-cancel" onClick={onCancel}>{t('common.yes')}, {t('common.button.cancel').toLowerCase()}</Button>
                    <Button color="success" onClick={() => toggleModal('cancel')}>{t('common.no')}</Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('form.pig.success.updated')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('form.pig.error.update')} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    );
};

export default PigEditForm;
