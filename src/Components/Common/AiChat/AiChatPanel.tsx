import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { AiMessage, setError } from 'slices/ai/reducer';
import { sendMessage, startNewConversation } from 'slices/ai/thunk';
import AiChatHeader from './AiChatHeader';
import AiChatMessages from './AiChatMessages';
import AiChatInput from './AiChatInput';

interface AiChatPanelProps {
    onClose: () => void;
}

const selectAi = createSelector(
    (state: any) => state.Ai,
    (ai: {
        messages: AiMessage[];
        sending: boolean;
        loadingHistory: boolean;
        error: string | null;
    }) => ({
        messages: ai.messages,
        sending: ai.sending,
        loadingHistory: ai.loadingHistory,
        error: ai.error,
    })
);

const AiChatPanel: React.FC<AiChatPanelProps> = ({ onClose }) => {
    const dispatch = useDispatch<any>();
    const { messages, sending, loadingHistory, error } = useSelector(selectAi);
    const [pendingText, setPendingText] = useState<string>('');

    const handleSend = (text: string) => {
        dispatch(sendMessage(text));
    };

    const handleNew = () => {
        dispatch(startNewConversation());
    };

    const handlePickSuggestion = (text: string) => {
        setPendingText(text);
    };

    return (
        <div className="ai-chat-panel" role="dialog" aria-label="Asistente PorcySys">
            <AiChatHeader onNewConversation={handleNew} onClose={onClose} />
            <div className="ai-chat-panel__body">
                <AiChatMessages
                    messages={messages}
                    sending={sending}
                    loadingHistory={loadingHistory}
                    onPickSuggestion={handlePickSuggestion}
                />
                {error && (
                    <div className="ai-chat-error" role="alert">
                        <span>{error}</span>
                        <button
                            type="button"
                            className="ai-chat-error__close"
                            onClick={() => dispatch(setError(null))}
                            aria-label="dismiss"
                        >
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                )}
            </div>
            <AiChatInput
                disabled={sending || loadingHistory}
                onSend={handleSend}
                externalValue={pendingText}
                onExternalConsumed={() => setPendingText('')}
            />
        </div>
    );
};

export default AiChatPanel;
