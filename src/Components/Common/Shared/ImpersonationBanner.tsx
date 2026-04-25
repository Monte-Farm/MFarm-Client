import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigContext } from 'App';
import { stopImpersonation } from 'helpers/impersonation_helper';

const ImpersonationBanner: React.FC = () => {
    const configContext = useContext(ConfigContext);
    const navigate = useNavigate();

    if (!configContext?.impersonation) return null;

    const { farm_name } = configContext.impersonation;

    const handleExit = () => {
        stopImpersonation();
        configContext.setImpersonation(null);
        navigate('/farms/view_farms');
    };

    return (
        <div
            style={{
                backgroundColor: '#e8590c',
                color: '#fff',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1100,
                fontSize: '14px',
                fontWeight: 500,
            }}
        >
            <span>
                <i className="ri-eye-line me-2" />
                Viendo como gerente de: <strong>{farm_name}</strong>
            </span>
            <button
                onClick={handleExit}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    color: '#fff',
                    padding: '4px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '13px',
                }}
            >
                <i className="ri-logout-box-line me-1" />
                Salir del modo granja
            </button>
        </div>
    );
};

export default ImpersonationBanner;
