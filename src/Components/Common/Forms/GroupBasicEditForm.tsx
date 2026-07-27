import { ConfigContext } from "App";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import React, { useContext, useMemo, useState } from "react";
import DatePicker from "react-flatpickr";
import { useTranslation } from "react-i18next";
import { Button, Col, Form, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import * as Yup from "yup";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { logger } from "utils/logger";
import { preventEnterSubmit } from "utils/formUtils";

interface GroupBasicData {
    _id?: string;
    code?: string;
    name?: string;
    creationDate?: string | Date | null;
    birthdate?: string | Date | null;
    observations?: string;
}

interface GroupBasicEditFormProps {
    group: GroupBasicData;
    onSave: () => void;
    onCancel: () => void;
}

interface FormValues {
    code: string;
    name: string;
    creationDate: Date | null;
    birthdate: Date | null;
    observations: string;
}

const parseDateOnly = (value?: string | Date | null): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return year && month && day ? new Date(year, month - 1, day) : null;
};

const formatDateForApi = (value: Date | null): string => {
    if (!value) return "";
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00.000Z`;
};

const GroupBasicEditForm: React.FC<GroupBasicEditFormProps> = ({ group, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [modals, setModals] = useState({ success: false, error: false, cancel: false });
    const [errorMessage, setErrorMessage] = useState("");

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const initialValues = useMemo<FormValues>(() => ({
        code: group.code ?? "",
        name: group.name ?? "",
        creationDate: parseDateOnly(group.creationDate),
        birthdate: parseDateOnly(group.birthdate),
        observations: group.observations ?? "",
    }), [group]);

    const formik = useFormik<FormValues>({
        initialValues,
        enableReinitialize: true,
        validationSchema: Yup.object({
            code: Yup.string().trim().required(t("groups.validation.codeRequired")),
            name: Yup.string().trim().required(t("groups.validation.nameRequired")),
            observations: Yup.string().max(500, t("groups.validation.observationsMax")),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged || !group._id) {
                setSubmitting(false);
                return;
            }

            const payload = Object.entries(values).reduce<Record<string, string>>((changes, [key, value]) => {
                const normalizedValue = value instanceof Date || value === null ? formatDateForApi(value) : value;
                const initialValue = initialValues[key as keyof FormValues];
                const normalizedInitialValue = initialValue instanceof Date || initialValue === null ? formatDateForApi(initialValue) : initialValue;
                if (normalizedValue !== normalizedInitialValue) changes[key] = normalizedValue;
                return changes;
            }, {});

            if (Object.keys(payload).length === 0) {
                onCancel();
                return;
            }

            try {
                await configContext.axiosHelper.update(
                    `${configContext.apiUrl}/group/update/${group._id}/${userLogged._id}`,
                    payload
                );
                toggleModal("success");
            } catch (error: any) {
                logger.error("Error updating group basic data:", { error });
                setErrorMessage(error?.response?.data?.message ?? t("groups.form.edit.error", { defaultValue: "No fue posible actualizar el grupo. Inténtalo de nuevo." }));
                toggleModal("error");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <>
            <Form onSubmit={formik.handleSubmit} onKeyDown={preventEnterSubmit}>
                <div className="farm-form-section mb-4">
                    <div className="farm-form-section-header mb-3">
                        <i className="ri-group-line me-2 text-primary" />
                        <span className="fw-semibold fs-6">{t("groups.form.edit.section", { defaultValue: "Datos básicos del grupo" })}</span>
                    </div>
                <Row className="g-3 align-items-start">
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label for="group-code" className="form-label text-muted small">{t("groups.column.code")}</Label>
                            <Input id="group-code" name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={!!(formik.touched.code && formik.errors.code)} />
                            {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label for="group-name" className="form-label text-muted small">{t("groups.column.name")}</Label>
                            <Input id="group-name" name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={!!(formik.touched.name && formik.errors.name)} />
                            {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label for="group-creation-date" className="form-label text-muted small">{t("groups.column.creationDate")}</Label>
                            <DatePicker
                                id="group-creation-date"
                                className="form-control"
                                value={formik.values.creationDate ?? undefined}
                                onChange={(dates: Date[]) => formik.setFieldValue("creationDate", dates[0] ?? null)}
                                options={{ dateFormat: "d/m/Y", allowInput: true }}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label for="group-birthdate" className="form-label text-muted small">{t("groups.column.birthDate")}</Label>
                            <DatePicker
                                id="group-birthdate"
                                className="form-control"
                                value={formik.values.birthdate ?? undefined}
                                onChange={(dates: Date[]) => formik.setFieldValue("birthdate", dates[0] ?? null)}
                                options={{ dateFormat: "d/m/Y", allowInput: true }}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={12}>
                        <FormGroup className="mb-0">
                            <Label for="group-observations" className="form-label text-muted small">{t("groups.column.observations")}</Label>
                            <Input id="group-observations" name="observations" type="textarea" rows="4" value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={!!(formik.touched.observations && formik.errors.observations)} />
                            {formik.touched.observations && formik.errors.observations && <FormFeedback>{formik.errors.observations}</FormFeedback>}
                        </FormGroup>
                    </Col>
                </Row>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button type="button" className="farm-secondary-button" onClick={() => toggleModal("cancel")} disabled={formik.isSubmitting}>{t("common.button.cancel")}</Button>
                    <Button type="submit" className="farm-primary-button" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner size="sm" /> : <><i className="ri-save-line me-2" />{t("common.button.save")}</>}
                    </Button>
                </div>
            </Form>

            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal("cancel")}>
                <ModalHeader toggle={() => toggleModal("cancel")}>{t("groups.form.edit.cancelTitle", { defaultValue: "Cancelar edición" })}</ModalHeader>
                <ModalBody>{t("groups.form.edit.cancelMessage", { defaultValue: "¿Estás seguro de que deseas cancelar? Los cambios no se guardarán." })}</ModalBody>
                <ModalFooter>
                    <Button className="btn-cancel" onClick={onCancel}>{t("common.yes")}, {t("common.button.cancel").toLowerCase()}</Button>
                    <Button color="success" onClick={() => toggleModal("cancel", false)}>{t("common.no")}</Button>
                </ModalFooter>
            </Modal>
            <SuccessModal isOpen={modals.success} onClose={onSave} message={t("groups.form.edit.success", { defaultValue: "Grupo actualizado con éxito" })} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal("error", false)} message={errorMessage} />
        </>
    );
};

export default GroupBasicEditForm;
