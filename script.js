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

var markers = []; // Danh sách marker
var currentRoute = null; // tuyến đường hiện tại

// Modal ảnh lớn
var modal = document.getElementById('imageModal');
var modalImage = document.getElementById('modalImage');
var modalTitle = document.getElementById('modalTitle');
var modalDesc = document.getElementById('modalDesc');
var currentImages = [];
var currentIndex = 0;

document.querySelector('.modal .close').onclick = () => { modal.style.display = 'none'; };
document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);

// Hiển thị ảnh slideshow
function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
}

// Vẽ tuyến đường màu xanh
function drawRoute(userLatLng, destination) {
  if (currentRoute) map.removeControl(currentRoute);
  currentRoute = L.Routing.control({
    waypoints: [
      L.latLng(userLatLng.lat, userLatLng.lng),
      L.latLng(destination.lat, destination.lng)
    ],
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    lineOptions: {
      styles: [{ color: 'blue', opacity: 0.8, weight: 5 }]
    },
    createMarker: function() { return null; } // không vẽ marker mặc định
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
        var popupContent = `<b>${props.name}</b><br>${props.description}`;
        if (props.images && props.images.length > 0) {
          popupContent += `<div class="popup-images">`;
          props.images.forEach((img, idx) => {
            popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(props.images)}' style="cursor:pointer;width:50px;margin:2px;">`;
          });
          popupContent += `</div>`;
        }
        layer.bindPopup(popupContent);
        markers.push({ layer: layer, props: props });
      }
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());

    // Xử lý click ảnh trong popup
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
            // Lấy vị trí hiện tại của người dùng
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(pos => {
                var userLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                drawRoute(userLatLng, { lat: m.layer.getLatLng().lat, lng: m.layer.getLatLng().lng });
              }, err => {
                alert('Không thể lấy vị trí hiện tại.');
              });
            } else {
              alert('Trình duyệt không hỗ trợ định vị.');
            }

            // Hiển thị slideshow modal ảnh
            if (m.props.images && m.props.images.length > 0) {
              currentImages = m.props.images;
              currentIndex = 0;
              modalTitle.textContent = m.props.name;
              modalDesc.textContent = m.props.description;
              showModalImage(currentIndex);
              modal.style.display = 'block';
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
