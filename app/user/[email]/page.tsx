'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Tag = 'Insult' | 'Funny' | 'Political' | 'Sport' | 'Computers' | 'Transport' | 'Food' | 'Cables' | 'Animals' | 'Woke' | 'Politically Incorrect' | 'Gay' | 'Poor Grammar' | 'Geeky' | 'Profound' | 'Conversation Stopper';

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
  'Poor Grammar': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
  'Geeky': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
  'Profound': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
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
  'Poor Grammar': '📝',
  'Geeky': '🤓',
  'Profound': '💭',
  'Conversation Stopper': '🛑',
};

interface UserStats {
  email: string;
  name: string;
  totalMessages: number;
  messagesByYear: Record<string, number>;
  messagesByTag: Record<Tag, number>;
}

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.email as string);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getDisplayName = (email: string, name: string): string => {
    if (email === 'bobby@robincroft.com') {
      return 'Bob Bot';
    }
    return name;
  };

  useEffect(() => {
    fetchUserStats();
  }, [email]);

  const fetchUserStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/user/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch user stats');
      }
    } catch (err) {
      setError('Failed to fetch user statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
          >
            ← Back to Messages
          </Link>
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error || 'User not found'}
          </div>
        </div>
      </div>
    );
  }

  const sortedYears = Object.keys(stats.messagesByYear).sort((a, b) => parseInt(b) - parseInt(a));
  const tagEntries = Object.entries(stats.messagesByTag)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          ← Back to Messages
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{getDisplayName(stats.email, stats.name)}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{stats.email}</p>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">Total Messages</p>
            <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{stats.totalMessages.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages by Year */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Messages by Year</h2>
            <div className="space-y-3">
              {sortedYears.map(year => (
                <div key={year} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{year}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(stats.messagesByYear[year] / stats.totalMessages) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-semibold w-16 text-right">
                      {stats.messagesByYear[year].toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages by Tag */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Messages by Tag</h2>
            <div className="space-y-3">
              {tagEntries.length > 0 ? (
                tagEntries.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${TAG_COLORS[tag as Tag]}`}>
                      <span>{TAG_ICONS[tag as Tag]}</span>
                      <span>{tag}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${(count / stats.totalMessages) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold w-16 text-right">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tagged messages</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
