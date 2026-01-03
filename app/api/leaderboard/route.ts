import { NextResponse } from 'next/server';
import { getDb, ALL_TAGS, type Tag } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();

    // Get all unique users with their total message counts
    const users = db.prepare(`
      SELECT creator_name, creator_email, COUNT(*) as total
      FROM messages
      GROUP BY creator_email, creator_name
      ORDER BY total DESC
    `).all() as { creator_name: string; creator_email: string; total: number }[];

    // For each user, get their year breakdown and tag breakdown
    const leaderboardData = users.map(user => {
      // Get messages by year for this user
      const messagesByYearRows = db.prepare(`
        SELECT strftime('%Y', datetime(created_timestamp / 1000, 'unixepoch')) as year, COUNT(*) as count
        FROM messages
        WHERE creator_email = ?
        GROUP BY year
      `).all(user.creator_email) as { year: string; count: number }[];

      const messagesByYear: Record<string, number> = {};
      messagesByYearRows.forEach(row => {
        messagesByYear[row.year] = row.count;
      });

      // Get all messages with tags for this user
      const messagesWithTags = db.prepare(`
        SELECT tags
        FROM messages
        WHERE creator_email = ? AND tags IS NOT NULL AND tags != ''
      `).all(user.creator_email) as { tags: string }[];

      // Count messages by tag
      const messagesByTag: Record<string, number> = {};
      ALL_TAGS.forEach(tag => {
        messagesByTag[tag] = 0;
      });

      messagesWithTags.forEach(msg => {
        const tags = msg.tags.split(',').map(t => t.trim());
        tags.forEach(tag => {
          if (messagesByTag[tag] !== undefined) {
            messagesByTag[tag]++;
          }
        });
      });

      return {
        email: user.creator_email,
        name: user.creator_name,
        totalMessages: user.total,
        messagesByYear,
        messagesByTag,
      };
    });

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard statistics',
      },
      { status: 500 }
    );
  }
}
