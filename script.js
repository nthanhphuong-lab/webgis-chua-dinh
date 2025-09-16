// === 1. Khởi tạo bản đồ ===
var map = L.map('map').setView([10.7, 105.1], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// === 2. Modal ảnh lớn ===
var modal = document.getElementById('imageModal');
var modalImage = document.getElementById('modalImage');
var currentImages = [];
var currentIndex = 0;

if(modal) {
  document.querySelector('.modal .close').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
  document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);
}

function showModalImage(index) {
  if(index < 0) index = currentImages.length -1;
  if(index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
}

// === 3. Đọc CSV từ Google Sheets ===
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuCf5kDrCceF7-oAI1IKNh2vjR3HCKtwKOROB1Swz2bRwCdqpki7kQqT_DwecG77ckhxmO7LgUdJ2/pub?gid=0&single=true&output=csv'; // Thay link CSV public

var locations = [];
var markers = [];

Papa.parse(csvUrl, {
  download: true,
  header: true,
  skipEmptyLines: true, // loại bỏ dòng trống
  complete: function(results) {
    // Lọc dữ liệu sạch: chỉ lấy các row có name, lat, lng
    locations = results.data.map(row => ({
      name: row['name'] ? row['name'].trim() : null,
      description: row['description'] ? row['description'].trim() : '',
      lat: parseFloat(row['lat']),
      lng: parseFloat(row['lng']),
      images: row['images'] ? row['images'].split(';').map(i => i.trim()) : []
    })).filter(r => r.name && !isNaN(r.lat) && !isNaN(r.lng));

    // Tạo marker
    locations.forEach((loc, idx) => {
      var popupContent = `<b>${loc.name}</b><br>${loc.description}`;
      if(loc.images.length > 0){
        popupContent += '<div class="popup-images">';
        loc.images.forEach((img, i) => {
          popupContent += `<img src="${img}" data-index="${i}" data-images='${JSON.stringify(loc.images)}'>`;
        });
        popupContent += '</div>';
      }

      let marker = L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(popupContent);
      markers.push(marker);
    });

    // Click ảnh popup
    map.on('popupopen', e => {
      var popup = e.popup._contentNode;
      if(popup){
        popup.querySelectorAll('.popup-images img').forEach(imgEl => {
          imgEl.addEventListener('click', () => {
            currentImages = JSON.parse(imgEl.getAttribute('data-images'));
            currentIndex = parseInt(imgEl.getAttribute('data-index'));
            showModalImage(currentIndex);
            modal.style.display = 'block';
          });
        });
      }
    });

    // === Sidebar danh sách ===
    const placeList = document.getElementById('placeList');
    function renderList(keyword = '') {
      placeList.innerHTML = '';
      locations.forEach((loc, idx) => {
        if(!loc.name) return;
        if(loc.name.toLowerCase().includes(keyword.toLowerCase())){
          let li = document.createElement('li');
          li.textContent = loc.name;
          li.addEventListener('click', () => {
            map.setView([loc.lat, loc.lng], 15);
            markers[idx].openPopup();
          });
          placeList.appendChild(li);
        }
      });
    }

    renderList();

    // Tìm kiếm
    const searchBox = document.getElementById('searchBox');
    if(searchBox){
      searchBox.addEventListener('input', function(){
        renderList(this.value);
      });
    }
  }
});
