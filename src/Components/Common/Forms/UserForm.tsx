import React, { useContext, useEffect, useState } from "react";
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
import { getLoggedinUser } from "helpers/api_helper";
import FileUploader from "../Shared/FileUploader";
import { userRoles } from "common/user_roles";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface UserFormProps {
    initialData?: UserData;
    onSave: () => void;
    onCancel: () => void;
    isUsernameDisable?: boolean;
    defaultRole?: string;
    currentUserRole: string;
}

const UserForm: React.FC<UserFormProps> = ({
    initialData,
    onSave,
    onCancel,
    isUsernameDisable,
    defaultRole,
    currentUserRole,
}) => {
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        color: "",
        message: "",
    });
    const [modals, setModals] = useState({
        success: false,
        error: false,
        cancel: false,
    });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const filteredRoles = defaultRole
        ? userRoles.filter((r) => r.value === defaultRole)
        : userRoles.filter((role) => {
            if (currentUserRole === "Superadmin") return true;
            if (currentUserRole === "farm_manager") {
                return (
                    role.value !== "Superadmin" &&
                    role.value !== "farm_manager"
                );
            }
            return (
                role.value !== "Superadmin" &&
                role.value !== "farm_manager"
            );
        });

    const validationSchema = Yup.object({
        name: Yup.string().required("Por favor, ingrese el nombre"),
        lastname: Yup.string().required("Por favor, ingrese el apellido"),
        email: Yup.string()
            .email("Por favor, ingrese un correo electrónico válido")
            .required("Por favor, ingrese el correo electrónico"),
        role: Yup.array()
            .of(Yup.string())
            .min(1, "Por favor, seleccione al menos un rol"),
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
                        event: `Registro de usuario de ${values.name} ${values.lastname}`,
                    });
                } else {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/create_user`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Actualizacion de usuario de ${values.name} ${values.lastname}`,
                    });
                }
                toggleModal("success");
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
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
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                {/* Imagen */}
                <div className="mt-4">
                    <Label htmlFor="imageInput" className="form-label">
                        Imagen del usuario
                    </Label>
                    <FileUploader
                        acceptedFileTypes={["image/*"]}
                        maxFiles={1}
                        onFileUpload={(file) => setFileToUpload(file)}
                    />
                </div>

                {/* Nombre - Apellido */}
                <div className="d-flex gap-3">
                    <div className="mt-4 w-50">
                        <Label className="form-label">Nombre</Label>
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
                        <Label className="form-label">Apellido</Label>
                        <Input
                            type="text"
                            name="lastname"
                            value={formik.values.lastname}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                                formik.touched.lastname &&
                                !!formik.errors.lastname
                            }
                        />
                        {formik.touched.lastname &&
                            formik.errors.lastname && (
                                <FormFeedback>
                                    {formik.errors.lastname}
                                </FormFeedback>
                            )}
                    </div>
                </div>

                {/* Correo */}
                <div className="mt-4">
                    <Label className="form-label">Correo Electrónico</Label>
                    <Input
                        type="email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={
                            formik.touched.email && !!formik.errors.email
                        }
                    />
                    {formik.touched.email && formik.errors.email && (
                        <FormFeedback>{formik.errors.email}</FormFeedback>
                    )}
                </div>

                <div className="mt-4">
                    <Label className="form-label fw-bold">Roles</Label>

                    <div className="role-selector-container d-flex flex-wrap gap-3">
                        {filteredRoles.map((role) => {
                            const checked =
                                formik.values.role.includes(role.value);

                            return (
                                <label
                                    key={role.value}
                                    className={`role-card ${checked ? "selected" : ""
                                        }`}
                                >
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
                                                    ? [
                                                        ...formik.values.role,
                                                        value,
                                                    ]
                                                    : formik.values.role.filter(
                                                        (r) => r !== value
                                                    )
                                            );
                                        }}
                                    />
                                    <span>{role.label}</span>
                                </label>
                            );
                        })}
                    </div>

                    {formik.touched.role && formik.errors.role && (
                        <FormFeedback className="d-block mt-2">
                            {formik.errors.role}
                        </FormFeedback>
                    )}
                </div>

                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button
                        className="farm-secondary-button"
                        onClick={() => toggleModal("cancel", false)}
                        disabled={formik.isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="farm-primary-button"
                        type="submit"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting
                            ? "Guardando..."
                            : initialData
                                ? "Actualizar Usuario"
                                : "Registrar Usuario"}
                    </Button>
                </div>
            </form>

            {/* Modal cancelar */}
            <Modal isOpen={modals.cancel} centeredtoggle={() => toggleModal("cancel", false)}>
                <ModalHeader>Confirmación de Cancelación</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button color="success" onClick={() => toggleModal("cancel", false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={initialData ? "Usuario actualizado con éxito" : "Usuario registrado con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal("error")} message={"Ha ocurrido un error, intentelo mas tarde"} />
        </>
    );
};

export default UserForm;