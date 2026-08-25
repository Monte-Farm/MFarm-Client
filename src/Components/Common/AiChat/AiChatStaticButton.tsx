import React from 'react';
import { useTranslation } from 'react-i18next';
import './aiChatStaticButton.scss';

interface AiChatStaticButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

const AiChatStaticButton: React.FC<AiChatStaticButtonProps> = ({ isOpen, onClick }) => {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            className={`ai-chat-static-btn${isOpen ? ' ai-chat-static-btn--open' : ''}`}
            onClick={onClick}
            aria-label={isOpen ? t('ai.action.closeAssistant') : t('ai.action.open')}
        >
            <span className="ai-chat-static-btn__icon">
                {isOpen
                    ? <i className="ri-close-line" />
                    : <i className="ri-sparkling-2-fill" />
                }
            </span>
            <span className="ai-chat-static-btn__pig" aria-hidden="true">🐷</span>
        </button>
    );
};

export default AiChatStaticButton;
