// Khởi tạo map
var map = L.map('map').setView([10.5, 105.1], 9);

// Thêm tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Danh sách marker để click từ sidebar
var markers = [];

// Load GeoJSON
fetch('data.geojson')
  .then(response => response.json())
  .then(data => {
    // Thêm marker mặc định Leaflet
    L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        var props = feature.properties;
        var popupContent = `<b>${props.name}</b><br>${props.description}`;
        if (props.image) {
          popupContent += `<br><img src="${props.image}" width="150">`;
        }
        layer.bindPopup(popupContent);

        // lưu marker để dùng cho sidebar
        markers.push({layer: layer, props: props});
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng); // mặc định icon
      }
    }).addTo(map);

    // Tạo danh sách bên trái
    var placeList = document.getElementById('placeList');
    markers.forEach((m, i) => {
      var li = document.createElement('li');
      li.textContent = m.props.name;
      li.addEventListener('click', () => {
        map.setView(m.layer.getLatLng(), 15);
        m.layer.openPopup();
      });
      placeList.appendChild(li);
    });

    // Tìm kiếm
    var searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', function () {
      var keyword = this.value.toLowerCase();
      placeList.innerHTML = '';
      markers.forEach(m => {
        if (m.props.name.toLowerCase().includes(keyword)) {
          var li = document.createElement('li');
          li.textContent = m.props.name;
          li.addEventListener('click', () => {
            map.setView(m.layer.getLatLng(), 15);
            m.layer.openPopup();
          });
          placeList.appendChild(li);
        }
      });
    });
  });
