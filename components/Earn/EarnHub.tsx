
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;

const EARNING_METHODS = [
  {
    id: 'spinning',
    title: 'Spin & Win',
    description: 'Test your luck on the daily wheel and win instant cash prizes up to 500 Ksh.',
    icon: 'fa-dharmachakra',
    path: '/spinning',
    color: 'emerald',
    reward: 'Up to 500/day'
  },
  {
    id: 'survey',
    title: 'Paid Surveys',
    description: 'Share your valuable opinion on trending topics and get rewarded for every completion.',
    icon: 'fa-poll',
    path: '/survey',
    color: 'blue',
    reward: 'Ksh 50 per survey'
  },
  {
    id: 'writing',
    title: 'Article Writing',
    description: 'Are you a wordsmith? Write engaging content for our partners and earn per publication.',
    icon: 'fa-pen-nib',
    path: '/writing',
    color: 'purple',
    reward: 'High Potential'
  },
  {
    id: 'youtube',
    title: 'Video Rewards',
    description: 'Watch premium video content and complete simple interaction tasks to grow your balance.',
    icon: 'fa-brands fa-youtube',
    path: '/youtube',
    color: 'red',
    reward: 'Passive Income'
  },
  {
    id: 'chat',
    title: 'Chat with Lonely People',
    description: 'Do you know you can earn by chatting with people? Connect with others, have real conversations, and get rewarded. Make someone\'s day and grow your balance.',
    icon: 'fa-comments',
    path: '/chat',
    color: 'amber',
    reward: 'Coming soon'
  }
];

const EarnHub: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-slide-up">
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Earn Center</h1>
        <p className="text-slate-500 font-medium">Choose your preferred way to grow your balance today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EARNING_METHODS.map((method) => (
          <Link 
            key={method.id} 
            to={method.path}
            className="group bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-110 duration-300 ${
                  method.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                  method.color === 'blue' ? 'bg-blue-50 text-blue-600 shadow-blue-100' :
                  method.color === 'purple' ? 'bg-purple-50 text-purple-600 shadow-purple-100' :
                  method.color === 'amber' ? 'bg-amber-50 text-amber-600 shadow-amber-100' :
                  'bg-red-50 text-red-600 shadow-red-100'
                }`}>
                  <i className={`fas ${method.icon}`}></i>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  method.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  method.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  method.color === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                  method.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {method.reward}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{method.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">
                {method.description}
              </p>
            </div>
            
            <div className="flex items-center text-slate-900 font-black text-sm group-hover:text-emerald-600 transition-colors">
              <span>Explore Method</span>
              <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </Link>
        ))}
      </div>

      {/* Referral Teaser */}
      <div className="mt-12 p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-md">
            <h3 className="text-2xl font-black mb-2 tracking-tight">Need a faster boost?</h3>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              Our multi-level referral program is the fastest way to hit your daily targets. Invite your circle and earn together.
            </p>
          </div>
          <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-emerald-900/20 whitespace-nowrap">
            Copy Referral Link
          </Link>
        </div>
        <div className="absolute right-0 top-0 p-12 opacity-5 text-8xl pointer-events-none group-hover:rotate-12 transition-transform duration-700">
          <i className="fas fa-users"></i>
        </div>
      </div>
    </div>
  );
};

export default EarnHub;
