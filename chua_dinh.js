// Khởi tạo bản đồ
var map = L.map('map').setView([10.5, 105.1], 9);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// GeoJSON data
var geojsonData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Đình Châu Phú",
        "type": "Đình",
        "description": "Đình thờ Nguyễn Hữu Cảnh, di tích lịch sử tại Châu Đốc.",
        "image": "images/dinh_chau_phu.jpg"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [105.1168, 10.7023]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Chùa Xá Lợi",
        "type": "Chùa",
        "description": "Ngôi chùa nổi tiếng tại Long Xuyên.",
        "image": "images/chua_xa_loi.jpg"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [105.4248, 10.3682]
      }
    }
  ]
};

var markerLayers = []; // lưu các marker để click từ sidebar

// Hàm tạo marker và popup
function createLayer(data) {
  // Xóa marker cũ
  markerLayers.forEach(function (m) { map.removeLayer(m); });
  markerLayers = [];

  L.geoJSON(data, {
    pointToLayer: function (feature, latlng) {
      var marker = L.marker(latlng);
      marker.bindPopup(
        "<h3>" + feature.properties.name + "</h3>" +
        "<p>" + feature.properties.description + "</p>" +
        "<img src='" + feature.properties.image + "' width='200'/>"
      );
      markerLayers.push(marker);
      return marker;
    }
  }).addTo(map);
}

// Hàm cập nhật danh sách địa điểm bên sidebar
function updateList(data) {
  var list = document.getElementById('location-list');
  list.innerHTML = '';
  data.features.forEach(function (feature, index) {
    var li = document.createElement('li');
    li.textContent = feature.properties.name + ' (' + feature.properties.type + ')';
    li.addEventListener('click', function () {
      var coords = feature.geometry.coordinates;
      map.flyTo([coords[1], coords[0]], 15);
      markerLayers[index].openPopup();
    });
    list.appendChild(li);
  });
}

// Ban đầu hiển thị tất cả
createLayer(geojsonData);
updateList(geojsonData);

// Lọc theo dropdown
document.getElementById('filter').addEventListener('change', function () {
  var selected = this.value;

  var filtered = {
    "type": "FeatureCollection",
    "features": geojsonData.features.filter(function (f) {
      return selected === 'all' || f.properties.type === selected;
    })
  };

  createLayer(filtered);
  updateList(filtered);
});
