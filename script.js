// script.js - load data.geojson, build markers + sidebar + search + toggle

// Khởi tạo map (zoom control mặc định đc tạo nhưng sẽ ở vị trí mặc định; chúng ta sẽ thêm lại xuống bottomright)
const map = L.map('map', { center: [10.5, 105.1], zoom: 11, zoomControl: false });

// Tile layer OSM
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// thêm zoom control ở bottomright để ko che sidebar
L.control.zoom({ position: 'bottomright' }).addTo(map);

// containers
let items = [];        // { feature, marker }
const listEl = document.getElementById('list');
const searchBox = document.getElementById('searchBox');
const btnToggle = document.getElementById('btnToggle');

// giúp tạo popup content (kèm ảnh nếu có)
function makePopupContent(props) {
  const name = props.name || '';
  const desc = props.description ? `<div style="font-size:13px;margin-top:4px">${props.description}</div>` : '';
  const img = props.image ? `<img src="${props.image}" alt="${name}">` : '';
  return `<div><strong>${name}</strong>${desc}${img}</div>`;
}

// hiển thị lỗi trong sidebar nếu cần
function showSidebarMessage(msg) {
  listEl.innerHTML = `<div style="padding:12px;color:#666">${msg}</div>`;
}

// Tải GeoJSON từ file data.geojson
fetch('data.geojson')
  .then(r => {
    if (!r.ok) throw new Error('Không tìm thấy data.geojson (HTTP ' + r.status + ')');
    return r.json();
  })
  .then(data => {
    if (!data.features || data.features.length === 0) {
      showSidebarMessage('Không có địa điểm trong data.geojson');
      return;
    }

    // tạo marker cho từng feature và thêm vào items
    data.features.forEach((f, idx) => {
      const coords = f.geometry && f.geometry.coordinates;
      if (!coords || coords.length < 2) return;
      const latlng = [coords[1], coords[0]];
      const marker = L.marker(latlng); // mặc định icon Leaflet

      const popup = makePopupContent(f.properties || {});
      marker.bindPopup(popup);

      marker.addTo(map);
      items.push({ feature: f, marker });
    });

    // fit map tới tất cả marker (nếu có)
    const group = L.featureGroup(items.map(it => it.marker));
    if (items.length) map.fitBounds(group.getBounds(), { padding: [40,40] });

    // Hiển thị danh sách ban đầu
    renderList(items);

  })
  .catch(err => {
    console.error(err);
    showSidebarMessage('Lỗi tải data.geojson: ' + err.message);
  });


// Render danh sách từ mảng items (hoặc từ filtered list)
function renderList(listItems) {
  listEl.innerHTML = '';
  if (!listItems || listItems.length === 0) {
    listEl.innerHTML = '<div style="padding:12px;color:#666">Không có kết quả</div>';
    return;
  }

  listItems.forEach((it, i) => {
    const props = it.feature.properties || {};
    const div = document.createElement('div');
    div.className = 'item';

    // thumb (nếu có) - nếu không có ảnh sẽ hiển thị khung xám
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = props.image || '';
    thumb.alt = props.name || '';
    // nếu image rỗng, dùng a tiny transparent data URI -> CSS background gray vẫn hiển thị
    if (!props.image) {
      thumb.style.background = '#ddd';
      thumb.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 gif
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = props.name || '(Không tên)';
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = props.description || '';

    meta.appendChild(title);
    meta.appendChild(desc);

    div.appendChild(thumb);
    div.appendChild(meta);

    // click => zoom + open popup
    div.addEventListener('click', () => {
      const m = it.marker;
      map.setView(m.getLatLng(), 15);
      m.openPopup();
    });

    listEl.appendChild(div);
  });
}

// Search: filter items by name or description
searchBox.addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  if (!q) {
    renderList(items);
    // show all markers
    items.forEach(it => { if (!map.hasLayer(it.marker)) map.addLayer(it.marker); });
    // fit to visible
    fitToVisibleMarkers();
    return;
  }

  const filtered = items.filter(it => {
    const p = it.feature.properties || {};
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  // hide all markers then show only filtered
  items.forEach(it => {
    if (filtered.indexOf(it) === -1) {
      if (map.hasLayer(it.marker)) map.removeLayer(it.marker);
    } else {
      if (!map.hasLayer(it.marker)) map.addLayer(it.marker);
    }
  });

  renderList(filtered);
  fitToVisibleMarkers();
});

// Fit map to currently visible markers
function fitToVisibleMarkers() {
  const visible = items.filter(it => map.hasLayer(it.marker)).map(it => it.marker);
  if (visible.length === 0) return;
  const group = L.featureGroup(visible);
  try { map.fitBounds(group.getBounds(), { padding: [40,40] }); }
  catch (e) { /* ignore */ }
}

// Toggle sidebar
btnToggle.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-closed');
  // map cần invalidate size sau khi transition kết thúc
  setTimeout(() => map.invalidateSize(), 320);
});
