import React from 'react';
import { useTranslation } from 'react-i18next';

const AiChatTyping: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="ai-chat-typing" role="status" aria-live="polite">
            <span className="ai-chat-typing__icon">
                <i className="ri-sparkling-2-fill"></i>
            </span>
            <span className="ai-chat-typing__label">{t("ai.typing.label")}</span>
            <span className="ai-chat-typing__dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </div>
    );
};

export default AiChatTyping;
