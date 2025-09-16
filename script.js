/* ---------- Config & Globals ---------- */
const GEOJSON_URL = 'data.geojson'; // ensure file at repo root
const START_VIEW = [10.5, 105.1];
const START_ZOOM = 10;

let map = L.map('map', { zoomControl: false }).setView(START_VIEW, START_ZOOM);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const clusterGroup = L.markerClusterGroup(); // for many markers
let markers = []; // {layer, props}

/* routing */
let routingControl = null;
function drawRoute(fromLatLng, toLatLng) {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  // use OSRM demo server (no API key). If heavy usage, replace with a paid routing API.
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(fromLatLng.lat, fromLatLng.lng),
      L.latLng(toLatLng.lat, toLatLng.lng)
    ],
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    showAlternatives: false,
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoute: true,
    createMarker: function() { return null; } // disable default markers for route
  }).addTo(map);
}

/* ---------- Sidebar toggle ---------- */
const sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
  setTimeout(() => map.invalidateSize(), 260);
});

/* ---------- Modal big image ---------- */
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.getElementById('closeModal') || document.querySelector('.modal .close');
const modalPrev = document.getElementById('modalPrev');
const modalNext = document.getElementById('modalNext');
const modalCounter = document.getElementById('modalCounter');

let modalImages = [];
let modalIndex = 0;

function openModal(images, idx) {
  modalImages = images.slice();
  modalIndex = idx || 0;
  modalImage.src = modalImages[modalIndex];
  updateModalCounter();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}
function closeModalFn() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}
function updateModalCounter() {
  modalCounter.textContent = `${modalIndex + 1} / ${modalImages.length}`;
}
function modalNextFn() {
  if (!modalImages.length) return;
  modalIndex = (modalIndex + 1) % modalImages.length;
  modalImage.src = modalImages[modalIndex];
  updateModalCounter();
}
function modalPrevFn() {
  if (!modalImages.length) return;
  modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
  modalImage.src = modalImages[modalIndex];
  updateModalCounter();
}

closeModal?.addEventListener('click', closeModalFn);
modalNext?.addEventListener('click', modalNextFn);
modalPrev?.addEventListener('click', modalPrevFn);
window.addEventListener('keydown', (e) => {
  if (modal.style.display === 'flex') {
    if (e.key === 'ArrowRight') modalNextFn();
    if (e.key === 'ArrowLeft') modalPrevFn();
    if (e.key === 'Escape') closeModalFn();
  }
});

/* ---------- Utility: create popup HTML ---------- */
function createPopupHtml(props, geom) {
  let html = `<strong>${props.name}</strong><br><small>${props.description || ''}</small><br>`;
  // button directions
  html += `<div style="margin-top:6px"><button data-action="directions" class="btn-route">Chỉ đường</button>
           <button data-action="choose-start" class="btn-choose">Chọn điểm bắt đầu</button></div>`;

  if (props.images && props.images.length) {
    html += `<div class="popup-images">`;
    props.images.forEach((img, i) => {
      // store images array on data-images attribute (escaped)
      html += `<img src="${img}" data-images='${JSON.stringify(props.images)}' data-index="${i}" alt="${props.name} image ${i+1}'>`;
    });
    html += `</div>`;
  }
  return html;
}

/* ---------- Load GeoJSON & create markers (clustered) ---------- */
fetch(GEOJSON_URL)
.then(r => {
  if (!r.ok) throw new Error('Không tải được data.geojson: ' + r.status);
  return r.json();
})
.then(geojson => {
  // Add markers to cluster
  L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      // you can customize icon here
      return L.marker(latlng);
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      layer.bindPopup(createPopupHtml(props, feature.geometry), { maxWidth: 360 });
      markers.push({ layer, props, feature });
      clusterGroup.addLayer(layer);
    }
  });

  map.addLayer(clusterGroup);

  // Sidebar list
  renderList(markers);

  // Info count
  document.getElementById('countInfo').textContent = `${markers.length} địa điểm`;

  // fit bounds if markers present
  if (markers.length) {
    const group = L.featureGroup(markers.map(m => m.layer));
    map.fitBounds(group.getBounds().pad(0.2));
  }
})
.catch(err => {
  console.error(err);
  alert('Lỗi khi load data.geojson. Kiểm tra console.');
});

/* ---------- Sidebar rendering & search ---------- */
const placeList = document.getElementById('placeList');
const searchBox = document.getElementById('searchBox');

function renderList(markerItems, keyword = '') {
  placeList.innerHTML = '';
  const lower = (keyword || '').trim().toLowerCase();
  const filtered = markerItems.filter(m => !lower || (m.props.name || '').toLowerCase().includes(lower));
  filtered.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m.props.name || '(không tên)';
    li.addEventListener('click', () => {
      const latlng = m.layer.getLatLng();
      map.setView(latlng, 15, { animate: true });
      m.layer.openPopup();
    });
    placeList.appendChild(li);
  });
}
function renderListWrapper(k='') { renderList(markers, k); }
searchBox.addEventListener('input', (e) => renderListWrapper(e.target.value));

/* ---------- Popup open handler: delegation for images & directions ---------- */
map.on('popupopen', e => {
  const popupNode = e.popup.getElement ? e.popup.getElement() : e.popup._contentNode;
  if (!popupNode) return;

  // thumbnails -> open modal
  popupNode.querySelectorAll('.popup-images img').forEach(imgEl => {
    imgEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const imgs = JSON.parse(imgEl.getAttribute('data-images') || '[]');
      const idx = parseInt(imgEl.getAttribute('data-index') || '0', 10);
      openModal(imgs, idx);
    });
  });

  // directions button
  const rootFeature = markers.find(m => m.layer.getPopup && m.layer.getPopup() === e.popup) || null;
  // fallback: try to get by popup latlng
  let targetLatLng = null;
  if (rootFeature && rootFeature.feature && rootFeature.feature.geometry) {
    const coords = rootFeature.feature.geometry.coordinates; // [lng, lat]
    targetLatLng = { lat: coords[1], lng: coords[0] };
  } else if (e.popup._latlng) {
    targetLatLng = { lat: e.popup._latlng.lat, lng: e.popup._latlng.lng };
  }

  popupNode.querySelectorAll('button[data-action="directions"]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!targetLatLng) { alert('Không xác định được điểm đích'); return; }
      // try geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          const from = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          drawRoute(from, targetLatLng);
        }, err => {
          // user denied or failed - offer to click start point
          alert('Không lấy được vị trí hiện tại. Bạn có thể chọn điểm bắt đầu bằng "Chọn điểm bắt đầu" nút trong popup.');
        }, { enableHighAccuracy: false, timeout: 8000 });
      } else {
        alert('Trình duyệt không hỗ trợ geolocation.');
      }
    });
  });

  // choose start button
  popupNode.querySelectorAll('button[data-action="choose-start"]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      alert('Bấm vào bản đồ tại vị trí bạn muốn bắt đầu. Sau đó click lại "Chỉ đường" trên popup đích.');
      // set temporary one-time click to capture start
      const onMapClick = function(e2) {
        const start = { lat: e2.latlng.lat, lng: e2.latlng.lng };
        // open the same popup again to allow user to click "Chỉ đường" (we will store start in window)
        window.__customStartPoint = start;
        map.off('click', onMapClick);
        alert('Đã chọn điểm bắt đầu. Bây giờ mở popup đích và bấm "Chỉ đường".');
      };
      map.on('click', onMapClick);
    });
  });

  // Modified "Chỉ đường" to check for custom start
  popupNode.querySelectorAll('button[data-action="directions"]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!targetLatLng) { alert('Không xác định được điểm đích'); return; }
      if (window.__customStartPoint) {
        drawRoute(window.__customStartPoint, targetLatLng);
        window.__customStartPoint = null; // reset
        return;
      }
      // otherwise geolocation path handled earlier via other listener
    });
  });
});

/* ---------- Helpful: close modal if click outside or on ESC handled above ---------- */
modal.addEventListener('click', (ev) => {
  // if clicked outside image area -> close
  if (ev.target === modal) closeModalFn();
});
