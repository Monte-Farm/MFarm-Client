import { ResponsiveLine } from '@nivo/line';
import { Card, CardBody, CardHeader } from 'reactstrap';

export interface AreaDataPoint {
    x: string | number;
    y: number;
}

export interface AreaSerie {
    id: string;
    data: AreaDataPoint[];
    color?: string;
}

interface StackedAreaChartCardProps {
    title: string;
    data: AreaSerie[];
    height?: number;
    xLabel?: string;
    yLabel?: string;
    curve?: 'basis' | 'cardinal' | 'catmullRom' | 'linear' | 'monotoneX' | 'monotoneY' | 'natural' | 'step' | 'stepAfter' | 'stepBefore';
    enableGridX?: boolean;
    enableGridY?: boolean;
    enableArea?: boolean;
    enablePoints?: boolean;
    pointSize?: number;
    enableSlices?: 'x' | false;
    className?: string;
    colors?: string[];
    axisBottomLegend?: string;
    axisLeftLegend?: string;
    margin?: { top: number; right: number; bottom: number; left: number };
    showLegend?: boolean;
    legendPosition?: 'top' | 'right' | 'bottom' | 'left';
    areaOpacity?: number;
    strokeWidth?: number;
    headerBgColor?: string;
    tooltipType?: 'number' | 'currency' | 'percentage';
}

const StackedAreaChartCard = ({
    title,
    data,
    height = 300,
    xLabel,
    yLabel,
    curve = 'monotoneX',
    enableGridX = true,
    enableGridY = true,
    enableArea = true,
    enablePoints = false,
    pointSize = 6,
    enableSlices = 'x',
    className = '',
    colors,
    axisBottomLegend,
    axisLeftLegend,
    margin = { top: 20, right: 20, bottom: 50, left: 60 },
    showLegend = true,
    legendPosition = 'top',
    areaOpacity = 0.7,
    strokeWidth = 2,
    headerBgColor = '#f8f9fa',
    tooltipType = 'number',
}: StackedAreaChartCardProps) => {
    // Transform data to Nivo format
    const nivoData = data.map(serie => ({
        id: serie.id,
        data: serie.data.map(point => ({
            x: point.x,
            y: point.y
        }))
    }));

    // Get colors from series or use default
    const chartColors = colors || data.map(s => s.color).filter(Boolean) as string[];

    // Validate data
    const hasValidData = nivoData.length > 0 && nivoData.some(serie => 
        serie.data && serie.data.length > 0 && serie.data.some(point => 
            point.y !== null && point.y !== undefined && !isNaN(point.y)
        )
    );

    if (!hasValidData) {
        return (
            <Card className={`w-100 ${className}`}>
                <CardHeader style={{ backgroundColor: headerBgColor }}>
                    <h6 className="mb-0 text-muted">{title}</h6>
                </CardHeader>
                <CardBody style={{ height: typeof height === 'number' ? `${height}px` : height, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ textAlign: "center", color: "#9ca3af" }}>
                        <div style={{ fontSize: "14px" }}>No hay datos disponibles</div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // Format tooltip based on type
    const formatTooltip = (value: number) => {
        switch (tooltipType) {
            case 'currency':
                return `$${value.toLocaleString()}`;
            case 'percentage':
                return `${value.toFixed(1)}%`;
            default:
                return value.toLocaleString();
        }
    };

    return (
        <Card className={`w-100 ${className}`}>
            <CardHeader style={{ backgroundColor: headerBgColor }}>
                <h6 className="mb-0 text-muted">{title}</h6>
            </CardHeader>
            <CardBody style={{ height: typeof height === 'number' ? `${height}px` : height, padding: "0 15px 15px 15px" }}>
                <ResponsiveLine
                    data={nivoData}
                    margin={margin}
                    xScale={{ type: 'point' }}
                    yScale={{
                        type: 'linear',
                        min: 0,
                        max: 'auto',
                        stacked: true,
                        reverse: false
                    }}
                    curve={curve}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: axisBottomLegend || xLabel,
                        legendOffset: 36,
                        legendPosition: 'middle'
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: axisLeftLegend || yLabel,
                        legendOffset: -50,
                        legendPosition: 'middle'
                    }}
                    enableGridX={enableGridX}
                    enableGridY={enableGridY}
                    colors={chartColors.length > 0 ? chartColors : { scheme: 'nivo' }}
                    lineWidth={strokeWidth}
                    pointSize={pointSize}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    enableArea={enableArea}
                    areaOpacity={areaOpacity}
                    enablePoints={enablePoints}
                    enableSlices={enableSlices}
                    useMesh={true}
                    tooltip={(point: any) => {
                        if (!point) return null;
                        
                        const value = point.y || point.data?.y || 0;
                        const label = point.seriesId || point.data?.serieId || 'Value';
                        const color = point.seriesColor || point.color || '#000';
                        
                        return (
                            <div
                                style={{
                                    background: 'white',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    fontSize: '12px'
                                }}
                            >
                                <div style={{ color, fontWeight: 'bold' }}>
                                    {label}: {formatTooltip(value)}
                                </div>
                            </div>
                        );
                    }}
                    legends={showLegend ? [
                        {
                            anchor: legendPosition as any,
                            direction: legendPosition === 'top' || legendPosition === 'bottom' ? 'row' : 'column',
                            justify: false,
                            translateX: legendPosition === 'right' ? 100 : legendPosition === 'left' ? -100 : 0,
                            translateY: legendPosition === 'bottom' ? 50 : legendPosition === 'top' ? -50 : 0,
                            itemsSpacing: 0,
                            itemDirection: 'left-to-right',
                            itemWidth: 80,
                            itemHeight: 20,
                            itemOpacity: 0.75,
                            symbolSize: 12,
                            symbolShape: 'circle',
                            symbolBorderColor: 'rgba(0, 0, 0, .5)',
                            effects: [
                                {
                                    on: 'hover',
                                    style: {
                                        itemBackground: 'rgba(0, 0, 0, .03)',
                                        itemOpacity: 1
                                    }
                                }
                            ]
                        }
                    ] : []}
                />
            </CardBody>
        </Card>
    );
};

export default StackedAreaChartCard;
