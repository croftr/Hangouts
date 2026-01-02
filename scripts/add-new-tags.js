const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');

// The three new tags to add
const NEW_TAGS = ['Death Update', 'Correction', 'Music'];

const BATCH_SIZE = 50;
const CONCURRENT_REQUESTS = 3;
const MAX_REQUESTS_PER_MINUTE = 48;

async function analyzeMessageBatch(client, messages) {
  const messagesText = messages.map((msg, idx) =>
    `[${idx}] "${msg.text}"`
  ).join('\n\n');

  const prompt = `Analyze the following chat messages and categorize each one with zero or more of these tags: ${NEW_TAGS.join(', ')}.

Rules:
- Death Update: Messages discussing someone (other than a group member) dying or being dead. This includes news about celebrities, public figures, relatives, friends, or anyone outside the group passing away.
- Correction: Messages that are correcting something someone else has said. This includes pointing out errors, clarifying misunderstandings, or providing the right information when someone was wrong.
- Music: Messages that reference music, songs, musical instruments, bands, artists, concerts, or anything music-related.

Messages:
${messagesText}

For each message, respond with ONLY the message number followed by a colon and comma-separated tags (or "none" if no tags apply).
Format: [number]: tag1, tag2, tag3
Example:
[0]: Music
[1]: Correction
[2]: none
[3]: Death Update, Music

Your response:`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const result = response.content[0].text;
    const lines = result.trim().split('\n');
    const tagResults = {};

    for (const line of lines) {
      const match = line.match(/\[(\d+)\]:\s*(.+)/);
      if (match) {
        const idx = parseInt(match[1]);
        const tagsStr = match[2].trim();
        if (tagsStr.toLowerCase() === 'none') {
          tagResults[idx] = [];
        } else {
          const tags = tagsStr.split(',').map(t => t.trim()).filter(t => NEW_TAGS.includes(t));
          tagResults[idx] = tags;
        }
      }
    }

    return tagResults;
  } catch (error) {
    console.error('Error calling Anthropic API:', error.message);
    return {};
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function addNewTags() {
  console.log('Adding new tags to all messages...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('Please set it with: export ANTHROPIC_API_KEY=your_api_key');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const dbPath = path.join(process.cwd(), 'messages.db');
  const db = new Database(dbPath);

  try {
    // Get all messages
    const { count } = db.prepare("SELECT COUNT(*) as count FROM messages").get();
    console.log(`Total messages to analyze: ${count.toLocaleString()}\n`);

    let processed = 0;
    let offset = 0;
    let requestsThisMinute = 0;
    let minuteStartTime = Date.now();

    const updateStmt = db.prepare('UPDATE messages SET tags = ? WHERE id = ?');

    while (processed < count) {
      // Rate limiting
      if (requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) {
        const elapsed = Date.now() - minuteStartTime;
        const waitTime = Math.max(0, 60000 - elapsed);
        if (waitTime > 0) {
          console.log(`Rate limit: waiting ${Math.round(waitTime / 1000)}s before continuing...`);
          await sleep(waitTime);
        }
        requestsThisMinute = 0;
        minuteStartTime = Date.now();
      }

      // Fetch a batch of messages
      const messageBatch = db.prepare(`
        SELECT id, text, tags
        FROM messages
        LIMIT ? OFFSET ?
      `).all(BATCH_SIZE * CONCURRENT_REQUESTS, offset);

      if (messageBatch.length === 0) break;

      // Split into concurrent batches
      const batches = [];
      for (let i = 0; i < messageBatch.length; i += BATCH_SIZE) {
        batches.push(messageBatch.slice(i, i + BATCH_SIZE));
      }

      // Process batches concurrently
      const batchPromises = batches.map(async (batch, batchIdx) => {
        await sleep(batchIdx * 400);
        return analyzeMessageBatch(client, batch);
      });

      const results = await Promise.all(batchPromises);
      requestsThisMinute += batches.length;

      // Update database with results
      const updateMany = db.transaction((updates) => {
        for (const update of updates) {
          updateStmt.run(update.tags, update.id);
        }
      });

      const updates = [];
      batches.forEach((batch, batchIdx) => {
        const tagResults = results[batchIdx];
        batch.forEach((msg, idx) => {
          const newTags = tagResults[idx] || [];

          // Get existing tags
          const existingTags = msg.tags ? msg.tags.split(',').map(t => t.trim()).filter(t => t) : [];

          // Remove any existing new tags (in case of re-run)
          const otherTags = existingTags.filter(t => !NEW_TAGS.includes(t));

          // Combine existing tags with new tags
          const allTags = [...otherTags, ...newTags];

          updates.push({
            id: msg.id,
            tags: allTags.join(', ')
          });
        });
      });

      updateMany(updates);
      processed += messageBatch.length;
      offset += messageBatch.length;

      console.log(`Progress: ${processed.toLocaleString()} / ${count.toLocaleString()} messages analyzed (${Math.round(processed/count*100)}%)`);

      await sleep(500);
    }

    console.log('\n=== Analysis Complete ===');
    console.log(`Total messages processed: ${processed.toLocaleString()}\n`);

    // Show tag statistics
    console.log('=== New Tag Statistics ===');
    for (const tag of NEW_TAGS) {
      const { count: tagCount } = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE tags LIKE ? OR tags LIKE ? OR tags = ?
      `).get(`%${tag},%`, `%, ${tag}`, tag);
      console.log(`${tag}: ${tagCount.toLocaleString()} messages`);
    }

    db.close();
  } catch (error) {
    console.error('Error during analysis:', error);
    db.close();
    process.exit(1);
  }
}

addNewTags();
