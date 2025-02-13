import React from "react";
import ReactApexChart from "react-apexcharts";

interface AreaChartProps {
  series: Array<{ name: string; data: number[] }>;
  categories: string[];
  title: string;
  height?: number;
}

const AreaChart: React.FC<AreaChartProps> = ({ series, categories, title }) => {
  const options = {
    chart: { type: "area", toolbar: { show: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    colors: ["#775DD0"],
    title: {
      text: title,
      align: "left",
      style: { fontWeight: 500 },
    },
    xaxis: { categories },
    tooltip: { enabled: true },
  };

  return (
    <ReactApexChart options={options} series={series} type="area" height="100%" className="apex-charts" />
  );
};

export default AreaChart;
