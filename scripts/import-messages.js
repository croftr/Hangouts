const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function parseDate(dateString) {
  // Parse "Friday, 1 April 2016 at 10:41:58 UTC"
  const match = dateString.match(/(\d+)\s+(\w+)\s+(\d+)\s+at\s+(\d+):(\d+):(\d+)/);
  if (!match) {
    console.error('Failed to parse date:', dateString);
    return 0;
  }

  const [, day, month, year, hour, minute, second] = match;
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  const date = new Date(Date.UTC(
    parseInt(year),
    months[month],
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ));

  return date.getTime();
}

async function importMessages() {
  console.log('Starting import process...');

  // Initialize database
  const dbPath = path.join(process.cwd(), 'messages.db');

  // Remove existing database
  if (fs.existsSync(dbPath)) {
    console.log('Removing existing database...');
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create table
  console.log('Creating database schema...');
  db.exec(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE NOT NULL,
      creator_name TEXT NOT NULL,
      creator_email TEXT NOT NULL,
      creator_user_type TEXT NOT NULL,
      created_date TEXT NOT NULL,
      created_timestamp INTEGER NOT NULL,
      text TEXT NOT NULL,
      topic_id TEXT NOT NULL
    );

    CREATE INDEX idx_creator_name ON messages(creator_name);
    CREATE INDEX idx_created_timestamp ON messages(created_timestamp);
    CREATE INDEX idx_text_search ON messages(text);
  `);

  // Read and parse JSON file
  const jsonPath = path.join(process.cwd(), 'data', 'messages.json');
  console.log('Reading messages from:', jsonPath);

  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(fileContent);
  const messages = data.messages;

  console.log(`Found ${messages.length} messages to import`);

  // Prepare insert statement
  const insert = db.prepare(`
    INSERT INTO messages (
      message_id, creator_name, creator_email, creator_user_type,
      created_date, created_timestamp, text, topic_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Batch insert for performance
  const batchSize = 1000;
  let imported = 0;
  let errors = 0;

  console.log('Importing messages in batches...');

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    const insertMany = db.transaction((msgs) => {
      for (const msg of msgs) {
        try {
          const timestamp = parseDate(msg.created_date);
          insert.run(
            msg.message_id,
            msg.creator.name,
            msg.creator.email,
            msg.creator.user_type,
            msg.created_date,
            timestamp,
            msg.text || '',
            msg.topic_id
          );
          imported++;
        } catch (error) {
          errors++;
          if (errors < 10) {
            console.error('Error importing message:', error.message);
          }
        }
      }
    });

    insertMany(batch);

    if (i % 10000 === 0) {
      console.log(`Progress: ${imported} / ${messages.length} messages imported`);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Successfully imported: ${imported} messages`);
  console.log(`Errors: ${errors}`);

  // Show some stats
  const stats = db.prepare('SELECT COUNT(*) as count FROM messages').get();
  console.log(`Total messages in database: ${stats.count}`);

  const dateRange = db.prepare(`
    SELECT
      MIN(created_timestamp) as earliest,
      MAX(created_timestamp) as latest
    FROM messages
  `).get();

  if (dateRange.earliest && dateRange.latest) {
    console.log(`Date range: ${new Date(dateRange.earliest).toISOString()} to ${new Date(dateRange.latest).toISOString()}`);
  }

  db.close();
  console.log('Database connection closed');
}

importMessages().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
