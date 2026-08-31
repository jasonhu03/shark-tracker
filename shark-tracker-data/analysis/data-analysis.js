import Database from 'better-sqlite3';
const db = new Database('../sharks.db');

const ping_count = db.prepare(`
    SELECT sharks.name, sharks.species, 
        MAX(pings.time) as latest_ping,
        MIN(pings.time) as earliest_ping, 
        julianday(MAX(pings.time)) - julianday(MIN(pings.time)) as tracking_days, 
        COUNT(*) as ping_count from pings
    JOIN sharks on sharks.shark_id = pings.shark_id
    WHERE sharks.species LIKE '%shark%'
    GROUP BY pings.shark_id
    HAVING ping_count > 100
    ORDER BY tracking_days DESC
    LIMIT 20
    `).all();

const longest_history = db.prepare(`
    SELECT shark_id, MIN(time) as earliest_ping, MAX(time) as latest_ping FROM pings
    GROUP BY shark_id
    ORDER BY latest_ping-earliest_ping DESC
    LIMIT 10`).all();

const latitude_by_month = db.prepare(`
    SELECT sharks.name, sharks.shark_id, strftime('%m', pings.time) as month,
        AVG(pings.lat) as avg_lat
    FROM pings
    JOIN sharks ON sharks.shark_id = pings.shark_id
    WHERE sharks.species = 'White Shark (Carcharodon carcharias)'
    GROUP BY sharks.shark_id, month
    HAVING (
        SELECT COUNT(DISTINCT strftime('%m', p2.time))
        FROM pings p2
        WHERE p2.shark_id = pings.shark_id
    ) = 12
    ORDER BY sharks.shark_id, month
    LIMIT 24
    `).all();


console.log(latitude_by_month);