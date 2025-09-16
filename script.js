// Tạo bản đồ
const map = L.map('map').setView([10.5, 105.1], 10);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Toggle sidebar
const sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
  setTimeout(() => map.invalidateSize(), 300);
});

// Modal ảnh lớn
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
let currentImages = [];
let currentIndex = 0;

document.querySelector('.modal .close').onclick = () => modal.style.display = 'none';
document.getElementById('prevImage').onclick = () => showModalImage(currentIndex - 1);
document.getElementById('nextImage').onclick = () => showModalImage(currentIndex + 1);

function showModalImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
  modal.style.display = 'block';
}

// CSV public từ Google Sheets
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuCf5kDrCceF7-oAI1IKNh2vjR3HCKtwKOROB1Swz2bRwCdqpki7kQqT_DwecG77ckhxmO7LgUdJ2/pub?gid=0&single=true&output=csv';

let locations = [];
let markers = [];

Papa.parse(csvUrl, {
  download: true,
  header: true,
  complete: function(results){
    locations = results.data.filter(r => r.lat && r.lng);
    renderMarkers(locations);
    renderList(locations);
  }
});

// Render marker
function renderMarkers(data){
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(loc => {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    const name = loc.name || 'Không tên';
    const description = loc.description || '';
    const images = loc.images ? loc.images.split(';').map(i => i.trim()) : [];

    if (!isNaN(lat) && !isNaN(lng)){
      let popupContent = `<b>${name}</b><br>${description}`;
      if(images.length){
        popupContent += '<div class="popup-images">';
        images.forEach((img, idx) => {
          popupContent += `<img src="${img}" data-index="${idx}" data-images='${JSON.stringify(images)}'>`;
        });
        popupContent += '</div>';
      }

      const marker = L.marker([lat,lng]).addTo(map).bindPopup(popupContent);
      markers.push(marker);
    }
  });

  // Click ảnh trong popup
  map.on('popupopen', e => {
    const popup = e.popup._contentNode;
    popup.querySelectorAll('.popup-images img').forEach(imgEl => {
      imgEl.addEventListener('click', () => {
        currentImages = JSON.parse(imgEl.getAttribute('data-images'));
        currentIndex = parseInt(imgEl.getAttribute('data-index'));
        showModalImage(currentIndex);
      });
    });
  });
}

// Render danh sách sidebar
function renderList(data){
  const list = document.getElementById('locationList');
  list.innerHTML = '';

  data.forEach((loc, idx) => {
    if(!loc || !loc.name) return;
    const li = document.createElement('li');
    li.textContent = loc.name;
    li.onclick = () => {
      map.setView([parseFloat(loc.lat), parseFloat(loc.lng)], 15);
      markers[idx].openPopup();
    };
    list.appendChild(li);
  });
}

// Tìm kiếm
const searchBox = document.getElementById('searchBox');
if(searchBox){
  searchBox.addEventListener('input', function(){
    const txt = this.value.toLowerCase();
    const filtered = locations.filter(loc => loc.name && loc.name.toLowerCase().includes(txt));
    renderMarkers(filtered);
    renderList(filtered);
  });
}
