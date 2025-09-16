// Tạo bản đồ
const map = L.map('map').setView([10.3759, 105.4194], 10);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Khai báo biến lưu locations và markers
let locations = [];
let markers = [];

// Lấy dữ liệu CSV từ Google Sheets
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuCf5kDrCceF7-oAI1IKNh2vjR3HCKtwKOROB1Swz2bRwCdqpki7kQqT_DwecG77ckhxmO7LgUdJ2/pub?gid=0&single=true&output=csv'; // thay link CSV public ở đây

Papa.parse(csvUrl, {
  download: true,
  header: true,
  complete: function (results) {
    locations = results.data.filter(row => row.lat && row.lng); // bỏ hàng trống
    renderMarkers(locations);
    renderList(locations);
  }
});

// Render markers lên bản đồ
function renderMarkers(data) {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  data.forEach(loc => {
    let lat = parseFloat(loc.lat);
    let lng = parseFloat(loc.lng);
    let name = loc.name || 'Không tên';

    if (!isNaN(lat) && !isNaN(lng)) {
      let marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>${loc.desc || ''}`);
      markers.push(marker);
    }
  });
}

// Render danh sách bên sidebar
function renderList(data) {
  const list = document.getElementById('locationList');
  list.innerHTML = '';

  data.forEach((loc, index) => {
    if (!loc || !loc.name) return; // tránh lỗi undefined

    const li = document.createElement('li');
    li.textContent = loc.name;
    li.onclick = () => {
      map.setView([parseFloat(loc.lat), parseFloat(loc.lng)], 15);
      markers[index].openPopup();
    };
    list.appendChild(li);
  });
}

// Tìm kiếm
document.getElementById('search').addEventListener('input', function () {
  const searchText = this.value.toLowerCase();
  const filtered = locations.filter(loc => {
    return loc.name && loc.name.toLowerCase().includes(searchText);
  });
  renderMarkers(filtered);
  renderList(filtered);
});
