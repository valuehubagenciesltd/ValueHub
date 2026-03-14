
import React from 'react';
// Fix: Use namespace import to bypass environment-specific type resolution issues with named exports
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useLocation } = ReactRouterDOM as any;
import { APP_NAME, NAVIGATION_LINKS, getRoleDisplayLabel } from '../constants';
import { User } from '../types';

interface HeaderProps {
  onLogout: () => void;
  user?: User;
}

const Header: React.FC<HeaderProps> = ({ onLogout, user }) => {
  const location = useLocation();

  return (
    <>
      {/* Top Header - Branding & Logout */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center group" title="Dashboard">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg shadow-emerald-200 group-hover:bg-emerald-700 transition-colors">
                  <i className="fas fa-chart-line text-lg"></i>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  {APP_NAME}
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:ml-8 md:flex md:space-x-2">
                {NAVIGATION_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
                      location.pathname === link.path 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                    }`}
                  >
                    <i className={`fas ${link.icon}`}></i>
                    <span>{link.name}</span>
                  </Link>
                ))}
                {(user?.role === 'chief' || user?.role === 'dev') && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
                      location.pathname === '/admin' 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'text-slate-500 hover:text-amber-600 hover:bg-slate-50'
                    }`}
                  >
                    <i className={`fas ${user?.role === 'dev' ? 'fa-headset' : 'fa-user-shield'}`}></i>
                    <span>{user?.role === 'dev' ? 'Support' : getRoleDisplayLabel(user?.role)}</span>
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {(user?.role === 'chief' || user?.role === 'dev') && (
                <span className="hidden lg:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest shadow-sm">
                  <i className={`fas ${user?.role === 'dev' ? 'fa-headset' : 'fa-crown'} mr-1.5 text-[10px]`}></i>
                  {user?.role === 'dev' ? 'Support' : getRoleDisplayLabel(user?.role)} Access
                </span>
              )}
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Refined Light Theme */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-2 pointer-events-none">
        <div className="max-w-md mx-auto bottom-nav-glass rounded-[2.5rem] flex items-center justify-around p-1.5 pointer-events-auto border border-white/50 shadow-2xl shadow-slate-200">
          {NAVIGATION_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center w-full py-2.5 transition-all duration-300 relative rounded-2xl ${
                  isActive ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400'
                }`}
              >
                <div className={`text-lg mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  <i className={`fas ${link.icon}`}></i>
                </div>
                <span className={`text-[9px] font-black tracking-widest transition-all uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {link.name}
                </span>
                
                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-emerald-600 rounded-full"></div>
                )}
              </Link>
            );
          })}

          {/* Admin / Support Panel Link for Chief & Dev (Mobile) */}
          {(user?.role === 'chief' || user?.role === 'dev') && (
            <Link
              to="/admin"
              className={`flex flex-col items-center justify-center w-full py-2.5 transition-all duration-300 relative rounded-2xl ${
                location.pathname === '/admin' ? 'text-amber-600 bg-amber-50/50' : 'text-slate-400'
              }`}
            >
              <div className={`text-lg mb-1 transition-transform duration-300 ${location.pathname === '/admin' ? 'scale-110' : ''}`}>
                <i className={`fas ${user?.role === 'dev' ? 'fa-headset' : 'fa-crown'}`}></i>
              </div>
              <span className={`text-[9px] font-black tracking-widest transition-all uppercase ${location.pathname === '/admin' ? 'opacity-100' : 'opacity-60'}`}>
                {user?.role === 'dev' ? 'Support' : (user ? getRoleDisplayLabel(user.role) : 'Admin')}
              </span>
              {location.pathname === '/admin' && (
                <div className="absolute -bottom-1 w-1 h-1 bg-amber-600 rounded-full"></div>
              )}
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};

export default Header;
