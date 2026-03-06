import { ResponsivePie } from '@nivo/pie';
import { Card, CardBody, CardHeader } from 'reactstrap';
import { RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

export interface DonutDataItem {
    id: string;
    label: string;
    value: number;
    color: string;
}

export interface DonutLegendItem {
    label: string;
    value: string | number;
    percentage?: string;
    trend?: 'up' | 'down';
    icon?: React.ReactNode;
}

interface DonutChartCardProps {
    title: string;
    data: DonutDataItem[];
    legendItems?: DonutLegendItem[];
    height?: number;
    innerRadius?: number;
    padAngle?: number;
    cornerRadius?: number;
    enableArcLabels?: boolean;
    enableArcLinkLabels?: boolean;
    className?: string;
    headerBgColor?: string;
}

const DonutChartCard = ({
    title,
    data,
    legendItems,
    height = 300,
    innerRadius = 0.65,
    padAngle = 2,
    cornerRadius = 4,
    enableArcLabels = false,
    enableArcLinkLabels = false,
    className = '',
    headerBgColor = '#f8f9fa',
}: DonutChartCardProps) => {
    return (
        <Card className={`h-100 ${className}`}>
            <CardHeader style={{ backgroundColor: headerBgColor }}>
                <h6 className="mb-0 text-muted">{title}</h6>
            </CardHeader>
            <CardBody>
                <div style={{ height: `${height}px` }}>
                    <ResponsivePie
                        data={data}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        innerRadius={innerRadius}
                        padAngle={padAngle}
                        cornerRadius={cornerRadius}
                        activeOuterRadiusOffset={8}
                        colors={{ datum: 'data.color' }}
                        borderWidth={0}
                        enableArcLabels={enableArcLabels}
                        enableArcLinkLabels={enableArcLinkLabels}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                            from: 'color',
                            modifiers: [['darker', 2]]
                        }}
                        tooltip={({ datum }) => (
                            <div
                                style={{
                                    background: 'white',
                                    padding: '9px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                            >
                                <strong>{datum.label}</strong>: {datum.value}
                            </div>
                        )}
                    />
                </div>

                {legendItems && legendItems.length > 0 && (
                    <div className="mt-3">
                        {legendItems.map((item, index) => (
                            <div
                                key={index}
                                className="d-flex align-items-center justify-content-between py-2"
                                style={{ borderBottom: index < legendItems.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    {item.icon && (
                                        <div style={{ width: '16px', height: '16px' }}>
                                            {item.icon}
                                        </div>
                                    )}
                                    {!item.icon && data[index] && (
                                        <div
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: data[index].color,
                                                borderRadius: '2px',
                                            }}
                                        />
                                    )}
                                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{item.label}</span>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>
                                        {item.value}
                                    </span>
                                    {item.percentage && (
                                        <span
                                            style={{
                                                color: item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : '#6b7280',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '2px',
                                                minWidth: '60px',
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            {item.trend === 'up' && <RiArrowUpLine size={14} />}
                                            {item.trend === 'down' && <RiArrowDownLine size={14} />}
                                            {item.percentage}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default DonutChartCard;
