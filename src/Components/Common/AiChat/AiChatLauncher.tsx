import React from 'react';
import AiChatPig, { PigState } from './AiChatPig';

interface AiChatLauncherProps {
    pigState: PigState;
    onClick: () => void;
}

const AiChatLauncher: React.FC<AiChatLauncherProps> = ({ pigState, onClick }) => {
    return <AiChatPig pigState={pigState} onClick={onClick} />;
};

export default AiChatLauncher;
