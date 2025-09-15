const map = L.map('map').setView([10.5, 105.2], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const sidebar = document.getElementById('sidebar');
const toggleButton = document.getElementById('toggleSidebar');
const mapDiv = document.getElementById('map');

toggleButton.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  if (sidebar.classList.contains('collapsed')) {
    mapDiv.style.left = '0';
  } else {
    mapDiv.style.left = '300px';
  }
  setTimeout(() => map.invalidateSize(), 310);
});

// load geojson
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    const locations = data.features;

    const geoLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.description}`);
      }
    }).addTo(map);

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

    document.getElementById('searchInput').addEventListener('input', (e) => {
      const searchText = e.target.value.toLowerCase();
      const filtered = locations.filter(f => f.properties.name.toLowerCase().includes(searchText));
      renderList(filtered);
    });
  })
  .catch(err => console.error(err));
