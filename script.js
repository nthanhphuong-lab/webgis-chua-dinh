// Khởi tạo map
var map = L.map('map', { zoomControl: false }).setView([10.5, 105.1], 9);
L.control.zoom({position:'bottomright'}).addTo(map);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Toggle sidebar
var sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', function () {
  sidebar.classList.toggle('hidden');
  setTimeout(() => map.invalidateSize(), 300);
});

// Danh sách marker
var markers = [];

// Tạo popup slideshow với modal ảnh lớn
function createPopupContent(props) {
  if (!props.images || props.images.length === 0) {
    return `<h3>${props.name}</h3><p>${props.description}</p>`;
  }

  var content = `<h3>${props.name}</h3><p>${props.description}</p>`;
  content += `<div class="popup-slideshow">
    <button class="prev">&lt;</button>
    <img src="${props.images[0]}" width="200" class="popup-image">
    <button class="next">&gt;</button>
  </div>
  <p id="photoCounter">1/${props.images.length}</p>`;

  setTimeout(() => {
    var popup = document.querySelector('.popup-slideshow');
    if (!popup) return;
    var imgTag = popup.querySelector('img');
    var prevBtn = popup.querySelector('.prev');
    var nextBtn = popup.querySelector('.next');
    var counter = document.getElementById('photoCounter');
    var idx = 0;

    prevBtn.addEventListener('click', function(e){
      e.stopPropagation();
      idx = (idx - 1 + props.images.length) % props.images.length;
      imgTag.src = props.images[idx];
      counter.textContent = (idx+1)+"/"+props.images.length;
    });
    nextBtn.addEventListener('click', function(e){
      e.stopPropagation();
      idx = (idx + 1) % props.images.length;
      imgTag.src = props.images[idx];
      counter.textContent = (idx+1)+"/"+props.images.length;
    });

    // Click vào ảnh mở modal lớn
    imgTag.addEventListener('click', function(e){
      e.stopPropagation();
      var modal = document.getElementById('imageModal');
      var modalImg = document.getElementById('modalImg');
      modal.style.display = "block";
      modalImg.src = props.images[idx];
    });

    // Đóng modal
    document.getElementById('closeModal').onclick = function() {
      document.getElementById('imageModal').style.display = "none";
    }
  }, 100);

  return content;
}

// Load GeoJSON
fetch('data.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.marker(latlng),
      onEachFeature: (feature, layer) => {
        var props = feature.properties;
        layer.bindPopup(createPopupContent(props), {maxWidth: 300});
        markers.push({layer, props});
      }
    }).addTo(map);

    // Danh sách sidebar
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
  });
