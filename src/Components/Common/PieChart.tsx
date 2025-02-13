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
    colors: ["#FF4560", "#00E396", "#FEB019", "#008FFB"],
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
