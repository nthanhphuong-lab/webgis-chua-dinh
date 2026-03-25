let map = L.map('map').setView([10.5, 105.4], 10);

// Bản đồ OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OSM contributors'
}).addTo(map);

let loaiData = [], tocData = [], xaData = [], geoData;
let markers = L.layerGroup().addTo(map);

// Load dữ liệu JSON
async function loadData() {
  loaiData = await fetch('loai.json').then(res=>res.json());
  tocData = await fetch('toc.json').then(res=>res.json());
  xaData = await fetch('phuongxa.json').then(res=>res.json());
  geoData = await fetch('data.geojson').then(res=>res.json());
  
  populateFilters();
  updateMap();
}

// Điền filter
function populateFilters() {
  const loaiSel = document.getElementById('filterLoai');
  loaiData.forEach(l=>loaiSel.innerHTML += `<option value="${l.id}">${l.ten}</option>`);
  const tocSel = document.getElementById('filterToc');
  tocData.forEach(t=>tocSel.innerHTML += `<option value="${t.id}">${t.ten}</option>`);
  const xaSel = document.getElementById('filterXa');
  xaData.forEach(x=>xaSel.innerHTML += `<option value="${x.id}">${x.ten}</option>`);

  document.getElementById('filterLoai').addEventListener('change', updateMap);
  document.getElementById('filterToc').addEventListener('change', updateMap);
  document.getElementById('filterXa').addEventListener('change', updateMap);
}

// Cập nhật bản đồ và danh sách theo filter
function updateMap() {
  const loai = document.getElementById('filterLoai').value;
  const toc = document.getElementById('filterToc').value;
  const xa = document.getElementById('filterXa').value;

  markers.clearLayers();
  const listEl = document.getElementById('datalist');
  listEl.innerHTML = '';

  geoData.features.forEach(f=>{
    const p = f.properties;
    if ((loai && p.loai !== loai) || 
        (toc && p.toc !== toc) || 
        (xa && p.diadanh !== xa)) return;

    const xaInfo = xaData.find(x=>x.id===p.diadanh);
    const marker = L.marker([xaInfo.lat, xaInfo.lng])
      .bindPopup(`<b>${p.tenUuTien}</b><br>${p.giaimachu}<br><i>${p.diachiChiTiet}</i><br><a href="${p.linkMap}" target="_blank">Xem bản đồ</a>`);
    marker.addTo(markers);

    // Danh sách bên trái
    const li = document.createElement('li');
    li.innerText = p.tenUuTien || p.tendanhSach || 'Không tên';
    li.onclick = ()=> { map.setView([xaInfo.lat, xaInfo.lng], 16); marker.openPopup(); };
    listEl.appendChild(li);
  });
}

loadData();
