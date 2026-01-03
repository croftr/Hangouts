'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Tag = 'Insult' | 'Funny' | 'Political' | 'Sport' | 'Computers' | 'Transport' | 'Food' | 'Cables' | 'Animals' | 'Woke' | 'Politically Incorrect' | 'Gay' | 'Poor Grammar' | 'Geeky' | 'Profound' | 'Death Update' | 'Correction' | 'Music' | 'Conversation Stopper';

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
  'Death Update': 'bg-stone-100 dark:bg-stone-900/30 text-stone-800 dark:text-stone-300',
  'Correction': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  'Music': 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-300',
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
  'Animals': '🐿️',
  'Woke': '✊',
  'Politically Incorrect': '🚫',
  'Gay': '🌈',
  'Poor Grammar': '📝',
  'Geeky': '🤓',
  'Profound': '💭',
  'Death Update': '⚰️',
  'Correction': '✅',
  'Music': '🎵',
  'Conversation Stopper': '🛑',
};

interface UserStats {
  email: string;
  name: string;
  totalMessages: number;
  messagesByYear: Record<string, number>;
  messagesByTag: Record<Tag, number>;
}

type SortField = 'totalMessages' | Tag | string;

export default function LeaderboardPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('totalMessages');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedMobileTag, setSelectedMobileTag] = useState<Tag | null>(null);
  const [selectedMobileYear, setSelectedMobileYear] = useState<string | null>(null);

  const getDisplayName = (email: string, name: string): string => {
    if (email === 'bobby@robincroft.com') {
      return 'Bob Bot';
    }
    return name;
  };

  const getAvatarPath = (email: string): string | null => {
    if (email === 'bobby@robincroft.com') {
      return '/bob-bot-avatar.png';
    }
    if (email === 'gmitlimited@gmail.com') {
      return '/gary.png';
    }
    if (email === 'angelajanecroft@gmail.com') {
      return '/rob.jpg';
    }
    if (email === 'HoopandKelp@gmail.com') {
      return '/mikey.webp';
    }
    if (email === 'barooahn@gmail.com') {
      return '/Nick-Barooah.webp';
    }
    return null;
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Failed to fetch leaderboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const getSortValue = (user: UserStats, field: SortField): number => {
    if (field === 'totalMessages') {
      return user.totalMessages;
    }
    // Check if it's a tag
    if (field in user.messagesByTag) {
      return user.messagesByTag[field as Tag];
    }
    // Check if it's a year
    if (field in user.messagesByYear) {
      return user.messagesByYear[field];
    }
    return 0;
  };

  const sortedStats = [...stats].sort((a, b) => {
    const aValue = getSortValue(a, sortBy);
    const bValue = getSortValue(b, sortBy);
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Get all unique years across all users
  const allYears = Array.from(
    new Set(stats.flatMap(user => Object.keys(user.messagesByYear)))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  // Get all tags that have at least one message
  const activeTags = (Object.keys(TAG_COLORS) as Tag[]).filter(tag =>
    stats.some(user => user.messagesByTag[tag] > 0)
  );

  // Set initial mobile tag when activeTags are loaded
  useEffect(() => {
    if (activeTags.length > 0 && !selectedMobileTag) {
      setSelectedMobileTag(activeTags[0]);
    }
  }, [activeTags, selectedMobileTag]);

  // Set initial mobile year when allYears are loaded
  useEffect(() => {
    if (allYears.length > 0 && !selectedMobileYear) {
      setSelectedMobileYear(allYears[0]);
    }
  }, [allYears, selectedMobileYear]);

  const UserAvatar = ({ email, name, size = 40 }: { email: string; name: string; size?: number }) => {
    const avatarPath = getAvatarPath(email);

    if (avatarPath) {
      return (
        <Image
          src={avatarPath}
          alt={`${getDisplayName(email, name)} Avatar`}
          width={size}
          height={size}
          className="rounded-full"
        />
      );
    }

    return (
      <div
        className="rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          className="text-gray-500 dark:text-gray-400"
          style={{ width: size * 0.6, height: size * 0.6 }}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    );
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="text-xs font-medium hover:underline focus:outline-none"
    >
      {label}
      {sortBy === field && (
        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || stats.length === 0) {
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
            {error || 'No data available'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Messages
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Leaderboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Compare message statistics across all users</p>
        </div>

        {/* Total Messages Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            <SortButton field="totalMessages" label="Total Messages" />
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="hidden md:table-cell text-left py-3 px-4 text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">User</th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">Messages</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((user, index) => (
                  <tr key={user.email} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="hidden md:table-cell py-4 px-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/user/${encodeURIComponent(user.email)}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <UserAvatar email={user.email} name={user.name} size={40} />
                        <div>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {getDisplayName(user.email, user.name)}
                          </p>
                          <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                      {user.totalMessages.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Messages by Year */}
        {allYears.length > 0 && selectedMobileYear && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Messages by Year</h2>

            {/* Mobile View - Single Year with Dropdown */}
            <div className="lg:hidden mb-4">
              <label htmlFor="mobile-year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Year
              </label>
              <select
                id="mobile-year-select"
                value={selectedMobileYear}
                onChange={(e) => setSelectedMobileYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {allYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile View - Table with Single Year */}
            <div className="lg:hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">User</th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                      <button
                        onClick={() => handleSort(selectedMobileYear)}
                        className="text-xs font-medium hover:underline focus:outline-none"
                      >
                        {selectedMobileYear}
                        {sortBy === selectedMobileYear && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map(user => (
                    <tr key={user.email} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-4 px-4">
                        <Link
                          href={`/user/${encodeURIComponent(user.email)}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <UserAvatar email={user.email} name={user.name} size={32} />
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {getDisplayName(user.email, user.name)}
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-gray-100">
                        {user.messagesByYear[selectedMobileYear]?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desktop View - All Years */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">User</th>
                    {allYears.map(year => (
                      <th key={year} className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                        <SortButton field={year} label={year} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map(user => (
                    <tr key={user.email} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-4 px-4">
                        <Link
                          href={`/user/${encodeURIComponent(user.email)}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <UserAvatar email={user.email} name={user.name} size={32} />
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {getDisplayName(user.email, user.name)}
                          </span>
                        </Link>
                      </td>
                      {allYears.map(year => (
                        <td key={year} className="py-4 px-4 text-right text-gray-900 dark:text-gray-100">
                          {user.messagesByYear[year]?.toLocaleString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Messages by Tag */}
        {activeTags.length > 0 && selectedMobileTag && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Messages by Tag</h2>

            {/* Mobile View - Single Tag with Dropdown */}
            <div className="lg:hidden mb-4">
              <label htmlFor="mobile-tag-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Tag
              </label>
              <select
                id="mobile-tag-select"
                value={selectedMobileTag}
                onChange={(e) => setSelectedMobileTag(e.target.value as Tag)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {activeTags.map(tag => (
                  <option key={tag} value={tag}>
                    {TAG_ICONS[tag]} {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile View - Table with Single Tag */}
            <div className="lg:hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">User</th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                      <button
                        onClick={() => handleSort(selectedMobileTag)}
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 hover:ring-2 hover:ring-offset-2 dark:hover:ring-offset-gray-800 transition-all ${TAG_COLORS[selectedMobileTag]}`}
                      >
                        <span>{TAG_ICONS[selectedMobileTag]}</span>
                        <span>{selectedMobileTag}</span>
                        {sortBy === selectedMobileTag && (
                          <span className="ml-1 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map(user => (
                    <tr key={user.email} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-4 px-4">
                        <Link
                          href={`/user/${encodeURIComponent(user.email)}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <UserAvatar email={user.email} name={user.name} size={32} />
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {getDisplayName(user.email, user.name)}
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-gray-100">
                        {user.messagesByTag[selectedMobileTag] > 0 ? user.messagesByTag[selectedMobileTag].toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desktop View - All Tags */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">User</th>
                    {activeTags.map(tag => (
                      <th key={tag} className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 min-w-[100px]">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => handleSort(tag)}
                            className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 hover:ring-2 hover:ring-offset-2 dark:hover:ring-offset-gray-800 transition-all ${TAG_COLORS[tag]}`}
                          >
                            <span>{TAG_ICONS[tag]}</span>
                            <span>{tag}</span>
                            {sortBy === tag && (
                              <span className="ml-1 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map(user => (
                    <tr key={user.email} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-4 px-4 sticky left-0 bg-white dark:bg-gray-800">
                        <Link
                          href={`/user/${encodeURIComponent(user.email)}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <UserAvatar email={user.email} name={user.name} size={32} />
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {getDisplayName(user.email, user.name)}
                          </span>
                        </Link>
                      </td>
                      {activeTags.map(tag => (
                        <td key={tag} className="py-4 px-4 text-right text-gray-900 dark:text-gray-100">
                          {user.messagesByTag[tag] > 0 ? user.messagesByTag[tag].toLocaleString() : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
