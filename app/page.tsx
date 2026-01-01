'use client';

import { useState, useEffect } from 'react';

type Tag = 'Insult' | 'Funny' | 'Political' | 'Sport' | 'Computers' | 'Transport' | 'Food' | 'Cables' | 'Animals' | 'Woke' | 'Politically Incorrect' | 'Gay' | 'Conversation Stopper';

const ALL_TAGS: Tag[] = ['Insult', 'Funny', 'Political', 'Sport', 'Computers', 'Transport', 'Food', 'Cables', 'Animals', 'Woke', 'Politically Incorrect', 'Gay', 'Conversation Stopper'];

const TAG_COLORS: Record<Tag, string> = {
  'Insult': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  'Funny': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  'Political': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  'Sport': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  'Computers': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  'Transport': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
  'Food': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  'Cables': 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300',
  'Animals': 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300',
  'Woke': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
  'Politically Incorrect': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  'Gay': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
  'Conversation Stopper': 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
};

const TAG_ICONS: Record<Tag, string> = {
  'Insult': '😠',
  'Funny': '😂',
  'Political': '🏛️',
  'Sport': '⚽',
  'Computers': '💻',
  'Transport': '🚗',
  'Food': '🍕',
  'Cables': '🔌',
  'Animals': '🐾',
  'Woke': '✊',
  'Politically Incorrect': '🚫',
  'Gay': '🌈',
  'Conversation Stopper': '🛑',
};

interface Message {
  id: number;
  message_id: string;
  creator_name: string;
  creator_email: string;
  created_date: string;
  created_timestamp: number;
  text: string;
  topic_id: string;
  tags?: string;
}

interface ApiResponse {
  success: boolean;
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'creator' | 'text' | 'both'>('both');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc'>('date_desc');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [page, sortBy, searchBy, selectedTags]);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        query,
        searchBy,
        sortBy,
        page: page.toString(),
        limit: '50',
      });

      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }

      const response = await fetch(`/api/messages?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setMessages(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError('Failed to fetch messages. Make sure the database is initialized.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };

  const parseMessageTags = (tagsString?: string): Tag[] => {
    if (!tagsString) return [];
    return tagsString.split(',').map(t => t.trim()).filter(t => t) as Tag[];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">Hangouts Messages</h1>

        {/* Search and Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="searchBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search By
                </label>
                <select
                  id="searchBy"
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as 'creator' | 'text' | 'both')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="both">Both</option>
                  <option value="creator">Creator</option>
                  <option value="text">Message Text</option>
                </select>
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By Date
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date_asc' | 'date_desc')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Tag Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter by Tags</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  selectedTags.includes(tag)
                    ? TAG_COLORS[tag] + ' ring-2 ring-offset-2 dark:ring-offset-gray-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{TAG_ICONS[tag]}</span>
                <span>{tag}</span>
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results Info */}
        {!loading && messages.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} messages
            </p>
          </div>
        )}

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {query ? 'No messages found matching your search.' : 'No messages available. Please import data first.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const messageTags = parseMessageTags(message.tags);
              return (
                <div key={message.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{message.creator_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{message.creator_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(message.created_timestamp)}</p>
                    </div>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{message.text}</p>
                  {messageTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {messageTags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${TAG_COLORS[tag]}`}
                        >
                          <span>{TAG_ICONS[tag]}</span>
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && messages.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-gray-600 dark:text-gray-400">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages || loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
