import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';

import systemLogo from '../../assets/images/system-logo.png';
import pigSilhouette from '../../assets/images/pig_silhouette.png';

const NotFound = () => {
    document.title = "Página no encontrada | Pig System";

    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f4f7f2 0%, #e8efe0 60%, #d9e4c9 100%)',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <img
                src={pigSilhouette}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    right: '-60px',
                    bottom: '-40px',
                    width: '360px',
                    opacity: 0.08,
                    pointerEvents: 'none',
                }}
            />
            <img
                src={pigSilhouette}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    left: '-80px',
                    top: '-60px',
                    width: '260px',
                    opacity: 0.06,
                    transform: 'scaleX(-1)',
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(60, 80, 40, 0.12)',
                    padding: '3rem 3.5rem',
                    textAlign: 'center',
                    maxWidth: '560px',
                    width: '100%',
                    zIndex: 1,
                    border: '1px solid rgba(120, 150, 80, 0.15)',
                }}
            >
                <img
                    src={systemLogo}
                    alt="Pig System"
                    style={{ height: '90px', marginBottom: '1.5rem' }}
                />

                <div
                    style={{
                        fontSize: '6rem',
                        fontWeight: 700,
                        lineHeight: 1,
                        background: 'linear-gradient(135deg, #4a7c3a 0%, #8fb366 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                    }}
                >
                    404
                </div>

                <h3 style={{ color: '#3d5228', fontWeight: 600, marginBottom: '0.75rem' }}>
                    ¡Ups! Esta página se escapó del corral
                </h3>

                <p style={{ color: '#6b7a5a', fontSize: '1rem', marginBottom: '2rem' }}>
                    La dirección que buscas no existe o fue movida.
                    Volvamos a un lugar seguro.
                </p>

                <Link to="/home">
                    <Button
                        color="success"
                        size="lg"
                        style={{
                            background: 'linear-gradient(135deg, #4a7c3a 0%, #6b9a4e 100%)',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            fontWeight: 500,
                            boxShadow: '0 4px 12px rgba(74, 124, 58, 0.3)',
                        }}
                    >
                        <i className="mdi mdi-home me-2"></i>
                        Volver al inicio
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
