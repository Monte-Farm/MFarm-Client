import React from 'react';
import './aiChatPig.scss';
import { useTranslation } from 'react-i18next';

export type PigState = 'idle' | 'attentive' | 'thinking' | 'talking';

interface AiChatPigProps {
    pigState: PigState;
    onClick: () => void;
}

const AiChatPig: React.FC<AiChatPigProps> = ({ pigState, onClick }) => {
    const { t } = useTranslation();

    const ariaLabelByState: Record<PigState, string> = {
        idle: t('ai.action.open'),
        attentive: t('ai.action.closeAssistant'),
        thinking: t('ai.action.thinkingClose'),
        talking: t('ai.action.respondingClose'),
    };

    return (
        <button
            type="button"
            className={`ai-chat-pig ai-chat-pig--${pigState}`}
            onClick={onClick}
            aria-label={ariaLabelByState[pigState]}
        >
            <div className="ai-chat-pig__stage">
                <svg
                    className={`pig pig--${pigState}`}
                    viewBox="0 0 100 80"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    {/* Thought bubble (only visible in thinking) */}
                    <g className="pig__thought">
                        <circle cx="86" cy="14" r="9" />
                        <circle cx="76" cy="22" r="3" />
                        <circle cx="71" cy="27" r="1.6" />
                        <text
                            x="86"
                            y="18"
                            textAnchor="middle"
                            className="pig__thought-text"
                        >
                            ?
                        </text>
                    </g>

                    {/* Tail */}
                    <path
                        className="pig__tail"
                        d="M22 46 q-6 -2 -6 -7 q0 -5 5 -5 q4 0 4 4"
                        fill="none"
                        stroke="#e89bb0"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />

                    {/* Body */}
                    <ellipse
                        className="pig__body"
                        cx="50"
                        cy="50"
                        rx="28"
                        ry="20"
                    />

                    {/* Legs */}
                    <g className="pig__legs">
                        <rect className="pig__leg pig__leg--bl" x="30" y="64" width="6" height="10" rx="2" />
                        <rect className="pig__leg pig__leg--fl" x="40" y="64" width="6" height="10" rx="2" />
                        <rect className="pig__leg pig__leg--br" x="56" y="64" width="6" height="10" rx="2" />
                        <rect className="pig__leg pig__leg--fr" x="66" y="64" width="6" height="10" rx="2" />
                    </g>

                    {/* Head */}
                    <g className="pig__head">
                        {/* Ears */}
                        <g className="pig__ears">
                            <path
                                className="pig__ear pig__ear--l"
                                d="M58 22 L62 14 L68 22 Z"
                            />
                            <path
                                className="pig__ear pig__ear--r"
                                d="M82 22 L86 14 L88 24 Z"
                            />
                        </g>

                        {/* Head shape */}
                        <ellipse
                            className="pig__head-shape"
                            cx="74"
                            cy="38"
                            rx="20"
                            ry="17"
                        />

                        {/* Eyes */}
                        <g className="pig__eyes">
                            <ellipse className="pig__eye pig__eye--l" cx="68" cy="34" rx="2" ry="2.6" />
                            <ellipse className="pig__eye pig__eye--r" cx="80" cy="34" rx="2" ry="2.6" />
                        </g>

                        {/* Snout */}
                        <g className="pig__snout">
                            <ellipse
                                className="pig__snout-shape"
                                cx="80"
                                cy="44"
                                rx="9"
                                ry="6"
                            />
                            <ellipse className="pig__nostril" cx="77.5" cy="44" rx="0.9" ry="1.6" />
                            <ellipse className="pig__nostril" cx="82.5" cy="44" rx="0.9" ry="1.6" />
                            <ellipse
                                className="pig__mouth"
                                cx="80"
                                cy="49"
                                rx="2.4"
                                ry="0.6"
                            />
                        </g>
                    </g>
                </svg>
            </div>
        </button>
    );
};

export default AiChatPig;
