let loai = [], toc = [], phuongxa = [], dataFeatures = [], loaicoso = [];

// Load tất cả dữ liệu
Promise.all([
  fetch('loai.json').then(r => r.json()),
  fetch('toc.json').then(r => r.json()),
  fetch('phuongxa.json').then(r => r.json()),
  fetch('loaicoso.json').then(r => r.json()),
  fetch('datageo.json').then(r => r.json())
]).then(([l, t, px, cs, data]) => {
  loai = l;
  toc = t;
  phuongxa = px;
  loaicoso = cs;
  dataFeatures = data.features;

  // map Loai từ số sang id trong loai.json nếu cần
  const loaiMap = {
    "0": "00","1":"01","2":"02","3":"03","4":"04","5":"05",
    "6":"06","7":"07","8":"08","9":"09"
  };
  dataFeatures.forEach(f => {
    if(loaiMap[f.properties.Loai]) f.properties.Loai = loaiMap[f.properties.Loai];
  });

  initMap();
  populateFilters();
  applyFilter();
});

let map, markersLayer;

function initMap() {
  map = L.map('map').setView([10.3791, 105.4317], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OSM'
  }).addTo(map);
}

// Tạo select filters
function populateFilters() {
  const selectLoai = document.getElementById('filterLoai');
  loai.forEach(l => selectLoai.innerHTML += `<option value="${l.id}">${l.name}</option>`);

  const selectToc = document.getElementById('filterToc');
  toc.forEach(t => selectToc.innerHTML += `<option value="${t.id}">${t.name}</option>`);

  const selectPX = document.getElementById('filterPhuongXa');
  phuongxa.forEach(px => selectPX.innerHTML += `<option value="${px.id}">${px.name}</option>`);

  const selectLoaiCS = document.getElementById('filterLoaiCoSo');
  loaicoso.forEach(cs => selectLoaiCS.innerHTML += `<option value="${cs.id}">${cs.name}</option>`);

  // onchange apply filter
  [selectLoai, selectToc, selectPX, selectLoaiCS].forEach(sel => {
    sel.onchange = applyFilter;
  });

  // Nút reset filter
  const resetBtn = document.createElement('button');
  resetBtn.textContent = "Reset bộ lọc";
  resetBtn.style.display = "block";
  resetBtn.style.width = "100%";
  resetBtn.style.marginTop = "5px";
  resetBtn.onclick = () => {
    selectLoai.value = '';
    selectToc.value = '';
    selectPX.value = '';
    selectLoaiCS.value = '';
    applyFilter();
  };
  document.getElementById('sidebar').appendChild(resetBtn);

  // Nút ẩn/hiện sidebar
  document.getElementById('toggleSidebar').onclick = () => {
    const sb = document.getElementById('sidebar');
    if(sb.style.left === '-300px'){
      sb.style.left = '0';
      map.invalidateSize();
    } else {
      sb.style.left = '-300px';
      map.invalidateSize();
    }
  };
}

// Áp dụng filter
function applyFilter() {
  const fLoai = document.getElementById('filterLoai').value;
  const fToc = document.getElementById('filterToc').value;
  const fPX = document.getElementById('filterPhuongXa').value;
  const fCS = document.getElementById('filterLoaiCoSo').value;

  const filtered = dataFeatures.filter(f => {
    const p = f.properties;
    return (fLoai === '' || p.Loai === fLoai)
        && (fToc === '' || p.Toc === fToc)
        && (fPX === '' || p.DiaDanh === fPX)
        && (fCS === '' || p.LoaiCoSo === fCS);
  });

  if(markersLayer) map.removeLayer(markersLayer);

  markersLayer = L.geoJSON(filtered, {
    onEachFeature: (f, layer) => {
      const p = f.properties;
      const loaiCS = loaicoso.find(l => l.id === p.LoaiCoSo)?.name || '';
      const ghiChu = loaicoso.find(l => l.id === p.LoaiCoSo)?.note || '';
      const pxName = phuongxa.find(pxItem => pxItem.id === p.DiaDanh)?.name || p.DiaDanh;
      const loaiName = loai.find(l => l.id === p.Loai)?.name || p.Loai;
      const tocName = toc.find(t => t.id === p.Toc)?.name || p.Toc;

      layer.bindPopup(`
        <strong>${p.TenDanhSach}</strong><br>
        Loại Thần: ${loaiName}<br>
        Tộc: ${tocName}<br>
        Phường/Xã: ${pxName}<br>
        Loại cơ sở: ${loaiCS}<br>
        Ghi chú: ${ghiChu}<br>
        Phone: ${p.Phone || ''}<br>
        Địa chỉ: ${p.DiaChi}<br>
        <a href="${p.LinkDrive || '#'}" target="_blank">Hình ảnh</a>
      `);
    }
  }).addTo(map);

  populateList(filtered);
}

// Sidebar list
function populateList(features) {
  const ul = document.getElementById('placeList');
  ul.innerHTML = '';
  features.forEach((f, i) => {
    const li = document.createElement('li');
    li.textContent = f.properties.TenDanhSach;
    li.onclick = () => {
      const coords = [...f.geometry.coordinates].reverse();
      map.setView(coords, 17);
      markersLayer.getLayers()[i].openPopup();
    };
    ul.appendChild(li);
  });
}
