const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');

// All AI-analyzed tags (excluding Conversation Stopper which is computed separately)
const AI_TAGS = [
  'Insult', 'Funny', 'Political', 'Sport', 'Computers', 'Transport',
  'Food', 'Cables', 'Animals', 'Woke', 'Politically Incorrect', 'Gay',
  'Poor Grammar', 'Geeky', 'Profound'
];

const BATCH_SIZE = 50;
const CONCURRENT_REQUESTS = 3;
const MAX_REQUESTS_PER_MINUTE = 48;

async function analyzeMessageBatch(client, messages) {
  const messagesText = messages.map((msg, idx) =>
    `[${idx}] "${msg.text}"`
  ).join('\n\n');

  const prompt = `Analyze the following chat messages and categorize each one with zero or more of these tags: ${AI_TAGS.join(', ')}.

Rules:
- Insult: Messages that contain insults, name-calling, or derogatory language
- Funny: Humorous messages, jokes, or lighthearted content
- Political: References to politics, politicians, political events, or political opinions
- Sport: References to sports, teams, games, or sporting events
- Computers: Discussions about computers, programming, IT, software, or digital technology
- Transport: References to cars, bikes, trains, planes, or any form of transportation
- Food: References to food, eating, cooking, restaurants, or recipes
- Cables: References to cables, wires, connections, or physical connectivity
- Animals: References to animals, pets, wildlife, creatures, or animal-related topics
- Woke: Content related to social justice, progressive politics, or identity politics
- Politically Incorrect: Offensive jokes, controversial humor, or content that challenges political correctness
- Gay: Messages that are effeminate, ladylike, meek, sensitive, gentle, or express vulnerability
- Poor Grammar: Messages with obvious grammatical errors, spelling mistakes, or poor sentence structure
- Geeky: Geek culture, nerdy references, science fiction, fantasy, gaming, comics, or technical enthusiasm
- Profound: Deep insights about life, philosophical thoughts, meaningful reflections, or thought-provoking wisdom

Messages:
${messagesText}

For each message, respond with ONLY the message number followed by a colon and comma-separated tags (or "none" if no tags apply).
Format: [number]: tag1, tag2, tag3
Example:
[0]: Funny, Insult
[1]: Political
[2]: none
[3]: Sport, Funny

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
          const tags = tagsStr.split(',').map(t => t.trim()).filter(t => AI_TAGS.includes(t));
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

async function reanalyzeAllTags() {
  console.log('Re-analyzing all messages with updated tag list...\n');

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

    // First, preserve Conversation Stopper tags and clear AI tags
    console.log('Preserving Conversation Stopper tags and clearing AI tags...');
    const messages = db.prepare('SELECT id, tags FROM messages').all();

    const updateStmt = db.prepare('UPDATE messages SET tags = ? WHERE id = ?');
    const preserveTransaction = db.transaction((msgs) => {
      for (const msg of msgs) {
        const existingTags = msg.tags ? msg.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        const conversationStopperOnly = existingTags.filter(t => t === 'Conversation Stopper');
        updateStmt.run(conversationStopperOnly.join(', '), msg.id);
      }
    });

    preserveTransaction(messages);
    console.log('✓ AI tags cleared, Conversation Stopper tags preserved\n');

    let processed = 0;
    let offset = 0;
    let requestsThisMinute = 0;
    let minuteStartTime = Date.now();

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
          const newAITags = tagResults[idx] || [];

          // Preserve Conversation Stopper tag
          const existingTags = msg.tags ? msg.tags.split(',').map(t => t.trim()).filter(t => t) : [];
          const conversationStopperTag = existingTags.filter(t => t === 'Conversation Stopper');

          // Combine AI tags with Conversation Stopper
          const allTags = [...newAITags, ...conversationStopperTag];

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

    console.log('\n=== Re-analysis Complete ===');
    console.log(`Total messages processed: ${processed.toLocaleString()}\n`);

    // Show tag statistics
    console.log('=== Tag Statistics ===');
    const allTags = [...AI_TAGS, 'Conversation Stopper'];
    for (const tag of allTags) {
      const { count: tagCount } = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE tags LIKE ? OR tags LIKE ? OR tags = ?
      `).get(`%${tag},%`, `%, ${tag}`, tag);
      console.log(`${tag}: ${tagCount.toLocaleString()} messages`);
    }

    const { count: untaggedCount } = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE tags = '' OR tags IS NULL
    `).get();
    console.log(`Untagged: ${untaggedCount.toLocaleString()} messages`);

    db.close();
  } catch (error) {
    console.error('Error during analysis:', error);
    db.close();
    process.exit(1);
  }
}

reanalyzeAllTags();
