import { Card, CardBody, CardHeader } from "reactstrap";
import { ResponsiveBar, BarDatum } from "@nivo/bar";
import { FaWeightHanging } from "react-icons/fa";

interface DistributionItem extends BarDatum {
    range: string;
    count: number;
}

interface Props {
    data: DistributionItem[];
    title?: string;
}

const WeightDistributionChart = ({ data, title }: Props) => {
    const hasData =
        data &&
        data.length > 0 &&
        data.some((d) => d.count > 0);

    return (
        <Card className="w-100 h-100 shadow border-0">
            <CardHeader className="bg-white border-0 pb-0">
                <h5 className="mb-0 fw-semibold text-dark">
                    {title || "Distribución de Peso"}
                </h5>
            </CardHeader>

            <CardBody style={{ height: 360 }}>
                {hasData ? (
                    <ResponsiveBar
                        data={data}
                        keys={["count"]}
                        indexBy="range"
                        margin={{ top: 30, right: 30, bottom: 70, left: 60 }}
                        padding={0.3}
                        borderRadius={8}
                        enableLabel={false}
                        axisBottom={{
                            tickRotation: -35,
                            legend: "Rango de Peso (kg)",
                            legendOffset: 55,
                            legendPosition: "middle",
                        }}
                        axisLeft={{
                            legend: "Cantidad",
                            legendOffset: -50,
                            legendPosition: "middle",
                        }}
                        colors={{ scheme: "nivo" }}
                        animate={true}
                        enableGridX={false}
                        tooltip={({ data }) => {
                            const item = data as DistributionItem;
                            return (
                                <div className="bg-white p-2 shadow rounded-3 border">
                                    <strong>{item.range}</strong>
                                    <div>{item.count} cerdos</div>
                                </div>
                            );
                        }}
                    />
                ) : (
                    <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                        <FaWeightHanging
                            className="mb-3"
                            style={{ fontSize: "3rem", opacity: 0.5 }}
                        />
                        <span>No hay datos de distribución disponibles</span>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default WeightDistributionChart;
