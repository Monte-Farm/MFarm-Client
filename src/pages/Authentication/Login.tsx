import React, { useContext } from "react";
import { Card, Col, Container, Row } from "reactstrap";
import loginImage from "../../assets/images/login_image.jpg";
import LoginForm from "../../Components/Common/Login";
import axios, { AxiosError, AxiosResponse } from "axios";
import { APIClient, getLoggedinUser, setAuthorization } from "helpers/api_helper";
import { useNavigate } from "react-router-dom";
import VelzonLogo from '../../assets/images/logo-dark.png'
import { ConfigContext } from "App";


const CoverSignIn = () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    document.title = "Inicio de sesión | MFarm";
    const history = useNavigate();
    const axiosHelper = new APIClient();
    const configContext = useContext(ConfigContext)

    const handleLogin = async (values: { username: string; password: string }) => {

        await axios.post(`${apiUrl}/user/login`, values)
            .then(function (response: AxiosResponse) {
                sessionStorage.setItem('authUser', JSON.stringify(response.data.data))
                history('/home')
            })
            .catch(function (error: AxiosError) {
                console.error(error.response)
                throw error;
            })

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
                                                        <img
                                                            src={configContext?.logoUrl}
                                                            style={{ maxWidth: '200px', maxHeight: '100px', width: 'auto', height: 'auto' }}
                                                            alt="Logo"
                                                        />

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
