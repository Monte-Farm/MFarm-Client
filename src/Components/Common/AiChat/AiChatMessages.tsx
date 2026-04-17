import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiMessage } from 'slices/ai/reducer';
import AiChatTyping from './AiChatTyping';
import AiChatSuggestions from './AiChatSuggestions';

interface AiChatMessagesProps {
    messages: AiMessage[];
    sending: boolean;
    loadingHistory: boolean;
    onPickSuggestion: (text: string) => void;
}

const AiChatMessages: React.FC<AiChatMessagesProps> = ({ messages, sending, loadingHistory, onPickSuggestion }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, sending]);

    if (loadingHistory) {
        return (
            <div className="ai-chat-messages ai-chat-messages--loading">
                <div className="spinner-border text-success" role="status" />
            </div>
        );
    }

    const isEmpty = messages.length === 0;

    return (
        <div className="ai-chat-messages" ref={scrollRef}>
            {isEmpty && !sending && (
                <AiChatSuggestions onPick={onPickSuggestion} disabled={sending} />
            )}
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`ai-chat-bubble ai-chat-bubble--${msg.role}`}
                >
                    {msg.role === 'assistant' ? (
                        <div className="ai-chat-bubble__markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="ai-chat-bubble__text">{msg.text}</div>
                    )}
                </div>
            ))}
            {sending && <AiChatTyping />}
        </div>
    );
};

export default AiChatMessages;
