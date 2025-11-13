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
                        groupMode="grouped"
                        margin={{ top: 50, right: 130, bottom: 60, left: 60 }}
                        padding={0.3}
                        axisBottom={{
                            legend: `${xLegend}`,
                            legendOffset: 32,
                        }}
                        axisLeft={{
                            legend: yLegend,
                            legendOffset: -40,
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        legends={[
                            {
                                dataFrom: "keys",
                                anchor: "bottom-right",
                                direction: "column",
                                translateX: 120,
                                itemsSpacing: 3,
                                itemWidth: 100,
                                itemHeight: 16,
                                symbolSize: 16,
                                symbolShape: "circle",
                            },
                        ]}
                        tooltip={({ id, value, indexValue }) => (
                            <div
                                style={{
                                    background: "white",
                                    padding: "6px 9px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                }}
                            >
                                <strong>{indexValue}</strong>
                                <br />
                                {id}: {value}
                            </div>
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