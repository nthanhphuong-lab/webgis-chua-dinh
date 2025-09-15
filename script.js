// Khởi tạo map
const map = L.map('map').setView([10.5, 105.2], 10);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Sidebar toggle
const sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  if (sidebar.classList.contains('collapsed')) {
    document.getElementById('map').style.width = '100%';
  } else {
    document.getElementById('map').style.width = 'calc(100% - 300px)';
  }
  setTimeout(() => map.invalidateSize(), 310);
});

// Load GeoJSON
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    const locations = data.features;

    // Thêm marker
    const geoLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.description}`);
      }
    }).addTo(map);

    // Hiển thị danh sách bên sidebar
    const locationList = document.getElementById('locationList');
    const renderList = (arr) => {
      locationList.innerHTML = '';
      arr.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature.properties.name;
        li.addEventListener('click', () => {
          map.setView([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 14);
        });
        locationList.appendChild(li);
      });
    };
    renderList(locations);

    // Tìm kiếm
    document.getElementById('searchInput').addEventListener('input', (e) => {
      const searchText = e.target.value.toLowerCase();
      const filtered = locations.filter(f => f.properties.name.toLowerCase().includes(searchText));
      renderList(filtered);
    });
  })
  .catch(err => console.error(err));
