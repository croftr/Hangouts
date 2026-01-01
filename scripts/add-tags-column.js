const Database = require('better-sqlite3');
const path = require('path');

function addTagsColumn() {
  console.log('Adding tags column to database...');

  const dbPath = path.join(process.cwd(), 'messages.db');
  const db = new Database(dbPath);

  try {
    // Check if tags column already exists
    const tableInfo = db.pragma('table_info(messages)');
    const hasTagsColumn = tableInfo.some(col => col.name === 'tags');

    if (hasTagsColumn) {
      console.log('Tags column already exists. Skipping migration.');
    } else {
      console.log('Adding tags column...');
      db.exec(`ALTER TABLE messages ADD COLUMN tags TEXT DEFAULT ''`);
      console.log('Tags column added successfully!');
    }

    db.close();
  } catch (error) {
    console.error('Error adding tags column:', error);
    db.close();
    process.exit(1);
  }
}

addTagsColumn();
