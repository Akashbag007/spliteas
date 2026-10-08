import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <Wallet className="w-5 h-5" />
            </div>
            <span>SplitEase</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="/#how-it-works" className="hover:text-emerald-600 transition-colors">
              How it works
            </a>
            <a href="/#features" className="hover:text-emerald-600 transition-colors">
              Features
            </a>
            <a href="/#debt-simplification" className="hover:text-emerald-600 transition-colors">
              Debt Simplification
            </a>
            <a href="/#faq" className="hover:text-emerald-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-emerald-600 px-3.5 py-2 transition-colors"
            >
              Log in
            </NavLink>
            <NavLink
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-xs shadow-emerald-600/25 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
            <span>SplitEase</span>
            <span className="text-slate-500 font-normal text-xs ml-2">
              Split expenses. Simplify life.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a href="/#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="/#features" className="hover:text-white transition-colors">
              Features
            </a>
            <NavLink to="/login" className="hover:text-white transition-colors">
              Login
            </NavLink>
            <NavLink to="/register" className="hover:text-white transition-colors">
              Register
            </NavLink>
          </div>

          <div className="text-slate-500">
            © {new Date().getFullYear()} SplitEase. Smart Group Expense Platform.
          </div>
        </div>
      </footer>
    </div>
  );
};
