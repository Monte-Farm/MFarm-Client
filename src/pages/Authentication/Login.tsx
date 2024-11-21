import React from "react";
import { Card, Col, Container, Row } from "reactstrap";
import loginImage from "../../assets/images/login_image.jpg";
import LoginForm from "../../Components/Common/Login";
import axios from "axios";
import { getLoggedinUser, setAuthorization } from "helpers/api_helper";
import { useNavigate } from "react-router-dom";
import VelzonLogo from '../../assets/images/logo-dark.png'


const CoverSignIn = () => {
    const apiUrl = process.env.REACT_APP_API_URL_DEVELOP;
    document.title = "Inicio de sesión | MFarm";
    const history = useNavigate()

    const handleLogin = async (values: { user_number: string; password: string }) => {
        try {
            const response = await axios.post(`${apiUrl}/user/login`, values);
            sessionStorage.setItem('authUser', JSON.stringify(response.data))
            history('/home')

        } catch (error) {
            console.error("Error en la petición de inicio de sesión:", error);
            throw error;
        }
    };

    return (
        <React.Fragment>
            <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
                <div className="bg-overlay"></div>
                <div className="auth-page-content overflow-hidden pt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <Card className="overflow-hidden">
                                    <Row className="g-0">
                                        <Col lg={6}>
                                            <img src={loginImage} className="img-fluid h-100" alt="Login Cover" />
                                        </Col>
                                        <Col lg={6}>
                                            <div className="p-lg-5">
                                                <div>
                                                    <div className="d-flex justify-content-center pb-5 pt-3">
                                                        <img src={VelzonLogo} className="" alt="" />
                                                    </div>
                                                    <h5 className="text-primary">Bienvenido!</h5>
                                                    <p className="text-muted">Inicie Sesión para continuar.</p>
                                                </div>

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
