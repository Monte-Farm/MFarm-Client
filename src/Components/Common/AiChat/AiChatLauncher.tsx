import React from 'react';
import AiChatPig, { PigState } from './AiChatPig';
import AiChatStaticButton from './AiChatStaticButton';

export type LauncherMode = 'animated' | 'static';

interface AiChatLauncherProps {
    pigState: PigState;
    isOpen: boolean;
    mode: LauncherMode;
    onClick: () => void;
}

const AiChatLauncher: React.FC<AiChatLauncherProps> = ({ pigState, isOpen, mode, onClick }) => {
    if (mode === 'static') {
        return <AiChatStaticButton isOpen={isOpen} onClick={onClick} />;
    }
    return <AiChatPig pigState={pigState} onClick={onClick} />;
};

export default AiChatLauncher;
