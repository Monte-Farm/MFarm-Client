import { useState } from "react";
import { PigHistoryChanges } from "common/data_interfaces";
import { translateFieldName } from "Components/Hooks/translateFieldName";

const HistoryFlagItem = ({ record }: { record: PigHistoryChanges }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div className={`history-flag ${isExpanded ? 'expanded' : ''}`}>
            <div className="flag-pointer">
                <i className="ri-arrow-up-s-line text-black"></i>
            </div>
            <div className="flag-content" onClick={toggleExpand}>
                <div className="flag-header">
                    <span className="flag-date">
                        {new Date(record.date).toLocaleDateString()} - {new Date(record.date).toLocaleTimeString()}
                    </span>
                    <span className="flag-action">
                        {record.action === 'actualización' ? 'Actualización' : record.action}
                    </span>
                    <span className="flag-user">
                        <i className="ri-user-fill me-1"></i>
                        {record.userId.name} {record.userId.lastname}
                    </span>
                </div>

                {isExpanded && (
                    <div className="flag-details">
                        {record.changes.map((change) => (
                            <div className="change-item">
                                <div className="change-field">
                                    {translateFieldName(change.field)}:
                                </div>
                                <div className="change-values">
                                    <div className="old-value">
                                        <span className="value-label text-black">Antes:</span>
                                        <span className="text-black fs-5">{change.oldValue || 'Vacío'}</span>
                                    </div>
                                    <div className="new-value">
                                        <span className="value-label text-black">Ahora:</span>
                                        <span className="text-black fs-5">{change.newValue || 'Vacío'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryFlagItem;