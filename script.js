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
var modalTitle = document.getElementById('modalTitle');
var modalDesc = document.getElementById('modalDesc');
var currentImages = [];
var currentIndex = 0;
var routeControl = null;

document.querySelector('.modal .close').onclick = () => { modal.style.display = 'none'; };
document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);

function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
}

// Vị trí người dùng
var userLatLng = null;
navigator.geolocation.getCurrentPosition(pos => {
  userLatLng = [pos.coords.latitude, pos.coords.longitude];
}, err => {
  console.warn("Không thể lấy vị trí hiện tại:", err.message);
});

// Hàm vẽ/xóa đường
function drawRoute(fromLatLng, toLatLng) {
  if (routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }
  routeControl = L.Routing.control({
    waypoints: [
      L.latLng(fromLatLng[0], fromLatLng[1]),
      L.latLng(toLatLng.lat, toLatLng.lng)
    ],
    lineOptions: {
      styles: [{ color: 'blue', weight: 5 }]
    },
    createMarker: () => null,
    addWaypoints: false,
    draggableWaypoints: false
  }).addTo(map);
}

// Load GeoJSON
fetch('data.geojson')
  .then(r => r.json())
  .then(data => {
    var geoLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng);
      },
      onEachFeature: function (feature, layer) {
        var props = feature.properties;
        // Popup content
        var popupContent = `<b>${props.name}</b><br>${props.description}`;
        if (props.images && props.images.length > 0) {
          popupContent += `<div class="popup-images">`;
          props.images.forEach((img, idx) => {
            popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(props.images)}' style="cursor:pointer;width:50px;margin:2px;">`;
          });
          popupContent += `</div>`;
        }
        popupContent += `
        <div style="margin-top:5px;">
          <button class="popup-route-btn" style="background:#007bff;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Chỉ đường</button>
          <button class="popup-clearroute-btn" style="background:#f44336;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;margin-left:5px;">Xóa đường</button>
        </div>`;
        layer.bindPopup(popupContent);
        markers.push({ layer: layer, props: props });
      }
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());

    // Click popup
    map.on('popupopen', function (e) {
      var popup = e.popup._contentNode;

      // Ảnh trong popup → mở modal slideshow
      popup.querySelectorAll('.popup-images img').forEach(imgEl => {
        imgEl.addEventListener('click', () => {
          currentImages = JSON.parse(imgEl.getAttribute('data-images'));
          currentIndex = parseInt(imgEl.getAttribute('data-index'));
          showModalImage(currentIndex);
          modal.style.display = 'block';
        });
      });

      // Nút Chỉ đường
      var routeBtn = popup.querySelector('.popup-route-btn');
      if (routeBtn) {
        routeBtn.onclick = () => {
          if (!userLatLng) return alert("Không xác định được vị trí hiện tại!");
          drawRoute(userLatLng, e.popup._latlng);
        };
      }

      // Nút Xóa đường
      var clearRouteBtn = popup.querySelector('.popup-clearroute-btn');
      if (clearRouteBtn) {
        clearRouteBtn.onclick = () => {
          if (routeControl) {
            map.removeControl(routeControl);
            routeControl = null;
          }
        };
      }
    });

    // Tạo danh sách bên trái
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
            // Chỉ zoom + mở popup (không modal ảnh, không route)
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
  })
  .catch(err => console.error('Lỗi load data.geojson:', err));
