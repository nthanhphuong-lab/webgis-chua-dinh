let loai=[], toc=[], phuongxa=[], dataFeatures=[];

Promise.all([
  fetch('loai.json').then(r=>r.json()),
  fetch('toc.json').then(r=>r.json()),
  fetch('phuongxa.json').then(r=>r.json()),
  fetch('data.geojson').then(r=>r.json())
]).then(([l, t, px, data])=>{
  loai = l; toc = t; phuongxa = px; dataFeatures = data.features;

  initMap();
  populateFilters();
  populateList(dataFeatures);
});

// Map và markers
let map, markersLayer;

function initMap() {
  map = L.map('map').setView([10.3791, 105.4317], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; OSM'}).addTo(map);
  markersLayer = L.geoJSON(dataFeatures, {
    onEachFeature: (f, layer)=>{
      const p = f.properties;
      let popupHTML = `<strong>${p.TenDanhSach}</strong><br>
        Loại: ${loai.find(l=>l.id===p.Loai)?.name || p.Loai}<br>
        Tộc: ${toc.find(t=>t.id===p.Toc)?.name || p.Toc}<br>
        Phường/Xã: ${phuongxa.find(px=>px.id===p.DiaDanh)?.name || p.DiaDanh}<br>
        Địa chỉ: ${p.DiaChi}`;
      if(p.LinkDrive) popupHTML += `<br><a href="${p.LinkDrive}" target="_blank">Hình ảnh</a>`;
      layer.bindPopup(popupHTML);
    }
  }).addTo(map);
}

// Populate menu lọc
function populateFilters() {
  const selectLoai = document.getElementById('filterLoai');
  loai.forEach(l=>selectLoai.innerHTML+=`<option value="${l.id}">${l.name}</option>`);
  
  const selectToc = document.getElementById('filterToc');
  toc.forEach(t=>selectToc.innerHTML+=`<option value="${t.id}">${t.name}</option>`);

  const selectPX = document.getElementById('filterPhuongXa');
  phuongxa.forEach(px=>selectPX.innerHTML+=`<option value="${px.id}">${px.name}</option>`);

  selectLoai.onchange = applyFilter;
  selectToc.onchange = applyFilter;
  selectPX.onchange = applyFilter;

  document.getElementById('resetFilter').onclick = ()=>{
    selectLoai.value=''; selectToc.value=''; selectPX.value=''; applyFilter();
  };

  // Toggle sidebar
  document.getElementById('toggleSidebar').onclick = ()=>{
    document.getElementById('sidebar').classList.toggle('hidden');
    document.getElementById('map').style.left = document.getElementById('sidebar').classList.contains('hidden') ? '0' : '300px';
  };
}

// Apply filter
function applyFilter() {
  const fLoai = document.getElementById('filterLoai').value;
  const fToc = document.getElementById('filterToc').value;
  const fPX = document.getElementById('filterPhuongXa').value;

  const filtered = dataFeatures.filter(f=>
    (fLoai===''||f.properties.Loai===fLoai) &&
    (fToc===''||f.properties.Toc===fToc) &&
    (fPX===''||f.properties.DiaDanh===fPX)
  );

  if(markersLayer) map.removeLayer(markersLayer);

  markersLayer = L.geoJSON(filtered, {
    onEachFeature: (f, layer)=>{
      const p = f.properties;
      let popupHTML = `<strong>${p.TenDanhSach}</strong><br>
        Loại: ${loai.find(l=>l.id===p.Loai)?.name || p.Loai}<br>
        Tộc: ${toc.find(t=>t.id===p.Toc)?.name || p.Toc}<br>
        Phường/Xã: ${phuongxa.find(px=>px.id===p.DiaDanh)?.name || p.DiaDanh}<br>
        Địa chỉ: ${p.DiaChi}`;
      if(p.LinkDrive) popupHTML += `<br><a href="${p.LinkDrive}" target="_blank">Hình ảnh</a>`;
      layer.bindPopup(popupHTML);
    }
  }).addTo(map);

  populateList(filtered);
}

// Populate danh sách địa điểm
function populateList(features) {
  const ul = document.getElementById('placeList');
  ul.innerHTML = '';
  features.forEach((f,i)=>{
    const li = document.createElement('li');
    li.textContent = f.properties.TenDanhSach;
    li.onclick = ()=>{
      const coords = f.geometry.coordinates;
      map.setView([coords[1], coords[0]], 17);
      markersLayer.getLayers()[i].openPopup();
    };
    ul.appendChild(li);
  });
}
