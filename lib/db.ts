import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

let db: Database.Database | null = null;
let dbInitialized = false;

async function ensureDatabase() {
  if (dbInitialized) return;

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production, decompress the gzipped database to /tmp
    const tmpDbPath = '/tmp/messages.db';

    if (!fs.existsSync(tmpDbPath)) {
      console.log('Decompressing database...');
      const gzipPath = path.join(process.cwd(), 'messages.db.gz');
      const compressedData = fs.readFileSync(gzipPath);
      const decompressedData = zlib.gunzipSync(compressedData);
      fs.writeFileSync(tmpDbPath, decompressedData);
      console.log('Database decompressed successfully');
    } else {
      console.log('Using cached database from /tmp');
    }
  }

  dbInitialized = true;
}

export async function getDb() {
  await ensureDatabase();

  if (!db) {
    // In production (Vercel), the database must be read-only
    // In development, we can use WAL mode
    const isProduction = process.env.NODE_ENV === 'production';
    const dbPath = isProduction
      ? '/tmp/messages.db'
      : path.join(process.cwd(), 'messages.db');

    db = new Database(dbPath, {
      readonly: isProduction,
      fileMustExist: true
    });

    // WAL mode only works in development (requires write access)
    if (!isProduction) {
      db.pragma('journal_mode = WAL');
    }
  }
  return db;
}

export async function initDb() {
  const database = await getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS messages (
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

    CREATE INDEX IF NOT EXISTS idx_creator_name ON messages(creator_name);
    CREATE INDEX IF NOT EXISTS idx_created_timestamp ON messages(created_timestamp);
    CREATE INDEX IF NOT EXISTS idx_text_search ON messages(text);
  `);

  console.log('Database initialized successfully');
}

export type Tag = 'Insult' | 'Funny' | 'Political' | 'Sport' | 'Computers' | 'Transport' | 'Food' | 'Cables' | 'Animals' | 'Woke' | 'Politically Incorrect' | 'Gay' | 'Poor Grammar' | 'Geeky' | 'Profound' | 'Death Update' | 'Correction' | 'Music' | 'Conversation Stopper';

export const ALL_TAGS: Tag[] = ['Insult', 'Funny', 'Political', 'Sport', 'Computers', 'Transport', 'Food', 'Cables', 'Animals', 'Woke', 'Politically Incorrect', 'Gay', 'Poor Grammar', 'Geeky', 'Profound', 'Death Update', 'Correction', 'Music', 'Conversation Stopper'];

export interface Message {
  id: number;
  message_id: string;
  creator_name: string;
  creator_email: string;
  creator_user_type: string;
  created_date: string;
  created_timestamp: number;
  text: string;
  topic_id: string;
  tags?: string;
}

export interface SearchParams {
  query?: string;
  searchBy?: 'creator' | 'text' | 'both';
  sortBy?: 'date_asc' | 'date_desc';
  tags?: string[];
  page?: number;
  limit?: number;
}

export async function searchMessages(params: SearchParams): Promise<{ messages: Message[]; total: number }> {
  const database = await getDb();
  const {
    query = '',
    searchBy = 'both',
    sortBy = 'date_desc',
    tags = [],
    page = 1,
    limit = 50
  } = params;

  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (query) {
    const searchConditions: string[] = [];
    if (searchBy === 'creator' || searchBy === 'both') {
      searchConditions.push('creator_name LIKE ?');
      queryParams.push(`%${query}%`);
    }
    if (searchBy === 'text' || searchBy === 'both') {
      searchConditions.push('text LIKE ?');
      queryParams.push(`%${query}%`);
    }
    conditions.push('(' + searchConditions.join(' OR ') + ')');
  }

  // Add tag filtering
  if (tags.length > 0) {
    const tagConditions = tags.map(tag => {
      // Use word boundaries to match exact tag names
      // Match: start of string or after comma, tag name, end of string or before comma
      queryParams.push(`%${tag},%`);  // Tag at start or middle: "Sport," or ", Sport,"
      queryParams.push(`%, ${tag}`);  // Tag at end: ", Sport"
      queryParams.push(tag);           // Tag is the only one: "Sport"
      return '(tags LIKE ? OR tags LIKE ? OR tags = ?)';
    });
    conditions.push('(' + tagConditions.join(' OR ') + ')');
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const orderClause = sortBy === 'date_asc'
    ? 'ORDER BY created_timestamp ASC'
    : 'ORDER BY created_timestamp DESC';

  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM messages ${whereClause}`;
  const countStmt = database.prepare(countQuery);
  const { count } = countStmt.get(...queryParams) as { count: number };

  // Get paginated results
  const dataQuery = `
    SELECT * FROM messages
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;
  const dataStmt = database.prepare(dataQuery);
  const messages = dataStmt.all(...queryParams, limit, offset) as Message[];

  return { messages, total: count };
}
