import { logger } from 'utils/logger';
import React, { useState } from "react";
import { Button, Form, FormFeedback, Input, Label } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";

const REMEMBER_KEY = "login_remember";

interface LoginFormProps {
    onSubmit: (values: { username: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const [passwordShow, setPasswordShow] = useState<boolean>(false);
    const [showErrorAlert, setShowErrorAlert] = useState<boolean>(false);

    const saved = (() => {
        try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null"); } catch { return null; }
    })();

    const [rememberMe, setRememberMe] = useState<boolean>(!!saved);

    const validation = useFormik({
        initialValues: {
            username: saved?.username ?? "",
            password: saved?.password ?? "",
        },
        validationSchema: Yup.object({
            username: Yup.string().required(t("auth.login.validation.username")),
            password: Yup.string().required(t("auth.login.validation.password")),
        }),
        onSubmit: async (values, { setSubmitting, setErrors }) => {
            try {
                setSubmitting(true);
                if (rememberMe) {
                    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username: values.username, password: values.password }));
                } else {
                    localStorage.removeItem(REMEMBER_KEY);
                }
                await onSubmit(values);
            } catch (error: any) {
                logger.error("Error al iniciar sesión:", error);
                if ((error && error.status === 401) || (error && error.status === 404)) {
                    setErrors({
                        username: t("auth.login.invalidCredentials"),
                        password: t("auth.login.invalidCredentials"),
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
                    <Label htmlFor="username" className="form-label fs-5">
                        {t("auth.login.field.username")}
                    </Label>
                    <Input
                        type="text"
                        className="form-control"
                        id="username"
                        placeholder={t("auth.login.field.usernamePlaceholder")}
                        name="username"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.username || ""}
                        invalid={
                            validation.touched.username && validation.errors.username
                                ? true
                                : false
                        }
                        disabled={validation.isSubmitting}
                    />
                    {validation.touched.username && validation.errors.username && (
                        <FormFeedback type="invalid">{validation.errors.username as string}</FormFeedback>
                    )}
                </div>

                <div className="mb-3">
                    <Label className="form-label fs-5" htmlFor="password-input">
                        {t("auth.login.field.password")}
                    </Label>
                    <div className="position-relative auth-pass-inputgroup mb-3">
                        <Input
                            type={passwordShow ? "text" : "password"}
                            className="form-control pe-5 password-input"
                            placeholder={t("auth.login.field.passwordPlaceholder")}
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
                            disabled={validation.isSubmitting}
                        />
                        {validation.touched.password && validation.errors.password && (
                            <FormFeedback type="invalid">{validation.errors.password as string}</FormFeedback>
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

                <div className="mb-3 form-check">
                    <Input
                        type="checkbox"
                        className="form-check-input"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={validation.isSubmitting}
                    />
                    <Label className="form-check-label" htmlFor="remember-me">
                        {t("auth.login.rememberMe")}
                    </Label>
                </div>

                <div className="mt-4">
                    <Button
                        className="w-100 farm-secondary-button"
                        type="submit"
                        disabled={validation.isSubmitting}
                    >
                        {validation.isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
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
                    <span>{t("auth.login.serviceUnavailable")}</span>
                </div>
            )}
        </>
    );
};

export default LoginForm;
