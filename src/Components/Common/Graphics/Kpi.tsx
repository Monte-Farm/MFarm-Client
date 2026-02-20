import { Card } from "reactstrap";
import { IconType } from "react-icons";

interface KPIProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: IconType;
    bgColor?: string;
    iconColor?: string;
}

const KPI = ({
    title,
    value,
    subtext,
    icon: Icon,
    bgColor = "#ffffff",
    iconColor = "#000000",
}: KPIProps) => {
    return (
        <Card
            className="h-100 text-center shadow-sm rounded-4 border-0"
            style={{
                backgroundColor: bgColor,
            }}
        >
            <div
                className="d-flex flex-column align-items-center justify-content-center p-3"
                style={{
                    height: "160px", // 🔥 altura fija uniforme
                }}
            >
                <Icon
                    className="mb-2"
                    style={{
                        color: iconColor,
                        fontSize: "clamp(20px, 3vw, 28px)",
                        flexShrink: 0,
                    }}
                />

                <h6
                    className="text-uppercase text-muted mb-1 text-truncate w-100"
                    style={{
                        fontSize: "clamp(10px, 1.5vw, 12px)",
                    }}
                >
                    {title}
                </h6>

                <h3
                    className="fw-bold mb-1 text-truncate w-100"
                    style={{
                        fontSize: "clamp(16px, 2.5vw, 24px)",
                    }}
                >
                    {value}
                </h3>

                {subtext && (
                    <small
                        className="text-muted text-truncate w-100"
                        style={{
                            fontSize: "clamp(10px, 1.5vw, 12px)",
                        }}
                    >
                        {subtext}
                    </small>
                )}
            </div>
        </Card>
    );
};

export default KPI;
