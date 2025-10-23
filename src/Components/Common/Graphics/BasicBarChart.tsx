import { Card, CardHeader, CardBody } from "reactstrap";
import { ResponsiveBar } from "@nivo/bar";
import { FiInbox } from "react-icons/fi";

interface BasicBarChartProps {
    title: string;
    data: any[];
    indexBy: string;
    keys: string[];
    xLegend?: string;
    yLegend?: string;
    height?: number | string;
}

const BasicBarChart = ({
    title,
    data,
    indexBy,
    keys,
    xLegend = "Categoría",
    yLegend = "Valor",
    height = 300,
}: BasicBarChartProps) => {
    const hasData = data && data.length > 0;

    return (
        <Card className="w-100">
            <CardHeader>
                <h5 className="mb-0">{title}</h5>
            </CardHeader>
            <CardBody
                style={{ height, ...(hasData ? {} : { display: "flex", justifyContent: "center", alignItems: "center" }), }}>
                {hasData ? (
                    <ResponsiveBar
                        data={data}
                        keys={keys}
                        indexBy={indexBy}
                        margin={{ top: 40, right: 40, bottom: 60, left: 60 }}
                        padding={0.3}
                        axisBottom={{
                            tickRotation: -45,
                            legend: xLegend,
                            legendPosition: "middle",
                            legendOffset: 45,
                        }}
                        axisLeft={{
                            legend: yLegend,
                            legendPosition: "middle",
                            legendOffset: -50,
                        }}
                        tooltip={({ id, value, indexValue }) => (
                            <strong>{indexValue}: {value}</strong>
                        )}
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

export default BasicBarChart;