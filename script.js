// Link CSV Google Sheets
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuCf5kDrCceF7-oAI1IKNh2vjR3HCKtwKOROB1Swz2bRwCdqpki7kQqT_DwecG77ckhxmO7LgUdJ2/pub?output=csv';

// Tạo map
const map = L.map('map').setView([10.5, 105.5], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let currentImages = [];
let currentIndex = 0;

// Modal slideshow
const modal = document.getElementById("myModal");
const modalImage = document.getElementById("modalImage");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

prevBtn.onclick = () => {
  if (currentImages.length > 0) {
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    modalImage.src = currentImages[currentIndex];
  }
};
nextBtn.onclick = () => {
  if (currentImages.length > 0) {
    currentIndex = (currentIndex + 1) % currentImages.length;
    modalImage.src = currentImages[currentIndex];
  }
};

// Load dữ liệu từ Google Sheets CSV
fetch(sheetUrl)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.split('\n').map(r => r.split(','));
    const header = rows[0]; // lấy tiêu đề cột
    const nameIndex = header.indexOf('Name');
    const latIndex = header.indexOf('Lat');
    const lngIndex = header.indexOf('Lng');
    // Tìm các cột Image*
    const imageCols = header.map((h, i) => h.startsWith('Image') ? i : -1).filter(i => i !== -1);

    const list = document.getElementById('list');

    rows.slice(1).forEach(row => {
      if (!row[nameIndex] || !row[latIndex] || !row[lngIndex]) return;

      const name = row[nameIndex];
      const lat = parseFloat(row[latIndex]);
      const lng = parseFloat(row[lngIndex]);
      const images = imageCols.map(i => row[i]).filter(x => x && x.trim() !== '');

      // Marker
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<b>${name}</b>`);
      markers.push(marker);

      marker.on('click', () => {
        openModal(images);
      });

      // Danh sách
      const li = document.createElement('li');
      li.textContent = name;
      li.onclick = () => {
        map.setView([lat, lng], 15);
        marker.openPopup();
        openModal(images);
      };
      list.appendChild(li);
    });
  });

// Hàm mở modal slideshow
function openModal(images) {
  currentImages = images;
  currentIndex = 0;
  if (images.length > 0) {
    modalImage.src = images[0];
    modal.style.display = 'block';
  }
}

// Đóng modal khi click ra ngoài
modal.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};
