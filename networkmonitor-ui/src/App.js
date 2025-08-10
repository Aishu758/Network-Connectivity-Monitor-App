import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, TimeScale, Tooltip, Legend);

function App() {
  const [logs, setLogs] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const prevStatusMessage = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get("https://localhost:8080/api/logs");
        setLogs(response.data);
        localStorage.setItem("cachedLogs", JSON.stringify(response.data));
      } catch (error) {
        console.error(error);
        const cached = localStorage.getItem("cachedLogs");
        if (cached) {
          setLogs(JSON.parse(cached));
        }
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      const latest = logs[logs.length - 1];

      if (
        prevStatusMessage.current !== null &&
        prevStatusMessage.current !== latest.statusMessage
      ) {
        if (
          latest.statusMessage.toLowerCase().includes("lost") ||
          latest.statusMessage.toLowerCase().includes("disconnected")
        ) {
          toast.error(`⚠️ ${latest.statusMessage} at ${latest.timestamp}`);
        } else if (latest.statusMessage.toLowerCase().includes("restored")) {
          toast.success(`✅ ${latest.statusMessage} at ${latest.timestamp}`);
        }
      }
      prevStatusMessage.current = latest.statusMessage;
    }
  }, [logs]);

  const chartData = {
    labels: logs.map((log) => new Date(log.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Signal Strength",
        data: logs.map((log) => log.signalStrength ?? 0),
        borderColor: "rgba(220, 53, 69, 1)", // Bootstrap danger red
        backgroundColor: "rgba(220, 53, 69, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#fff",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#fff" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#fff" },
      },
    },
  };

  return (
    <div className={`container mt-4 ${showGraph ? "dark-mode" : ""}`}>
      <h2 className="mb-4 text-center text-black">Connectivity Status Dashboard</h2>

      <div className="text-center mb-4">
        <button
          className="btn btn-outline-danger"
          onClick={() => setShowGraph((prev) => !prev)}
        >
          {showGraph ? "Show Table" : "Show Graph"}
        </button>
      </div>

      {logs.length > 0 && !logs[logs.length - 1].connected && (
        <div className="alert alert-danger text-center">
          Connection lost at {logs[logs.length - 1].timestamp}
        </div>
      )}

      {logs.length > 0 && logs[logs.length - 1].statusMessage === "Connection restored" && (
        <div className="alert alert-success text-center">
          Connection restored at {logs[logs.length - 1].timestamp}
        </div>
      )}

      {showGraph ? (
        <div className="graph-wrapper bg-dark p-3 rounded shadow">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-bordered table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Connected</th>
                <th>Timestamp</th>
                <th>IP Address</th>
                <th>Network Type</th>
                <th>Signal Strength</th>
                <th>Status Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.connected ? "Yes" : "No"}</td>
                  <td>{log.timestamp}</td>
                  <td>{log.ipAddress}</td>
                  <td>{log.networkType}</td>
                  <td>{log.signalStrength ?? "-"}</td>
                  <td>{log.statusMessage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ToastContainer position="top-right" />
    </div>
  );
}

export default App;
