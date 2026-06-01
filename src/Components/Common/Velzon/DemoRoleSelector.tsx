import { logger } from 'utils/logger';
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getLoggedinUser, setAuthorization } from 'helpers/api_helper';
import { connectNotificationSocket } from 'helpers/socketService';
import { fetchGlobalConfig } from 'slices/configurations/thunk';
import { ConfigContext } from 'App';

const ROLES: { value: string; icon: string }[] = [
    { value: 'Superadmin',              icon: 'ri-shield-star-line' },
    { value: 'farm_manager',            icon: 'ri-plant-line' },
    { value: 'warehouse_manager',       icon: 'ri-building-2-line' },
    { value: 'subwarehouse_manager',    icon: 'ri-store-2-line' },
    { value: 'general_worker',          icon: 'ri-user-line' },
    { value: 'reproduction_technician', icon: 'ri-flask-line' },
    { value: 'veterinarian',            icon: 'ri-stethoscope-line' },
    { value: 'finance_manager',         icon: 'ri-money-dollar-circle-line' },
];

const DemoRoleSelector = () => {
    const { t } = useTranslation();
    const dispatch: any = useDispatch();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const [loadingRole, setLoadingRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRoleSelect = async (role: string) => {
        try {
            setError(null);
            setLoadingRole(role);

            const response = await axios.post(`${configContext?.apiUrl}/user/demo-login`, { role });
            const user = response.data.data;

            sessionStorage.setItem('authUser', JSON.stringify(user));
            setAuthorization(user.token);
            configContext?.setUserLogged(getLoggedinUser());
            connectNotificationSocket(user.token, dispatch);
            dispatch(fetchGlobalConfig());
            navigate('/home');
        } catch (err: any) {
            logger.error(err);
            setError(t('auth.demo.error'));
            setLoadingRole(null);
        }
    };

    return (
        <div>
            <div className="row g-2">
                {ROLES.map((role) => {
                    const isLoading = loadingRole === role.value;
                    const isDisabled = loadingRole !== null;
                    return (
                        <div className="col-6" key={role.value}>
                            <button
                                className="btn w-100 d-flex flex-column align-items-center justify-content-center gap-1 py-3"
                                style={{
                                    backgroundColor: '#fff',
                                    border: '1.5px solid #A87340',
                                    borderRadius: '8px',
                                    color: '#2F4F4F',
                                    opacity: isDisabled && !isLoading ? 0.5 : 1,
                                    transition: 'all 0.15s',
                                    minHeight: '80px',
                                }}
                                onClick={() => handleRoleSelect(role.value)}
                                disabled={isDisabled}
                            >
                                {isLoading ? (
                                    <span
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                        aria-hidden="true"
                                        style={{ color: '#A87340' }}
                                    />
                                ) : (
                                    <i className={`${role.icon} fs-20`} style={{ color: '#A87340' }} />
                                )}
                                <span
                                    className="fw-semibold text-center"
                                    style={{ fontSize: '0.72rem', lineHeight: 1.2 }}
                                >
                                    {isLoading
                                        ? t('auth.demo.loading')
                                        : t(`roles.${role.value}`, { defaultValue: role.value })}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="alert alert-danger mt-3 py-2 text-center" style={{ fontSize: '0.85rem' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default DemoRoleSelector;
