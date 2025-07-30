import React from 'react';
import { FaBaby, FaPiggyBank, FaWeight, FaHeart } from 'react-icons/fa';

interface PigTimelineProps {
    currentStage: string;
    sex: 'macho' | 'hembra';
    className?: string;
}

const PigTimeline: React.FC<PigTimelineProps> = ({ currentStage, sex, className = '' }) => {
    const stages = [
        { id: 'lechón', label: 'Lechón', icon: <FaBaby /> },
        { id: 'destete', label: 'Destete', icon: <FaPiggyBank /> },
        { id: 'engorda', label: 'Engorda', icon: <FaWeight /> },
        { id: 'reproductor', label: sex === 'hembra' ? 'Reproductora' : 'Reproductor', icon: <FaHeart /> }
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