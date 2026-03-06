import React from "react";
import { Card, CardBody, CardHeader, Spinner } from "reactstrap";
import { ResponsiveLine } from "@nivo/line";
import { FiInbox, FiTrendingUp } from "react-icons/fi";

interface DataPoint {
    x: string | number;
    y: number;
}

interface Serie {
    id: string;
    data: DataPoint[];
    color?: string;
}

interface BasicLineChartCardProps {
    title: string;
    data: Serie[];
    yLabel: string;
    xLabel?: string;
    height?: number | string;
    color?: string;
    curve?: "basis" | "cardinal" | "catmullRom" | "linear" | "monotoneX" | "monotoneY" | "natural" | "step";
    pointSize?: number;
    strokeWidth?: number;
    enableGrid?: boolean;
    enablePoints?: boolean;
    enableArea?: boolean;
    areaOpacity?: number;
    showTooltip?: boolean;
    formatTooltip?: (point: any) => string;
    showLegend?: boolean;
    legendPosition?: "top" | "bottom" | "left" | "right";
    loading?: boolean;
    error?: string;
    emptyMessage?: string;
    className?: string;
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    theme?: any;
    headerBgColor?: string;
}

const BasicLineChartCard: React.FC<BasicLineChartCardProps> = ({
    title,
    data,
    yLabel,
    xLabel = "Período",
    height = 300,
    color = "#0d6efd",
    curve = "natural",
    pointSize = 6,
    strokeWidth = 2,
    enableGrid = true,
    enablePoints = true,
    enableArea = false,
    areaOpacity = 0.1,
    showTooltip = true,
    formatTooltip,
    showLegend = false,
    legendPosition = "top",
    loading = false,
    error,
    emptyMessage = "No hay datos disponibles",
    className = "",
    margin = { top: 20, right: 20, bottom: 50, left: 60 },
    theme,
    headerBgColor = '#f8f9fa',
}) => {
    // Verificar si hay datos válidos
    const hasData = data.some(serie => serie.data && serie.data.length > 0 && serie.data.some(point => point.y !== null && point.y !== undefined));

    // Formateo por defecto para tooltips
    const defaultFormatTooltip = (point: any) => {
        const value = typeof point.y === 'number' ? point.y.toLocaleString() : point.y;
        return `${point.serieId}: ${value}`;
    };

    // Tema por defecto mejorado
    const defaultTheme = {
        background: "transparent",
        text: {
            fontSize: 12,
            fill: "#6b7280",
            fontFamily: "system-ui, -apple-system, sans-serif",
        },
        axis: {
            ticks: {
                text: {
                    fontSize: 11,
                    fill: "#9ca3af",
                },
            },
            legend: {
                text: {
                    fontSize: 12,
                    fill: "#4b5563",
                    fontWeight: 500,
                },
            },
        },
        grid: {
            line: {
                stroke: "#e5e7eb",
                strokeWidth: 1,
                strokeDasharray: "2 2",
            },
        },
        tooltip: {
            container: {
                background: "rgba(255, 255, 255, 0.95)",
                color: "#1f2937",
                fontSize: 12,
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
            },
        },
        ...theme,
    };

    // Aplicar color a las series si no tienen color definido
    const processedData = data.map(serie => ({
        ...serie,
        color: serie.color || color,
    }));

    if (loading) {
        return (
            <Card className={`w-100 ${className}`}>
                <CardHeader style={{ backgroundColor: headerBgColor }}>
                    <h6 className="mb-0 text-muted">{title}</h6>
                </CardHeader>
                <CardBody style={{ height, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Spinner color="primary" />
                </CardBody>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`w-100 ${className}`}>
                <CardHeader style={{ backgroundColor: headerBgColor }}>
                    <h6 className="mb-0 text-muted">{title}</h6>
                </CardHeader>
                <CardBody style={{ height, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ textAlign: "center", color: "#dc3545" }}>
                        <FiInbox size={48} style={{ marginBottom: 10 }} />
                        <div>{error}</div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (!hasData) {
        return (
            <Card className={`w-100 ${className}`}>
                <CardHeader style={{ backgroundColor: headerBgColor }}>
                    <h6 className="mb-0 text-muted">{title}</h6>
                </CardHeader>
                <CardBody style={{ height, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ textAlign: "center", color: "#9ca3af" }}>
                        <FiInbox size={48} style={{ marginBottom: 10 }} />
                        <div>{emptyMessage}</div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className={`w-100 ${className}`}>
            <CardHeader style={{ backgroundColor: headerBgColor }} className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0 text-muted">{title}</h6>
                {showLegend && (
                    <div className="d-flex align-items-center gap-2">
                        {processedData.map((serie) => (
                            <div key={serie.id} className="d-flex align-items-center gap-1">
                                <div 
                                    style={{ 
                                        width: "12px", 
                                        height: "12px", 
                                        backgroundColor: serie.color,
                                        borderRadius: "2px"
                                    }} 
                                />
                                <small style={{ fontSize: "12px", color: "#6b7280" }}>
                                    {serie.id}
                                </small>
                            </div>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardBody style={{ height, padding: "0 15px 15px 15px" }}>
                <ResponsiveLine
                    data={processedData}
                    margin={margin}
                    xScale={{ type: "point" }}
                    yScale={{
                        type: "linear",
                        min: "auto",
                        max: "auto",
                        stacked: false,
                    }}
                    curve={curve}
                    axisBottom={{
                        tickRotation: -30,
                        legend: xLabel,
                        legendOffset: 40,
                        legendPosition: "middle" as const,
                        tickSize: 5,
                        tickPadding: 5,
                    }}
                    axisLeft={{
                        legend: yLabel,
                        legendOffset: -50,
                        legendPosition: "middle" as const,
                        tickSize: 5,
                        tickPadding: 5,
                        format: (value) => typeof value === 'number' ? value.toLocaleString() : value,
                    }}
                    enableGridX={enableGrid}
                    enableGridY={enableGrid}
                    pointSize={enablePoints ? pointSize : 0}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    pointLabelYOffset={-12}
                    useMesh={showTooltip}
                    enableArea={enableArea}
                    areaOpacity={areaOpacity}
                    lineWidth={strokeWidth}
                    colors={{ datum: "color" }}
                    theme={defaultTheme}
                    animate={true}
                    motionConfig="gentle"
                    legends={showLegend ? [
                        {
                            anchor: legendPosition as any,
                            direction: "row",
                            justify: false,
                            translateX: 0,
                            translateY: legendPosition === "bottom" ? 50 : -50,
                            itemsSpacing: 0,
                            itemDirection: "left-to-right",
                            itemWidth: 80,
                            itemHeight: 20,
                            itemOpacity: 1,
                            symbolSize: 12,
                            symbolShape: "square",
                        },
                    ] : []}
                />
            </CardBody>
        </Card>
    );
};

export default BasicLineChartCard;
