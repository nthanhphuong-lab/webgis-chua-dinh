let loai = [], toc = [], phuongxa = [], loaicoso = [];
let dataFeatures = [];
let map, markersLayer;
let tongquatData = [];
let routingControl = null;

Promise.all([
  fetch('loai.json').then(r => r.json()),
  fetch('toc.json').then(r => r.json()),
  fetch('phuongxa.json').then(r => r.json()),
  fetch('loaicoso.json').then(r => r.json()),
  fetch('data.geojson').then(r => r.json()),
  fetch('tongquat.json').then(r => r.json()) // 👈 thêm dòng này
])
.then(([l, t, px, cs, geo, tq]) => {
  loai = l;
  toc = t;
  phuongxa = px;
  loaicoso = cs;
  dataFeatures = geo.features || [];
  tongquatData = tq; // 👈 lưu dữ liệu chi tiết

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
      ${p.DiaChi}<br><br>
    
      <button onclick="showDetail('${p.Ma}')">
        🔍 Xem chi tiết
      </button>
      <button onclick="showRoute(${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]})">
        🧭 Chỉ đường
      </button>
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
function showDetail(ma) {
  const item = tongquatData.find(x => x.Ma === ma);

  if (!item) {
    alert("Không có dữ liệu chi tiết!");
    return;
  }

  const t = item.ThongTinChung;

   const html = `
  <h2>${t.TenCoSo || ""}</h2>
  
  <p><b>📍 Địa chỉ:</b> ${t.DiaChi || ""}</p>
  <p><b>🏮 Loại:</b> ${t.LoaiChua || ""}</p>
  <p><b>🙏 Thần chủ:</b> ${t.ThanChu || ""}</p>
  <p><b>👥 Tộc:</b> ${t.Toc || ""}</p>
  <p><b>🧭 Phường/Xã:</b> ${t.PhuongXa || ""}</p>
  
  <hr>
  
  <h3>📜 Lịch sử</h3>
  <p><b>Thời gian:</b> ${item.LichSu?.ThoiGian || ""}</p>
  <p><b>Người sáng lập:</b> ${item.LichSu?.NguoiSangLap || ""}</p>
  <p><b>Trùng tu:</b> ${item.LichSu?.TrungTu || ""}</p>
  
  <h3>🏛 Kiến trúc</h3>
  <p><b>Phong cách:</b> ${item.KienTruc?.PhongCach || ""}</p>
  <p><b>Bố cục:</b> ${item.KienTruc?.BoCuc || ""}</p>
  <p><b>Vật liệu:</b> ${item.KienTruc?.VatLieu || ""}</p>
  
  <h3>🎎 Văn hóa</h3>
  <p><b>Vai trò:</b> ${item.VanHoa?.VaiTro || ""}</p>
  <p><b>Ý nghĩa:</b> ${item.VanHoa?.YNgia || ""}</p>
  <p><b>Giá trị:</b> ${item.VanHoa?.GiaTri || ""}</p>
  
  <h3>🎉 Lễ hội</h3>
  <p><b>Lễ chính:</b> ${item.LeHoi?.LeHoiChinh || ""}</p>
  <p><b>Hoạt động:</b> ${item.LeHoi?.HoatDong || ""}</p>
  
  <h3>🌏 Ý nghĩa địa phương</h3>
  <p><b>Du lịch:</b> ${item.YNgiaDiaPhuong?.DuLich || ""}</p>
  <p><b>Đời sống:</b> ${item.YNgiaDiaPhuong?.DoiSong || ""}</p>
  <p><b>Bảo tồn:</b> ${item.YNgiaDiaPhuong?.BaoTon || ""}</p>
  
  <h3>🛠 Bảo tồn</h3>
  <p><b>Hiện trạng:</b> ${item.BaoTon?.HienTrang || ""}</p>
  <p><b>Công tác:</b> ${item.BaoTon?.CongTac || ""}</p>
  
  <hr>

  <a href="${t.LinkMap || "#"}" target="_blank">🗺 Map</a> |
  <a href="${t.LinkHinh || "#"}" target="_blank">📷 Hình</a>

  <hr>
  <p>${item.ThongTinKhac || ""}</p>
`;

  showModal(html);
}
function showModal(html) {
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}
// 👇 THÊM Ở ĐÂY (dòng cuối file)
window.showDetail = showDetail;

function showRoute(lat, lng) {

  if (!navigator.geolocation) {
    alert("Trình duyệt không hỗ trợ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {

    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;

    // Xóa route cũ
    if (routingControl) {
      map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLat, userLng),
        L.latLng(lat, lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,

      lineOptions: {
        styles: [{ color: '#007bff', weight: 5 }]
      },

      createMarker: () => null
    }).addTo(map);

    // 👇 HIỂN THỊ KM + TIME
    routingControl.on('routesfound', function(e) {
      const route = e.routes[0];

      const distance = (route.summary.totalDistance / 1000).toFixed(2);
      const time = Math.round(route.summary.totalTime / 60);

      document.getElementById("routeInfo").innerHTML =
        `📏 ${distance} km | ⏱ ${time} phút`;
    });

  }, () => {
    alert("Không lấy được vị trí!");
  });
}
function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  document.getElementById("routeInfo").innerHTML = "Chưa có tuyến đường";
}
