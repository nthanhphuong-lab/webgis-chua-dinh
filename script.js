let loai = [], toc = [], phuongxa = [], loaicoso = [];
let dataFeatures = [];
let map, markersLayer;
let tongquatData = [];

// Tuyến đường đơn hiện có
let routingControl = null;
let manualLocation = null;
let pickingLocation = false;
let manualMarker = null;

// Tour nhiều chùa/miếu
let tourRoutingControl = null;
let tourStopCounter = 0;
const MAX_TOUR_STOPS = 10;

Promise.all([
  fetch('loai.json').then(r => r.json()),
  fetch('toc.json').then(r => r.json()),
  fetch('phuongxa.json').then(r => r.json()),
  fetch('loaicoso.json').then(r => r.json()),
  fetch('data.geojson').then(r => r.json()),
  fetch('tongquat.json').then(r => r.json())
])
.then(([l, t, px, cs, geo, tq]) => {
  loai = l;
  toc = t;
  phuongxa = px;
  loaicoso = cs;
  dataFeatures = geo.features || [];
  tongquatData = tq;

  initMap();
  populateFilters();
  initPilgrimageTour();
  applyFilter();
})
.catch(err => {
  console.error("Lỗi load:", err);
  alert("Không tải được dữ liệu. Hãy kiểm tra các file JSON/GeoJSON.");
});

function initMap() {
  map = L.map('map', { zoomControl: false })
    .setView([10.38, 105.43], 10);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM'
  }).addTo(map);

  map.on('click', function(e) {
    if (!pickingLocation) return;

    manualLocation = e.latlng;

    if (manualMarker) map.removeLayer(manualMarker);

    manualMarker = L.marker(manualLocation, {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:18px;
          height:18px;
          background:red;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 0 5px rgba(0,0,0,0.5);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    })
    .addTo(map)
    .bindPopup("📍 Vị trí bạn chọn")
    .openPopup();

    pickingLocation = false;
    alert("Đã chọn vị trí!");
  });
}

function populateFilters() {
  const fLoai = document.getElementById('filterLoai');
  const fToc = document.getElementById('filterToc');
  const fPX = document.getElementById('filterPhuongXa');
  const fCS = document.getElementById('filterLoaiCoSo');

  loai.forEach(x => fLoai.innerHTML += `<option value="${x.id}">${escapeHtml(x.name)}</option>`);
  toc.forEach(x => fToc.innerHTML += `<option value="${x.id}">${escapeHtml(x.name)}</option>`);
  phuongxa.forEach(x => fPX.innerHTML += `<option value="${x.id}">${escapeHtml(x.name)}</option>`);
  loaicoso.forEach(x => fCS.innerHTML += `<option value="${x.id}">${escapeHtml(x.name)}</option>`);

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

  document.getElementById("btnPickLocation").onclick = () => {
    pickingLocation = true;
    alert("👉 Nhấp lên bản đồ để chọn vị trí");
  };
}

function applyFilter() {
  const fLoai = document.getElementById('filterLoai').value;
  const fToc = document.getElementById('filterToc').value;
  const fPX = document.getElementById('filterPhuongXa').value;
  const fCS = document.getElementById('filterLoaiCoSo').value;

  const filtered = dataFeatures.filter(f => {
    const p = f.properties || {};
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

  const redIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  markersLayer = L.geoJSON(features, {
    pointToLayer: function(feature, latlng) {
      const p = feature.properties || {};

      // Chỉ Chùa Quan Đế có MaChua 108030742 là ghim đỏ
      if (String(p.MaChua) === "108030742") {
        return L.marker(latlng, { icon: redIcon });
      }

      return L.marker(latlng);
    },

    onEachFeature: (f, layer) => {
      const p = f.properties || {};

      const loaiName = loai.find(x => x.id == p.Loai)?.name || "Không rõ";
      const tocName = toc.find(x => x.id == p.Toc)?.name || "Không rõ";
      const pxName = phuongxa.find(x => x.id == p.DiaDanh)?.name || p.DiaDanh || "";
      const cs = loaicoso.find(x => x.id == p.LoaiCoSo);
      const lat = f.geometry.coordinates[1];
      const lng = f.geometry.coordinates[0];

      layer.bindPopup(`
        <b>${escapeHtml(p.TenDanhSach || "Không tên")}</b><br>
        Loại thần: ${escapeHtml(loaiName)}<br>
        Tộc: ${escapeHtml(tocName)}<br>
        Phường/Xã: ${escapeHtml(pxName)}<br>
        Loại cơ sở: ${escapeHtml(cs?.name || "")}<br>
        ${escapeHtml(p.DiaChi || "")}<br><br>

        <button onclick="showDetail('${escapeJsString(p.Ma)}')">
          🔍 Xem chi tiết
        </button>
        <button onclick="showRoute(${lat}, ${lng})">
          🧭 Chỉ đường
        </button>
        <button onclick="addFeatureToTour('${escapeJsString(p.Ma)}')">
          ➕ Thêm vào tour
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
    li.textContent = f.properties?.TenDanhSach || "Không tên";

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

  const t = item.ThongTinChung || {};

  const html = `
    <h2>${escapeHtml(t.TenCoSo || "")}</h2>

    <p><b>📍 Địa chỉ:</b> ${escapeHtml(t.DiaChi || "")}</p>
    <p><b>🏮 Loại:</b> ${escapeHtml(t.LoaiChua || "")}</p>
    <p><b>🙏 Thần chủ:</b> ${escapeHtml(t.ThanChu || "")}</p>
    <p><b>👥 Tộc:</b> ${escapeHtml(t.Toc || "")}</p>
    <p><b>🧭 Phường/Xã:</b> ${escapeHtml(t.PhuongXa || "")}</p>

    <hr>

    <h3>📜 Lịch sử</h3>
    <p><b>Thời gian:</b> ${escapeHtml(item.LichSu?.ThoiGian || "")}</p>
    <p><b>Người sáng lập:</b> ${escapeHtml(item.LichSu?.NguoiSangLap || "")}</p>
    <p><b>Trùng tu:</b> ${escapeHtml(item.LichSu?.TrungTu || "")}</p>

    <h3>🏛 Kiến trúc</h3>
    <p><b>Phong cách:</b> ${escapeHtml(item.KienTruc?.PhongCach || "")}</p>
    <p><b>Bố cục:</b> ${escapeHtml(item.KienTruc?.BoCuc || "")}</p>
    <p><b>Vật liệu:</b> ${escapeHtml(item.KienTruc?.VatLieu || "")}</p>

    <h3>🎎 Văn hóa</h3>
    <p><b>Vai trò:</b> ${escapeHtml(item.VanHoa?.VaiTro || "")}</p>
    <p><b>Ý nghĩa:</b> ${escapeHtml(item.VanHoa?.YNgia || "")}</p>
    <p><b>Giá trị:</b> ${escapeHtml(item.VanHoa?.GiaTri || "")}</p>

    <h3>🎉 Lễ hội</h3>
    <p><b>Lễ chính:</b> ${escapeHtml(item.LeHoi?.LeHoiChinh || "")}</p>
    <p><b>Hoạt động:</b> ${escapeHtml(item.LeHoi?.HoatDong || "")}</p>

    <h3>🌏 Ý nghĩa địa phương</h3>
    <p><b>Du lịch:</b> ${escapeHtml(item.YNgiaDiaPhuong?.DuLich || "")}</p>
    <p><b>Đời sống:</b> ${escapeHtml(item.YNgiaDiaPhuong?.DoiSong || "")}</p>
    <p><b>Bảo tồn:</b> ${escapeHtml(item.YNgiaDiaPhuong?.BaoTon || "")}</p>

    <h3>🛠 Bảo tồn</h3>
    <p><b>Hiện trạng:</b> ${escapeHtml(item.BaoTon?.HienTrang || "")}</p>
    <p><b>Công tác:</b> ${escapeHtml(item.BaoTon?.CongTac || "")}</p>

    <hr>

    <a href="${safeUrl(t.LinkMap)}" target="_blank" rel="noopener">🗺 Map</a> |
    <a href="${safeUrl(t.LinkHinh)}" target="_blank" rel="noopener">📷 Hình</a>

    <hr>
    <p>${escapeHtml(item.ThongTinKhac || "")}</p>
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

/* =========================================================
   CHỈ ĐƯỜNG ĐƠN — GIỮ NGUYÊN CHỨC NĂNG CŨ
   ========================================================= */

function showRoute(lat, lng) {
  // Ưu tiên vị trí chọn tay
  if (manualLocation) {
    drawRoute(manualLocation.lat, manualLocation.lng, lat, lng);
    return;
  }

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    alert("⚠️ Phải chạy HTTPS hoặc localhost mới lấy được GPS!");
    return;
  }

  if (!navigator.geolocation) {
    alert("Trình duyệt không hỗ trợ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      if (userLat < 9 || userLat > 12) {
        alert("⚠️ Vị trí có vẻ nằm ngoài khu vực dữ liệu, hãy kiểm tra hoặc chọn tay!");
      }

      drawRoute(userLat, userLng, lat, lng);
    },
    function(err) {
      console.error(err);
      alert("❌ Không lấy được GPS → hãy chọn vị trí thủ công!");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

function drawRoute(userLat, userLng, lat, lng) {
  clearTourRouteOnly();
  clearSingleRouteOnly();

  routingControl = L.Routing.control({
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
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
    createMarker: function(i, wp) {
      return L.marker(wp.latLng).bindPopup(
        i === 0 ? "📍 Bạn đang ở đây" : "🎯 Điểm đến"
      );
    }
  }).addTo(map);

  const routeBox = document.getElementById("routeBox");
  if (routeBox) routeBox.style.display = "block";

  const routeInfo = document.getElementById("routeInfo");
  if (routeInfo) routeInfo.innerHTML = "⏳ Đang tính đường...";

  routingControl.on('routesfound', function(e) {
    const route = e.routes[0];
    const distance = (route.summary.totalDistance / 1000).toFixed(2);
    const time = formatMinutes(Math.round(route.summary.totalTime / 60));

    if (routeInfo) {
      routeInfo.innerHTML = `📏 ${distance} km | ⏱ ${time}`;
    }
  });

  routingControl.on('routingerror', function(err) {
    console.error("Lỗi tìm đường:", err);
    if (routeInfo) routeInfo.innerHTML = "❌ Không tìm được tuyến đường.";
  });
}

function clearSingleRouteOnly() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

function clearRoute() {
  clearSingleRouteOnly();

  if (manualMarker) {
    map.removeLayer(manualMarker);
    manualMarker = null;
  }

  manualLocation = null;
  pickingLocation = false;

  const routeInfo = document.getElementById("routeInfo");
  if (routeInfo) routeInfo.innerHTML = "Chưa có tuyến đường";

  const routeBox = document.getElementById("routeBox");
  if (routeBox) routeBox.style.display = "none";
}

/* =========================================================
   TOUR HÀNH HƯƠNG NHIỀU ĐIỂM — MODULE ĐỘC LẬP
   ========================================================= */

function initPilgrimageTour() {
  const panel = document.getElementById("tourPanel");
  const stopList = document.getElementById("tourStopList");

  if (!panel || !stopList) {
    console.warn("Chưa chèn giao diện #tourPanel vào index.html");
    return;
  }

  const toggleBtn = document.getElementById("toggleTourPanel");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      panel.classList.toggle("tour-hidden");
      setTimeout(() => map.invalidateSize(), 250);
    };
  }

  document.getElementById("addTourStop").onclick = () => addTourStop();
  document.getElementById("calculateTour").onclick = calculateTourRoute;
  document.getElementById("clearTour").onclick = clearTour;

  // Mặc định tạo 3 điểm: xuất phát, điểm dừng, điểm đến
  addTourStop();
  addTourStop();
  addTourStop();
  updateTourStopLabels();
}

function buildPlaceOptions(selectedValue = "") {
  const sorted = [...dataFeatures]
    .filter(isValidPointFeature)
    .sort((a, b) => {
      const nameA = a.properties?.TenDanhSach || "";
      const nameB = b.properties?.TenDanhSach || "";
      return nameA.localeCompare(nameB, "vi");
    });

  let html = `<option value="">-- Chọn chùa/miếu --</option>`;

  sorted.forEach(feature => {
    const p = feature.properties || {};
    const value = String(p.Ma || "");
    const name = p.TenDanhSach || p.TenCong || p.Ma || "Không tên";
    const address = p.DiaChi ? ` — ${p.DiaChi}` : "";
    const selected = value === String(selectedValue) ? " selected" : "";

    html += `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(name + address)}</option>`;
  });

  return html;
}

function addTourStop(selectedMa = "") {
  const list = document.getElementById("tourStopList");
  if (!list) return;

  if (list.children.length >= MAX_TOUR_STOPS) {
    alert(`Chỉ nên dùng tối đa ${MAX_TOUR_STOPS} điểm trong một tuyến.`);
    return;
  }

  tourStopCounter += 1;

  const row = document.createElement("div");
  row.className = "tour-stop-row";
  row.dataset.stopId = String(tourStopCounter);

  row.innerHTML = `
    <span class="tour-stop-number"></span>

    <select class="tour-place-select" aria-label="Chọn cơ sở">
      ${buildPlaceOptions(selectedMa)}
    </select>

    <div class="tour-order-buttons">
      <button type="button" class="tour-up" title="Đưa lên">↑</button>
      <button type="button" class="tour-down" title="Đưa xuống">↓</button>
      <button type="button" class="tour-remove" title="Xóa điểm">×</button>
    </div>
  `;

  row.querySelector(".tour-up").onclick = () => moveTourStop(row, -1);
  row.querySelector(".tour-down").onclick = () => moveTourStop(row, 1);
  row.querySelector(".tour-remove").onclick = () => removeTourStop(row);

  list.appendChild(row);
  updateTourStopLabels();
}

function addFeatureToTour(ma) {
  const list = document.getElementById("tourStopList");
  if (!list) {
    alert("Chưa có giao diện Tour hành hương trong index.html.");
    return;
  }

  const emptySelect = [...list.querySelectorAll(".tour-place-select")]
    .find(select => !select.value);

  if (emptySelect) {
    emptySelect.value = String(ma);
  } else {
    addTourStop(ma);
  }

  const panel = document.getElementById("tourPanel");
  panel?.classList.remove("tour-hidden");
  updateTourStopLabels();
}

function removeTourStop(row) {
  const list = document.getElementById("tourStopList");
  if (!list) return;

  if (list.children.length <= 2) {
    alert("Tuyến đường phải có ít nhất 2 địa điểm.");
    return;
  }

  row.remove();
  updateTourStopLabels();
}

function moveTourStop(row, direction) {
  const list = document.getElementById("tourStopList");
  if (!list) return;

  if (direction < 0 && row.previousElementSibling) {
    list.insertBefore(row, row.previousElementSibling);
  }

  if (direction > 0 && row.nextElementSibling) {
    list.insertBefore(row.nextElementSibling, row);
  }

  updateTourStopLabels();
}

function updateTourStopLabels() {
  const rows = [...document.querySelectorAll("#tourStopList .tour-stop-row")];

  rows.forEach((row, index) => {
    const number = row.querySelector(".tour-stop-number");
    const removeBtn = row.querySelector(".tour-remove");

    number.textContent = String(index + 1);

    if (index === 0) {
      row.dataset.role = "start";
      row.title = "Điểm xuất phát";
    } else if (index === rows.length - 1) {
      row.dataset.role = "end";
      row.title = "Điểm đến";
    } else {
      row.dataset.role = "stop";
      row.title = `Điểm dừng ${index}`;
    }

    if (removeBtn) removeBtn.disabled = rows.length <= 2;
  });
}

function calculateTourRoute() {
  const rows = [...document.querySelectorAll("#tourStopList .tour-stop-row")];
  const selectedValues = rows
    .map(row => row.querySelector(".tour-place-select")?.value || "");

  if (selectedValues.length < 2) {
    alert("Cần ít nhất 2 địa điểm.");
    return;
  }

  if (selectedValues.some(value => !value)) {
    alert("Vui lòng chọn đầy đủ tất cả địa điểm trong tour.");
    return;
  }

  const unique = new Set(selectedValues);
  if (unique.size !== selectedValues.length) {
    alert("Một chùa/miếu không nên được chọn lặp lại trong cùng một tour.");
    return;
  }

  const features = selectedValues.map(getFeatureByMa);

  if (features.some(feature => !feature || !isValidPointFeature(feature))) {
    alert("Có địa điểm thiếu hoặc sai tọa độ.");
    return;
  }

  const waypoints = features.map(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    return L.latLng(Number(lat), Number(lng));
  });

  drawTourRoute(waypoints, features);
}

function drawTourRoute(waypoints, features) {
  clearSingleRouteOnly();
  clearTourRouteOnly();

  const info = document.getElementById("tourInfo");
  if (info) info.innerHTML = "⏳ Đang tính tuyến qua các điểm...";

  tourRoutingControl = L.Routing.control({
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1"
    }),
    waypoints,
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false,
    lineOptions: {
      styles: [{
        color: "#1769e0",
        weight: 6,
        opacity: 0.85
      }]
    },
    createMarker: function(index, waypoint) {
      const feature = features[index];
      const name = feature?.properties?.TenDanhSach || `Điểm ${index + 1}`;

      return L.marker(waypoint.latLng, {
        icon: createNumberedTourIcon(index + 1)
      }).bindPopup(`<b>${index + 1}. ${escapeHtml(name)}</b>`);
    }
  }).addTo(map);

  tourRoutingControl.on("routesfound", function(event) {
    const route = event.routes[0];
    const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
    const minutes = Math.round(route.summary.totalTime / 60);

    const itinerary = features.map((feature, index) => {
      const name = feature.properties?.TenDanhSach || `Điểm ${index + 1}`;
      return `<li><b>${index + 1}.</b> ${escapeHtml(name)}</li>`;
    }).join("");

    if (info) {
      info.innerHTML = `
        <div><b>📏 Tổng quãng đường:</b> ${distanceKm} km</div>
        <div><b>⏱ Thời gian dự kiến:</b> ${formatMinutes(minutes)}</div>
        <div><b>🛕 Số địa điểm:</b> ${features.length}</div>
        <ol class="tour-summary-list">${itinerary}</ol>
      `;
    }
  });

  tourRoutingControl.on("routingerror", function(error) {
    console.error("Lỗi tour:", error);
    if (info) {
      info.innerHTML =
        "❌ Không tính được tuyến. Có thể một điểm nằm ngoài mạng đường bộ hoặc máy chủ định tuyến đang bận.";
    }
  });
}

function createNumberedTourIcon(number) {
  return L.divIcon({
    className: "tour-numbered-marker-wrapper",
    html: `<div class="tour-numbered-marker">${number}</div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
  });
}

function clearTourRouteOnly() {
  if (tourRoutingControl) {
    map.removeControl(tourRoutingControl);
    tourRoutingControl = null;
  }
}

function clearTour() {
  clearTourRouteOnly();

  const list = document.getElementById("tourStopList");
  if (list) {
    list.innerHTML = "";
    addTourStop();
    addTourStop();
    addTourStop();
  }

  const info = document.getElementById("tourInfo");
  if (info) info.innerHTML = "Chưa tính tuyến.";

  updateTourStopLabels();
}

function getFeatureByMa(ma) {
  return dataFeatures.find(feature =>
    String(feature.properties?.Ma) === String(ma)
  );
}

function isValidPointFeature(feature) {
  if (!feature?.geometry || feature.geometry.type !== "Point") return false;

  const coords = feature.geometry.coordinates;
  return Array.isArray(coords)
    && coords.length >= 2
    && Number.isFinite(Number(coords[0]))
    && Number.isFinite(Number(coords[1]));
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJsString(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

function safeUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "#";
}

window.showDetail = showDetail;
window.showRoute = showRoute;
window.clearRoute = clearRoute;
window.closeModal = closeModal;

window.addTourStop = addTourStop;
window.addFeatureToTour = addFeatureToTour;
window.calculateTourRoute = calculateTourRoute;
window.clearTour = clearTour;
