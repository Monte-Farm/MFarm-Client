import React, { useEffect, useState } from "react";

interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    change: number;
    changeText: string;
    icon: React.ReactNode;
    duration?: number;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    suffix = "",
    change,
    changeText,
    icon,
    duration = 800,
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const isPositive = change >= 0;

    useEffect(() => {
        let start = 0;
        const increment = value / (duration / 16);

        const counter = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplayValue(value);
                clearInterval(counter);
            } else {
                setDisplayValue(start);
            }
        }, 16);

        return () => clearInterval(counter);
    }, [value, duration]);

    return (
        <div className="card h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between">
                    <div>
                        <p className="fw-medium mb-0 text-muted">{title}</p>

                        <h2 className="mt-4 ff-secondary fw-semibold">
                            {displayValue.toFixed(2)}
                            {suffix}
                        </h2>

                        <p className="mb-0 text-muted">
                            <span
                                className={`badge bg-light ${isPositive ? "text-success" : "text-danger"
                                    }`}
                            >
                                <i
                                    className={`align-middle ri-arrow-${isPositive ? "up" : "down"
                                        }-line  ${isPositive ? "text-success" : "text-danger"
                                    }`}
                                />{" "}
                                {Math.abs(change)} %
                            </span>{" "}
                            {changeText}
                        </p>
                    </div>

                    <div>
                        <div className="avatar-sm flex-shrink-0">
                            <span className="avatar-title rounded-circle material-shadow fs-2 bg-info-subtle">
                                {icon}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
