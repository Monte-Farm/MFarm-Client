import { useState } from "react";
import { PigFeedingEntry } from "common/data_interfaces";

const FeedingEntryItem = ({ entry }: { entry: PigFeedingEntry }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div className={`feeding-entry-item ${isExpanded ? 'expanded' : ''}`}>
            <div className="entry-pointer">
                <i className="ri-arrow-up-s-line"></i>
            </div>
            <div className="entry-content" onClick={toggleExpand}>
                <div className="entry-header">
                    <span className="entry-category">
                        {entry.category}
                    </span>
                    <span className="entry-name">
                        {entry.name}
                    </span>
                </div>

                {isExpanded && (
                    <div className="entry-details">
                        <div className="detail-item">
                            <div className="detail-field">Cantidad diaria:</div>
                            <div className="detail-value">
                                {entry.dailyAmount} {entry.unit}
                            </div>
                        </div>

                        {entry.observations && (
                            <div className="detail-item">
                                <div className="detail-field">Observaciones:</div>
                                <div className="detail-value">
                                    {entry.observations}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedingEntryItem;