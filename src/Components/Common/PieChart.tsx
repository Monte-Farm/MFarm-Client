import React from "react";
import ReactApexChart from "react-apexcharts";

interface PieChartProps {
  series: number[];
  labels: string[];
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ series, labels, title }) => {
  const options = {
    chart: { type: "pie" },
    labels,
    colors: ["#2F4F4F", "#F5F5DC", "#8B4513", "#6B8E23"],
    title: {
      text: title,
      align: "left",
      style: { fontWeight: 500 },
    },
    legend: { position: "bottom" },
    tooltip: { enabled: true },
  };

  return (
    <ReactApexChart options={options} series={series} type="pie" height="100%" className="apex-charts" />
  );
};

export default PieChart;
