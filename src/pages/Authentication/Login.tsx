import React, { useContext } from "react";
import { Card, Col, Container, Row } from "reactstrap";
import loginImage from "../../assets/images/portada.png";
import LoginForm from "../../Components/Common/Login";
import axios, { AxiosError, AxiosResponse } from "axios";
import { getLoggedinUser } from "helpers/api_helper";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "App";
import Aurora from "Components/Common/Aurora";
import LogoSystem from '../../assets/images/logo.png'

const CoverSignIn = () => {
    document.title = "Inicio de sesión | MFarm";
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const handleLogin = async (values: { username: string; password: string }) => {
        try {
            const response = await axios.post(`${configContext?.apiUrl}/user/login`, values);
            sessionStorage.setItem('authUser', JSON.stringify(response.data.data));
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
                                        <Col lg={6}>
                                            <img src={loginImage} className="img-fluid h-100" alt="Login Cover" />
                                        </Col>
                                        <Col lg={6} style={{ backgroundColor: '#F5F5DC' }}>
                                            <div className="p-lg-5">
                                                <div className="d-flex justify-content-center pb-5 pt-3">
                                                    <img
                                                        src={LogoSystem}
                                                        style={{ maxWidth: '250px', maxHeight: '150px', width: '150px', height: '150px' }}
                                                        alt="Logo"
                                                    />
                                                </div>
                                                <h4 className="text-center" style={{ color: '#2F4F4F' }}>Bienvenido!</h4>
                                                <p className="text-muted text-center fs-5">Inicie Sesión para continuar.</p>

                                                <div className="mt-4">
                                                    <LoginForm onSubmit={handleLogin} />
                                                </div>
                                            </div>
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
