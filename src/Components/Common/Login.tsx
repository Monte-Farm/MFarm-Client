import React, { useState } from "react";
import { Button, Form, FormFeedback, Input, Label } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";

interface LoginFormProps {
    onSubmit: (values: { user_number: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
    const [passwordShow, setPasswordShow] = useState<boolean>(false);

    const validation = useFormik({
        initialValues: {
            user_number: "",
            password: "",
        },
        validationSchema: Yup.object({
            user_number: Yup.string().required("Por favor, ingrese su número de usuario"),
            password: Yup.string().required("Por favor, ingrese su contraseña"),
        }),
        onSubmit: async (values, { setSubmitting, setErrors }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                setErrors({user_number:'Nombre de usuario o contraseña incorrectos.' , password: "Nombre de usuario o contraseña incorrectos." });
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <Form
            onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
            }}
        >
            <div className="mb-3">
                <Label htmlFor="user_number" className="form-label">
                    Número de usuario
                </Label>
                <Input
                    type="text"
                    className="form-control"
                    id="user_number"
                    placeholder="Ingrese su número de usuario"
                    name="user_number"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.user_number || ""}
                    invalid={
                        validation.touched.user_number && validation.errors.user_number ? true : false
                    }
                />
                {validation.touched.user_number && validation.errors.user_number && (
                    <FormFeedback type="invalid">{validation.errors.user_number}</FormFeedback>
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
                            validation.touched.password && validation.errors.password ? true : false
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
    );
};

export default LoginForm;
