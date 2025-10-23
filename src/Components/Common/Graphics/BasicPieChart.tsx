import { Card, CardHeader, CardBody } from "reactstrap";
import { ResponsivePie } from "@nivo/pie";
import { FiInbox } from "react-icons/fi";

interface BasicPieChartProps {
    title: string;
    data: { id: string; value: number }[];
    height?: number | string;
    colorScheme?: string;
}

const BasicPieChart = ({
    title,
    data,
    height = 300,
}: BasicPieChartProps) => {
    const hasData = data && data.some(d => d.value > 0);

    return (
        <Card className="w-100">
            <CardHeader>
                <h5 className="mb-0">{title}</h5>
            </CardHeader>
            <CardBody style={{ height, ...(hasData ? {} : { display: "flex", justifyContent: "center", alignItems: "center" }), }}>
                {hasData ? (
                    <ResponsivePie
                        data={data}
                        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                        innerRadius={0.5}
                        padAngle={1}
                        cornerRadius={3}
                        borderWidth={1}
                        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: "color" }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                        tooltip={({ datum }) => <strong>{datum.id}: {datum.value}</strong>}
                    />
                ) : (
                    <div style={{ textAlign: "center", color: "#888" }}>
                        <FiInbox size={48} style={{ marginBottom: 10 }} />
                        <div>No hay datos disponibles</div>
                    </div>
                )}
            </CardBody>
        </Card >
    );
};

export default BasicPieChart;