const Database = require('better-sqlite3');
const path = require('path');
const readline = require('readline');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function clearTags() {
  console.log('=== Clear All Tags ===\n');

  const dbPath = path.join(process.cwd(), 'messages.db');
  const db = new Database(dbPath);

  try {
    // Get count of messages with tags
    const { total } = db.prepare('SELECT COUNT(*) as total FROM messages').get();
    const { withTags } = db.prepare("SELECT COUNT(*) as withTags FROM messages WHERE tags IS NOT NULL AND tags != ''").get();

    console.log(`Total messages: ${total}`);
    console.log(`Messages with tags: ${withTags}`);

    if (withTags === 0) {
      console.log('\nNo messages have tags. Nothing to clear.');
      db.close();
      return;
    }

    const answer = await askQuestion(`\nAre you sure you want to clear all tags from ${withTags} messages? (yes/no): `);

    if (answer.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      db.close();
      return;
    }

    console.log('\nClearing tags...');

    // Clear all tags
    const result = db.prepare("UPDATE messages SET tags = ''").run();

    console.log(`\nSuccessfully cleared tags from ${result.changes} messages.`);

    // Verify
    const { remaining } = db.prepare("SELECT COUNT(*) as remaining FROM messages WHERE tags IS NOT NULL AND tags != ''").get();
    console.log(`Messages with tags remaining: ${remaining}`);

    db.close();
  } catch (error) {
    console.error('Error clearing tags:', error);
    db.close();
    process.exit(1);
  }
}

clearTags();
