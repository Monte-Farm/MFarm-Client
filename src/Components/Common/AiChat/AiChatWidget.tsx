import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { setOpen, toggleOpen } from 'slices/ai/reducer';
import { loadConversation, loadPersistedConversationId } from 'slices/ai/thunk';
import AiChatLauncher from './AiChatLauncher';
import AiChatPanel from './AiChatPanel';
import './aiChat.scss';

const selectWidget = createSelector(
    (state: any) => state.Ai,
    (ai: { isOpen: boolean; activeConversationId: string | null }) => ({
        isOpen: ai.isOpen,
        activeConversationId: ai.activeConversationId,
    })
);

const AiChatWidget: React.FC = () => {
    const dispatch = useDispatch<any>();
    const { isOpen, activeConversationId } = useSelector(selectWidget);

    useEffect(() => {
        const persisted = loadPersistedConversationId();
        if (persisted && !activeConversationId) {
            dispatch(loadConversation(persisted));
        }
        // Only run once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="ai-chat-widget">
            {isOpen && <AiChatPanel onClose={() => dispatch(setOpen(false))} />}
            <AiChatLauncher isOpen={isOpen} onClick={() => dispatch(toggleOpen())} />
        </div>
    );
};

export default AiChatWidget;
