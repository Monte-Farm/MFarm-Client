import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import React, { useContext, useState } from "react";
import {
    Button,
    Input,
    Label,
    FormFeedback,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import FileUploader from "../Shared/FileUploader";
import { userRoles } from "common/user_roles";
import { useTranslation } from "react-i18next";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface UserFormProps {
    initialData?: UserData;
    onSave: () => void;
    onCancel: () => void;
    isUsernameDisable?: boolean;
    defaultRole?: string;
    currentUserRole: string | string[];
}

const UserForm: React.FC<UserFormProps> = ({
    initialData,
    onSave,
    onCancel,
    isUsernameDisable,
    defaultRole,
    currentUserRole,
}) => {
    const { t } = useTranslation();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false, error: false, cancel: false });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const hasRole = (r: string) =>
        Array.isArray(currentUserRole) ? currentUserRole.includes(r) : currentUserRole === r;

    const filteredRoles = defaultRole
        ? userRoles.filter((r) => r.value === defaultRole)
        : userRoles.filter((role) => {
            if (hasRole("Superadmin")) return true;
            if (hasRole("farm_manager")) {
                return role.value !== "Superadmin" && role.value !== "farm_manager";
            }
            return role.value !== "Superadmin" && role.value !== "farm_manager" && role.value !== "finance_manager";
        });

    const validationSchema = Yup.object({
        name: Yup.string().required(t("users.form.validation.nameRequired")),
        lastname: Yup.string().required(t("users.form.validation.lastnameRequired")),
        email: Yup.string()
            .email(t("users.form.validation.emailInvalid"))
            .required(t("users.form.validation.emailRequired")),
        role: Yup.array()
            .of(Yup.string())
            .min(1, t("users.form.validation.roleRequired")),
    });

    const formik = useFormik({
        initialValues: {
            profile_image: initialData?.profile_image || "",
            name: initialData?.name || "",
            lastname: initialData?.lastname || "",
            farm_assigned: initialData?.farm_assigned || userLogged.farm_assigned,
            email: initialData?.email || "",
            role: initialData?.role || (defaultRole ? [defaultRole] : []),
            assigment: initialData?.assigment || null,
            status: initialData?.status ?? true,
            history: initialData?.history || [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                if (!configContext) return;
                setSubmitting(true);

                if (fileToUpload) {
                    await fileUpload(fileToUpload);
                }

                if (initialData) {
                    await configContext.axiosHelper.put(`${configContext.apiUrl}/user/update_user/${initialData.username}`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Actualización de usuario de ${values.name} ${values.lastname}`,
                    });
                } else {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/create_user`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Registro de usuario de ${values.name} ${values.lastname}`,
                    });
                }
                toggleModal("success");
            } catch (error) {
                logger.error("Error al enviar el formulario:", error);
                toggleModal("error");
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fileUpload = async (file: File) => {
        if (!configContext) return;
        const uploadResponse = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/upload/upload_file/`, file);
        formik.values.profile_image = uploadResponse.data.data;
    };

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
                <div className="mt-4">
                    <Label htmlFor="imageInput" className="form-label">
                        {t("users.form.field.image")}
                    </Label>
                    <FileUploader
                        acceptedFileTypes={["image/*"]}
                        maxFiles={1}
                        onFileUpload={(file) => setFileToUpload(file)}
                    />
                </div>

                <div className="d-flex gap-3">
                    <div className="mt-4 w-50">
                        <Label className="form-label">{t("users.form.field.name")}</Label>
                        <Input
                            type="text"
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.name && !!formik.errors.name}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <FormFeedback>{formik.errors.name}</FormFeedback>
                        )}
                    </div>

                    <div className="mt-4 w-50">
                        <Label className="form-label">{t("users.form.field.lastname")}</Label>
                        <Input
                            type="text"
                            name="lastname"
                            value={formik.values.lastname}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.lastname && !!formik.errors.lastname}
                        />
                        {formik.touched.lastname && formik.errors.lastname && (
                            <FormFeedback>{formik.errors.lastname}</FormFeedback>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <Label className="form-label">{t("users.form.field.email")}</Label>
                    <Input
                        type="email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.email && !!formik.errors.email}
                    />
                    {formik.touched.email && formik.errors.email && (
                        <FormFeedback>{formik.errors.email}</FormFeedback>
                    )}
                </div>

                <div className="mt-4">
                    <Label className="form-label fw-bold">{t("users.form.field.roles")}</Label>
                    <div className="role-selector-container d-flex flex-wrap gap-3">
                        {filteredRoles.map((role) => {
                            const checked = formik.values.role.includes(role.value);
                            return (
                                <label key={role.value} className={`role-card ${checked ? "selected" : ""}`}>
                                    <input
                                        type="checkbox"
                                        value={role.value}
                                        checked={checked}
                                        disabled={!!defaultRole}
                                        onChange={(e) => {
                                            if (defaultRole) return;
                                            const value = e.target.value;
                                            const isChecked = e.target.checked;
                                            formik.setFieldValue(
                                                "role",
                                                isChecked
                                                    ? [...formik.values.role, value]
                                                    : formik.values.role.filter((r) => r !== value)
                                            );
                                        }}
                                    />
                                    <i className="ri-checkbox-circle-fill role-check-icon"></i>
                                    <span>{t(`roles.${role.value}`, { defaultValue: role.label })}</span>
                                </label>
                            );
                        })}
                    </div>
                    {formik.touched.role && formik.errors.role && (
                        <FormFeedback className="d-block mt-2">{formik.errors.role}</FormFeedback>
                    )}
                </div>

                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button
                        className="farm-secondary-button"
                        onClick={() => toggleModal("cancel", true)}
                        disabled={formik.isSubmitting}
                    >
                        {t("users.form.button.cancel")}
                    </Button>
                    <Button
                        className="farm-primary-button"
                        type="submit"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting
                            ? t("users.form.button.saving")
                            : initialData
                                ? t("users.form.button.update")
                                : t("users.form.button.register")}
                    </Button>
                </div>
            </form>

            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal("cancel", false)}>
                <ModalHeader toggle={() => toggleModal("cancel", false)}>
                    {t("users.form.cancelModal.title")}
                </ModalHeader>
                <ModalBody>
                    {t("users.form.cancelModal.body")}
                </ModalBody>
                <ModalFooter>
                    <Button className="btn-cancel" onClick={onCancel}>
                        {t("users.form.button.yesCancel")}
                    </Button>
                    <Button color="success" onClick={() => toggleModal("cancel", false)}>
                        {t("users.form.button.noCancel")}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
            <SuccessModal
                isOpen={modals.success}
                onClose={() => onSave()}
                message={initialData ? t("users.form.success.updated") : t("users.form.success.created")}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal("error")}
                message={t("users.form.error.save")}
            />
        </>
    );
};

export default UserForm;
