import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "./ChartsDynamicColor";

interface LineChartProps {
  series: Array<{ name: string; data: number[] }>;
  categories: string[];
  title: string;
  height?: number;
  zoomEnabled?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  series,
  categories,
  title,
  zoomEnabled = true,
}) => {
  const options = {
    chart: {
      type: 'line',
      zoom: {
        enabled: zoomEnabled,
      },
      toolbar: {
        show: false,
      },
    },
    markers: {
      size: 4,
    },
    dataLabels: {
      enabled: true,
    },
    stroke: {
      curve: 'straight',
    },
    colors: ['#8B4513'],
    title: {
      text: title,
      align: 'left',
      style: {
        fontWeight: 500,
      },
    },
    xaxis: {
      categories: categories,
    },
    tooltip: {
      enabled: false
    }
  };

  return (
    <React.Fragment>
      <ReactApexChart
        dir="ltr"
        options={options}
        series={series}
        type="line"
        height='100%'
        className="apex-charts"
      />
    </React.Fragment>
  );
};

export default LineChart;
