import React, { useMemo } from "react";
import { FaPiggyBank } from "react-icons/fa";

interface WeaningProgressProps {
    birthDate: string | Date;
    litterStatus?: "weaning" | "weaned";
}

const MIN_WEANING_DAYS = 21;
const MAX_WEANING_DAYS = 28;

const WeaningProgress: React.FC<WeaningProgressProps> = ({
    birthDate,
    litterStatus
}) => {
    const { daysOld, daysRemaining, progress, status, isWeaned } = useMemo(() => {
        const birth = new Date(birthDate);
        const today = new Date();

        birth.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffMs = today.getTime() - birth.getTime();
        const days = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);

        const remaining = MIN_WEANING_DAYS - days;
        const progressPercent = Math.min((days / MAX_WEANING_DAYS) * 100, 100);

        if (litterStatus === "weaned") {
            return {
                daysOld: days,
                daysRemaining: 0,
                progress: 100,
                status: "ready",
                isWeaned: true
            };
        }

        let currentStatus: "normal" | "ready" | "overdue";

        if (days < MIN_WEANING_DAYS) currentStatus = "normal";
        else if (days <= MAX_WEANING_DAYS) currentStatus = "ready";
        else currentStatus = "overdue";

        return {
            daysOld: days,
            daysRemaining: remaining,
            progress: progressPercent,
            status: currentStatus,
            isWeaned: false
        };
    }, [birthDate, litterStatus]);

    const theme = isWeaned
        ? {
            color: "#10b981",
            bg: "#ecfdf5",
            text: "Camada destetada",
            icon: "fa-solid fa-circle-check"
        }
        : {
            normal: {
                color: "#3b82f6",
                bg: "#eff6ff",
                text: `${daysRemaining} días para destete`,
                icon: "fa-solid fa-clock"
            },
            ready: {
                color: "#10b981",
                bg: "#ecfdf5",
                text: "Listo para destete",
                icon: "fa-solid fa-circle-check"
            },
            overdue: {
                color: "#ef4444",
                bg: "#fef2f2",
                text: "Destete atrasado",
                icon: "fa-solid fa-triangle-exclamation"
            }
        }[status];

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "#ffffff",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e5e7eb"
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <FaPiggyBank size={25} color={theme?.color} />
                    <span style={{ fontWeight: 700, fontSize: 20 }}>
                        Progreso de destete
                    </span>
                </div>

                <span
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: theme?.color,
                        background: theme?.bg,
                        padding: "6px 12px",
                        borderRadius: 14
                    }}
                >
                    {isWeaned ? "Destetada" : `${daysOld} días`}
                </span>
            </div>

            {/* Barra */}
            <div
                style={{
                    height: 14,
                    background: "#f3f4f6",
                    borderRadius: 10,
                    overflow: "hidden",
                    marginTop: 18
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: theme?.color,
                        transition: "width 0.4s ease"
                    }}
                />
            </div>

            {/* Estado */}
            <div
                style={{
                    marginTop: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme?.color,
                    minHeight: 28
                }}
            >
                <i className={theme?.icon} style={{ fontSize: 18 }} />
                {theme?.text}
            </div>
        </div>
    );
};

export default WeaningProgress;