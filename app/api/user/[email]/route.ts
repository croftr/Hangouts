import { NextRequest, NextResponse } from 'next/server';
import { getDb, ALL_TAGS, type Tag } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email: rawEmail } = await params;
    const email = decodeURIComponent(rawEmail);
    const db = await getDb();

    // Get user name and total message count
    const userInfo = db.prepare(`
      SELECT creator_name, creator_email, COUNT(*) as total
      FROM messages
      WHERE creator_email = ?
      GROUP BY creator_email, creator_name
    `).get(email) as { creator_name: string; creator_email: string; total: number } | undefined;

    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get messages by year
    const messagesByYearRows = db.prepare(`
      SELECT strftime('%Y', datetime(created_timestamp / 1000, 'unixepoch')) as year, COUNT(*) as count
      FROM messages
      WHERE creator_email = ?
      GROUP BY year
      ORDER BY year DESC
    `).all(email) as { year: string; count: number }[];

    const messagesByYear: Record<string, number> = {};
    messagesByYearRows.forEach(row => {
      messagesByYear[row.year] = row.count;
    });

    // Get all messages with tags for this user
    const messagesWithTags = db.prepare(`
      SELECT tags
      FROM messages
      WHERE creator_email = ? AND tags IS NOT NULL AND tags != ''
    `).all(email) as { tags: string }[];

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

    return NextResponse.json({
      success: true,
      data: {
        email: userInfo.creator_email,
        name: userInfo.creator_name,
        totalMessages: userInfo.total,
        messagesByYear,
        messagesByTag,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user statistics',
      },
      { status: 500 }
    );
  }
}
