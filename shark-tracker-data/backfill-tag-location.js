import Database from 'better-sqlite3';
const db = new Database('sharks.db');

const sharks = db.prepare('SELECT shark_id FROM sharks').all();

const updateShark = db.prepare(`UPDATE sharks SET tag_location = ? WHERE shark_id = ?`);

for (const shark of sharks) {
  const res = await fetch(`https://www.mapotic.com/api/v1/maps/3413/public-pois/${shark.shark_id}/`);
  const data = await res.json();
  const attributes = data.attributes_values;

  const tagLocationAttr = attributes.find(a => a.attribute.code === 'tag_location');
  const tagLocation = tagLocationAttr ? tagLocationAttr.value : null;

  updateShark.run(tagLocation, shark.shark_id);
  console.log(shark.shark_id, tagLocation);
}

console.log('Backfill complete');