import SimpleBar from "simplebar-react";

interface GroupHistoryItem {
    date: string;
    userId?: any;
    action: string;
    description: string;
}

interface GroupHistoryListProps {
    data: GroupHistoryItem[];
}

const GroupHistoryList: React.FC<GroupHistoryListProps> = ({ data }) => {

    const getBadgeColor = (action: string) => {
        switch (action) {
            case "created": return "success";
            case "add": return "primary";
            case "withdraw": return "danger";
            case "transfer": return "warning";
            default: return "secondary";
        }
    };

    const translateAction = (action: string) => {
        switch (action) {
            case "created": return "CREADO";
            case "add": return "INGRESO";
            case "withdraw": return "RETIRO";
            case "transfer": return "TRANSFERENCIA";
            default: return action.toUpperCase();
        }
    };

    return (
        <SimpleBar style={{ maxHeight: "calc(100vh - 435px)", padding: "16px" }} autoHide={false}>
            <div className="d-flex flex-column gap-3">
                {data
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((item, idx) => {
                        const badgeColor = getBadgeColor(item.action);

                        const d = new Date(item.date);
                        const formattedDate =
                            d.toLocaleDateString("es-ES") +
                            " - " +
                            d.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                        return (
                            <div
                                key={idx}
                                className="d-flex align-items-start gap-3 p-3 border rounded"
                                style={{ backgroundColor: "#f8f9fa" }}
                            >
                                <span
                                    className={`badge bg-${badgeColor} text-white fs-6 py-2 px-3`}
                                    style={{ width: "150px", textAlign: "center", flexShrink: 0 }}
                                >
                                    {translateAction(item.action)}
                                </span>

                                <div className="flex-grow-1">
                                    <div className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
                                        {formattedDate}
                                    </div>

                                    <div className="mb-1" style={{ fontSize: "1rem", fontWeight: 500 }}>
                                        {item.description}
                                    </div>

                                    {item.userId && (
                                        <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                                            {item.userId.name} {item.userId.lastname}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </SimpleBar>
    );
};

export default GroupHistoryList;