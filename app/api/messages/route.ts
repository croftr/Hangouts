import { NextRequest, NextResponse } from 'next/server';
import { searchMessages, SearchParams } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse tags from query string (comma-separated)
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').filter(t => t.trim()) : [];

    const params: SearchParams = {
      query: searchParams.get('query') || '',
      searchBy: (searchParams.get('searchBy') as 'creator' | 'text' | 'both') || 'both',
      sortBy: (searchParams.get('sortBy') as 'date_asc' | 'date_desc') || 'date_desc',
      tags,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = searchMessages(params);

    return NextResponse.json({
      success: true,
      data: result.messages,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / (params.limit || 50)),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}
