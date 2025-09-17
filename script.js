// ====================== KHỞI TẠO BẢN ĐỒ ======================
var map = L.map('map', { zoomControl: false }).setView([10.5, 105.1], 9);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Thêm tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ====================== SIDEBAR ======================
var sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', function () {
  sidebar.classList.toggle('hidden');
  setTimeout(() => { map.invalidateSize(); }, 300);
});

// ====================== DETAIL PANEL ======================
function showDetailPanel(props){
  document.getElementById('detailPanel').classList.remove('hidden');
  document.getElementById('detailTitle').textContent = props.name;
  document.getElementById('detailDesc').textContent = props.detail || props.description || '';
}
document.getElementById('closeDetail').onclick = () => {
  document.getElementById('detailPanel').classList.add('hidden');
};

// ====================== BIẾN TOÀN CỤC ======================
var markers = [];
var modal = document.getElementById('imageModal');
var modalImage = document.getElementById('modalImage');
var modalTitle = document.getElementById('modalTitle');
var modalDesc = document.getElementById('modalDesc');
var currentImages = [];
var currentIndex = 0;
var routeControl = null;
var userLatLng = null;
var currentRouteDestination = null;

// ====================== MODAL ẢNH ======================
document.querySelector('.modal .close').onclick = () => { modal.style.display = 'none'; };
document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);

function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
  modalTitle.textContent = "";
  modalDesc.textContent = "";
}

// ====================== ĐỊNH VỊ NGƯỜI DÙNG ======================
navigator.geolocation.getCurrentPosition(pos => {
  userLatLng = [pos.coords.latitude, pos.coords.longitude];
}, err => {
  console.warn("Không thể lấy vị trí hiện tại:", err.message);
});

// ====================== VẼ TUYẾN ĐƯỜNG ======================
function drawRoute(from, to){
  if(routeControl){
    map.removeControl(routeControl);
    routeControl = null;
  }
  routeControl = L.Routing.control({
    waypoints: [L.latLng(from[0], from[1]), L.latLng(to.lat, to.lng)],
    routeWhileDragging: false,
    createMarker: function() { return null; },
    lineOptions: {
      styles: [{color: 'blue', opacity: 0.8, weight: 5}]
    }
  }).addTo(map);
}
function clearRoute(){
  if(routeControl){
    map.removeControl(routeControl);
    routeControl = null;
  }
}

// ====================== LOAD GEOJSON ======================
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
            popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(props.images)}' style="cursor:pointer;width:50px;margin:2px;">`;
          });
          popupContent += `</div>`;
        }
        // Nút Chỉ đường & Xóa đường
        popupContent += `
          <div style="margin-top:5px;">
            <button class="popup-route-btn" style="background:#007bff;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;margin-right:5px;">Chỉ đường</button>
            <button class="popup-clear-route-btn" style="background:#dc3545;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa đường</button>
          </div>
        `;
        layer.bindPopup(popupContent);

        // Thêm marker vào danh sách
        markers.push({ layer: layer, props: props });

        // Khi click marker ngoài map → show detail panel
        layer.on('click', () => {
          showDetailPanel(props);
        });
      }
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());

    // Xử lý popup mở
    map.on('popupopen', function (e) {
      var popup = e.popup._contentNode;

      // Click ảnh → modal slideshow
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
      routeBtn.onclick = () => {
        currentRouteDestination = e.popup._latlng;
        if (!userLatLng) return alert("Không xác định được vị trí hiện tại!");
        drawRoute(userLatLng, currentRouteDestination);
      };

      // Nút Xóa đường
      var clearBtn = popup.querySelector('.popup-clear-route-btn');
      clearBtn.onclick = () => {
        clearRoute();
      };
    });

    // ====================== DANH SÁCH BÊN TRÁI ======================
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
            showDetailPanel(m.props); // hiển thị detail panel khi click danh sách
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
