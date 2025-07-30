import React, { useContext, useEffect, useState } from "react";
import { Button, Input, Label, FormFeedback, Modal, ModalHeader, ModalBody, ModalFooter, Alert, } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { SubwarehouseData, UserData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";

interface UserFormProps {
    initialData?: UserData;
    onSubmit: (data: UserData) => Promise<void>;
    onCancel: () => void;
    isUsernameDisable?: boolean;
    defaultRole?: string;
    currentUserRole: string;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel, isUsernameDisable, defaultRole, currentUserRole }) => {
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(initialData?.role || null);
    const [subwarehouses, setSubwarehouses] = useState<SubwarehouseData[] | null>(null)
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const defaultRoles = [
        { value: "Superadmin", label: "Superadmin" },
        { value: "farm_manager", label: "Gerente de granja" },
        { value: "warehouse_manager", label: "Encargado de almacen" },
        { value: "subwarehouse_manager", label: "Encargado de subalmacen" },
    ];

    const filteredRoles = defaultRoles.filter((role) => {
        if (currentUserRole === "Superadmin") {
            return true;
        }
        if (currentUserRole === "farm_manager") {
            return role.value !== "Superadmin" && role.value !== "farm_manager";
        }
        return role.value !== "Superadmin" && role.value !== "farm_manager";
    });

    const validationSchema = Yup.object({
        username: Yup.string().required("Por favor, ingrese el número de usuario"),
        password: Yup.string().required("Por favor, ingrese la contraseña"),
        name: Yup.string().required("Por favor, ingrese el nombre"),
        lastname: Yup.string().required("Por favor, ingrese el apellido"),
        email: Yup.string()
            .email("Por favor, ingrese un correo electrónico válido")
            .required("Por favor, ingrese el correo electrónico"),
        role: Yup.string().required("Por favor, seleccione un rol"),
    });

    const formik = useFormik({
        initialValues: {
            username: initialData?.username || "",
            password: initialData?.password || "",
            name: initialData?.name || "",
            lastname: initialData?.lastname || "",
            farm_assigned: initialData?.farm_assigned || null,
            email: initialData?.email || "",
            role: initialData?.role || defaultRole || "",
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
                setSubmitting(true);
                if (!initialData) {
                    values.farm_assigned = userLogged?.farm_assigned || null;
                }
                await onSubmit(values);
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleError = (error: any, message: string) => {
        console.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const fetchSubwarehouses = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse`);
            const subwarehouses = response.data.data;
            setSubwarehouses(subwarehouses.filter((obj: any) => obj.id !== 'AG001'));
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los subalmacenes');
        }
    };

    useEffect(() => {
        fetchSubwarehouses();
    }, [])

    return (
        <>
            <form onSubmit={(e) => {
                e.preventDefault();
                formik.handleSubmit();
            }}>

                {/* Campo Número de Usuario */}
                <div className="mt-4">
                    <Label htmlFor="usernameInput" className="form-label">Número de Usuario</Label>
                    <Input
                        type="text"
                        id="usernameInput"
                        className="form-control"
                        name="username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.username && !!formik.errors.username}
                        disabled={isUsernameDisable}
                    />
                    {formik.touched.username && formik.errors.username && (
                        <FormFeedback>{formik.errors.username}</FormFeedback>
                    )}
                </div>

                {/* Campo Contrasena */}
                <div className="mt-4">
                    <Label htmlFor="pwdInput" className="form-label">Contraseña</Label>
                    <Input
                        type="password"
                        id="pwdInput"
                        className="form-control"
                        name="password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.password && !!formik.errors.password}
                        disabled={isUsernameDisable}
                    />
                    {formik.touched.password && formik.errors.password && (
                        <FormFeedback>{formik.errors.password}</FormFeedback>
                    )}
                </div>

                <div className="d-flex gap-3">

                    {/* Campo Nombre */}
                    <div className="mt-4 w-50">
                        <Label htmlFor="nameInput" className="form-label">Nombre</Label>
                        <Input
                            type="text"
                            id="nameInput"
                            className="form-control"
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

                    {/* Campo Apellido */}
                    <div className="mt-4 w-50">
                        <Label htmlFor="lastnameInput" className="form-label">Apellido</Label>
                        <Input
                            type="text"
                            id="lastnameInput"
                            className="form-control"
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

                {/* Campo Correo Electrónico */}
                <div className="mt-4">
                    <Label htmlFor="emailInput" className="form-label">Correo Electrónico</Label>
                    <Input
                        type="email"
                        id="emailInput"
                        className="form-control"
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

                {/* Campo Rol */}
                <div className="mt-4">
                    <Label htmlFor="roleInput" className="form-label">Rol</Label>
                    <Input
                        type="select"
                        id="roleInput"
                        name="role"
                        value={formik.values.role}
                        onChange={(e) => {
                            formik.handleChange(e);
                            setSelectedRole(e.target.value);
                        }}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.role && !!formik.errors.role}
                        disabled={!!defaultRole}
                    >
                        <option value="">Seleccione un rol</option>
                        {filteredRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.role && formik.errors.role && (
                        <FormFeedback>{formik.errors.role}</FormFeedback>
                    )}
                </div>

                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button className="farm-secondary-button" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button className="farm-primary-button" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Usuario" : "Registrar Usuario"}
                    </Button>
                </div>
            </form>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}

            {/* Modal de confirmación de cancelación */}
            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Confirmación de Cancelación</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default UserForm;
