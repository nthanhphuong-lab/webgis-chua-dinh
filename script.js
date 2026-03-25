// ===== MAP =====
var map = L.map('map').setView([10.5, 105.3], 10);

// Base layer
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
osm.addTo(map);

// ===== GLOBAL =====
let allData = [];
let markers = [];

// ===== LOAD DATA =====
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    allData = data.features;
    renderList(allData);
    renderMap(allData);
    renderFilter(allData);
  });

// ===== RENDER MAP =====
function renderMap(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(f => {
    let lat = f.geometry.coordinates[1];
    let lng = f.geometry.coordinates[0];

    // Popup chi tiết
    let popupContent = `<b>${f.properties.name}</b><br>
                        <b>Loại:</b> ${f.properties.type} - ${f.properties.subtype}<br>
                        <b>Địa chỉ:</b> ${f.properties.address}<br>
                        <b>Lịch sử:</b> ${f.properties.history}<br>
                        <b>Văn hóa:</b> ${f.properties.culture}<br>
                        <b>Kiến trúc:</b> ${f.properties.architecture}<br>`;

    if (f.properties.attributes) {
      popupContent += "<b>Chi tiết:</b><br>";
      f.properties.attributes.forEach(attr => {
        popupContent += `${attr.category}: ${attr.name} <br>`;
      });
    }

    let marker = L.marker([lat, lng]).bindPopup(popupContent);
    marker.addTo(map);
    markers.push(marker);
  });
}

// ===== RENDER LIST =====
function renderList(data) {
  let list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(f => {
    let li = document.createElement("li");
    li.innerText = f.properties.name;

    li.onclick = () => {
      let lat = f.geometry.coordinates[1];
      let lng = f.geometry.coordinates[0];
      map.setView([lat, lng], 15);
      markers.find(m => m.getLatLng().lat === lat && m.getLatLng().lng === lng)
             .openPopup();
    };

    list.appendChild(li);
  });
}

// ===== SEARCH =====
document.getElementById("search").addEventListener("input", function() {
  let keyword = this.value.toLowerCase();
  let filtered = allData.filter(f =>
    f.properties.name.toLowerCase().includes(keyword) ||
    f.properties.type.toLowerCase().includes(keyword) ||
    f.properties.subtype.toLowerCase().includes(keyword)
  );
  renderList(filtered);
  renderMap(filtered);
});

// ===== FILTER ATTRIBUTES =====
function renderFilter(data) {
  let filterDiv = document.getElementById("filter");
  filterDiv.innerHTML = "";

  let categories = new Set();
  data.forEach(f => {
    if (f.properties.attributes) {
      f.properties.attributes.forEach(a => categories.add(a.category));
    }
  });

  categories.forEach(cat => {
    let btn = document.createElement("button");
    btn.innerText = cat;
    btn.onclick = () => {
      let filtered = allData.filter(f =>
        f.properties.attributes &&
        f.properties.attributes.some(a => a.category === cat)
      );
      renderList(filtered);
      renderMap(filtered);
    };
    filterDiv.appendChild(btn);
  });

  // Reset button
  let reset = document.createElement("button");
  reset.innerText = "Tất cả";
  reset.onclick = () => {
    renderList(allData);
    renderMap(allData);
  };
  filterDiv.appendChild(reset);
}

// ===== SIDEBAR TOGGLE =====
document.getElementById("toggleBtn").onclick = () => {
  document.getElementById("sidebar").classList.toggle("hidden");
};
