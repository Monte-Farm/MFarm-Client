import React from 'react';

interface AiChatLauncherProps {
    isOpen: boolean;
    onClick: () => void;
}

const AiChatLauncher: React.FC<AiChatLauncherProps> = ({ isOpen, onClick }) => {
    return (
        <button
            type="button"
            className={`ai-chat-launcher${isOpen ? ' is-open' : ''}`}
            onClick={onClick}
            aria-label={isOpen ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
        >
            <i className={isOpen ? 'ri-close-line' : 'ri-robot-2-line'}></i>
        </button>
    );
};

export default AiChatLauncher;
