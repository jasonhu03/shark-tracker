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
var num_sharks = 0;

legend.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = 
  `<h4>🦈 SharkWatch</h4>
  <div id ="num-tracker"></div>
  <div id="search-container">
    <input type="text" id="shark-search" placeholder="Search sharks..."/>
  </div>
  <div id="category-filters"></div>`;
  L.DomEvent.disableClickPropagation(div);
  L.DomEvent.disableScrollPropagation(div);
  return div;
};

legend.addTo(map);

const filterContainer = document.getElementById('category-filters');
filterContainer.innerHTML = '<button class="filter-btn active" data-category="all">All</button>';

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

const markers = [];
const categories = ["Sharks", "Dolphins", "Turtles", "Seals", "Alligators", "Swordfish"];
categories.forEach(s => {
  filterContainer.innerHTML += `<button class="filter-btn" data-category="${s.toLowerCase()}">${s}</button>`;
});

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
      category_name: {
        en: "Sharks"
      },
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
          try{
          if(!feature.geometry) return;
          const lat = feature.geometry.coordinates[1];
          const lng = feature.geometry.coordinates[0];
          const p = feature.properties;
          const name = p.name;
          const category_name = p.category_name.en;
          const img = p.image ? p.image : 'https://cdn.pixabay.com/photo/2022/06/16/11/51/shark-7265786_1280.png';
          const last_seen = p.last_move_datetime.split("-");

          const marker = L.marker([lat,lng], {icon: sharkIcon, riseOnHover: true})
            .addTo(map)
            .bindPopup(`
              <b>${name}</b>
              <img src=${img} width="200"/>
              <p>Species: ${p.species}
                Width: ${p.weight}
                Length: ${p.length}
                Last Seen: ${months[parseInt(last_seen[1])]} ${last_seen[2].split('T')[0]}, ${last_seen[0]}</p>
              `);
          marker.sharkName = name.toLowerCase();
          marker.category_name = category_name.toLowerCase();
          marker.on('click', function(){
            openSharkPanel(p.id, p.slug);
          });
          markers.push(marker);
          num_sharks++;
          }
            catch(err){
              console.log("error", feature.properties.name, err);
            }
        })
        console.log(num_sharks);
        document.getElementById('num-tracker').innerHTML = `<h4>Currently Tracking: ${num_sharks} sharks</h4>`;
      })

console.log(categories);

var popup = L.popup();

function onMapClick(e) {
    popup
    .setLatLng(e.latlng)
    .setContent("You clicked the map at " + e.latlng.toString())
    .openOn(map);
}

function openSharkPanel(id, slug) {
  history.pushState({sharkId:id}, '', `${id}`);
  fetch(`https://www.mapotic.com/api/v1/maps/3413/public-pois/${id}/`)
    .then(r => r.json())
    .then(data => {
      console.log(data)
      const name = data.name
      const attributes = data.attributes_values
      const weight = attributes[3].value;
      const length = attributes[4].value;
      document.getElementById('panel-content').innerHTML = `
      <b>${name}</b>
      <img src="${data.image.image.medium}" width="100%"/>
      <p>Species: ${attributes[0].attribute.settings.choices[attributes[0].value].en}</p>
      <p>Length: ${length}</p>
      <p>Weight: ${weight}</p>
      `;
    });
    

  L.DomEvent.disableClickPropagation(document.getElementById('panel-content'));
  document.getElementById('shark-panel').classList.add('open');
  document.getElementById('close-panel').addEventListener('click', () =>{
    closeSharkPanel();
  });
}

function closeSharkPanel(){
  document.getElementById('shark-panel').classList.remove('open');
  history.pushState({}, '', window.location.pathname);
}
document.getElementById('shark-search').addEventListener('input', function() {
  const query = this.value.toLowerCase();
  num_sharks = 0;
  markers.forEach(marker => {
    if ((selected === 'all' || marker.category_name === selected) && (marker.sharkName.startsWith(query) || marker.category_name === query)) {
      marker.addTo(map);
      num_sharks+=1;
    } else {
      marker.remove();
    }
  });
  document.getElementById('num-tracker').innerHTML = `<h4>Currently Tracking: ${num_sharks} sharks</h4>`;
});

var selected = 'all';
document.getElementById('category-filters').addEventListener('click', function(e) {
  if (!e.target.classList.contains('filter-btn')) return;
  
  selected = e.target.dataset.category;
  console.log(selected);
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  num_sharks = 0;

  markers.forEach(marker => {
    if (selected === 'all' || marker.category_name === selected) {
      marker.addTo(map);
      num_sharks+=1;
    } else {
      marker.remove();
    }
  });
  document.getElementById('num-tracker').innerHTML = `<h4>Currently Tracking: ${num_sharks} sharks</h4>`;
});

map.on('click', onMapClick);