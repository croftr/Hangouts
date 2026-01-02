const Database = require('better-sqlite3');
const { statSync } = require('fs');
const { join } = require('path');

const dbPath = join(process.cwd(), 'messages.db');

console.log('Original size:', (statSync(dbPath).size / 1024 / 1024).toFixed(2), 'MB');

const db = new Database(dbPath);

console.log('Running VACUUM to optimize database...');
db.exec('VACUUM');

console.log('Optimized size:', (statSync(dbPath).size / 1024 / 1024).toFixed(2), 'MB');

db.close();
console.log('Database optimization complete!');
