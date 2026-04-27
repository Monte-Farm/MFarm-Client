import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { AiMessage, setOpen, toggleOpen } from 'slices/ai/reducer';
import { loadConversation, loadPersistedConversationId } from 'slices/ai/thunk';
import AiChatLauncher from './AiChatLauncher';
import AiChatPanel from './AiChatPanel';
import { PigState } from './AiChatPig';
import './aiChat.scss';

interface WidgetSelection {
    isOpen: boolean;
    activeConversationId: string | null;
    sending: boolean;
    lastAssistantHasText: boolean;
}

const selectWidget = createSelector(
    (state: any) => state.Ai,
    (ai: {
        isOpen: boolean;
        activeConversationId: string | null;
        sending: boolean;
        messages: AiMessage[];
    }): WidgetSelection => {
        const last = ai.messages[ai.messages.length - 1];
        return {
            isOpen: ai.isOpen,
            activeConversationId: ai.activeConversationId,
            sending: ai.sending,
            lastAssistantHasText: last?.role === 'assistant' && !!last.text,
        };
    }
);

const derivePigState = (
    isOpen: boolean,
    sending: boolean,
    lastAssistantHasText: boolean
): PigState => {
    if (!isOpen) return 'idle';
    if (sending && !lastAssistantHasText) return 'thinking';
    if (sending && lastAssistantHasText) return 'talking';
    return 'attentive';
};

const AiChatWidget: React.FC = () => {
    const dispatch = useDispatch<any>();
    const { isOpen, activeConversationId, sending, lastAssistantHasText } =
        useSelector(selectWidget);

    useEffect(() => {
        const persisted = loadPersistedConversationId();
        if (persisted && !activeConversationId) {
            dispatch(loadConversation(persisted));
        }
        // Only run once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pigState = derivePigState(isOpen, sending, lastAssistantHasText);

    return (
        <div className="ai-chat-widget">
            {isOpen && <AiChatPanel onClose={() => dispatch(setOpen(false))} />}
            <AiChatLauncher pigState={pigState} onClick={() => dispatch(toggleOpen())} />
        </div>
    );
};

export default AiChatWidget;
