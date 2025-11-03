import React, { useContext, useState } from "react";
import { Alert, Card, Col, Container, Row } from "reactstrap";
import loginImage from "../../assets/images/portada.png";
import LoginForm from "../../Components/Common/Velzon/Login";
import axios, { AxiosError, AxiosResponse } from "axios";
import { getLoggedinUser } from "helpers/api_helper";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "App";
import Aurora from "Components/Common/Velzon/Aurora";
import LogoSystem from '../../assets/images/logo.png'
import systemLogo from '../../assets/images/system-logo.png'
import loginBanner from '../../assets/images/login_banner.png'

const CoverSignIn = () => {
    document.title = "Inicio de sesión | MFarm";
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [showDisabledAlert, setShowDisabledAlert] = useState<boolean>(false);

    const handleLogin = async (values: { username: string; password: string }) => {
        try {
            setShowDisabledAlert(false)

            const response = await axios.post(`${configContext?.apiUrl}/user/login`, values);
            const user = response.data.data
            if (!user.status) {
                setShowDisabledAlert(true)
                return
            }

            sessionStorage.setItem('authUser', JSON.stringify(user));
            configContext?.setUserLogged(getLoggedinUser());
            history('/home');
        } catch (error: any) {
            console.error(error.response);
            throw error;
        }
    };

    return (
        <React.Fragment>
            <style>
                {`
                    html, body {
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        height: 100%;
                    }
                `}
            </style>

            <div className="auth-page-wrapper d-flex justify-content-center align-items-center min-vh-100 position-relative">
                {/* Aurora como fondo sin scroll */}
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ overflow: "hidden" }}>
                    <Aurora colorStops={["#2F4F4F", "#8B4513", "#F5F5DC"]} speed={0.5} />
                </div>

                {/* Contenido */}
                <div className="auth-page-content overflow-hidden pt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <Card className="overflow-hidden" style={{ borderRadius: '10px' }}>
                                    <Row className="g-0">
                                        <Col lg={8}>
                                            <img src={loginBanner} className="img-fluid h-100" alt="Login Cover" />
                                        </Col>
                                        <Col lg={4} style={{ backgroundColor: '#F5F5DC' }}>
                                            <div className="p-lg-5">
                                                <div className="d-flex justify-content-center pb-0 mt-0">
                                                    <img
                                                        src={systemLogo}
                                                        style={{ maxWidth: '300px', maxHeight: '300px', width: '220px', height: '200px' }}
                                                        alt="Logo"
                                                    />
                                                </div>
                                                <h4 className="text-center" style={{ color: '#2F4F4F' }}>Bienvenido!</h4>
                                                <p className="text-muted text-center fs-5">Inicie Sesión para continuar.</p>

                                                <div className="mt-5">
                                                    <LoginForm onSubmit={handleLogin} />
                                                </div>
                                            </div>

                                            {showDisabledAlert && (
                                                <Alert color="danger" className="text-center mx-3 rounded">
                                                    Este usuario ha sido desactivado, pongase en contacto con el administrador
                                                </Alert>
                                            )}
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CoverSignIn;
