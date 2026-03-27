let loai=[], toc=[], phuongxa=[], dataFeatures=[], loaicoso=[];

Promise.all([
  fetch('loai.json').then(r=>r.json()),
  fetch('toc.json').then(r=>r.json()),
  fetch('phuongxa.json').then(r=>r.json()),
  fetch('loaicoso.json').then(r=>r.json()),
  fetch('data.geojson').then(r=>r.json())
]).then(([l, t, px, cs, data])=>{
  loai = l;
  toc = t;
  phuongxa = px;
  loaicoso = cs;
  dataFeatures = data.features;

  initMap();
  populateFilters();
  applyFilter(); // hiển thị danh sách ban đầu
});

let map, markersLayer;

function initMap() {
  map = L.map('map').setView([10.3791, 105.4317], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; OSM'}).addTo(map);
}

// Đổ select filters
function populateFilters() {
  const selectLoai = document.getElementById('filterLoai');
  loai.forEach(l=>selectLoai.innerHTML+=`<option value="${l.id}">${l.name}</option>`);

  const selectToc = document.getElementById('filterToc');
  toc.forEach(t=>selectToc.innerHTML+=`<option value="${t.id}">${t.name}</option>`);

  const selectPX = document.getElementById('filterPhuongXa');
  phuongxa.forEach(px=>selectPX.innerHTML+=`<option value="${px.id}">${px.name}</option>`);

  const selectLoaiCS = document.getElementById('filterLoaiCoSo');
  loaicoso.forEach(cs=>selectLoaiCS.innerHTML+=`<option value="${cs.id}">${cs.name}</option>`);

  // sự kiện onchange
  [selectLoai, selectToc, selectPX, selectLoaiCS].forEach(sel=>{
    sel.onchange = applyFilter;
  });

  document.getElementById('toggleSidebar').onclick = ()=>{
    const sb = document.getElementById('sidebar');
    if(sb.style.left==='-300px'){
      sb.style.left='0';
      map.invalidateSize();
    } else {
      sb.style.left='-300px';
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

  // lọc data
  const filtered = dataFeatures.filter(f=>{
    const p = f.properties;
    return (fLoai==='' || p.Loai===fLoai)
        && (fToc==='' || p.Toc===fToc)
        && (fPX==='' || p.DiaDanh===fPX)
        && (fCS==='' || p.LoaiCoSo===fCS); // LoaiCoSo là field mới trong geojson
  });

  // Xóa layer cũ
  if(markersLayer) map.removeLayer(markersLayer);

  markersLayer = L.geoJSON(filtered, {
    onEachFeature: (f, layer)=>{
      const p=f.properties;
      const loaiCS = loaicoso.find(l=>l.id===p.LoaiCoSo)?.name || '';
      const ghiChu = loaicoso.find(l=>l.id===p.LoaiCoSo)?.note || '';
      const pxName = phuongxa.find(pxItem=>pxItem.id===p.DiaDanh)?.name || p.DiaDanh;

      layer.bindPopup(`
        <strong>${p.TenDanhSach}</strong><br>
        Loại Thần: ${loai.find(l=>l.id===p.Loai)?.name || p.Loai}<br>
        Tộc: ${toc.find(t=>t.id===p.Toc)?.name || p.Toc}<br>
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
  ul.innerHTML='';
  features.forEach((f,i)=>{
    const li=document.createElement('li');
    li.textContent=f.properties.TenDanhSach;
    li.onclick=()=>{ 
      const coords = [...f.geometry.coordinates].reverse(); 
      map.setView(coords,17); 
      markersLayer.getLayers()[i].openPopup(); 
    };
    ul.appendChild(li);
  });
}
