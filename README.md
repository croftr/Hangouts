# Hangouts Messages Browser

A Next.js application for browsing, searching, and sorting Google Hangouts chat messages with AI-powered tagging.

## Features

- Full-text search across all messages
- Search by creator name or message text
- Sort messages by date (ascending or descending)
- AI-powered message tagging and categorization
- Filter messages by multiple tags
- Dark mode support (follows system preference)
- Pagination for efficient browsing
- Responsive UI built with Tailwind CSS
- SQLite database for fast local queries
- Ready for Vercel deployment

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Import Messages

Before running the application, you need to import the messages from your JSON file into the database:

```bash
npm run import-messages
```

This will:
- Create a SQLite database (`messages.db`)
- Parse all messages from `data/messages.json`
- Create indexes for fast searching
- Show progress and completion statistics

The import process handles large files efficiently using batch inserts.

### 3. Analyze and Tag Messages (Optional but Recommended)

To enable AI-powered tagging, you'll need an Anthropic API key. The system will categorize messages with the following tags:

**AI-Analyzed Tags:**
- 😠 **Insult**: Messages with insults, name-calling, or derogatory language
- 😂 **Funny**: Humorous messages, jokes, or lighthearted content
- 🏛️ **Political**: References to politics, politicians, or political events
- ⚽ **Sport**: References to sports, teams, games, or sporting events
- 💻 **Computers**: Discussions about computers, programming, IT, software
- 🚗 **Transport**: References to cars, bikes, trains, planes, or transportation
- 🍕 **Food**: References to food, eating, cooking, restaurants, or recipes
- 🔌 **Cables**: References to cables, wires, connections, or physical connectivity
- 🐾 **Animals**: References to animals, pets, wildlife, or creatures
- ✊ **Woke**: Social justice, progressive politics, or identity politics
- 🚫 **Politically Incorrect**: Offensive jokes or controversial humor
- 🌈 **Gay**: Messages that are effeminate, ladylike, meek, sensitive, or gentle

**Automatically Detected Tags:**
- 🛑 **Conversation Stopper**: Messages that didn't receive a response within 2 hours

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your_api_key_here

# Run the analysis (this may take a while for large datasets)
npm run analyze-tags
```

The script will:
- Process messages in batches using Claude AI
- Analyze each message for appropriate tags
- Store tags in the database
- Show progress and statistics

Note: This uses the Anthropic API and will incur costs based on usage. For 145,000 messages, expect to process them in batches of 20 messages per request.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hangouts/
├── app/
│   ├── api/
│   │   └── messages/
│   │       └── route.ts         # API endpoint for message queries
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main UI page
│   └── globals.css              # Global styles
├── lib/
│   └── db.ts                    # Database utilities and queries
├── scripts/
│   ├── import-messages.js       # Data import script
│   ├── add-tags-column.js       # Database migration for tags
│   └── analyze-tags.js          # AI tagging script
├── data/
│   └── messages.json            # Your source data
└── messages.db                  # SQLite database (created by import)
```

## API Endpoints

### GET /api/messages

Query parameters:
- `query` - Search term (optional)
- `searchBy` - Search scope: `creator`, `text`, or `both` (default: `both`)
- `sortBy` - Sort order: `date_asc` or `date_desc` (default: `date_desc`)
- `tags` - Comma-separated list of tags to filter by (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

Example:
```
/api/messages?query=hello&searchBy=text&sortBy=date_desc&tags=Funny,Sport&page=1&limit=50
```

## Deploying to Vercel

### Option 1: SQLite (Current Setup)

The current setup uses SQLite which works well for development and can work on Vercel with some limitations:

1. The database will be read-only in production (Vercel's filesystem is read-only)
2. You need to commit the `messages.db` file to your repository
3. Updates require redeployment

To deploy with SQLite:

```bash
# Make sure messages.db is created
npm run import-messages

# Remove messages.db from .gitignore if you want to commit it
# Then deploy to Vercel
vercel
```

### Option 2: Vercel Postgres (Recommended for Production)

For a production deployment, it's recommended to use Vercel Postgres:

1. Create a Postgres database in your Vercel project dashboard
2. Update `lib/db.ts` to use `@vercel/postgres` instead of `better-sqlite3`
3. Modify the import script to work with Postgres
4. Run the import script with your database credentials

Example migration to Vercel Postgres:

```typescript
// lib/db.ts with Vercel Postgres
import { sql } from '@vercel/postgres';

export async function searchMessages(params: SearchParams) {
  const { query, searchBy, sortBy, page, limit } = params;

  // Build WHERE clause
  let whereClause = '';
  if (query) {
    if (searchBy === 'creator') {
      whereClause = `WHERE creator_name ILIKE '%${query}%'`;
    } else if (searchBy === 'text') {
      whereClause = `WHERE text ILIKE '%${query}%'`;
    } else {
      whereClause = `WHERE creator_name ILIKE '%${query}%' OR text ILIKE '%${query}%'`;
    }
  }

  // Execute query
  const offset = (page - 1) * limit;
  const orderBy = sortBy === 'date_asc' ? 'ASC' : 'DESC';

  const result = await sql`
    SELECT * FROM messages
    ${whereClause}
    ORDER BY created_timestamp ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows;
}
```

## Database Schema

```sql
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
```

## Performance

- Messages are indexed by creator name, timestamp, and text for fast queries
- Pagination limits results to 50 messages per page by default
- SQLite WAL mode enabled for better concurrent access
- Batch imports process 1000 messages at a time

## Troubleshooting

### Database not found error
Make sure you've run `npm run import-messages` before starting the dev server.

### Import script fails
Check that `data/messages.json` exists and is valid JSON.

### Slow searches
The database should be fast even with hundreds of thousands of messages. If searches are slow, ensure the import script completed successfully and created the indexes.

## License

MIT
