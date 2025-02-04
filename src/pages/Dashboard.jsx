import React, { useEffect } from "react";
import { Chart, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, LineController, BarElement, BarController, ArcElement, DoughnutController, PieController } from "chart.js";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

// Register the components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  ArcElement,
  DoughnutController,
  PieController // needed for "pie" chart type
);

const Dashboard = () => {
  useEffect(() => {
    const ctx = document.getElementById('lineChart').getContext('2d');
    const lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'Line Chart',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    const ctx2 = document.getElementById('barChart').getContext('2d');
    const barChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'Bar Chart',
            data: [65, 59, 80, 81, 56, 55, 40],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(201, 203, 207, 0.2)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    const ctx3 = document.getElementById("pieChart").getContext("2d");
    const pieChart = new Chart(ctx3, {
      type: "pie",
      data: {
        labels: ["Red", "Blue", "Yellow"],
        datasets: [
          {
            label: "My First Dataset",
            data: [300, 50, 100],
            backgroundColor: ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 205, 86)"],
            hoverOffset: 4
          }
        ]
      }
    });

    // Cleanup chart on component unmount to prevent memory leaks
    return () => {
      if (lineChart) {
        lineChart.destroy();
      }
      if (barChart) {
        barChart.destroy();
      }
      if (pieChart) {
        pieChart.destroy();
      }
    };
  }, []);

  return (
    <>

      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Dashboard</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="index.html">Home</a>
              </li>
              <li className="breadcrumb-item active">Dashboard</li>
            </ol>
          </nav>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Line Chart</h5>
                <canvas id="lineChart" style={{ maxHeight: "400px" }}></canvas>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Bar Chart</h5>
                <canvas id="barChart" style={{ maxHeight: "400px" }}></canvas>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
  <div className="col-lg-12">
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Pie Chart</h5>
        <canvas id="pieChart" style={{ maxHeight: "400px" }}></canvas>
      </div>
    </div>
  </div>
</div>
      </main>

    </>
  );
};

export default Dashboard;
