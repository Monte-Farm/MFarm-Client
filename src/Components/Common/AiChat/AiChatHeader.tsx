import React from 'react';
import { useTranslation } from 'react-i18next';

interface AiChatHeaderProps {
    onNewConversation: () => void;
    onClose: () => void;
}

const AiChatHeader: React.FC<AiChatHeaderProps> = ({ onNewConversation, onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="ai-chat-header">
            <div className="ai-chat-header__titles">
                <span className="ai-chat-header__icon">
                    <i className="ri-sparkling-2-fill"></i>
                </span>
                <div>
                    <div className="ai-chat-header__name-row">
                        <h6 className="ai-chat-header__title">{t("ai.panel.title")}</h6>
                        <span className="ai-chat-header__dot" aria-hidden="true" />
                    </div>
                    <span className="ai-chat-header__subtitle">{t("ai.panel.subtitle")}</span>
                </div>
            </div>
            <div className="ai-chat-header__actions">
                <button
                    type="button"
                    className="ai-chat-header__btn"
                    onClick={onNewConversation}
                    title={t("ai.action.newConversation")}
                    aria-label={t("ai.action.newConversation")}
                >
                    <i className="ri-edit-box-line"></i>
                </button>
                <button
                    type="button"
                    className="ai-chat-header__btn"
                    onClick={onClose}
                    title={t("ai.action.close")}
                    aria-label={t("ai.action.close")}
                >
                    <i className="ri-close-line"></i>
                </button>
            </div>
        </div>
    );
};

export default AiChatHeader;
