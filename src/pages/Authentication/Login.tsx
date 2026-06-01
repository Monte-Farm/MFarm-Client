import { logger } from 'utils/logger';
import React, { useContext, useState } from "react";
import { Card, Col, Container, Row } from "reactstrap";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import loginImage from "../../assets/images/portada.png";
import LoginForm from "../../Components/Common/Velzon/Login";
import DemoRoleSelector from "../../Components/Common/Velzon/DemoRoleSelector";
import axios, { AxiosError, AxiosResponse } from "axios";
import { getLoggedinUser, setAuthorization } from "helpers/api_helper";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "App";
import Aurora from "Components/Common/Velzon/Aurora";
import LogoSystem from '../../assets/images/logo.png'
import systemLogo from '../../assets/images/system-logo-dark.png'
import loginBanner from '../../assets/images/login_banner.png'
import { useDispatch } from "react-redux";
import { connectNotificationSocket } from "helpers/socketService";
import { fetchGlobalConfig } from "slices/configurations/thunk";
import { useTranslation } from "react-i18next";
import { isDemoMode } from "config";

const CoverSignIn = () => {
    const { t } = useTranslation();
    document.title = isDemoMode ? t('auth.demo.welcome') + ' | PorcySys' : t('auth.login.pageTitle');
    const dispatch: any = useDispatch();
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
            setAuthorization(user.token);
            configContext?.setUserLogged(getLoggedinUser());
            connectNotificationSocket(user.token, dispatch);
            dispatch(fetchGlobalConfig());
            history('/home');
        } catch (error: any) {
            logger.error(error.response);
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
                        height: 100%;
                    }
                    .auth-scroll-wrapper {
                        min-height: 100vh;
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    @media (max-height: 600px) {
                        .auth-scroll-wrapper {
                            align-items: flex-start;
                            padding: 16px 0;
                        }
                    }
                `}
            </style>

            <div className="auth-page-wrapper position-relative" style={{ minHeight: '100vh' }}>
                {/* Aurora fija como fondo */}
                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ overflow: "hidden", zIndex: 0 }}>
                    <Aurora colorStops={["#2F4F4F", "#8B4513", "#F5F5DC"]} speed={0.5} />
                </div>

                {/* Contenido con scroll */}
                <div className="auth-scroll-wrapper" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="auth-page-content w-100 py-4">
                        <Container>
                            <Row>
                                <Col lg={12}>
                                    <Card className="overflow-hidden" style={{ borderRadius: '10px' }}>
                                        <Row className="g-0">
                                            <Col lg={8} className="d-none d-lg-block">
                                                <img src={loginBanner} className="img-fluid h-100" style={{ objectFit: 'cover' }} alt="Login Cover" />
                                            </Col>
                                            <Col lg={4} xs={12} style={{ backgroundColor: '#F5F5DC' }}>
                                                <div className="p-4 p-lg-5">
                                                    <div className="d-flex justify-content-center pb-0 mt-0">
                                                        <img
                                                            src={systemLogo}
                                                            style={{ maxWidth: '220px', maxHeight: '160px', width: '100%', height: 'auto' }}
                                                            alt="Logo"
                                                        />
                                                    </div>
                                                    <h4 className="text-center" style={{ color: '#2F4F4F' }}>
                                                        {isDemoMode ? t('auth.demo.welcome') : t('auth.login.welcome')}
                                                    </h4>
                                                    <p className="text-muted text-center fs-5">
                                                        {isDemoMode ? t('auth.demo.subtitle') : t('auth.login.subtitle')}
                                                    </p>

                                                    <div className="mt-4">
                                                        {isDemoMode ? (
                                                            <DemoRoleSelector />
                                                        ) : (
                                                            <LoginForm onSubmit={handleLogin} />
                                                        )}
                                                    </div>
                                                </div>

                                                {!isDemoMode && (
                                                    <AlertMessage
                                                        color="danger"
                                                        message={t('auth.login.disabledUser')}
                                                        visible={showDisabledAlert}
                                                        onClose={() => setShowDisabledAlert(false)}
                                                    />
                                                )}
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        </Container>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CoverSignIn;
