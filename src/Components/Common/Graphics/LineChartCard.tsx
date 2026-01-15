import { useState } from "react";
import { Card, CardBody, CardHeader, ButtonGroup, Button } from "reactstrap";
import { ResponsiveLine } from "@nivo/line";
import { FiInbox } from "react-icons/fi";

interface LineChartCardProps {
    stats: any;
    type: "volume" | "extractions" | "pregnancies" | "farrowings" | "abortions" | "inventory";
    title: string;
    yLabel: string;
    color?: string;
    height?: number | string;
}

const LineChartCard = ({
    stats,
    type,
    title,
    yLabel,
    color = "#0d6efd",
    height = 300,
}: LineChartCardProps) => {
    const [view, setView] = useState<"day" | "week" | "month" | "year">("day");

    const mapKey = (period: string) => `${type}By${period.charAt(0).toUpperCase() + period.slice(1)}`;

    const getChartData = () => {
        const key = mapKey(view);
        const dataset = stats?.[key] ?? [];

        const data = dataset.map((v: any) => {
            const id = v._id;
            let label = "";

            if (typeof id === "object" && id.year && id.month)
                label = `${id.month}/${id.year}`;
            else if (typeof id === "object" && id.year && id.week)
                label = `Sem ${id.week}/${id.year}`;
            else if (typeof id === "object" && id.year)
                label = `${id.year}`;
            else
                label = id;

            // Determinar valor según el tipo
            let yValue = 0;
            if (v.totalInseminations !== undefined) yValue = v.totalInseminations;
            else if (v.totalVolume !== undefined) yValue = v.totalVolume;
            else if (v.count !== undefined) yValue = v.count;
            else if (v.totalPregnancies !== undefined) yValue = v.totalPregnancies;
            else if (v.totalFarrowings !== undefined) yValue = v.totalFarrowings;
            else if (v.totalAbortions !== undefined) yValue = v.totalAbortions;

            return {
                x: label,
                y: yValue,
            };
        });

        return [
            {
                id: title,
                color,
                data,
            },
        ];
    };

    const hasData = getChartData()[0].data.some((d: { y: number }) => d.y > 0);

    return (
        <Card className="w-100">
            <CardHeader className="d-flex align-items-center justify-content-between">
                <h4 className="mb-0">{title}</h4>
                <ButtonGroup size="sm">
                    {["day", "week", "month", "year"].map((period) => (
                        <Button
                            key={period}
                            color={view === period ? "primary" : "light"}
                            onClick={() => setView(period as any)}
                        >
                            {period === "day"
                                ? "Día"
                                : period === "week"
                                    ? "Semana"
                                    : period === "month"
                                        ? "Mes"
                                        : "Año"}
                        </Button>
                    ))}
                </ButtonGroup>
            </CardHeader>
            <CardBody
                style={{
                    height,
                    ...(hasData ? {} : { display: "flex", justifyContent: "center", alignItems: "center" }),
                }}
            >
                {hasData ? (
                    <ResponsiveLine
                        data={getChartData()}
                        margin={{ top: 30, right: 30, bottom: 50, left: 60 }}
                        xScale={{ type: "point" }}
                        yScale={{
                            type: "linear",
                            min: "auto",
                            max: "auto",
                            stacked: false,
                        }}
                        axisBottom={{
                            tickRotation: -30,
                            legend: "Período",
                            legendOffset: 40,
                            legendPosition: "middle",
                        }}
                        axisLeft={{
                            legend: yLabel,
                            legendOffset: -50,
                            legendPosition: "middle",
                        }}
                        pointSize={10}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: "serieColor" }}
                        useMesh={true}
                        curve="natural"
                        theme={{
                            text: { fontSize: 12, fill: "#333" },
                            legends: { text: { fontSize: 14 } },
                        }}
                    />
                ) : (
                    <div style={{ textAlign: "center", color: "#888" }}>
                        <FiInbox size={48} style={{ marginBottom: 10 }} />
                        <div>No hay datos disponibles</div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default LineChartCard;