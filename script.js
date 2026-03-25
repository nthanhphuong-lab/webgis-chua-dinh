let loai=[], toc=[], phuongxa=[], dataFeatures=[];

// Load 4 file JSON
Promise.all([
  fetch('loai.json').then(r=>r.json()),
  fetch('toc.json').then(r=>r.json()),
  fetch('phuongxa.json').then(r=>r.json()),
  fetch('data.geojson').then(r=>r.json())
]).then(([l, t, px, data])=>{
  loai = l; toc = t; phuongxa = px;
  dataFeatures = data.features || [data]; 
  initMap();
  populateFilters();
  populateList(dataFeatures);
});

let map, markersLayer;

function initMap(){
  map = L.map('map').setView([10.3791, 105.4317], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19, attribution:'&copy; OSM'
  }).addTo(map);

  markersLayer = L.geoJSON(dataFeatures, {onEachFeature:bindPopup}).addTo(map);
}

function bindPopup(f, layer){
  const p = f.properties;
  const phuongXaName = phuongxa.find(px=>px.id===p.DiaDanh)?.name || p.DiaDanh;
  const loaiName = loai.find(l=>l.id===p.Loai)?.name || p.Loai;
  const tocName = toc.find(t=>t.id===p.Toc)?.name || p.Toc;

  let driveLink = p.HinhAnh ? `<br><a href="${p.HinhAnh}" target="_blank">Xem hình ảnh</a>` : '';

  layer.bindPopup(`
    <strong>${p.TenDanhSach}</strong><br>
    Loại: ${loaiName}<br>
    Tộc: ${tocName}<br>
    Phường/Xã: ${phuongXaName}<br>
    Địa chỉ: ${p.DiaChi || ''}<br>
    <a href="${p.LinkMap || '#'}" target="_blank">Xem bản đồ</a>
    ${driveLink}
  `);
}

// --- Filter ---
function populateFilters(){
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
}

function applyFilter(){
  const fLoai = document.getElementById('filterLoai').value;
  const fToc = document.getElementById('filterToc').value;
  const fPX = document.getElementById('filterPhuongXa').value;

  const filtered = dataFeatures.filter(f=>
    (fLoai===''||f.properties.Loai===fLoai) &&
    (fToc===''||f.properties.Toc===fToc) &&
    (fPX===''||f.properties.DiaDanh===fPX)
  );

  if(markersLayer) map.removeLayer(markersLayer);
  markersLayer = L.geoJSON(filtered,{onEachFeature:bindPopup}).addTo(map);
  populateList(filtered);
}

// --- Sidebar list (text only) ---
function populateList(features){
  const ul = document.getElementById('placeList');
  ul.innerHTML='';
  features.forEach((f,i)=>{
    const li = document.createElement('li');
    li.textContent = f.properties.TenDanhSach;
    li.style.cursor = 'pointer';
    li.onclick = ()=>{
      const coords = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
      map.setView(coords,17);
      markersLayer.getLayers()[i].openPopup();
    };
    ul.appendChild(li);
  });
}
