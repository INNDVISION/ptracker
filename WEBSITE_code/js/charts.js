let airQualityChart;

function initChart() {
  const ctx = document.getElementById('airQualityChart').getContext('2d');
  airQualityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'PM2.5 (µg/m³)',
          data: [],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 1,
          fill: false
        },
        {
          label: 'PM10 (µg/m³)',
          data: [],
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderWidth: 1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute'
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Concentration (µg/m³)'
          }
        }
      }
    }
  });
}

function updateChart(data) {
  if (!airQualityChart) {
    initChart();
  }

  const timestamps = data.map(entry => new Date(entry.timestamp).toLocaleString());
  const pm25Values = data.map(entry => entry.pm25);
  const pm10Values = data.map(entry => entry.pm10);

  airQualityChart.data.labels = timestamps;
  airQualityChart.data.datasets[0].data = pm25Values;
  airQualityChart.data.datasets[1].data = pm10Values;
  airQualityChart.update();
}

fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    updateChart(data);
  })
  .catch(error => console.error('Error fetching data:', error));
