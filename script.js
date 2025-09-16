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

var markers = [];
var routingControl = null; // lưu tuyến đường hiện tại

// Modal slideshow nâng cao
var modal = document.getElementById('imageModal');
var modalImage = document.getElementById('modalImage');
var modalTitle = document.getElementById('modalTitle'); // cần tạo trong HTML
var modalDesc = document.getElementById('modalDesc');   // cần tạo trong HTML
var routeBtn = document.getElementById('modalRouteBtn'); // cần tạo trong HTML
var currentImages = [];
var currentIndex = 0;
var currentMarkerLatLng = null;

document.querySelector('.modal .close').onclick = () => { modal.style.display = 'none'; };
document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);

function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
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

        // Popup chỉ hiển thị tên
        layer.bindPopup(`<b>${props.name}</b>`);
        markers.push({ layer: layer, props: props });
      }
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());

    // Click marker mở modal
    markers.forEach(m => {
      m.layer.on('click', () => {
        modalTitle.textContent = m.props.name;
        modalDesc.textContent = m.props.description;
        currentImages = m.props.images || [];
        currentIndex = 0;
        currentMarkerLatLng = m.layer.getLatLng();
        if (currentImages.length > 0) showModalImage(0);
        modal.style.display = 'block';
      });
    });

    // Click nút Chỉ đường trong modal
    routeBtn.onclick = () => {
      if (!currentMarkerLatLng) return;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const userLatLng = [pos.coords.latitude, pos.coords.longitude];
          if (routingControl) map.removeControl(routingControl);
          routingControl = L.Routing.control({
            waypoints: [
              L.latLng(userLatLng[0], userLatLng[1]),
              currentMarkerLatLng
            ],
            routeWhileDragging: false,
            show: true
          }).addTo(map);
          modal.style.display = 'none';
        }, err => { alert("Không thể lấy vị trí hiện tại: " + err.message); });
      } else {
        alert("Trình duyệt không hỗ trợ định vị.");
      }
    };

    // Sidebar danh sách
    var placeList = document.getElementById('placeList');
    function renderList(keyword = '') {
      placeList.innerHTML = '';
      markers.forEach(m => {
        if (m.props.name.toLowerCase().includes(keyword.toLowerCase())) {
          var li = document.createElement('li');
          li.textContent = m.props.name;
          li.addEventListener('click', () => {
            map.setView(m.layer.getLatLng(), 15);
            m.layer.fire('click'); // mở modal
          });
          placeList.appendChild(li);
        }
      });
    }
    renderList();

    document.getElementById('searchBox').addEventListener('input', function () {
      renderList(this.value);
    });

  })
  .catch(err => console.error('Lỗi load data.geojson:', err));
