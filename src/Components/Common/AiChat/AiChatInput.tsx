import React, { useEffect, useRef, useState } from 'react';

interface AiChatInputProps {
    disabled: boolean;
    onSend: (text: string) => void;
    externalValue?: string;
    onExternalConsumed?: () => void;
}

const AiChatInput: React.FC<AiChatInputProps> = ({ disabled, onSend, externalValue, onExternalConsumed }) => {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (externalValue !== undefined && externalValue !== '') {
            setValue(externalValue);
            onExternalConsumed?.();
            textareaRef.current?.focus();
        }
    }, [externalValue, onExternalConsumed]);

    const submit = () => {
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue('');
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    return (
        <div className="ai-chat-input">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Pregúntale lo que quieras a tu granja..."
                rows={1}
                disabled={disabled}
                maxLength={2000}
            />
            <button
                type="button"
                className="ai-chat-input__send"
                onClick={submit}
                disabled={disabled || !value.trim()}
                aria-label="Enviar"
            >
                <i className="ri-arrow-up-line"></i>
            </button>
        </div>
    );
};

export default AiChatInput;
