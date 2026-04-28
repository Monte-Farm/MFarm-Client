import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaBaby, FaPiggyBank, FaWeight, FaHeart } from 'react-icons/fa';

interface PigTimelineProps {
    currentStage: string;
    sex: 'male' | 'female';
    className?: string;
}

const PigTimeline: React.FC<PigTimelineProps> = ({ currentStage, sex, className = '' }) => {
    const { t } = useTranslation();

    const stages = [
        { id: 'piglet', label: t('pigs.stage.piglet'), icon: <FaBaby /> },
        { id: 'weaning', label: t('pigs.stage.weaning'), icon: <FaPiggyBank /> },
        { id: 'fattening', label: t('pigs.stage.fattening'), icon: <FaWeight /> },
        {
            id: 'breeder',
            label: sex === 'female' ? t('shared.pigTimeline.breederFemale') : t('pigs.stage.breeder'),
            icon: <FaHeart />
        }
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
