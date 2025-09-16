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

// Popup nhỏ
function createPopupContent(props) {
  if (!props.images || props.images.length === 0) {
    return `<h3>${props.name}</h3><p>${props.description}</p>`;
  }
  return `<h3>${props.name}</h3><p>${props.description}</p>
    <div class="popup-slideshow">
      <button class="prev">&lt;</button>
      <img src="${props.images[0]}" width="200" class="popup-image">
      <button class="next">&gt;</button>
    </div>
    <p class="photoCounter">1/${props.images.length}</p>`;
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

    document.getElementById('searchBox').addEventListener('input', function(){
      var keyword = this.value.toLowerCase();
      var filtered = markers.filter(m => m.props.name.toLowerCase().includes(keyword));
      renderList(filtered);
    });

    // Popup nhỏ mở: gán slideshow và modal lớn
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

      // Click ảnh popup → modal lớn
      imgTag?.addEventListener('click', function(ev){
        ev.stopPropagation();
        openModal(props.images, idx);
      });
    });
  });

// Modal lớn
var modal = document.getElementById('imageModal');
var modalImg = document.getElementById('modalImg');
var modalIdx = 0;
var modalImages = [];

function openModal(images, index){
  modalImages = images;
  modalIdx = index;
  modalImg.src = modalImages[modalIdx];
  modal.style.display = "flex";
}

// Next / Prev modal lớn
function modalNext() {
  modalIdx = (modalIdx + 1) % modalImages.length;
  modalImg.src = modalImages[modalIdx];
}
function modalPrev() {
  modalIdx = (modalIdx - 1 + modalImages.length) % modalImages.length;
  modalImg.src = modalImages[modalIdx];
}

// Thêm nút Next / Prev vào modal
var controlsDiv = document.createElement('div');
controlsDiv.className = "modal-controls";
controlsDiv.innerHTML = `<button id="modalPrev">&lt; Prev</button><button id="modalNext">Next &gt;</button>`;
modal.appendChild(controlsDiv);

document.getElementById('modalNext').onclick = modalNext;
document.getElementById('modalPrev').onclick = modalPrev;

// Đóng modal
document.getElementById('closeModal').onclick = function(){
  modal.style.display = "none";
};
