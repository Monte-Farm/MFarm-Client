import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "./ChartsDynamicColor";

interface LineChartProps {
  dataColors: string;
  series: Array<{ name: string; data: number[] }>;
  categories: string[];
  title: string;
  height?: number;
  zoomEnabled?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  dataColors,
  series,
  categories,
  title,
  zoomEnabled = true,
}) => {
  const lineChartColors = getChartColorsArray(dataColors);

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
      enabled: false,
    },
    stroke: {
      curve: 'straight',
    },
    colors: lineChartColors,
    title: {
      text: title,
      align: 'left',
      style: {
        fontWeight: 500,
      },
    },
    xaxis: {
      categories: categories,
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
