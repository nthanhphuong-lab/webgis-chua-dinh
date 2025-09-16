// Khởi tạo bản đồ
var map = L.map('map', { zoomControl: false }).setView([10.5, 105.1], 9);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Thêm tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Toggle sidebar
var sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', function () {
  sidebar.classList.toggle('hidden');
  setTimeout(() => { map.invalidateSize(); }, 300);
});

// Danh sách marker
var markers = [];

// Modal ảnh lớn
var modal = document.getElementById('imageModal');
var modalImage = document.getElementById('modalImage');
var currentImages = [];
var currentIndex = 0;

document.querySelector('.modal .close').onclick = () => { modal.style.display = 'none'; };
document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);

function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
}

// Biến lưu tuyến đường hiện tại
var currentRoute = null;

// Hàm vẽ tuyến đường
function routeBetween(from, to) {
  if (currentRoute) {
    map.removeControl(currentRoute);
  }
  currentRoute = L.Routing.control({
    waypoints: [from, to],
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    lineOptions: {
      styles: [{ color: 'blue', opacity: 0.7, weight: 5 }]
    },
    createMarker: function() { return null; } // Không tạo marker thêm
  }).addTo(map);
}

// Load GeoJSON
fetch('data.geojson')
  .then(r => r.json())
  .then(data => {
    var geoLayer = L.geoJSON(data, {
      pointToLayer: function(feature, latlng) {
        return L.marker(latlng);
      },
      onEachFeature: function(feature, layer) {
        var props = feature.properties;
        // Popup content
        var popupContent = `<b>${props.name}</b><br>${props.description}`;
        if (props.images && props.images.length > 0) {
          popupContent += `<div class="popup-images">`;
          props.images.forEach((img, idx) => {
            popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(props.images)}'>`;
          });
          popupContent += `</div>`;
        }
        layer.bindPopup(popupContent);
        markers.push({ layer: layer, props: props });
      }
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());

    // Click popup ảnh
    map.on('popupopen', function (e) {
      var popup = e.popup._contentNode;
      popup.querySelectorAll('.popup-images img').forEach(imgEl => {
        imgEl.addEventListener('click', () => {
          currentImages = JSON.parse(imgEl.getAttribute('data-images'));
          currentIndex = parseInt(imgEl.getAttribute('data-index'));
          showModalImage(currentIndex);
          modal.style.display = 'block';
        });
      });
    });

    // Danh sách địa điểm
    var placeList = document.getElementById('placeList');
    function renderList(keyword = '') {
      placeList.innerHTML = '';
      markers.forEach(m => {
        if (m.props.name.toLowerCase().includes(keyword.toLowerCase())) {
          var li = document.createElement('li');
          li.textContent = m.props.name;
          li.style.cursor = 'pointer';
          li.addEventListener('click', () => {
            map.setView(m.layer.getLatLng(), 15);
            m.layer.openPopup();

            // Lấy vị trí hiện tại người dùng và vẽ tuyến đường
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(pos => {
                var from = L.latLng(pos.coords.latitude, pos.coords.longitude);
                var to = m.layer.getLatLng();
                routeBetween(from, to);
              }, () => {
                alert('Không thể lấy vị trí hiện tại.');
              });
            } else {
              alert('Trình duyệt không hỗ trợ định vị.');
            }
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
  })
  .catch(err => console.error('Lỗi load data.geojson:', err));
