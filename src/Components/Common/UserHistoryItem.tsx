import { useState } from "react";
import { UserData } from "common/data_interfaces";

interface UserHistoryItemProps {
    record: UserData["history"][number];
}

const UserHistoryItem = ({ record }: UserHistoryItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div className={`history-flag mb-2 ${isExpanded ? 'expanded' : ''}`}>
            <div className="flag-pointer">
                <i className="ri-arrow-up-s-line text-black"></i>
            </div>
            <div className="flag-content" onClick={toggleExpand}>
                <div className="flag-header">
                    <span className="flag-date">
                        {new Date(record.date).toLocaleDateString()} - {new Date(record.date).toLocaleTimeString()}
                    </span>
                    <span className="flag-action">
                        {record.event}
                    </span>
                </div>

                {isExpanded && (
                    <div className="flag-details">
                        <div className="text-muted fst-italic">
                            No hay detalles adicionales para este evento.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserHistoryItem;