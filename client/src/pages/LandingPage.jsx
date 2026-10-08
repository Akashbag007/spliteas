import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowRight,
  Split,
  Receipt,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Users2,
  Sparkles,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-6 shadow-2xs border border-emerald-200/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Bill Splitting & Debt Minimization</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Split expenses. <br />
              <span className="text-emerald-600">Simplify life.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              SplitEase makes group expenses simple, transparent and stress-free.
              Track shared trips, flat rent, dinner parties, and automatically calculate the minimum number of settlements.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <NavLink to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base px-6">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </NavLink>
              <NavLink to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-6">
                  Demo Log In
                </Button>
              </NavLink>
            </div>

            {/* Trust badge */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Equal, Exact, % & Shares Splits
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Greedy Debt Minimization
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Export PDF & CSV
              </span>
            </div>
          </div>

          {/* Interactive Preview Mockup */}
          <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-4 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Goa Trip 2026 • Live Preview
                </span>
                <h3 className="text-lg font-bold text-slate-900">Expense & Settlement Board</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200">
                  Total Spent: ₹37,200
                </span>
              </div>
            </div>

            {/* Grid preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Who owes whom card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Debt Simplification Engine
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Min 2 Transactions
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                        RV
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">Rahul Verma</span>
                        <span className="text-slate-400 mx-1">owes</span>
                        <span className="font-semibold text-emerald-700">Akash Sharma</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-rose-600">₹4,200</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                        DM
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">Dev Malhotra</span>
                        <span className="text-slate-400 mx-1">owes</span>
                        <span className="font-semibold text-emerald-700">Akash Sharma</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-rose-600">₹2,800</span>
                  </div>
                </div>
              </div>

              {/* Balances status */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Member Balances
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">4 Active Members</span>
                </div>
                <div className="space-y-2.5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-semibold text-slate-800">Akash Sharma</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      You are owed +₹7,000
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-semibold text-slate-800">Rahul Verma</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Owes ₹4,200
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-semibold text-slate-800">Jay Patel</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Settled ₹0.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Four Easy Steps
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How SplitEase Works
            </h3>
            <p className="text-sm text-slate-500 mt-3">
              Say goodbye to messy spreadsheets and awkward balance requests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Create a group',
                desc: 'Organize expenses for a road trip, flatmates, hostel utilities, or a college project.',
                icon: Users2,
              },
              {
                step: '02',
                title: 'Add expenses',
                desc: 'Record bills with flexible split methods: Equal, Exact amounts, Percentages, or Shares.',
                icon: Receipt,
              },
              {
                step: '03',
                title: 'Split automatically',
                desc: 'Smart algorithms calculate individual balances and simplify debts to minimum transactions.',
                icon: Split,
              },
              {
                step: '04',
                title: 'Settle balances',
                desc: 'Mark debts as paid with one click, keep full audit histories, and export PDF summaries.',
                icon: CheckCircle2,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/60 rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 transition-all relative group"
                >
                  <span className="text-3xl font-black text-slate-200 group-hover:text-emerald-500/30 transition-colors">
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 mt-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Features
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed for modern financial clarity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Split className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                4 Smart Split Modes
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Split equally among everyone, by exact currency amounts, custom percentages (summing to 100%), or weighted shares.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Debt Simplification
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Greedy min-cash-flow algorithm collapses messy web of IOUs into the minimum practical number of direct transfers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <PieChart className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Visual Analytics
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Interactive charts broken down by categories (Food, Travel, Hotel, Rent), monthly expenditure trends, and member shares.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Receipt Attachments
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Attach bills, receipts, invoices, and photos (JPG, PNG, PDF) directly to any expense with built-in preview.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                PDF & CSV Export
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download beautifully formatted printable PDF expense summaries or CSV spreadsheets for accounting with one click.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Secure JWT Authentication
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bcrypt password hashing, auto-refreshing JWT access tokens, role authorization, and rate-limited backend security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Debt Simplification Deep Dive Section */}
      <section id="debt-simplification" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                The Mathematics of Balance
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Minimizing Transactions With Debt Simplification
              </h3>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                In a typical group of 4 or 5 friends, people take turns paying for cabs, drinks, and meals. This normally results in a messy spiderweb of pairwise debts.
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                SplitEase runs a polynomial-time greedy algorithm that aggregates total net balances:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
                Net Balance = (Total Paid + Settled Paid) - (Total Share + Settled Received)
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                It then pairs the largest debtors with the largest creditors, cutting transaction volume by up to 70%!
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 rounded-3xl shadow-xl">
              <h4 className="text-lg font-bold mb-4">Before vs After Example</h4>
              <div className="space-y-4 text-xs">
                <div className="bg-white/10 p-4 rounded-xl border border-white/15">
                  <span className="font-bold text-emerald-200 block mb-1">Traditional Chaotic Splits (6 transfers)</span>
                  <p className="opacity-90 leading-relaxed">
                    Rahul pays Akash ₹300, Jay pays Rahul ₹200, Dev pays Rahul ₹300, Dev pays Akash ₹500...
                  </p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl border border-white/25">
                  <span className="font-bold text-white block mb-1">SplitEase Simplified (Only 2 transfers)</span>
                  <div className="flex items-center justify-between font-semibold mt-2">
                    <span>Rahul Verma → Akash Sharma</span>
                    <span className="bg-white text-emerald-700 px-2 py-0.5 rounded font-bold">₹300</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold mt-2">
                    <span>Jay Patel → Akash Sharma</span>
                    <span className="bg-white text-emerald-700 px-2 py-0.5 rounded font-bold">₹500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Questions & Answers
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What split methods are supported?',
                a: 'SplitEase supports Equal splits (with penny rounding prevention), Exact amount splits (validates total sum equals bill amount), Percentage splits (validates total percentage equals 100%), and Shares splits (weighted distribution).',
              },
              {
                q: 'How does the settlement system work?',
                a: 'Members can record a settlement when money changes hands via UPI, cash, or bank transfer. Once marked as PAID, the balances and "Who owes whom" list update immediately.',
              },
              {
                q: 'Can I export group data?',
                a: 'Yes! You can export a comprehensive PDF report with full expense tables, balances, and settlements, or download CSV files for Excel.',
              },
              {
                q: 'Are receipts supported?',
                a: 'Yes, you can attach bill images (JPG, PNG) or PDFs up to 5MB, and preview them directly inside expense details.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
            Ready to simplify your group finances?
          </h3>
          <p className="text-sm text-slate-400 mb-8 max-w-xl mx-auto">
            Experience stress-free expense sharing with automated balance calculation and debt minimization.
          </p>
          <NavLink to="/register">
            <Button size="lg" className="px-8 text-base shadow-lg shadow-emerald-500/20">
              Create Your Free Account
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </NavLink>
        </div>
      </section>
    </div>
  );
};
