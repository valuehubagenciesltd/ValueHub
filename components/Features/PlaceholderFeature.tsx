
import React from 'react';

interface PlaceholderFeatureProps {
  title: string;
}

const PlaceholderFeature: React.FC<PlaceholderFeatureProps> = ({ title }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 text-4xl animate-bounce">
        <i className="fas fa-rocket"></i>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{title}</h1>
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
    </div>
  );
};

export default PlaceholderFeature;
