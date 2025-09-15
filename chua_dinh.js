// Khởi tạo bản đồ
var map = L.map('map').setView([10.5, 105.1], 9);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Dữ liệu GeoJSON
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

// Hàm hiển thị popup
function onEachFeature(feature, layer) {
  layer.bindPopup(
    "<h3>" + feature.properties.name + "</h3>" +
    "<p>" + feature.properties.description + "</p>" +
    "<img src='" + feature.properties.image + "' width='200'/>"
  );
}

// Hiển thị tất cả
var layerGroup = L.geoJSON(geojsonData, { onEachFeature: onEachFeature }).addTo(map);

// Lọc theo dropdown
document.getElementById('filter').addEventListener('change', function () {
  var selected = this.value;

  // Xóa các layer cũ
  map.eachLayer(function (layer) {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });

  // Tải lại tile layer OSM
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Lọc dữ liệu
  var filtered = {
    "type": "FeatureCollection",
    "features": geojsonData.features.filter(function (f) {
      return selected === 'all' || f.properties.type === selected;
    })
  };

  // Vẽ lại
  L.geoJSON(filtered, { onEachFeature: onEachFeature }).addTo(map);
});
