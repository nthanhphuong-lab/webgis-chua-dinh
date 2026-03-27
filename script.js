let loai = [], toc = [], phuongxa = [], loaicoso = [];
let dataFeatures = [];
let map, markersLayer;

Promise.all([
  fetch('loai.json').then(r => r.json()),
  fetch('toc.json').then(r => r.json()),
  fetch('phuongxa.json').then(r => r.json()),
  fetch('loaicoso.json').then(r => r.json()),
  fetch('data.geojson').then(r => r.json())
])
.then(([l, t, px, cs, geo]) => {
  loai = l;
  toc = t;
  phuongxa = px;
  loaicoso = cs;
  dataFeatures = geo.features || [];

  initMap();
  populateFilters();
  applyFilter();
})
.catch(err => console.error("Lỗi load:", err));

function initMap() {
  map = L.map('map', { zoomControl: false })
    .setView([10.38, 105.43], 10);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM'
  }).addTo(map);
}

function populateFilters() {
  const fLoai = document.getElementById('filterLoai');
  const fToc = document.getElementById('filterToc');
  const fPX = document.getElementById('filterPhuongXa');
  const fCS = document.getElementById('filterLoaiCoSo');

  loai.forEach(x => fLoai.innerHTML += `<option value="${x.id}">${x.name}</option>`);
  toc.forEach(x => fToc.innerHTML += `<option value="${x.id}">${x.name}</option>`);
  phuongxa.forEach(x => fPX.innerHTML += `<option value="${x.id}">${x.name}</option>`);
  loaicoso.forEach(x => fCS.innerHTML += `<option value="${x.id}">${x.name}</option>`);

  [fLoai, fToc, fPX, fCS].forEach(el => el.onchange = applyFilter);

  document.getElementById('resetFilter').onclick = () => {
    fLoai.value = '';
    fToc.value = '';
    fPX.value = '';
    fCS.value = '';
    applyFilter();
  };

  document.getElementById('toggleSidebar').onclick = () => {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('hidden');
    setTimeout(() => map.invalidateSize(), 300);
  };
}

function applyFilter() {
  const fLoai = document.getElementById('filterLoai').value;
  const fToc = document.getElementById('filterToc').value;
  const fPX = document.getElementById('filterPhuongXa').value;
  const fCS = document.getElementById('filterLoaiCoSo').value;

  const filtered = dataFeatures.filter(f => {
    const p = f.properties;
    return (!fLoai || p.Loai == fLoai)
        && (!fToc || p.Toc == fToc)
        && (!fPX || p.DiaDanh == fPX)
        && (!fCS || p.LoaiCoSo == fCS);
  });

  renderMap(filtered);
  renderList(filtered);
}

function renderMap(features) {
  if (markersLayer) map.removeLayer(markersLayer);

  markersLayer = L.geoJSON(features, {
    onEachFeature: (f, layer) => {
      const p = f.properties;

      const loaiName = loai.find(x => x.id == p.Loai)?.name || "Không rõ";
      const tocName = toc.find(x => x.id == p.Toc)?.name || "Không rõ";
      const pxName = phuongxa.find(x => x.id == p.DiaDanh)?.name || p.DiaDanh;
      const cs = loaicoso.find(x => x.id == p.LoaiCoSo);

      layer.bindPopup(`
        <b>${p.TenDanhSach}</b><br>
        Loại thần: ${loaiName}<br>
        Tộc: ${tocName}<br>
        Phường/Xã: ${pxName}<br>
        Loại cơ sở: ${cs?.name || ""}<br>
        ${p.DiaChi}
      `);
    }
  }).addTo(map);
}

function renderList(features) {
  const ul = document.getElementById('placeList');
  ul.innerHTML = '';

  if (!features.length) {
    ul.innerHTML = '<li>Không có dữ liệu</li>';
    return;
  }

  features.forEach(f => {
    const li = document.createElement('li');
    li.textContent = f.properties.TenDanhSach;

    li.onclick = () => {
      const coords = [...f.geometry.coordinates].reverse();
      map.setView(coords, 16);
    };

    ul.appendChild(li);
  });
}
