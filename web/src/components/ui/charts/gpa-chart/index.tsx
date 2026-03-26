"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function GpaChart() {
  const data = {
    labels: ["L100 S1", "L100 S2", "L200 S1", "L200 S2", "L300 S1", "Today"],
    datasets: [
      {
        fill: true,
        label: 'Semester GPA',
        data: [3.20, 3.45, 3.40, 3.70, 3.82, 3.86],
        borderColor: '#4a0404', // UENR Brown
        backgroundColor: 'rgba(74, 4, 4, 0.05)', // Faint Brown Fill
        tension: 0.4, // Smoothes the line
        pointBackgroundColor: '#fff',
        pointBorderColor: '#4a0404',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Clean look, no legend needed
      },
      tooltip: {
        backgroundColor: '#4a0404',
        titleFont: { size: 10, weight: 'bold' as const, family: 'Lato' },
        bodyFont: { size: 12, weight: 'bold' as const, family: 'Roboto' },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `GPA: ${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 4.0,
        ticks: {
          stepSize: 1,
          font: { size: 9, weight: 'bold' as const },
          color: '#cbd5e1',
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.3)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          font: { size: 9, weight: 'bold' as const },
          color: '#94a3b8',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="w-full h-48 py-2">
      <Line data={data} options={options} />
    </div>
  );
}