import React, { useState } from "react";
import { Button, Form, FormFeedback, Input, Label } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";

interface LoginFormProps {
    onSubmit: (values: { username: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
    const [passwordShow, setPasswordShow] = useState<boolean>(false);
    const [showErrorAlert, setShowErrorAlert] = useState<boolean>(false);

    const validation = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema: Yup.object({
            username: Yup.string().required("Por favor, ingrese su número de usuario"),
            password: Yup.string().required("Por favor, ingrese su contraseña"),
        }),
        onSubmit: async (values, { setSubmitting, setErrors }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error: any) {
                console.error("Error al iniciar sesión:", error);
                if ((error && error.status === 401) || (error && error.status === 404)) {
                    setErrors({
                        username: "Nombre de usuario o contraseña incorrectos.",
                        password: "Nombre de usuario o contraseña incorrectos.",
                    });
                } else {
                    setShowErrorAlert(true);
                    setTimeout(() => setShowErrorAlert(false), 5000);
                }
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <>
            <Form
                onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                }}
            >
                <div className="mb-3">
                    <Label htmlFor="username" className="form-label">
                        Número de usuario
                    </Label>
                    <Input
                        type="text"
                        className="form-control"
                        id="username"
                        placeholder="Ingrese su número de usuario"
                        name="username"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.username || ""}
                        invalid={
                            validation.touched.username && validation.errors.username
                                ? true
                                : false
                        }
                    />
                    {validation.touched.username && validation.errors.username && (
                        <FormFeedback type="invalid">{validation.errors.username}</FormFeedback>
                    )}
                </div>

                <div className="mb-3">
                    <Label className="form-label" htmlFor="password-input">
                        Contraseña
                    </Label>
                    <div className="position-relative auth-pass-inputgroup mb-3">
                        <Input
                            type={passwordShow ? "text" : "password"}
                            className="form-control pe-5 password-input"
                            placeholder="Ingrese su contraseña"
                            id="password-input"
                            name="password"
                            value={validation.values.password || ""}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                                validation.touched.password && validation.errors.password
                                    ? true
                                    : false
                            }
                        />
                        {validation.touched.password && validation.errors.password && (
                            <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                        )}
                        <button
                            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                            type="button"
                            id="password-addon"
                            onClick={() => setPasswordShow(!passwordShow)}
                        >
                            <i className="ri-eye-fill align-middle"></i>
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <Button
                        color="success"
                        className="w-100"
                        type="submit"
                        disabled={validation.isSubmitting}
                    >
                        {validation.isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                </div>
            </Form>

            {showErrorAlert && (
                <div
                    className="position-fixed bottom-0 start-50 translate-middle-x bg-danger text-white text-center p-3 rounded"
                    style={{
                        zIndex: 1050,
                        width: "90%",
                        maxWidth: "500px",
                    }}
                >
                    <span>El servicio no está disponible. Inténtelo de nuevo más tarde.</span>
                </div>
            )}
        </>
    );
};

export default LoginForm;
