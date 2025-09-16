// === 1. Khởi tạo bản đồ ===
var map = L.map('map', { zoomControl: false }).setView([10.5, 105.1], 9);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Toggle sidebar
var sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', function () {
  sidebar.classList.toggle('hidden');
  setTimeout(() => { map.invalidateSize(); }, 300);
});

// === 2. Modal ảnh lớn ===
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

// === 3. Đọc CSV từ Google Sheets ===
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuCf5kDrCceF7-oAI1IKNh2vjR3HCKtwKOROB1Swz2bRwCdqpki7kQqT_DwecG77ckhxmO7LgUdJ2/pub?gid=0&single=true&output=csv';

var markers = []; // lưu { layer, props }

Papa.parse(csvUrl, {
  download: true,
  header: true,
  complete: function (results) {
    const rows = results.data;
    rows.forEach(row => {
      // Ép lat/lng sang dạng số
      if (!row.lat || !row.lng) return;

      let latStr = String(row.lat).replace(',', '.').trim();
      let lngStr = String(row.lng).replace(',', '.').trim();
      let lat = parseFloat(latStr);
      let lng = parseFloat(lngStr);
      if (isNaN(lat) || isNaN(lng)) return;

      let images = row.images ? row.images.split(';').map(i => i.trim()) : [];

      var popupContent = `<b>${row.name}</b><br>${row.description || ''}`;
      if (images.length > 0) {
        popupContent += `<div class="popup-images">`;
        images.forEach((img, idx) => {
          popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(images)}'>`;
        });
        popupContent += `</div>`;
      }

      var marker = L.marker([lat, lng]).addTo(map).bindPopup(popupContent);
      markers.push({ layer: marker, props: { name: row.name, images: images } });
    });

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
});
