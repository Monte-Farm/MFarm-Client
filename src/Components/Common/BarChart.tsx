import React from "react";
import ReactApexChart from "react-apexcharts";

interface BarChartProps {
  series: Array<{ name: string; data: number[] }>;
  categories: string[];
  title: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ series, categories, title }) => {
  const options = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        endingShape: "rounded",
      },
    },
    colors: ["#6B8E23"],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    title: {
      text: title,
      align: "left",
      style: { fontWeight: 500 },
    },
    xaxis: { categories },
    tooltip: { enabled: true },
  };

  return (
    <ReactApexChart options={options} series={series} type="bar" height="100%" className="apex-charts" />
  );
};

export default BarChart;
