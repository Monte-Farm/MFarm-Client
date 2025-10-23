import { Card, CardBody, CardHeader } from "reactstrap";
import { ResponsiveRadar } from "@nivo/radar";
import { FiInbox } from "react-icons/fi";

interface BoarVolumeRadarProps {
    data: any[];
}

const BoarVolumeRadar = ({ data }: BoarVolumeRadarProps) => {
    const hasData =
        data &&
        data.some((b) =>
            ["avgVolume", "maxVolume", "minVolume", "totalVolume"].some((metric) => b[metric] > 0)
        );

    const metrics = ["avgVolume", "maxVolume", "minVolume", "totalVolume"];

    const metricLabels: { [key: string]: string } = {
        avgVolume: "Promedio",
        maxVolume: "Máximo",
        minVolume: "Mínimo",
        totalVolume: "Total",
    };

    const radarData = metrics.map((metric) => {
        const obj: any = { metric: metricLabels[metric] };
        data.forEach((boar) => {
            obj[boar.code] = boar[metric];
        });
        return obj;
    });

    const keys = data.map((b) => b.code);

    return (
        <Card className="w-100">
            <CardHeader>
                <h4 className="mb-0" style={{ fontSize: "1.3rem", fontWeight: "600" }}>
                    Comparativa de volúmenes por verraco
                </h4>
            </CardHeader>
            <CardBody style={{ height: "350px", ...(hasData ? {} : { display: "flex", justifyContent: "center", alignItems: "center" }), }}>
                {hasData ? (
                    <ResponsiveRadar
                        data={radarData}
                        keys={keys}
                        indexBy="metric"
                        margin={{ top: 50, right: 80, bottom: 50, left: 80 }}
                        borderWidth={2}
                        borderColor={{ from: "color" }}
                        gridShape="circular"
                        gridLabelOffset={20}
                        dotSize={8}
                        dotBorderWidth={2}
                        dotBorderColor={{ from: "color" }}
                        colors={{ scheme: "category10" }}
                        blendMode="multiply"
                        motionConfig="wobbly"
                        theme={{
                            text: { fontSize: 14, fill: "#333" },
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

export default BoarVolumeRadar;