import React from 'react';
import { Building2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-3 mb-8">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dedham Budget Transparency</h1>
            <p className="text-slate-500 text-sm">Interactive Town Finances, Payroll & Vendor Projects</p>
          </div>
        </header>

        {/* Main Content Card */}
        <main className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex items-center justify-center text-slate-400">
          Dashboard framework initialized. Ready for Phase 2 data fetching.
        </main>
      </div>
    </div>
  );
}