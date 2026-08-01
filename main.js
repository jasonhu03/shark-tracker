var map = L.map('map', {
    maxBounds: [[-85, -200], [85, 200]],
    maxBoundsViscosity: 0.5,
    //renderer: L.canvas()
}).setView([39.505, -70], 6);

L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
    maxZoom: 16,
    minZoom: 2.5,
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>', 
}).addTo(map);

const legend = L.control({ position: 'topright' });

legend.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `<h4>🦈 SharkWatch</h4>`;
  return div;
};

legend.addTo(map);

var sharkIcon = L.icon({
    iconUrl: 'shark.png',
    iconSize: [54, 50],
    //iconAnchor: [22, 94],
    //popupAnchor: [-3, -76],
    //shadowUrl: 'my-icon-shadow.png',
    //shadowSize: [68, 95],
    //shadowAnchor: [22, 94]
});

const months = {
  1:'January', 2:'February', 3:'March', 4:'April', 5:'May', 6:'June', 
  7:'July', 8:'August', 9:'September', 10:'October', 11:'November', 12:'December'
};

const testFeatures = [
  {
    geometry: null,
    properties: {
      name: "Test Null Shark",
      image: null,
      species: "Fake Shark",
      weight: "100 lbs",
      length: "5 ft",
      last_move_datetime: "2024-01-15T10:00:00Z"
    }
  },
  {
    geometry: { coordinates: [39.505, -70] },
    properties: {
      name: "Test No Image Shark",
      image: null,
      species: "Imageless Shark",
      weight: "200 lbs", 
      length: "8 ft",
      last_move_datetime: "2023-06-20T10:00:00Z"
    }
  }
];

fetch('https://www.mapotic.com/api/v1/maps/3413/pois.geojson/')
      .then(r => r.json())
      .then(data => {
        const allFeatures = [...testFeatures, ...data.features];
        allFeatures.forEach(feature => {
          if(!feature.geometry) return;
          const lat = feature.geometry.coordinates[1];
          const lng = feature.geometry.coordinates[0];
          const p = feature.properties;
          const name = p.name;
          const img = p.image ? p.image : 'https://cdn.pixabay.com/photo/2022/06/16/11/51/shark-7265786_1280.png';
          const last_seen = p.last_move_datetime.split("-");

          const marker = L.marker([lat,lng], {icon: sharkIcon})
            .addTo(map)
            .bindPopup(`
              <b>${name}</b>
              <img src=${img} width="200"/>
              <p>Species: ${p.species}
                Width: ${p.weight}
                Length: ${p.length}
                Last Seen: ${months[parseInt(last_seen[1])]} ${last_seen[2].split('T')[0]}, ${last_seen[0]}</p>
              `);

          })
      })
      .catch(err => console.log('Error:', err))

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}



map.on('click', onMapClick);