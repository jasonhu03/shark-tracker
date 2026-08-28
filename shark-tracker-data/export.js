import Database from 'better-sqlite3';
import fs from 'node:fs';
const db = new Database('sharks.db');

const sharks = db.prepare(`SELECT * FROM sharks`).all();
const sharksDict = sharks.reduce((acc, shark) => {
    acc[shark.shark_id] = shark;
    return acc
}, {});

fs.writeFileSync('output/sharks.json', JSON.stringify(sharksDict,null,2));

const pings = db.prepare(`SELECT * FROM pings`).all();
const allPings = pings.reduce((acc, ping) => {
    if(!acc[ping.shark_id]){
        acc[ping.shark_id] = [];
    }
    acc[ping.shark_id].push(ping);
    return acc;
}, {});

for(const sharkHistory in allPings){
    fs.writeFileSync(`output/pings/${sharkHistory}.json`, JSON.stringify(allPings[sharkHistory],null,2));
}