import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Chart = ({ symbol, history = [] }) => {
  // Trích xuất ngày làm nhãn và giá đóng cửa làm dữ liệu biểu đồ
  const labels = history.map(h => h.date);
  const prices = history.map(h => h.price);

  // Dữ liệu fallback nếu không có lịch sử
  const chartLabels = labels.length > 0 ? labels : ['9:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];
  const chartData = prices.length > 0 ? prices : [145, 146.5, 145.8, 148, 147.2, 149, 150];

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: `Giá ${symbol}`,
        data: chartData,
        borderColor: '#00f2fe',
        backgroundColor: 'rgba(0, 242, 254, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#0b0f19',
        pointBorderColor: '#00f2fe',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11, 15, 25, 0.9)',
        titleColor: '#fff',
        bodyColor: '#00f2fe',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `$${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
        ticks: { color: '#90a4ae' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { color: '#90a4ae', callback: (value) => `$${value}` }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return <div style={{ height: '400px', width: '100%' }}><Line options={options} data={data} /></div>;
};

export default Chart;
