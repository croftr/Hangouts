const Database = require('better-sqlite3');
const { join } = require('path');

const dbPath = join(process.cwd(), 'messages.db');
const db = new Database(dbPath);

console.log('Fixing Conversation Stopper tags...\n');

// Get all messages ordered by timestamp (regardless of topic)
const allMessages = db.prepare(`
  SELECT id, topic_id, created_timestamp, tags
  FROM messages
  ORDER BY created_timestamp ASC
`).all();

console.log(`Total messages: ${allMessages.length.toLocaleString()}\n`);

// Process all messages in chronological order
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
let conversationStoppersFound = 0;
let tagsRemoved = 0;
let tagsAdded = 0;

const updateStmt = db.prepare('UPDATE messages SET tags = ? WHERE id = ?');

// Start transaction for better performance
db.prepare('BEGIN').run();

for (let i = 0; i < allMessages.length; i++) {
  const currentMsg = allMessages[i];
  const nextMsg = allMessages[i + 1];

  // Parse existing tags
  const existingTags = currentMsg.tags
    ? currentMsg.tags.split(',').map(t => t.trim()).filter(t => t)
    : [];

  // Remove 'Conversation Stopper' from existing tags
  const otherTags = existingTags.filter(t => t !== 'Conversation Stopper');

  let shouldHaveTag = false;

  // Determine if this message should have the Conversation Stopper tag
  if (!nextMsg) {
    // Last message overall - it's a conversation stopper
    shouldHaveTag = true;
  } else {
    // Check time gap to next message
    const timeGapMs = nextMsg.created_timestamp - currentMsg.created_timestamp;
    if (timeGapMs > TWO_HOURS_MS) {
      shouldHaveTag = true;
    }
  }

  // Build new tags array
  const newTags = shouldHaveTag
    ? [...otherTags, 'Conversation Stopper']
    : otherTags;

  const newTagsString = newTags.join(', ');

  // Update if tags changed
  if (newTagsString !== currentMsg.tags) {
    updateStmt.run(newTagsString, currentMsg.id);

    const hadTag = existingTags.includes('Conversation Stopper');
    const hasTag = newTags.includes('Conversation Stopper');

    if (!hadTag && hasTag) {
      tagsAdded++;
    } else if (hadTag && !hasTag) {
      tagsRemoved++;
    }
  }

  if (shouldHaveTag) {
    conversationStoppersFound++;
  }
}

// Commit transaction
db.prepare('COMMIT').run();

console.log('✅ Conversation Stopper tags fixed!\n');
console.log('Statistics:');
console.log(`- Total conversation stoppers: ${conversationStoppersFound.toLocaleString()}`);
console.log(`- Tags added: ${tagsAdded.toLocaleString()}`);
console.log(`- Tags removed (incorrect): ${tagsRemoved.toLocaleString()}`);

// Show some examples
console.log('\nSample conversation stoppers:');
const samples = db.prepare(`
  SELECT creator_name, text, created_date, tags
  FROM messages
  WHERE tags LIKE '%Conversation Stopper%'
  ORDER BY created_timestamp DESC
  LIMIT 5
`).all();

samples.forEach((msg, idx) => {
  console.log(`\n${idx + 1}. ${msg.creator_name} (${msg.created_date})`);
  console.log(`   "${msg.text.substring(0, 80)}${msg.text.length > 80 ? '...' : ''}"`);
  console.log(`   Tags: ${msg.tags}`);
});

db.close();
console.log('\n✅ Done!');
