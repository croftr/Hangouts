const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');

const AI_TAGS = ['Insult', 'Funny', 'Political', 'Sport', 'Computers', 'Transport', 'Food', 'Cables', 'Woke', 'Politically Incorrect', 'Gay'];
const ALL_TAGS = ['Insult', 'Funny', 'Political', 'Sport', 'Computers', 'Transport', 'Food', 'Cables', 'Woke', 'Politically Incorrect', 'Gay', 'Conversation Stopper'];

const BATCH_SIZE = 50; // Process more messages per request
const CONCURRENT_REQUESTS = 3; // Fewer concurrent requests
const MAX_REQUESTS_PER_MINUTE = 48; // Stay safely under 50/min limit

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
- Woke: Content related to social justice, progressive politics, or identity politics
- Politically Incorrect: Offensive jokes, controversial humor, or content that challenges political correctness
- Gay: Messages that are effeminate, ladylike, meek, sensitive, gentle, or express vulnerability

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

async function detectConversationStoppers(db) {
  console.log('Analyzing message timestamps to detect conversation stoppers...');

  // Get all messages ordered by topic and timestamp
  const messages = db.prepare(`
    SELECT id, topic_id, created_timestamp, tags
    FROM messages
    ORDER BY topic_id, created_timestamp
  `).all();

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  let conversationStoppers = 0;

  // Group by topic and check gaps
  const messagesByTopic = {};
  for (const msg of messages) {
    if (!messagesByTopic[msg.topic_id]) {
      messagesByTopic[msg.topic_id] = [];
    }
    messagesByTopic[msg.topic_id].push(msg);
  }

  const updateStmt = db.prepare('UPDATE messages SET tags = ? WHERE id = ?');
  const updateMany = db.transaction((updates) => {
    for (const update of updates) {
      updateStmt.run(update.tags, update.id);
    }
  });

  const updates = [];

  for (const topicId in messagesByTopic) {
    const topicMessages = messagesByTopic[topicId];

    for (let i = 0; i < topicMessages.length - 1; i++) {
      const currentMsg = topicMessages[i];
      const nextMsg = topicMessages[i + 1];

      const timeDiff = nextMsg.created_timestamp - currentMsg.created_timestamp;

      if (timeDiff >= TWO_HOURS_MS) {
        // This message is a conversation stopper
        let currentTags = currentMsg.tags ? currentMsg.tags.split(',').map(t => t.trim()).filter(t => t) : [];

        // Add "Conversation Stopper" if not already present
        if (!currentTags.includes('Conversation Stopper')) {
          currentTags.push('Conversation Stopper');
          updates.push({
            id: currentMsg.id,
            tags: currentTags.join(', ')
          });
          conversationStoppers++;
        }
      }
    }

    // Check if the last message in a topic is a stopper (no follow-up at all)
    if (topicMessages.length > 0) {
      const lastMsg = topicMessages[topicMessages.length - 1];
      let lastTags = lastMsg.tags ? lastMsg.tags.split(',').map(t => t.trim()).filter(t => t) : [];

      if (!lastTags.includes('Conversation Stopper')) {
        lastTags.push('Conversation Stopper');
        updates.push({
          id: lastMsg.id,
          tags: lastTags.join(', ')
        });
        conversationStoppers++;
      }
    }
  }

  updateMany(updates);
  console.log(`Tagged ${conversationStoppers} messages as "Conversation Stopper"`);
}

async function analyzeTags() {
  console.log('Starting tag analysis...');

  // Check for API key
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
    // Get total count of messages without tags
    const { count } = db.prepare("SELECT COUNT(*) as count FROM messages WHERE tags IS NULL OR tags = ''").get();
    console.log(`Found ${count} messages to analyze`);

    if (count === 0) {
      console.log('All messages already have tags!');
      db.close();
      return;
    }

    // Prepare update statement
    const updateStmt = db.prepare('UPDATE messages SET tags = ? WHERE id = ?');

    let processed = 0;
    let offset = 0;
    let requestsThisMinute = 0;
    let minuteStartTime = Date.now();

    while (processed < count) {
      // Rate limiting: wait if we've hit the limit for this minute
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
      const messages = db.prepare(`
        SELECT id, text
        FROM messages
        WHERE tags IS NULL OR tags = ''
        LIMIT ? OFFSET ?
      `).all(BATCH_SIZE * CONCURRENT_REQUESTS, offset);

      if (messages.length === 0) break;

      // Split into concurrent batches
      const batches = [];
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        batches.push(messages.slice(i, i + BATCH_SIZE));
      }

      // Process batches concurrently
      const batchPromises = batches.map(async (batch, batchIdx) => {
        await sleep(batchIdx * 400); // Stagger requests more
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
          const tags = tagResults[idx] || [];
          updates.push({
            id: msg.id,
            tags: tags.join(', ')
          });
        });
      });

      updateMany(updates);
      processed += messages.length;
      offset += messages.length;

      console.log(`Progress: ${processed} / ${count} messages analyzed (${Math.round(processed/count*100)}%)`);

      // Rate limiting - wait a bit between batches
      await sleep(500);
    }

    console.log('\n=== AI Analysis Complete ===');
    console.log(`Total messages processed: ${processed}`);

    // Now detect "Conversation Stopper" tags
    console.log('\n=== Detecting Conversation Stoppers ===');
    await detectConversationStoppers(db);

    // Show tag statistics
    console.log('\n=== Tag Statistics ===');
    for (const tag of ALL_TAGS) {
      const { count: tagCount } = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE tags LIKE ?
      `).get(`%${tag}%`);
      console.log(`${tag}: ${tagCount} messages`);
    }

    const { count: untaggedCount } = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE tags = ''
    `).get();
    console.log(`Untagged: ${untaggedCount} messages`);

    db.close();
  } catch (error) {
    console.error('Error during analysis:', error);
    db.close();
    process.exit(1);
  }
}

analyzeTags();
