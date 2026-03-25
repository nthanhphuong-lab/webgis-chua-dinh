// ===== MAP =====
var map = L.map('map', {
  zoomControl: false // tắt zoom mặc định để custom vị trí
}).setView([10.5, 105.3], 9);

// Thêm zoom control góc phải trên
L.control.zoom({ position: 'topright' }).addTo(map);

// Base layers
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
var satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains: ['mt0','mt1','mt2','mt3']
});

osm.addTo(map);

// Layer control
L.control.layers({
  "Bản đồ": osm,
  "Vệ tinh": satellite
}).addTo(map);

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
  })
  .catch(err => console.error('Không load được data.geojson', err));

// ===== RENDER MAP =====
function renderMap(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(f => {
    let lat = f.geometry.coordinates[1];
    let lng = f.geometry.coordinates[0];

    let popupContent = `
      <b>${f.properties.tendanhSach}</b><br>
      Loại: ${f.properties.loaithanchu}<br>
      Tộc: ${f.properties.toc}<br>
      Địa danh: ${f.properties.diadanh}<br>
      Đề tài: ${f.properties.detai}<br>
      Mã chùa: ${f.properties.machua}<br>
      Địa chỉ: ${f.properties.diachiChiTiet}<br>
      <a href="${f.properties.linkMap}" target="_blank">Xem trên Google Maps</a>
    `;

    let marker = L.marker([lat, lng])
      .bindPopup(popupContent);

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
    li.innerText = f.properties.tendanhSach;

    li.onclick = () => {
      let lat = f.geometry.coordinates[1];
      let lng = f.geometry.coordinates[0];
      map.setView([lat, lng], 15);
      markers.find(m => {
        let pos = m.getLatLng();
        return pos.lat === lat && pos.lng === lng;
      })?.openPopup();
    };

    list.appendChild(li);
  });
}

// ===== SEARCH =====
document.getElementById("search").addEventListener("input", function() {
  let keyword = this.value.toLowerCase();

  let filtered = allData.filter(f =>
    f.properties.tendanhSach.toLowerCase().includes(keyword)
  );

  renderList(filtered);
  renderMap(filtered);
});

// ===== FILTER ATTRIBUTES (theo Loại Thần Chủ) =====
function renderFilter(data) {
  let filterDiv = document.getElementById("filter");
  filterDiv.innerHTML = "";

  let categories = new Set();
  data.forEach(f => {
    if(f.properties.loaithanchu) categories.add(f.properties.loaithanchu);
  });

  categories.forEach(cat => {
    let btn = document.createElement("button");
    btn.innerText = cat;

    btn.onclick = () => {
      let filtered = allData.filter(f => f.properties.loaithanchu === cat);
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
