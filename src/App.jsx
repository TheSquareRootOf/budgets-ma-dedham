import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  fetchOperatingBudget, 
  fetchPayrollData, 
  fetchCapitalProjects, 
  fetchVendorCheckbook 
} from './api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function App() {
  const [budgetData, setBudgetData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [crossReferencedProjects, setCrossReferencedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadAndProcessData() {
      const [budget, payroll, projects, vendors] = await Promise.all([
        fetchOperatingBudget(),
        fetchPayrollData(),
        fetchCapitalProjects(),
        fetchVendorCheckbook()
      ]);

      setBudgetData(budget.map(item => ({ name: item.name, value: item.spend })));
      setPayrollData(payroll.map(item => ({ name: item.department, value: item.total })));

      const processedProjects = projects.map(project => {
        const relatedChecks = vendors.filter(check => {
          if (check.department !== project.department) return false;
          const searchString = `${check.vendor} ${check.description}`.toLowerCase();

          if (project.id === 'PROJ-001' && searchString.includes('roof')) return true;
          if (project.id === 'PROJ-002' && (searchString.includes('florist') || searchString.includes('bulb'))) return true;
          if (project.id === 'PROJ-003' && (searchString.includes('paint') || searchString.includes('paving'))) return true;
          return false;
        });

        const totalSpend = relatedChecks.reduce((sum, check) => sum + check.amount, 0);
        return {
          ...project,
          totalSpend,
          isOverBudget: totalSpend > project.originalBudget,
          relatedChecks
        };
      });

      setCrossReferencedProjects(processedProjects);
      setIsLoading(false);
    }
    loadAndProcessData();
  }, []);

  const formatCurrency = (value) => `$${value.toLocaleString()}`;

  // The Search Engine Logic
  const filteredProjects = crossReferencedProjects.filter(project => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchProject = project.name.toLowerCase().includes(term) || project.department.toLowerCase().includes(term);
    const matchVendor = project.relatedChecks.some(check => 
      check.vendor.toLowerCase().includes(term) || check.description.toLowerCase().includes(term)
    );
    return matchProject || matchVendor;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dedham Budget Transparency</h1>
              <p className="text-slate-500 text-sm">Interactive Town Finances, Payroll & Vendor Projects</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search projects, vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            />
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            Loading visual dashboard...
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts (Unchanged) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Operating Spend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={budgetData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {budgetData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Payroll Breakdown</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payrollData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {payrollData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Capital Projects Spend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={crossReferencedProjects.map(p => ({ name: p.name, value: p.totalSpend }))} 
                        innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        {crossReferencedProjects.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 pb-2 mt-8">
                <h2 className="text-2xl font-bold text-slate-800">Project Spend Discrepancy Analysis</h2>
                <span className="text-sm text-slate-500">Showing {filteredProjects.length} results</span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
                  No projects or vendors match "{searchTerm}"
                </div>
              ) : (
                filteredProjects.map(project => (
                  <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                        <p className="text-sm text-slate-500">{project.department} Department</p>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold ${project.isOverBudget ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {project.isOverBudget ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {project.isOverBudget ? 'Over Budget' : 'Under Budget'}
                      </div>
                    </div>

                    <div className="flex gap-8 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Approved Budget</p>
                        <p className="text-2xl font-medium text-slate-700">${project.originalBudget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Vendor Spend</p>
                        <p className={`text-2xl font-bold ${project.isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                          ${project.totalSpend.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Verified Vendor Checks</h4>
                      <div className="space-y-1">
                        {project.relatedChecks.map(check => (
                          <div key={check.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <div>
                              <span className="font-semibold text-slate-800">{check.vendor}</span>
                              <span className="text-slate-500 ml-2 truncate">— {check.description}</span>
                            </div>
                            <span className="font-mono font-medium text-slate-700 border-b border-dotted border-slate-300">
                              ${check.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}