'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  'Animals': '🐾',
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

  const getBio = (email: string): string | null => {
    if (email === 'HoopandKelp@gmail.com') {
      return "A high-functioning cynic with hedonistic features, Mikey serves as the group's reality anchor and sardonic shield. With over 47,000 messages to his name, he functions simultaneously as the group's jester and superego—keeping everyone in check with his relentless sarcasm and blunt wit. When others spiral into absurdity, Mikey drags them back to mundane reality, albeit begrudgingly. His weekend plans revolve around his carefully curated wine selection (Hardys Crest Cabernet Sauvignon, naturally) and the occasional brave venture into bad weather. A master of the preemptive strike in conversation, he maintains control by lowering the seriousness before anyone else can. Despite his role as the observer above the fray, he's slowly becoming the very thing he mocks—these days, he can only do 'dad dancing.'";
    }
    if (email === 'angelajanecroft@gmail.com') {
      return "A technological stoic with over 35,000 messages, Rob serves as the Ego of the group—the rational mediator attempting to balance chaos with logic, technical solutions, and moral observation. As the resident 'Tech Support Father Figure,' he believes that with the right USB-C cable or API endpoint, human suffering can be mitigated. A reluctant ascetic who views hunger as 'nothing to fear,' he oscillates between complaining about poor service (fruit salad for lunch in first class?) and stoically accepting his fate with moral superiority. Rob is the Archivist of Disaster, documenting rather than screaming when Noah throws yet another tablet into a farmer's field (they have 6... had 6). He acts as the moral compass that points slightly off-north, asking logistical questions like 'How the hell did the mattress get up?' while missing the inherent comedy. A modern Sisyphus pushing a boulder of electronics up a hill, he loves a good ding dong (debate) and critiques Gary's 'meat swets' with detached bemusement. No amount of JSON placeholders will fix his friends, but he keeps trying anyway.";
    }
    if (email === 'barooahn@gmail.com') {
      return "A techno-optimist with conflict-avoidant tendencies, Nicholas functions as the group's diplomat and participatory observer with approximately 5,200 messages. As the 'Agreeable Mirror,' his lexicon is dominated by affirmations—'Perfect!', 'Ha ha. I like it.', 'Totally.'—seeking harmony and consensus where others create chaos. The most stable member of the ecosystem, he serves as the comedic straight man, providing the 'normal' baseline against which Gary's gout and Mikey's sarcasm are measured. A future-oriented early adopter consumed by media and gadgets (Andor, The Peripheral, 1899, Mr. Robot, AR glasses with screens), he looks forward while Gary stays stuck in childhood and Mikey in cynical present. Often standing on the threshold as the reluctant participant, he asks 'How do I join?' rather than breaking the rules, politely engaging with inanity ('It's a nice white dot as far as white dots go') to make others feel heard. The superego's apprentice and the group's TV Guide, he maintains their cultural literacy by watching The Peripheral so the others don't have to. His ability to find things 'good' and laugh at bad jokes ensures survival, though he desperately needs to practice saying 'That gif was terrible, Gary' instead of 'Ha ha.'";
    }
    if (email === 'gmitlimited@gmail.com') {
      return "An impulsive hedonist with somatic manifestations of stress, Gary is the Id of the group with over 41,000 messages providing raw material for others to dissect. The group mascot and bewildered protagonist, he's trapped in a classic binge-purge cycle—'I'm booze free this weekend as I felt a twinge of gout after last weekends binge, what a twat'—viewing his body as both vehicle for pleasure and traitorous entity. His plea 'Stop talking about booze please 😂' reveals the fragility of his resolve; he knows he cannot resist, so he begs the environment to remove temptation. A Peter Pan complex drives his constant regression to simpler times—reminiscing about childhood fishing trips ('Had a little tent and flasks an tha... think I was 8ish... No! 10'), joking about whizz and coke, greeting with 'Wassap monkey pluckers!!!' Narrating life with an external locus of control ('The mattress came up the side of the house', 'The story of my life'), he's the passive participant bewildered by chaos he creates. At high risk of repetitive gout flare-ups and social embarrassment, he bounces back from cliche films and worldly IT outages with undiminished enthusiasm. He needs to embrace the Dad archetype—hoisting mattresses and joining wine clubs is his reality now. The monkey plucker days are behind him. (Hydration strictly for the gout.)";
    }
    return null;
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
          <div className="flex items-center gap-6 mb-6">
            {getAvatarPath(stats.email) && (
              <Image
                src={getAvatarPath(stats.email)!}
                alt={`${getDisplayName(stats.email, stats.name)} Avatar`}
                width={120}
                height={120}
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{getDisplayName(stats.email, stats.name)}</h1>
              <p className="text-gray-600 dark:text-gray-400">{stats.email}</p>
            </div>
          </div>

          {getBio(stats.email) && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3">About</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{getBio(stats.email)}</p>
            </div>
          )}

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
                    <span className="text-gray-900 dark:text-gray-100 font-semibold w-16 text-right">
                      {count.toLocaleString()}
                    </span>
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
