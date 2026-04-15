import { useEffect, useState, useContext } from "react";
import { Card, CardBody, CardHeader } from "reactstrap";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { ResponsiveLine } from "@nivo/line";
import { ConfigContext } from "App";
import { FaArrowRight, FaChartLine } from "react-icons/fa";

interface Props {
    entityId: string;
    mode: "group" | "individual";
    title?: string;
}

const WeightEvolutionChart = ({ entityId, mode, title }: Props) => {
    const configContext = useContext(ConfigContext);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [from, setFrom] = useState<Date>(firstDayOfMonth);
    const [to, setTo] = useState<Date>(now);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchEvolution = async () => {
        if (!configContext || !entityId) return;
        if (from > to) return;

        setLoading(true);

        try {
            const endpoint =
                mode === "group"
                    ? `/weighing/group_evolution/${entityId}`
                    : `/weighing/pig_evolution/${entityId}`;

            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}${endpoint}`,
                { from: from.toISOString(), to: to.toISOString() }
            );

            const rawData = Array.isArray(res.data)
                ? res.data
                : res.data.data || [];

            const evolution = rawData.map((w: any) => ({
                x: new Date(w.weighedAt).toLocaleDateString(),
                y: Number(w.weight.toFixed(2)),
            }));

            setData([
                {
                    id: mode === "group" ? "Peso promedio" : "Peso",
                    data: evolution,
                },
            ]);
        } catch (error) {
            console.error("Error fetching weight evolution:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvolution();
    }, [from, to, entityId, mode]);

    const hasData = data.length > 0 && data[0]?.data?.length > 0;

    return (
        <Card className="w-100 h-100 shadow border-0">
            <CardHeader className="bg-white border-0 pb-0">
                <div className="d-flex flex-column gap-3">

                    {/* Título */}
                    <h5 className="mb-0 fw-semibold text-dark">
                        {title ||
                            (mode === "group"
                                ? "Evolución Grupal"
                                : "Evolución Individual")}
                    </h5>

                    {/* Rango de fechas con icono central */}
                    <div className="d-flex align-items-center gap-3">
                        <Flatpickr
                            value={from}
                            options={{ dateFormat: "Y-m-d" }}
                            className="form-control rounded-3 shadow-sm"
                            onChange={([date]) => setFrom(date)}
                        />

                        <FaArrowRight
                            size={18}
                            className="text-muted"
                            style={{ opacity: 0.7 }}
                        />

                        <Flatpickr
                            value={to}
                            options={{ dateFormat: "Y-m-d" }}
                            className="form-control rounded-3 shadow-sm"
                            onChange={([date]) => setTo(date)}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardBody style={{ height: 360 }}>
                {loading ? (
                    <div className="h-100 d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-primary" />
                    </div>
                ) : hasData ? (
                    <ResponsiveLine
                        data={data}
                        margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
                        xScale={{ type: "point" }}
                        yScale={{
                            type: "linear",
                            min: "auto",
                            max: "auto",
                            stacked: false,
                        }}
                        curve="monotoneX"
                        axisBottom={{
                            tickRotation: -35,
                            legend: "Fecha",
                            legendOffset: 50,
                            legendPosition: "middle",
                        }}
                        axisLeft={{
                            legend: "Peso (kg)",
                            legendOffset: -50,
                            legendPosition: "middle",
                            format: (value) => value.toFixed(2),
                        }}
                        pointSize={8}
                        pointBorderWidth={2}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        enableGridX={false}
                        colors={{ scheme: "category10" }}
                        tooltip={({ point }) => (
                            <div className="bg-white p-2 shadow rounded-3 border">
                                <strong>{point.data.xFormatted}</strong>
                                <div>{Number(point.data.y).toFixed(2)} kg</div>
                            </div>
                        )}
                    />
                ) : (
                    <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted text-center">
                        <FaChartLine
                            size={50}
                            className="mb-3"
                            style={{ opacity: 0.4 }}
                        />
                        <span className="fw-medium">
                            No hay registros de pesaje para este periodo
                        </span>
                        <small className="text-muted">
                            Ajusta el rango de fechas para visualizar datos
                        </small>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default WeightEvolutionChart;
