import React, { useMemo } from "react";
import {
    FaBaby,
    FaChartLine,
    FaTruckLoading,
    FaSyncAlt,
    FaCheck,
    FaDollarSign,
    FaSkull
} from "react-icons/fa";

interface GrowthStatusProgressProps {
    status:
    | "weaning"
    | "ready_to_grow"
    | "grow_overdue"
    | "growing"
    | "ready_to_exit"
    | "exit_overdue"
    | "exit"
    | "replacement"
    | "sold"
    | "deceased"
    | "exit_processed";
    title?: string;
}

const baseSteps = [
    { key: "weaning", label: "Destete", icon: FaBaby },
    { key: "growing", label: "Crecimiento", icon: FaChartLine },
    { key: "exit", label: "Salida", icon: FaTruckLoading }
];

const finalStagesMap: Record<
    string,
    { key: string; label: string; icon: any }
> = {
    replacement: {
        key: "replacement",
        label: "Reemplazo",
        icon: FaSyncAlt
    },
    sold: {
        key: "sold",
        label: "Venta",
        icon: FaDollarSign
    },
    deceased: {
        key: "deceased",
        label: "Baja",
        icon: FaSkull
    },
    exit_processed: {
        key: "exit_processed",
        label: "Salida Procesada",
        icon: FaCheck
    }
};

const GrowthStatusProgress: React.FC<GrowthStatusProgressProps> = ({ status, title }) => {

    const { steps, activeIndex } = useMemo(() => {

        const stageIndexMap: Record<string, number> = {
            weaning: 0,
            ready_to_grow: 0,
            grow_overdue: 0,

            growing: 1,
            ready_to_exit: 1,
            exit_overdue: 1,

            exit: 2,

            replacement: 3,
            sold: 3,
            deceased: 3,
            exit_processed: 3
        };

        const hasFinalStage = [
            "replacement",
            "sold",
            "deceased",
            "exit_processed"
        ].includes(status);

        const dynamicSteps = hasFinalStage
            ? [...baseSteps, finalStagesMap[status]]
            : baseSteps;

        return {
            steps: dynamicSteps,
            activeIndex: stageIndexMap[status] ?? 0
        };

    }, [status]);

    const totalSteps = steps.length;

    const progressPercent =
        totalSteps > 1
            ? (activeIndex / (totalSteps - 1)) * 100
            : 0;

    return (
        <div
            style={{
                width: "100%",
                background: "#ffffff",
                padding: "28px 16px",
                borderRadius: "6px",
                boxSizing: "border-box",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
        >
            {title && (
                <div
                    style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        marginBottom: "28px",
                        color: "#374151",
                        textAlign: "center"
                    }}
                >
                    {title}
                </div>
            )}

            <div
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                {/* Línea base */}
                <div
                    style={{
                        position: "absolute",
                        top: "23px",
                        left: 0,
                        width: "100%",
                        height: "4px",
                        background: "#e5e7eb",
                        borderRadius: "4px",
                        zIndex: 0
                    }}
                />

                {/* Línea progreso */}
                <div
                    style={{
                        position: "absolute",
                        top: "23px",
                        left: 0,
                        width: `${progressPercent}%`,
                        height: "4px",
                        background: "#3b82f6",
                        borderRadius: "4px",
                        transition: "width 0.4s ease",
                        zIndex: 0
                    }}
                />

                {steps.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isCompleted = index < activeIndex;
                    const StepIcon = step.icon;

                    const color = isActive
                        ? "#10b981"
                        : isCompleted
                            ? "#3b82f6"
                            : "#9ca3af";

                    return (
                        <div
                            key={step.key}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                zIndex: 1
                            }}
                        >
                            <div
                                style={{
                                    width: "46px",
                                    height: "46px",
                                    borderRadius: "14px",
                                    background: isActive ? color : "#fff",
                                    border: `2px solid ${color}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: isActive ? "#fff" : color,
                                    transition: "all 0.3s ease",
                                    transform: isActive ? "scale(1.08)" : "scale(1)"
                                }}
                            >
                                {isCompleted
                                    ? <FaCheck size={16} />
                                    : <StepIcon />}
                            </div>

                            <span
                                style={{
                                    marginTop: "12px",
                                    fontSize: "14px",
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? "#111827" : "#6b7280",
                                    textAlign: "center"
                                }}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GrowthStatusProgress;