// ======= LỚP NỀN ==========
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
});
var googleSat = L.tileLayer(
  'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  {
    maxZoom:20,
    subdomains:['mt0','mt1','mt2','mt3'],
    attribution:'Google Satellite'
  }
);

// ======= MAP ==========
var map = L.map('map', {
  center:[10.368,105.435],
  zoom:13,
  layers:[osm]
});

// ======= CONTROL LỚP ==========
var baseLayers = {
  "OpenStreetMap":osm,
  "Google Satellite":googleSat
};
L.control.layers(baseLayers,null,{collapsed:false}).addTo(map);

// ======= LOAD GEOJSON TỪ FILE ==========
var chuadinhLayer;
fetch('data.geojson')
  .then(response => response.json())
  .then(data => {
    chuadinhLayer = L.geoJSON(data, {
      onEachFeature:function(feature, layer){
        layer.bindPopup(
      `<b>${feature.properties.name}</b><br>${feature.properties.description}` +
      (feature.properties.image ? `<br><img src="${feature.properties.image}" width="200">` : '')
);

      }
    }).addTo(map);

    fillSidebar(chuadinhLayer,'placeList');
  });

// ======= ĐIỀN DANH SÁCH SIDEBAR ==========
function fillSidebar(layer, listId){
  var list=document.getElementById(listId);
  list.innerHTML='';
  layer.eachLayer(function(marker){
    var li=document.createElement('li');
    li.textContent=marker.feature.properties.name;
    li.addEventListener('click',function(){
      map.setView(marker.getLatLng(),16);
      marker.openPopup();
    });
    list.appendChild(li);
  });
}

// ======= NÚT ẨN/HIỆN SIDEBAR ==========
document.getElementById('toggleSidebar').addEventListener('click',function(){
  document.body.classList.toggle('sidebar-hidden');
});
