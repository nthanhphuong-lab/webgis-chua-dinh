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
var routeControl = null; // lưu tuyến đường hiện tại

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
        // Tạo popup content
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

    // Xử lý click ảnh trong popup (mở modal slideshow)
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
            var latlng = m.layer.getLatLng();
            map.setView(latlng, 15);

            // Mở popup nhanh
            m.layer.openPopup();

            // Lấy vị trí người dùng và vẽ tuyến đường
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(pos => {
                var userLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);

                // Xóa route cũ nếu có
                if (routeControl) map.removeControl(routeControl);

                // Vẽ tuyến đường
                routeControl = L.Routing.control({
                  waypoints: [userLatLng, latlng],
                  routeWhileDragging: false,
                  show: false
                }).addTo(map);
              }, err => {
                alert('Không thể lấy vị trí của bạn.');
              });
            } else {
              alert('Trình duyệt không hỗ trợ Geolocation.');
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
