import Database from 'better-sqlite3';
import fs from 'node:fs';
const db = new Database('sharks.db');

const sharks = db.prepare(`SELECT * FROM sharks`).all();
const sharksDict = sharks.reduce((acc, shark) => {
    acc[shark.shark_id] = shark;
    return acc
});

fs.writeFileSync('output/sharks.json', JSON.stringify(sharksDict,null,2));