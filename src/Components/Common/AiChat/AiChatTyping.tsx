import React from 'react';

const AiChatTyping: React.FC = () => {
    return (
        <div className="ai-chat-typing" role="status" aria-live="polite">
            <span className="ai-chat-typing__icon">
                <i className="ri-sparkling-2-fill"></i>
            </span>
            <span className="ai-chat-typing__label">consultando</span>
            <span className="ai-chat-typing__dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </div>
    );
};

export default AiChatTyping;
