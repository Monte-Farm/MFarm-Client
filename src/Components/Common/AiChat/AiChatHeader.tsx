import React from 'react';

interface AiChatHeaderProps {
    onNewConversation: () => void;
    onClose: () => void;
}

const AiChatHeader: React.FC<AiChatHeaderProps> = ({ onNewConversation, onClose }) => {
    return (
        <div className="ai-chat-header">
            <div className="ai-chat-header__titles">
                <span className="ai-chat-header__icon">
                    <i className="ri-sparkling-2-fill"></i>
                </span>
                <div>
                    <div className="ai-chat-header__name-row">
                        <h6 className="ai-chat-header__title">Asistente PorcySys</h6>
                        <span className="ai-chat-header__dot" aria-hidden="true" />
                    </div>
                    <span className="ai-chat-header__subtitle">Pregúntame lo que sea sobre tu granja</span>
                </div>
            </div>
            <div className="ai-chat-header__actions">
                <button
                    type="button"
                    className="ai-chat-header__btn"
                    onClick={onNewConversation}
                    title="Nueva conversación"
                    aria-label="Nueva conversación"
                >
                    <i className="ri-edit-box-line"></i>
                </button>
                <button
                    type="button"
                    className="ai-chat-header__btn"
                    onClick={onClose}
                    title="Cerrar asistente IA"
                    aria-label="Cerrar asistente IA"
                >
                    <i className="ri-close-line"></i>
                </button>
            </div>
        </div>
    );
};

export default AiChatHeader;
