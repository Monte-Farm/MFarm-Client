// components/KPI.tsx
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

const KPI = ({ title, value, subtext, icon: Icon, bgColor = "#ffffff", iconColor = "#000000" }: KPIProps) => {
    return (
        <Card className="text-center p-3 shadow-sm rounded" style={{ minWidth: '180px', backgroundColor: bgColor }}>
            <div className="d-flex flex-column align-items-center">
                <Icon size={28} className="mb-2" style={{ color: iconColor }} />
                <h6 className="text-uppercase mb-1">{title}</h6>
                <h3 className="fw-bold mb-1">{value}</h3>
                {subtext && <small className="text-muted">{subtext}</small>}
            </div>
        </Card>
    );
};

export default KPI;