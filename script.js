// === 1. Khởi tạo bản đồ ===
var map = L.map('map', { zoomControl: false }).setView([10.5, 105.1], 9);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// === 2. Sidebar toggle ===
var sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', function () {
  sidebar.classList.toggle('hidden');
  setTimeout(() => { map.invalidateSize(); }, 300);
});

// === 3. Modal ảnh lớn ===
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

// === 4. Đọc dữ liệu CSV từ Google Sheets ===
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuCf5kDrCceF7-oAI1IKNh2vjR3HCKtwKOROB1Swz2bRwCdqpki7kQqT_DwecG77ckhxmO7LgUdJ2/pub?gid=0&single=true&output=csv';

var markers = [];

fetch(csvUrl)
  .then(r => r.text())
  .then(text => {
    const rows = Papa.parse(text, { header: true }).data;
    // rows = [{name, description, lat, lng, images}, ...]
    rows.forEach(row => {
      if (!row.name || !row.lat || !row.lng) return;
      var images = row.images ? row.images.split('|') : [];

      var popupContent = `<b>${row.name}</b><br>${row.description || ''}`;
      if (images.length > 0) {
        popupContent += `<div class="popup-images">`;
        images.forEach((img, idx) => {
          popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(images)}'>`;
        });
        popupContent += `</div>`;
      }

      var marker = L.marker([parseFloat(row.lat), parseFloat(row.lng)]).addTo(map)
        .bindPopup(popupContent);

      markers.push({ layer: marker, props: row });
    });

    // Xử lý click ảnh trong popup (event delegation)
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
  })
  .catch(err => console.error('Lỗi load CSV:', err));
