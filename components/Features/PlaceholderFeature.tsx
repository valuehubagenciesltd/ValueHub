
import React, { useState } from 'react';

export interface YouTubeVideoItem {
  title: string;
  url: string;
}

export interface ChatContactItem {
  name: string;
  phone: string;
}

export interface ChatCountryGroup {
  country: string;
  flag: string;
  contacts: ChatContactItem[];
}

export interface PlaceholderFeatureProps {
  title: string;
  variant?: 'spin' | 'surveys' | 'writing' | 'youtube' | 'chat';
  youtubeVideos?: YouTubeVideoItem[];
  chatContacts?: ChatCountryGroup[];
}

const DEFAULT_CHAT_CONTACTS: ChatCountryGroup[] = [
  {
    country: 'United States',
    flag: '🇺🇸',
    contacts: [
      { name: 'Annita', phone: '+1 305 482 7193' },
      { name: 'Jason', phone: '+1 917 640 2831' },
      { name: 'Melissa', phone: '+1 213 555 7482' },
      { name: 'Daniel', phone: '+1 646 732 9054' },
      { name: 'Ashley', phone: '+1 415 689 2740' }
    ]
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    contacts: [
      { name: 'Adam', phone: '+44 7421 638905' },
      { name: 'Emily', phone: '+44 7538 294617' },
      { name: 'Oliver', phone: '+44 7712 904368' },
      { name: 'Sophie', phone: '+44 7594 186302' },
      { name: 'Harry', phone: '+44 7480 527941' }
    ]
  }
];

const PlaceholderFeature: React.FC<PlaceholderFeatureProps> = ({
  title,
  variant = 'default',
  youtubeVideos = [],
  chatContacts = DEFAULT_CHAT_CONTACTS
}) => {
  const [spinning, setSpinning] = useState(false);
  const [spinDegrees, setSpinDegrees] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({});
  const [articleDrafts, setArticleDrafts] = useState<Record<number, string>>({});

  const WHEEL_SEGMENTS = ['Try Again', 'KES 50', 'KES 200', 'KES 30', 'Try Again', 'KES 100', 'KES 500', 'KES 40', 'Try Again', 'KES 80', 'KES 250', 'KES 60'];
  const TRY_AGAIN_INDEX = 0;
  const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    const extraSpins = 360 * 5;
    const landOnTryAgain = 360 - (TRY_AGAIN_INDEX + 0.5) * SEGMENT_ANGLE;
    setSpinDegrees((d) => d + extraSpins + landOnTryAgain);
    setTimeout(() => setSpinning(false), 2500);
  };

  const triviaQuestions: { question: string; options: string[]; correct: string }[] = [
    { question: 'What is the capital of Kenya?', options: ['Mombasa', 'Nairobi', 'Kisumu', 'Nakuru'], correct: 'Nairobi' },
    { question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correct: '6' },
    { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 'Mars' },
    { question: 'What is 7 × 8?', options: ['54', '56', '58', '60'], correct: '56' },
    { question: 'In which year did Kenya gain independence?', options: ['1960', '1962', '1963', '1965'], correct: '1963' },
    { question: 'Which famous migration happens in Kenya and Tanzania?', options: ['The Elephant Migration', 'The Zebra Migration', 'The Great Wildebeest Migration', 'The Lion Migration'], correct: 'The Great Wildebeest Migration' },
    { question: 'Which two official languages are spoken in Kenya?', options: ['Arabic and English', 'Arabic and Kiswahili', 'French and Kiswahili', 'English and Kiswahili'], correct: 'English and Kiswahili' },
    { question: 'What is the capital city of France?', options: ['Berlin', 'Paris', 'Rome', 'Madrid'], correct: 'Paris' },
    { question: 'Which ocean borders Kenya to the east?', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Mediterranean Sea'], correct: 'Indian Ocean' },
    { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: '7' },
    { question: 'What is the largest mammal on Earth?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], correct: 'Blue Whale' },
    { question: 'Which country is Mount Kenya in?', options: ['Tanzania', 'Uganda', 'Kenya', 'Ethiopia'], correct: 'Kenya' }
  ];

  const articleTopics = [
    'How to save money in 2026',
    'Best side hustles in Kenya',
    'Tips for freelancers',
    'Managing your M-Pesa budget',
    'Growing your network through referrals'
  ];

  const TRY_AGAIN_COLOR = '#64748b';
  const getSegmentColor = (label: string, index: number) =>
    label === 'Try Again' ? TRY_AGAIN_COLOR : ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981'][index % 11];

  const defaultContent = (
    <>
      <p className="text-slate-500 text-lg max-w-lg">
        This feature is coming soon! Our team is working hard to bring you more ways to earn and grow with Valuehub.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-emerald-600 font-bold mb-1">Status</div>
          <div className="text-slate-900">In Development</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-emerald-600 font-bold mb-1">Rewards</div>
          <div className="text-slate-900">Up to 500/day</div>
        </div>
      </div>
    </>
  );

  const spinContent = (
    <>
         <p className="text-slate-500 text-lg max-w-lg mb-8">
        This Is Just a Demo! The wheel is rigged for now. We want to make sure everything works perfectly before we let you win real rewards. 
      </p>
      <div className="relative flex items-center justify-center mb-8">
        <div className="relative" style={{ width: 280, height: 300 }}>
          <div
            className="absolute z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-md"
            style={{ left: 126, top: 4 }}
          />
          <div
            className="rounded-full border-4 border-slate-800 shadow-xl overflow-hidden"
            style={{
              width: 280,
              height: 280,
              background: `conic-gradient(${WHEEL_SEGMENTS.map((label, i) => `${getSegmentColor(label, i)} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`).join(', ')})`,
              transform: `rotate(${spinDegrees}deg)`,
              transition: spinning ? 'transform 2.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
            }}
          >
            {WHEEL_SEGMENTS.map((label, i) => {
              const startAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              const rad = (startAngle * Math.PI) / 180;
              const r = 118;
              const x = 140 + r * Math.sin(rad);
              const y = 140 - r * Math.cos(rad);
              return (
                <div
                  key={i}
                  className="absolute text-white font-bold text-xs text-center pointer-events-none"
                  style={{
                    left: x - 28,
                    top: y - 10,
                    width: 56,
                    transform: `rotate(${startAngle}deg)`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
          <div
            className="absolute rounded-full bg-white border-4 border-slate-800 shadow-inner flex items-center justify-center z-[1]"
            style={{ width: 56, height: 56, left: 112, top: 112 }}
          >
            <span className="text-slate-800 font-black text-lg">VH</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleSpin}
        disabled={spinning}
        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all"
      >
        {spinning ? 'Spinning...' : 'Spin the wheel'}
      </button>
    </>
  );

  const surveysContent = (
    <>
      <p className="text-slate-500 text-lg max-w-lg mb-8">
        Answer the trivia below.
      </p>
      <div className="grid gap-6 max-w-2xl w-full text-left">
        {triviaQuestions.map((q, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="font-bold text-slate-800 mb-3">{i + 1}. {q.question}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const chosen = surveyAnswers[i] === opt;
                const showResult = surveyAnswers[i] !== undefined;
                const isCorrect = opt === q.correct;
                const chosenCorrect = chosen && isCorrect;
                const chosenWrong = chosen && !isCorrect;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSurveyAnswers((prev) => ({ ...prev, [i]: opt }))}
                    disabled={showResult}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      chosenCorrect ? 'bg-emerald-100 border-emerald-400 text-emerald-800' :
                      chosenWrong ? 'bg-red-100 border-red-300 text-red-800' :
                      showResult && isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      chosen ? 'bg-slate-100 border-slate-300' :
                      'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {opt}
                    {chosenCorrect && ' ✓'}
                    {chosenWrong && ' ✗'}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const writingContent = (
    <>
      <p className="text-slate-500 text-lg max-w-lg mb-8">
        Pick a topic and write your article below. Your draft stays in your browser only.
      </p>
      <div className="grid gap-6 max-w-2xl w-full text-left">
        {articleTopics.map((topic, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="font-bold text-slate-800 mb-3">{topic}</p>
            <textarea
              placeholder="Start writing here..."
              value={articleDrafts[i] ?? ''}
              onChange={(e) => setArticleDrafts((prev) => ({ ...prev, [i]: e.target.value }))}
              className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y text-slate-700"
              rows={4}
            />
          </div>
        ))}
      </div>
    </>
  );

  const videos = youtubeVideos.length >= 3 ? youtubeVideos.slice(0, 3) : [
    { title: 'Valuehub – How to earn', url: 'https://youtu.be/MBxjPb8hRws?si=gKxUD0W3qGOmsy8f' },
    { title: 'Getting started guide', url: 'https://youtu.be/y90R_2je0kk?si=RNhG758LYy-Zo7Kw' },
    { title: 'Tips and tricks', url: 'https://youtu.be/dVcEMgr5Y1M?si=Lbh8N54Cl2BwRret' }
  ];

  const getYouTubeEmbedId = (url: string): string | null => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0] ?? null;
        return id || null;
      }
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const youtubeContent = (
    <>
      <p className="text-slate-500 text-lg max-w-lg mb-8">
        Watch these videos.
      </p>
      <div className="grid gap-8 max-w-3xl w-full">
        {videos.map((v, i) => {
          const videoId = getYouTubeEmbedId(v.url);
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <i className="fab fa-youtube text-lg"></i>
                </div>
                <span className="font-bold text-slate-800">{v.title}</span>
              </div>
              {videoId ? (
                <div className="relative w-full aspect-video bg-slate-900">
                  <iframe
                    title={v.title}
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
                  Invalid video URL
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  const chatContent = (
    <>
      <p className="text-slate-500 text-lg max-w-lg mb-8">
        Connect with people below. Tap a number to start a chat or call.
      </p>
      <div className="grid gap-8 max-w-2xl w-full text-left">
        {chatContacts.map((group, gi) => (
          <div key={gi} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-800 flex items-center gap-2">
              <span>{group.flag}</span>
              <span>{group.country}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {group.contacts.map((c, ci) => {
                const tel = c.phone.replace(/\s/g, '');
                const num = chatContacts.slice(0, gi).reduce((acc, g) => acc + g.contacts.length, 0) + ci + 1;
                return (
                  <li key={ci} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium text-slate-800">
                      {num}. Chat with {c.name} {group.flag}
                    </span>
                    <a
                      href={`tel:${tel}`}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm whitespace-nowrap"
                    >
                      {c.phone}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );

  const contentByVariant = {
    spin: spinContent,
    surveys: surveysContent,
    writing: writingContent,
    youtube: youtubeContent,
    chat: chatContent,
    default: defaultContent
  };

  const content = contentByVariant[variant] ?? defaultContent;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 text-4xl">
        {variant === 'spin' && <i className="fas fa-dice"></i>}
        {variant === 'surveys' && <i className="fas fa-clipboard-list"></i>}
        {variant === 'writing' && <i className="fas fa-pen-fancy"></i>}
        {variant === 'youtube' && <i className="fab fa-youtube text-5xl"></i>}
        {variant === 'chat' && <i className="fas fa-comments"></i>}
        {(!variant || variant === 'default') && <i className="fas fa-rocket"></i>}
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{title}</h1>
      {content}
    </div>
  );
};

export default PlaceholderFeature;
