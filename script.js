// Tạo map Leaflet
const map = L.map('map').setView([10.5, 105.1], 12);

// Thêm tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Lấy dữ liệu GeoJSON
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    const geoLayer = L.geoJSON(data, {
      // Thêm popup có ảnh
const geoLayer = L.geoJSON(data, {
  onEachFeature: function (feature, layer) {
    if (feature.properties && feature.properties.name) {
      const name = feature.properties.name;
      const img = feature.properties.image ?
        `<br><img src="${feature.properties.image}" alt="${name}" style="width:100%;max-width:200px;border-radius:5px;">` : '';
      layer.bindPopup(`<b>${name}</b>${img}`);
    }
  }
}).addTo(map);

    // Hiển thị danh sách
    const listEl = document.getElementById('location-list');
    data.features.forEach((feature, index) => {
      const li = document.createElement('li');
      li.textContent = feature.properties.name;
      li.addEventListener('click', () => {
        const coords = feature.geometry.coordinates;
        map.setView([coords[1], coords[0]], 15);
      });
      listEl.appendChild(li);
    });
  });

// Nút toggle sidebar
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const mapDiv = document.getElementById('map');

  sidebar.classList.toggle('closed');

  if (sidebar.classList.contains('closed')) {
    mapDiv.style.left = '0';
  } else {
    mapDiv.style.left = '250px';
  }

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
});
