import SimpleBar from "simplebar-react";

interface HistoryItem {
    [key: string]: any;
}

interface HistoryListProps {
    data: HistoryItem[];
    typeKey: string;
    dateKey: string;
    descriptionKey: string;
    responsibleKey?: string;
    badgeColors?: Record<string, string>;
}

const HistoryList: React.FC<HistoryListProps> = ({
    data,
    typeKey,
    dateKey,
    descriptionKey,
    responsibleKey,
    badgeColors = {}
}) => {

    const getBadgeColor = (type: string) => {
        if (badgeColors[type]) return badgeColors[type];
        switch (type) {
            case 'celo': return 'warning';
            case 'inseminacion': return 'primary';
            case 'aborto': return 'danger';
            case 'parto': return 'success';
            case 'diagnostico': return 'info';
            default: return 'secondary';
        }
    }

    return (
        <SimpleBar style={{ maxHeight: "calc(100vh - 435px)", padding: "16px" }} autoHide={false}>
            <div className="d-flex flex-column gap-3">
                {data
                    .sort((a, b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime())
                    .map((item, idx) => {
                        const badgeColor = getBadgeColor(item[typeKey]);
                        const formattedDate = new Date(item[dateKey]).toLocaleDateString('es-ES');

                        return (
                            <div
                                key={idx}
                                className="d-flex align-items-start gap-3 p-3 border rounded"
                                style={{ backgroundColor: '#f8f9fa' }}
                            >
                                <span
                                    className={`badge bg-${badgeColor} text-white fs-6 py-2 px-3`}
                                    style={{ width: '120px', textAlign: 'center', flexShrink: 0 }}
                                >
                                    {item[typeKey].toUpperCase()}
                                </span>
                                <div className="flex-grow-1">
                                    <div className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>
                                        {formattedDate}
                                    </div>
                                    <div className="mb-1" style={{ fontSize: '1rem', fontWeight: 500 }}>
                                        {item[descriptionKey]}
                                    </div>
                                    {responsibleKey && item[responsibleKey] && (
                                        <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                            {item[responsibleKey].name} {item[responsibleKey].lastname}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
            </div>
        </SimpleBar>
    )
}

export default HistoryList;