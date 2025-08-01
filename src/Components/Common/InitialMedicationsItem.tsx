import { useState } from "react";
import { PigMedicationEntry } from "common/data_interfaces";

const InitialMedicationsItem = ({ medication }: { medication: PigMedicationEntry }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded(!isExpanded);

    const routeIcons = {
        oral: "ri-capsule-line",
        intramuscular: "ri-syringe-line",
        subcutánea: "ri-test-tube-line",
        tópica: "ri-oil-line",
        intravenosa: "ri-drop-line",
        "": "ri-question-line"
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "No especificada";
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className={`medication-item ${isExpanded ? 'expanded' : ''}`}>
            <div className="medication-pointer">
                <i className="ri-arrow-up-s-line"></i>
            </div>
            <div className="medication-content" onClick={toggleExpand}>
                <div className="medication-header">
                    <span className="medication-type">
                        {medication.type}
                    </span>
                    <span className="medication-name">
                        {medication.name}
                    </span>
                    <span className="medication-route">
                        <i className={`${routeIcons[medication.route || '']} me-2`}></i>
                        {medication.route || 'Sin especificar'}
                    </span>
                </div>

                {isExpanded && (
                    <div className="medication-details">
                        <div className="detail-item">
                            <div className="detail-field">Dosis:</div>
                            <div className="detail-value">
                                {medication.dose || 'No especificada'} {medication.unit}
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-field">Fecha de aplicación:</div>
                            <div className="detail-value">
                                {formatDate(medication.applicationDate)}
                            </div>
                        </div>

                        {medication.observations && (
                            <div className="detail-item">
                                <div className="detail-field">Observaciones:</div>
                                <div className="detail-value">
                                    {medication.observations}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialMedicationsItem;