import Database from 'better-sqlite3';
const db = new Database('sharks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sharks (
    shark_id INTEGER PRIMARY KEY UNIQUE,
    name TEXT,
    weight TEXT,
    length TEXT,
    species TEXT,
    img_src TEXT
  );

  CREATE TABLE IF NOT EXISTS pings (
    time TEXT,
    lat REAL,
    lng REAL,
    import_id TEXT PRIMARY KEY UNIQUE,
    shark_id INTEGER,
    FOREIGN KEY (shark_id) REFERENCES sharks(shark_id)
  );
`);

const res = await fetch(`https://www.mapotic.com/api/v1/maps/3413/pois.geojson/`);
const data = await res.json();

const sharks = data.features.map(shark => ({
    shark_id: shark.properties.id    
}));

async function getSharkHistory(id){
    const res = await fetch(`https://www.mapotic.com/api/v1/maps/3413/pois/${id}/motion/with-meta/`);
    const data = await res.json();
        
    const points = data.motion.map(m => ({
        time: new Date(m.dt_move),
        lat: m.point.coordinates[1],
        lng: m.point.coordinates[0],
        import_id: m.import_id
    })).sort((a,b) => a.time - b.time);

    return points;
}

async function getSharkDetail(id) {
    const res = await fetch(`https://www.mapotic.com/api/v1/maps/3413/public-pois/${id}/`);
    const data = await res.json();
    const attributes = data.attributes_values;

    const sharkDetail = {
        name: data.name,
        weight: attributes[3].value,
        length: attributes[4].value,
        species: attributes[0].attribute.settings.choices[attributes[0].value].en,
        img_src: data.image.image.medium
    };

    return sharkDetail;
}

//INSERT functionality
const insertShark = db.prepare(`
  INSERT OR IGNORE INTO sharks (shark_id, name, weight, length, species, img_src)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertPing = db.prepare(`
  INSERT OR IGNORE INTO pings (import_id, shark_id, time, lat, lng)
  VALUES (?, ?, ?, ?, ?)
`);

for (const shark of sharks) {
  const shark_details = await getSharkDetail(shark.shark_id);
  const points = await getSharkHistory(shark.shark_id);

  insertShark.run(
    shark.shark_id,
    shark_details.name,
    shark_details.weight,
    shark_details.length,
    shark_details.species,
    shark_details.img_src,
  );

  for (const p of points) {
    insertPing.run(p.import_id, shark.shark_id, p.time.toISOString(), p.lat, p.lng);
  }
}