import React, { useContext, useEffect, useState } from "react";
import { Button, Input, Label, FormFeedback, Modal, ModalHeader, ModalBody, ModalFooter, Alert, } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { SubwarehouseData, UserData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { APIClient } from "helpers/api_helper";

interface UserFormProps {
    initialData?: UserData;
    onSubmit: (data: UserData) => Promise<void>;
    onCancel: () => void;
    isUsernameDisable?: boolean
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel, isUsernameDisable }) => {
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(initialData?.role || null);
    const [subwarehouses, setSubwarehouses] = useState<SubwarehouseData[] | null>(null)
    const configContext = useContext(ConfigContext);

    const validationSchema = Yup.object({
        username: Yup.string().required("Por favor, ingrese el número de usuario"),
        password: Yup.string().required("Por favor, ingrese la contraseña"),
        name: Yup.string().required("Por favor, ingrese el nombre"),
        lastname: Yup.string().required("Por favor, ingrese el apellido"),
        phoneNumber: Yup.string().required("Por favor, ingrese el número de teléfono"),
        email: Yup.string().email("Por favor, ingrese un correo electrónico válido").required("Por favor, ingrese el correo electrónico"),
        role: Yup.string().required("Por favor, seleccione un rol"),
        assigment: selectedRole === "Encargado de subalmacen" ? Yup.string().required("Por favor, seleccione un subalmacen") : Yup.string().nullable(),
    });

    const formik = useFormik({
        initialValues: initialData || {
            username: "",
            password: "",
            name: "",
            lastname: "",
            phoneNumber: "",
            email: "",
            role: "",
            assigment: null,
            status: true,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
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

                {/* Campo Número de Teléfono */}
                <div className="mt-4">
                    <Label htmlFor="phoneNumberInput" className="form-label">Número de Teléfono</Label>
                    <Input
                        type="text"
                        id="phoneNumberInput"
                        className="form-control"
                        name="phoneNumber"
                        value={formik.values.phoneNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.phoneNumber && !!formik.errors.phoneNumber}
                    />
                    {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                        <FormFeedback>{formik.errors.phoneNumber}</FormFeedback>
                    )}
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
                    >
                        <option value="">Seleccione un rol</option>
                        {configContext?.configurationData?.userRoles.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.role && formik.errors.role && (
                        <FormFeedback>{formik.errors.role}</FormFeedback>
                    )}
                </div>

                {/* Campo Asignación, solo si el rol es "Encargado de subalmacen" */}
                {selectedRole === "Encargado de subalmacen" && (
                    <div className="mt-4">
                        <Label htmlFor="assigmentInput" className="form-label">Subalmacen Asignado</Label>
                        <Input
                            type="select"
                            id="assigmentInput"
                            name="assigment"
                            value={formik.values.assigment || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.assigment && !!formik.errors.assigment}
                        >
                            <option value="">Seleccione un subalmacen</option>
                            {subwarehouses?.map((subwarehouse) => (
                                <option key={subwarehouse.id} value={subwarehouse.id}>
                                    {subwarehouse.name}
                                </option>
                            ))}
                        </Input>
                        {formik.touched.assigment && formik.errors.assigment && (
                            <FormFeedback>{formik.errors.assigment}</FormFeedback>
                        )}
                    </div>
                )}


                {/* Botones */}
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button color="danger" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={formik.isSubmitting}>
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
