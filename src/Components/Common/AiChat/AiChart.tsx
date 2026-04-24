import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { ChartSpec } from 'slices/ai/reducer';

interface AiChartProps {
    spec: ChartSpec;
}

const COLORS = [
    '#2563eb', '#16a34a', '#dc2626', '#f59e0b',
    '#7c3aed', '#0891b2', '#db2777', '#65a30d',
];

const AiChart: React.FC<AiChartProps> = ({ spec }) => {
    const { type, title, xLabel, yLabel, unit, series } = spec;

    const { apexType, apexSeries, categories, stacked } = useMemo(() => {
        if (type === 'pie') {
            const data = series[0]?.data ?? [];
            return {
                apexType: 'pie' as const,
                apexSeries: data.map(p => p.y),
                categories: data.map(p => String(p.x)),
                stacked: false,
            };
        }

        const xSet: (string | number)[] = [];
        const seen = new Set<string>();
        series.forEach(s => {
            s.data.forEach(p => {
                const key = String(p.x);
                if (!seen.has(key)) {
                    seen.add(key);
                    xSet.push(p.x);
                }
            });
        });

        const apexSeries = series.map(s => {
            const byX = new Map(s.data.map(p => [String(p.x), p.y]));
            return {
                name: s.name,
                data: xSet.map(x => byX.get(String(x)) ?? 0),
            };
        });

        return {
            apexType: (type === 'line' ? 'line' : 'bar') as 'line' | 'bar',
            apexSeries,
            categories: xSet.map(String),
            stacked: type === 'stacked-bar',
        };
    }, [type, series]);

    const options: ApexOptions = useMemo(() => {
        const fmtY = (v: number) =>
            unit ? `${Number(v).toLocaleString()} ${unit}` : Number(v).toLocaleString();

        const base: ApexOptions = {
            colors: COLORS,
            theme: { mode: 'light' },
            legend: { position: 'bottom' },
            tooltip: { y: { formatter: fmtY } },
            dataLabels: { enabled: false },
        };

        if (title) base.title = { text: title, style: { fontSize: '13px' } };

        if (type === 'pie') {
            return {
                ...base,
                chart: { type: 'pie', toolbar: { show: false } },
                labels: categories,
            };
        }

        const opts: ApexOptions = {
            ...base,
            chart: {
                type: apexType,
                stacked,
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            xaxis: { categories },
            yaxis: {
                labels: { formatter: (v: number) => (unit ? `${v} ${unit}` : String(v)) },
            },
            plotOptions: {
                bar: { borderRadius: 3, columnWidth: '60%' },
            },
        };

        if (apexType === 'line') opts.stroke = { curve: 'smooth', width: 2 };
        if (xLabel) opts.xaxis = { ...opts.xaxis, title: { text: xLabel } };
        if (yLabel) opts.yaxis = { ...(opts.yaxis as any), title: { text: yLabel } };

        return opts;
    }, [type, apexType, stacked, categories, title, xLabel, yLabel, unit]);

    return (
        <div className="ai-chart">
            <ReactApexChart
                options={options}
                series={apexSeries as any}
                type={apexType}
                height={260}
            />
        </div>
    );
};

export default React.memo(AiChart, (prev, next) => prev.spec === next.spec);
