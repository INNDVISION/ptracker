const socket = io();
let trackingData = [];
let trackingStartTime = null;
let trackingInterval = null;

function updateData(data) {
  document.getElementById('timestamp').innerHTML = new Date(data.timestamp).toLocaleString();
  document.getElementById('pm25').innerHTML = data.pm25;
  document.getElementById('pm10').innerHTML = data.pm10;
  document.getElementById('coordinates').innerHTML = `${data.latitude}, ${data.longitude}`;
  document.getElementById('device_temp').innerHTML = data.device_temp;
  document.getElementById('real_temp').innerHTML = data.real_temp;
  document.getElementById('humidity').innerHTML = data.humidity;

  updatePmStatus(data.pm25, data.pm10); // Update PM status
  updateMap(data.latitude, data.longitude);

  if (trackingStartTime) {
    trackingData.push(data);
    updateHistory();
  }
}


function toggleHistory() {
  const history = document.querySelector('.history');
  const toggleButton = document.getElementById('toggle-history');
  if (history.style.display === 'none' || history.style.display === '') {
    history.style.display = 'block';
    toggleButton.textContent = 'Hide History';
  } else {
    history.style.display = 'none';
    toggleButton.textContent = 'Show History';
  }
}

function updateHistory() {
  const historyBody = document.getElementById('history-body');
  historyBody.innerHTML = '';

  trackingData.forEach(data => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(data.timestamp).toLocaleString()}</td>
      <td>${data.pm25}</td>
      <td>${data.pm10}</td>
      <td>${data.latitude}, ${data.longitude}</td>
      <td>${data.real_temp}</td>
    `;
    historyBody.appendChild(row);
  });
}

function startTracking() {
  resetMap(); // Reset the map when tracking starts
  trackingStartTime = new Date();
  trackingData = [];
  document.getElementById('start-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;

  trackingInterval = setInterval(() => {
    const elapsed = new Date() - trackingStartTime;
    document.getElementById('timer').textContent = new Date(elapsed).toISOString().substr(11, 8);
  }, 1000);
}

function stopTracking() {
  clearInterval(trackingInterval);
  document.getElementById('start-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;

  let sumPm25 = 0;
  let sumPm10 = 0;
  trackingData.forEach(data => {
    sumPm25 += data.pm25;
    sumPm10 += data.pm10;
  });

  const avgPm25 = sumPm25 / trackingData.length;
  const avgPm10 = sumPm10 / trackingData.length;

  document.getElementById('avg-pm25').textContent = `Average PM2.5: ${avgPm25.toFixed(2)} µg/m³`;
  document.getElementById('avg-pm10').textContent = `Average PM10: ${avgPm10.toFixed(2)} µg/m³`;
}

function toggleApiData() {
  const apiDataSection = document.querySelector('.api-data');
  const toggleButton = document.getElementById('toggle-api-data');
  if (apiDataSection.style.display === 'none' || apiDataSection.style.display === '') {
    apiDataSection.style.display = 'block';
    toggleButton.textContent = 'Hide All Data';
    fetchApiData();
  } else {
    apiDataSection.style.display = 'none';
    toggleButton.textContent = 'Show All Data';
  }
}

function fetchApiData() {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      const apiDataBody = document.getElementById('api-data-body');
      apiDataBody.innerHTML = '';
      data.forEach(dataItem => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(dataItem.timestamp).toLocaleString()}</td>
          <td>${dataItem.pm25}</td>
          <td>${dataItem.pm10}</td>
          <td>${dataItem.latitude}, ${dataItem.longitude}</td>
          <td>${dataItem.real_temp}</td>
          <td>${dataItem.humidity}</td>
        `;
        apiDataBody.appendChild(row);
      });
    })
    .catch(error => console.error('Error fetching data:', error));
}


function updatePmStatus(pm25, pm10) {
  let pm25Status = pm25 <= 12 ? 'Safe' : 'Unsafe';
  let pm10Status = pm10 <= 50 ? 'Safe' : 'Unsafe';

  document.getElementById('pm-status').textContent = 
    `Current status of Particulate Matter: PM2.5 = ${pm25Status}, PM10 = ${pm10Status}`;
}

document.getElementById('start-btn').addEventListener('click', startTracking);
document.getElementById('stop-btn').addEventListener('click', stopTracking);
document.getElementById('toggle-history').addEventListener('click', toggleHistory);
document.getElementById('toggle-api-data').addEventListener('click', toggleApiData);

socket.on('newData', (data) => {
  updateData(data);
});

fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    if (data.length > 0) {
      updateData(data[0]);
    }
  })
  .catch(error => console.error('Error fetching data:', error));
