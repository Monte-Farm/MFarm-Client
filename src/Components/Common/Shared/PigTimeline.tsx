import React from 'react';
import { FaBaby, FaPiggyBank, FaWeight, FaHeart } from 'react-icons/fa';

interface PigTimelineProps {
    currentStage: string;
    sex: 'male' | 'female';
    className?: string;
}

const PigTimeline: React.FC<PigTimelineProps> = ({ currentStage, sex, className = '' }) => {
    const stages = [
        { id: 'piglet', label: 'Lechón', icon: <FaBaby /> },
        { id: 'weaning', label: 'Destete', icon: <FaPiggyBank /> },
        { id: 'fattening', label: 'Engorda', icon: <FaWeight /> },
        { id: 'breeder', label: sex === 'female' ? 'Reproductora' : 'Reproductor', icon: <FaHeart /> }
    ];

    const currentIndex = stages.findIndex(stage => stage.id === currentStage);

    return (
        <div className={`pig-timeline ${className}`}>
            <div className="timeline-line" />
            <div className="timeline-stages">
                {stages.map((stage, index) => (
                    <div
                        key={stage.id}
                        className={`timeline-stage ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}
                    >
                        <div className="stage-icon-container">
                            <div className="stage-icon fs-4">
                                {stage.icon}
                            </div>
                        </div>
                        <div className="stage-label fs-5">{stage.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PigTimeline;