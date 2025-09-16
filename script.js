var map = L.map('map', { zoomControl: false }).setView([10.5, 105.1], 9);
L.control.zoom({position:'bottomright'}).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', function () {
  sidebar.classList.toggle('hidden');
  setTimeout(() => map.invalidateSize(), 300);
});

var markers = [];

// Tạo popup content
function createPopupContent(props) {
  if (!props.images || props.images.length === 0) {
    return `<h3>${props.name}</h3><p>${props.description}</p>`;
  }
  var content = `<h3>${props.name}</h3><p>${props.description}</p>
  <div class="popup-slideshow">
    <button class="prev">&lt;</button>
    <img src="${props.images[0]}" width="200" class="popup-image">
    <button class="next">&gt;</button>
  </div>
  <p class="photoCounter">1/${props.images.length}</p>`;
  return content;
}

// Load GeoJSON
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.marker(latlng),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createPopupContent(feature.properties), {maxWidth: 300});
        markers.push({layer, props: feature.properties});
      }
    }).addTo(map);

    // Sidebar
    var placeList = document.getElementById('placeList');
    function renderList(items) {
      placeList.innerHTML = '';
      items.forEach(m => {
        var li = document.createElement('li');
        li.textContent = m.props.name;
        li.addEventListener('click', () => {
          map.setView(m.layer.getLatLng(), 15);
          m.layer.openPopup();
        });
        placeList.appendChild(li);
      });
    }
    renderList(markers);

    // Tìm kiếm
    document.getElementById('searchBox').addEventListener('input', function(){
      var keyword = this.value.toLowerCase();
      var filtered = markers.filter(m => m.props.name.toLowerCase().includes(keyword));
      renderList(filtered);
    });

    // Popup open event để gán slideshow + modal
    map.on('popupopen', function(e){
      var popupNode = e.popup.getElement();
      if (!popupNode) return;
      var props = markers.find(m => m.layer.getPopup() === e.popup)?.props;
      if (!props) return;

      var imgTag = popupNode.querySelector('img.popup-image');
      var prevBtn = popupNode.querySelector('.prev');
      var nextBtn = popupNode.querySelector('.next');
      var counter = popupNode.querySelector('.photoCounter');
      var idx = 0;

      prevBtn?.addEventListener('click', function(ev){
        ev.stopPropagation();
        idx = (idx - 1 + props.images.length) % props.images.length;
        imgTag.src = props.images[idx];
        counter.textContent = (idx+1)+"/"+props.images.length;
      });
      nextBtn?.addEventListener('click', function(ev){
        ev.stopPropagation();
        idx = (idx + 1) % props.images.length;
        imgTag.src = props.images[idx];
        counter.textContent = (idx+1)+"/"+props.images.length;
      });

      // Click ảnh mở modal lớn
      imgTag?.addEventListener('click', function(ev){
        ev.stopPropagation();
        document.getElementById('imageModal').style.display = "block";
        document.getElementById('modalImg').src = props.images[idx];
      });
    });
  });

// Đóng modal
document.getElementById('closeModal').onclick = function(){
  document.getElementById('imageModal').style.display = "none";
};
