// ========== Cấu hình Google Sheets CSV ==========
const sheetUrl = 'https://docs.google.com/spreadsheets/d/1wB3RpeaXcKxTwFBgb4YwG89gwCko4vayAzfoGf1dTdU/edit?usp=sharing';

// ========== Tạo Map ==========
const map = L.map('map').setView([10.5, 105.1], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let currentImages = [];
let currentIndex = 0;

// ========== Modal ==========
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImage');
const closeModal = document.getElementsByClassName('close')[0];
const prevBtn = document.getElementsByClassName('prev')[0];
const nextBtn = document.getElementsByClassName('next')[0];

closeModal.onclick = () => { modal.style.display = "none"; };

function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImg.src = currentImages[currentIndex];
}
prevBtn.onclick = () => { showModalImage(currentIndex - 1); };
nextBtn.onclick = () => { showModalImage(currentIndex + 1); };

// ========== Load dữ liệu từ Google Sheets ==========
fetch(sheetUrl)
  .then(r => r.text())
  .then(csv => {
    const rows = csv.split('\n').slice(1);
    const features = [];

    rows.forEach(row => {
      if (!row.trim()) return;
      // cắt từng cột, chú ý có thể dùng regex mạnh hơn nếu có dấu phẩy trong mô tả
      const cols = row.split(',');
      const name = cols[0];
      const description = cols[1];
      const lat = parseFloat(cols[2]);
      const lng = parseFloat(cols[3]);
      const images = cols[4] ? (cols[4].includes(';') ? cols[4].split(';') : cols[4].split(',')) : [];

      features.push({
        type: "Feature",
        properties: { name, description, images },
        geometry: { type: "Point", coordinates: [lng, lat] }
      });
    });

    const geojson = { type: "FeatureCollection", features };
    loadMapData(geojson);
  })
  .catch(err => console.error('Lỗi load Google Sheets:', err));

// ========== Hiển thị dữ liệu lên map ==========
function loadMapData(data) {
  L.geoJSON(data, {
    onEachFeature: function (feature, layer) {
      const props = feature.properties;
      let popupContent = `<b>${props.name}</b><br>${props.description}`;
      if (props.images && props.images.length > 0) {
        popupContent += `<div class="popup-images">`;
        props.images.forEach((img, idx) => {
          popupContent += `<img src="${img.trim()}" data-index="${idx}" data-images='${JSON.stringify(props.images)}'>`;
        });
        popupContent += `</div>`;
      }
      layer.bindPopup(popupContent);
      markers.push({ layer: layer, props: props });
    },
    pointToLayer: (feature, latlng) => L.marker(latlng)
  }).addTo(map);

  // click ảnh trong popup mở modal
  map.on('popupopen', function (e) {
    const popup = e.popup._contentNode;
    popup.querySelectorAll('.popup-images img').forEach(imgEl => {
      imgEl.addEventListener('click', () => {
        currentImages = JSON.parse(imgEl.getAttribute('data-images'));
        currentIndex = parseInt(imgEl.getAttribute('data-index'));
        showModalImage(currentIndex);
        modal.style.display = 'block';
      });
    });
  });

  // Render danh sách bên trái
  const placeList = document.getElementById('placeList');
  function renderList(keyword = '') {
    placeList.innerHTML = '';
    markers.forEach(m => {
      if (m.props.name.toLowerCase().includes(keyword.toLowerCase())) {
        const li = document.createElement('li');
        li.textContent = m.props.name;
        li.addEventListener('click', () => {
          map.setView(m.layer.getLatLng(), 15);
          m.layer.openPopup();
        });
        placeList.appendChild(li);
      }
    });
  }
  renderList();

  // Tìm kiếm
  document.getElementById('searchBox').addEventListener('input', function () {
    renderList(this.value);
  });
}
