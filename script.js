// Khởi tạo map
const map = L.map('map').setView([10.7, 105.1], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let featureGroup = L.featureGroup().addTo(map);

// Biến lưu để chỉ đường
let routingLine = null;
let startLatLng = null;

// Lấy dữ liệu GeoJSON
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    loadFeatures(data);
  });

function loadFeatures(geojson) {
  const list = document.getElementById('locationList');
  list.innerHTML = '';

  L.geoJSON(geojson, {
    onEachFeature: function (feature, layer) {
      // Danh sách bên trái
      const li = document.createElement('li');
      li.textContent = feature.properties.name;
      li.addEventListener('click', () => {
        map.flyTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 15);
        layer.openPopup();
      });
      list.appendChild(li);

      // Popup slideshow nhỏ
      const imgs = feature.properties.images || [];
      let popupContent = `<h3>${feature.properties.name}</h3>
                          <p>${feature.properties.description}</p>`;
      imgs.forEach((img, i) => {
        popupContent += `<img src="${img}" style="width:100px;cursor:pointer;" onclick="openModal(${JSON.stringify(imgs)},${i})">`;
      });

      // Thêm nút chọn điểm để chỉ đường
      popupContent += `<br><button onclick="selectStart(${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]})">Chọn làm điểm đầu</button>`;
      popupContent += `<button onclick="routeTo(${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]})">Chỉ đường tới đây</button>`;

      layer.bindPopup(popupContent);
      layer.addTo(featureGroup);
    },
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng);
    }
  });
}

// ==== Modal slideshow ảnh lớn ====
let modal = document.getElementById("imageModal");
let modalImg = document.getElementById("modalImage");
let captionText = document.getElementById("caption");
let closeBtn = document.getElementsByClassName("close")[0];
let prevBtn = document.querySelector(".prev");
let nextBtn = document.querySelector(".next");

let currentImages = [];
let currentIndex = 0;

function openModal(images, index) {
  currentImages = images;
  currentIndex = index;
  modal.style.display = "block";
  showImage();
}

function showImage() {
  modalImg.src = currentImages[currentIndex];
  captionText.innerHTML = (currentIndex + 1) + '/' + currentImages.length;
}

closeBtn.onclick = function () {
  modal.style.display = "none";
};

prevBtn.onclick = function () {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  showImage();
};
nextBtn.onclick = function () {
  currentIndex = (currentIndex + 1) % currentImages.length;
  showImage();
};

// ==== Chỉ đường ====
function selectStart(lat, lng) {
  startLatLng = [lat, lng];
  alert('Đã chọn điểm đầu!');
}

function routeTo(lat, lng) {
  if (!startLatLng) {
    alert('Hãy chọn điểm đầu trước');
    return;
  }
  if (routingLine) map.removeLayer(routingLine);

  routingLine = L.polyline([startLatLng, [lat, lng]], {color: 'blue'}).addTo(map);
  map.fitBounds(routingLine.getBounds());
}
