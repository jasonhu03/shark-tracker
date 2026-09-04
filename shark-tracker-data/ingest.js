import Database from 'better-sqlite3';
const db = new Database('sharks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sharks (
    shark_id INTEGER PRIMARY KEY UNIQUE,
    name TEXT,
    weight TEXT,
    length TEXT,
    species TEXT,
    life_stage TEXT,
    description TEXT,
    gender TEXT,
    img_src TEXT,
    tag_location TEXT
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

function findAttr(attributes, code) {
  return attributes.find(a => a.attribute.code === code);
}

async function getSharkDetail(id) {
    const res = await fetch(`https://www.mapotic.com/api/v1/maps/3413/public-pois/${id}/`);
    const data = await res.json();
    const attributes = data.attributes_values;

    const speciesAttr = attributes.find(a => a.attribute.code.startsWith('species:'));
    const weightAttr = findAttr(attributes, 'weight');
    const lengthAttr = findAttr(attributes, 'length');
    const life_stageAttr = findAttr(attributes, 'stage_of_life');
    const descriptionAttr = findAttr(attributes, 'description');
    const genderAttr = findAttr(attributes, 'gender');
    const tagLocationAttr = findAttr(attributes, 'tag_location');

    const sharkDetail = {
        name: data.name,
        weight: weightAttr ? weightAttr.value : null,
        length: lengthAttr ? lengthAttr.value : null,
        species: speciesAttr ? speciesAttr.attribute.settings.choices[speciesAttr.value].en : null,
        life_stage: life_stageAttr ? life_stageAttr.attribute.settings.choices[life_stageAttr.value].en : null,
        description: descriptionAttr ? descriptionAttr.value_html : null,
        gender: genderAttr ? genderAttr.attribute.settings.choices[genderAttr.value].en : null,
        img_src: data.image.image.medium,
        tag_location: tagLocationAttr ? tagLocationAttr.value : null
    };

    return sharkDetail;
}

//INSERT functionality
const insertShark = db.prepare(`
  INSERT OR IGNORE INTO sharks (shark_id, name, weight, length, species, life_stage, description, gender, img_src, tag_location)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        shark_details.life_stage,
        shark_details.description,
        shark_details.gender,
        shark_details.img_src,
        shark_details.tag_location
    );

    for (const p of points) {
        insertPing.run(p.import_id, shark.shark_id, p.time.toISOString(), p.lat, p.lng);
    }
}