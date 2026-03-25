let map = L.map('map').setView([10.5, 105.2], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let markers = [];

fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    const filterLoai = document.getElementById('filterLoai');
    const filterToc = document.getElementById('filterToc');
    const placeList = document.getElementById('placeList');

    // Lấy danh sách Loại và Tộc để tạo dropdown
    const loaiSet = new Set();
    const tocSet = new Set();
    data.features.forEach(f => {
      loaiSet.add(f.properties.loai);
      tocSet.add(f.properties.toc);
    });

    loaiSet.forEach(v => {
      const o = document.createElement('option'); o.value = v; o.textContent = v; filterLoai.appendChild(o);
    });
    tocSet.forEach(v => {
      const o = document.createElement('option'); o.value = v; o.textContent = v; filterToc.appendChild(o);
    });

    function renderList(filtered) {
      placeList.innerHTML = "";
      filtered.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f.properties.ten;
        li.addEventListener('click', () => {
          const [lng, lat] = f.geometry.coordinates;
          map.setView([lat, lng], 16);
        });
        placeList.appendChild(li);
      });
    }

    function renderMarkers(filtered) {
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      filtered.forEach(f => {
        const [lng, lat] = f.geometry.coordinates;
        const m = L.marker([lat, lng]).addTo(map).bindPopup(`<b>${f.properties.ten}</b><br>${f.properties.diachi}`);
        markers.push(m);
      });
    }

    function applyFilter() {
      const loaiV = filterLoai.value;
      const tocV = filterToc.value;
      const filtered = data.features.filter(f => {
        return (!loaiV || f.properties.loai === loaiV) &&
               (!tocV || f.properties.toc === tocV);
      });
      renderList(filtered);
      renderMarkers(filtered);
    }

    filterLoai.addEventListener('change', applyFilter);
    filterToc.addEventListener('change', applyFilter);

    // render lần đầu
    applyFilter();
  })
  .catch(err => console.error(err));
