'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Tag = 'Insult' | 'Funny' | 'Political' | 'Sport' | 'Computers' | 'Transport' | 'Food' | 'Cables' | 'Animals' | 'Woke' | 'Politically Incorrect' | 'Gay' | 'Poor Grammar' | 'Geeky' | 'Profound' | 'Conversation Stopper';

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
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{tag}</span>
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
