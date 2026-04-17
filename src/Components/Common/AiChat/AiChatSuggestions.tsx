import React from 'react';

interface AiChatSuggestionsProps {
    onPick: (text: string) => void;
    disabled?: boolean;
}

const SUGGESTIONS = [
    '¿Cuántos cerdos tengo en total?',
    'Consumo de alimento del último mes',
    '¿Cuántas cerdas embarazadas tengo?',
    'Balance financiero de este trimestre',
];

const AiChatSuggestions: React.FC<AiChatSuggestionsProps> = ({ onPick, disabled }) => {
    return (
        <div className="ai-chat-suggestions">
            <div className="ai-chat-suggestions__intro">
                <span className="ai-chat-suggestions__avatar">
                    <i className="ri-robot-2-line"></i>
                </span>
                <p>Pregúntame lo que sea sobre tu granja</p>
            </div>
            <div className="ai-chat-suggestions__chips">
                {SUGGESTIONS.map((label) => (
                    <button
                        key={label}
                        type="button"
                        className="ai-chat-suggestions__chip"
                        onClick={() => onPick(label)}
                        disabled={disabled}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AiChatSuggestions;
