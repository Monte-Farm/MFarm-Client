import React from "react";
import { Card, CardBody, Badge } from "reactstrap";
import CountUp from "react-countup";

type TrendVariant = "success" | "danger" | "info" | "warning" | "secondary";

interface StatKpiCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: React.ReactNode;
    animateValue?: boolean;
    durationSeconds?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    trendPercent?: number;
    trendLabel?: string;
    trendVariant?: TrendVariant;
    className?: string;
    iconBgColor?: string;
}

const StatKpiCard: React.FC<StatKpiCardProps> = ({
    title,
    value,
    subtext,
    icon,
    animateValue = false,
    durationSeconds = 1.2,
    decimals = 0,
    prefix,
    suffix,
    trendPercent,
    trendLabel = "vs. previous month",
    trendVariant = "success",
    className = "",
    iconBgColor = "#EEF2FF",
}) => {
    const numericValue = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
    const canAnimate = animateValue && Number.isFinite(numericValue);

    const trendIsPositive = typeof trendPercent === "number" ? trendPercent >= 0 : true;
    const trendText = typeof trendPercent === "number" ? `${Math.abs(trendPercent).toFixed(2)}%` : null;

    return (
        <Card className={`border-0 shadow-sm ${className}`} style={{ borderRadius: "5px" }}>
            <CardBody className="p-3 p-md-4">
                <div className="d-flex align-items-start justify-content-between">
                    <div className="text-muted fw-semibold" style={{ fontSize: "14px" }}>
                        {title}
                    </div>
                    <div
                        className="d-flex align-items-center justify-content-center ms-3"
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "999px",
                            backgroundColor: iconBgColor,
                        }}
                    >
                        {icon}
                    </div>
                </div>

                <div className="mt-3">
                    <div className="fw-semibold" style={{ fontSize: "28px", color: "#111827", lineHeight: 1 }}>
                        {canAnimate ? (
                            <CountUp
                                end={numericValue}
                                duration={durationSeconds}
                                decimals={decimals}
                                separator="," 
                                prefix={prefix}
                                suffix={suffix}
                            />
                        ) : (
                            <>{prefix}{value}{suffix}</>
                        )}
                    </div>

                    {subtext && (
                        <div className="text-muted mt-1" style={{ fontSize: "13px" }}>
                            {subtext}
                        </div>
                    )}

                    {trendText && (
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <Badge color={trendVariant} pill className="d-inline-flex align-items-center gap-1">
                                <span style={{ fontSize: "12px" }}>
                                    {trendIsPositive ? "↑" : "↓"}
                                </span>
                                <span style={{ fontSize: "12px" }}>{trendText}</span>
                            </Badge>
                            <span className="text-muted" style={{ fontSize: "13px" }}>
                                {trendLabel}
                            </span>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default StatKpiCard;
