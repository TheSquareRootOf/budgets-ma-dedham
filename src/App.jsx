import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, FilterX, Table2, ArrowUpDown, CalendarDays, 
  ChevronRight, ChevronLeft, Maximize2, Minimize2, X, ChevronDown, Check, Minus, TrendingUp, Calendar,
  AlertCircle, Loader2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  fetchOperatingBudget, 
  fetchPayrollData, 
  fetchCapitalProjects, 
  fetchVendorCheckbook 
} from './api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6366f1', '#ec4899'];

export default function App() {
  const [rawBudget, setRawBudget] = useState([]);
  const [rawPayroll, setRawPayroll] = useState([]);
  const [rawProjects, setRawProjects] = useState([]);
  const [rawCheckbook, setRawCheckbook] = useState([]);
  
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize disclaimer state from browser local storage
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return localStorage.getItem('dedhamDisclaimerDismissed') !== 'true';
  });

  // Drill-down states
  const [selectedDonut, setSelectedDonut] = useState(null); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Table specific states
  const [budgetTableSearch, setBudgetTableSearch] = useState('');
  const [budgetSort, setBudgetSort] = useState({ key: 'description', direction: 'asc' });
  const [budgetPage, setBudgetPage] = useState(1);
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(false);
  
  const [payrollTableSearch, setPayrollTableSearch] = useState('');
  const [payrollSort, setPayrollSort] = useState({ key: 'name', direction: 'asc' });
  const [payrollPage, setPayrollPage] = useState(1);
  const [isPayrollExpanded, setIsPayrollExpanded] = useState(false);
  
  // Employee Chart States
  const [employeeTimeRange, setEmployeeTimeRange] = useState('3year'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [checkSort, setCheckSort] = useState({ key: 'amount', direction: 'desc' });
  const [checkPage, setCheckPage] = useState(1);
  const [isCheckExpanded, setIsCheckExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [budget, payroll, projects, vendors] = await Promise.all([
        fetchOperatingBudget(), fetchPayrollData(), fetchCapitalProjects(), fetchVendorCheckbook()
      ]);
      
      setRawBudget(budget); setRawPayroll(payroll); setRawProjects(projects); setRawCheckbook(vendors);
      
      const today = new Date();
      const currentMonth = today.getMonth(); 
      const currentYear = today.getFullYear();
      const deducedFY = (currentMonth >= 6 ? currentYear + 1 : currentYear).toString();

      const years = new Set([...budget.map(d => d.fiscalYear), ...payroll.map(d => d.fiscalYear), ...projects.map(d => d.fiscalYear)]);
      const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
      setAvailableYears(sortedYears);
      
      if (sortedYears.includes(deducedFY)) setSelectedYear(deducedFY);
      else if (sortedYears.length > 0) setSelectedYear(sortedYears[0]);
      
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    resetFilters();
  };

  const resetFilters = () => {
    setSelectedDonut(null);
    setSelectedCategory(null);
    setSelectedAccount(null);
    setSelectedEmployee(null);
    setBudgetTableSearch('');
    setPayrollTableSearch('');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDismissDisclaimer = () => {
    setShowDisclaimer(false);
    localStorage.setItem('dedhamDisclaimerDismissed', 'true');
  };

  // Modern Loading Screen with Branding
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Building2 className="w-12 h-12 text-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Dedham Dollars</h1>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center max-w-md w-full animate-in fade-in zoom-in duration-500 delay-150">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Hang tight!</h2>
          <p className="text-slate-500">We're securely hauling in half a million Dedham ledger records for you...</p>
        </div>
      </div>
    );
  }

  const currentBudget = rawBudget.filter(d => d.fiscalYear === selectedYear);
  const currentPayroll = rawPayroll.filter(d => d.fiscalYear === selectedYear);
  const currentProjects = rawProjects.filter(d => d.fiscalYear === selectedYear);
  const currentCheckbook = rawCheckbook.filter(d => d.fiscalYear === selectedYear);

  // --- Deep Match Global Search ---
  const globalSearchLower = globalSearch.toLowerCase();
  
  const searchFilteredBudget = currentBudget.filter(row => {
    if (!globalSearch) return true;
    if (row.description.toLowerCase().includes(globalSearchLower) || row.department.toLowerCase().includes(globalSearchLower)) return true;
    
    const hasMatchingCheck = currentCheckbook.some(c => 
      c.accountCode === row.accountCode && 
      c.department === row.department &&
      (c.vendor.toLowerCase().includes(globalSearchLower) || c.description.toLowerCase().includes(globalSearchLower))
    );
    return hasMatchingCheck;
  });

  const searchFilteredPayroll = currentPayroll.filter(row => {
    if (!globalSearch) return true;
    return row.name.toLowerCase().includes(globalSearchLower) || 
           row.position.toLowerCase().includes(globalSearchLower) || 
           row.department.toLowerCase().includes(globalSearchLower);
  });

  const searchFilteredProjects = currentProjects.filter(row => {
    if (!globalSearch) return true;
    return row.name.toLowerCase().includes(globalSearchLower) || 
           row.department.toLowerCase().includes(globalSearchLower);
  });

  const nonPayrollBudget = searchFilteredBudget.filter(d => !d.isPayroll);

  const totalGlobalBudget = nonPayrollBudget.reduce((sum, item) => sum + item.budget, 0);
  const totalGlobalSpend = nonPayrollBudget.reduce((sum, item) => sum + item.spend, 0);
  const spendPercentage = totalGlobalBudget > 0 ? (totalGlobalSpend / totalGlobalBudget) * 100 : 0;
  const spendColor = totalGlobalSpend > totalGlobalBudget ? 'bg-red-500' : 'bg-emerald-500';

  const formatCurrency = (value) => `$${value.toLocaleString()}`;

  // --- Donuts Data ---
  const budgetDonutData = Object.values(nonPayrollBudget.reduce((acc, row) => {
    if (!acc[row.department]) acc[row.department] = { name: row.department, budget: 0, spend: 0 };
    acc[row.department].budget += row.budget;
    acc[row.department].spend += row.spend;
    return acc;
  }, {})).filter(item => item.budget > 0 || item.spend > 0).sort((a, b) => b.budget - a.budget);

  const top10Budget = budgetDonutData.slice(0, 10);
  const otherBudget = budgetDonutData.slice(10);
  if (otherBudget.length > 0) top10Budget.push({ name: 'Other Departments', budget: otherBudget.reduce((sum, i) => sum + i.budget, 0), spend: otherBudget.reduce((sum, i) => sum + i.spend, 0) });

  const payrollDonutData = Object.values(searchFilteredPayroll.reduce((acc, row) => {
    if (!acc[row.department]) acc[row.department] = { name: row.department, total: 0 };
    acc[row.department].total += row.total;
    return acc;
  }, {})).filter(item => item.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);

  const projectsDonutData = Object.values(searchFilteredProjects.reduce((acc, row) => {
    if (!acc[row.department]) acc[row.department] = { name: row.department, value: 0 };
    acc[row.department].value += row.originalBudget;
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 10);

  // --- Budget Table Logic ---
  const categoryBudgetItems = (selectedCategory && selectedDonut === 'budget') ? nonPayrollBudget.filter(r => r.department === selectedCategory) : [];
  const tableSearchLower = budgetTableSearch.toLowerCase();
  const filteredCategoryItems = categoryBudgetItems.filter(row => !budgetTableSearch || row.description.toLowerCase().includes(tableSearchLower));

  const groupedBudgetTable = Object.values(filteredCategoryItems.reduce((acc, row) => {
    if (!acc[row.description]) acc[row.description] = { description: row.description, accountCode: row.accountCode, budget: 0, spend: 0 };
    acc[row.description].budget += row.budget;
    acc[row.description].spend += row.spend;
    return acc;
  }, {}));

  const requestBudgetSort = (key) => setBudgetSort({ key, direction: budgetSort.key === key && budgetSort.direction === 'desc' ? 'asc' : 'desc' });
  const sortedBudgetTable = [...groupedBudgetTable].sort((a, b) => {
    let aVal = a[budgetSort.key]; let bVal = b[budgetSort.key];
    if (budgetSort.key === 'percentage') { aVal = a.budget > 0 ? (a.spend / a.budget) : 0; bVal = b.budget > 0 ? (b.spend / b.budget) : 0; }
    if (typeof aVal === 'string') return budgetSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return budgetSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const budgetPageSize = isBudgetExpanded ? 20 : 6;
  const totalBudgetPages = Math.ceil(sortedBudgetTable.length / budgetPageSize);
  const paginatedBudgetTable = sortedBudgetTable.slice((budgetPage - 1) * budgetPageSize, budgetPage * budgetPageSize);

  // --- Grouped Payroll Table Logic ---
  const categoryPayrollItems = (selectedCategory && selectedDonut === 'payroll') ? searchFilteredPayroll.filter(r => r.department === selectedCategory) : [];
  const payrollSearchLower = payrollTableSearch.toLowerCase();
  
  const groupedPayrollTable = Object.values(categoryPayrollItems.reduce((acc, row) => {
    const key = `${row.name}-${row.position}`;
    if (!acc[key]) acc[key] = { name: row.name, position: row.position, basePay: 0, overtime: 0, otherPay: 0, total: 0 };
    acc[key].basePay += row.basePay;
    acc[key].overtime += row.overtime;
    acc[key].otherPay += row.otherPay;
    acc[key].total += row.total;
    return acc;
  }, {})).filter(row => !payrollTableSearch || row.name.toLowerCase().includes(payrollSearchLower) || row.position.toLowerCase().includes(payrollSearchLower));

  const requestPayrollSort = (key) => setPayrollSort({ key, direction: payrollSort.key === key && payrollSort.direction === 'desc' ? 'asc' : 'desc' });
  const sortedPayrollTable = [...groupedPayrollTable].sort((a, b) => {
    let aVal = a[payrollSort.key]; let bVal = b[payrollSort.key];
    if (typeof aVal === 'string') return payrollSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return payrollSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const payrollPageSize = isPayrollExpanded ? 50 : 25;
  const totalPayrollPages = Math.ceil(sortedPayrollTable.length / payrollPageSize);
  const paginatedPayrollTable = sortedPayrollTable.slice((payrollPage - 1) * payrollPageSize, payrollPage * payrollPageSize);

  // --- Employee Pay History Chart Logic ---
  let employeeChartData = [];
  if (selectedEmployee) {
    let employeeHistory = rawPayroll.filter(r => r.name === selectedEmployee.name);
    
    if (employeeTimeRange === '3year') {
      const curr = parseInt(selectedYear);
      const validYears = [curr, curr - 1, curr - 2].map(String);
      employeeHistory = employeeHistory.filter(r => validYears.includes(r.fiscalYear));
    } else if (employeeTimeRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      employeeHistory = employeeHistory.filter(r => {
        if (!r.date) return false;
        const rowDate = new Date(r.date);
        return rowDate >= start && rowDate <= end;
      });
    }

    const payByYear = employeeHistory.reduce((acc, row) => {
      const fy = row.fiscalYear || 'Unknown';
      if (!acc[fy]) acc[fy] = { fiscalYear: fy, totalPay: 0, basePay: 0, overtime: 0, otherPay: 0 };
      acc[fy].totalPay += row.total;
      acc[fy].basePay += row.basePay;
      acc[fy].overtime += row.overtime;
      acc[fy].otherPay += row.otherPay;
      return acc;
    }, {});
    
    employeeChartData = Object.values(payByYear).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
  }

  // --- Vendor Check Logic (TIGHTENED) ---
  const accountChecks = (selectedAccount && selectedDonut === 'budget') ? currentCheckbook.filter(c => {
    // Must be in the same department overarching category
    if (c.department !== selectedCategory) return false;
    
    // 1. Exact Accounting Code Match (The Gold Standard)
    if (selectedAccount.accountCode && c.accountCode && c.accountCode === selectedAccount.accountCode) {
      return true;
    }
    
    // 2. The $0 Failsafe: If the ledger officially says $0 spent, DO NOT attempt to guess via fuzzy text matching.
    if (!selectedAccount.spend || selectedAccount.spend === 0) {
      return false;
    }

    const targetDesc = (selectedAccount.description || '').toLowerCase().trim();
    const checkAccDesc = (c.accountDescription || '').toLowerCase().trim();
    
    if (!targetDesc) return false;

    // 3. Exact Category Name Match
    if (checkAccDesc === targetDesc) return true;
    
    return false;
  }) : [];

  const requestCheckSort = (key) => setCheckSort({ key, direction: checkSort.key === key && checkSort.direction === 'desc' ? 'asc' : 'desc' });
  const sortedCheckTable = [...accountChecks].sort((a, b) => {
    let aVal = a[checkSort.key]; let bVal = b[checkSort.key];
    if (typeof aVal === 'string') return checkSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return checkSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const checkPageSize = isCheckExpanded ? 20 : 6;
  const totalCheckPages = Math.ceil(sortedCheckTable.length / checkPageSize);
  const paginatedCheckTable = sortedCheckTable.slice((checkPage - 1) * checkPageSize, checkPage * checkPageSize);

  // --- Dynamic Breadcrumbs Navigation ---
  let breadcrumbs = [{ id: 'dashboard-top', label: 'Dashboard', hasResults: true }];
  
  if (selectedDonut === 'budget') {
    breadcrumbs.push({ id: 'budget-table', label: 'Budget & Spend', hasResults: sortedBudgetTable.length > 0 });
    breadcrumbs.push({ id: 'vendor-table', label: 'Vendor Checks', hasResults: selectedAccount && sortedCheckTable.length > 0 });
  } else if (selectedDonut === 'payroll') {
    breadcrumbs.push({ id: 'payroll-table', label: 'Payroll by Category', hasResults: sortedPayrollTable.length > 0 });
    breadcrumbs.push({ id: 'employee-chart', label: 'Payroll Detail', hasResults: selectedEmployee && employeeChartData.length > 0 });
  } else if (selectedDonut === 'projects') {
    breadcrumbs.push({ id: 'projects-table', label: 'Major Projects', hasResults: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-8" id="dashboard-top">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dedham Dollars</h1>
              <p className="text-slate-500 text-sm">Making Our Town Finances Easier To Understand</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">FY {selectedYear} Operating Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700">Approved Budget</span>
                  <span className="font-bold text-blue-600">{formatCurrency(totalGlobalBudget)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                  <div className="bg-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700">Funds Spent</span>
                  <span className={`font-bold ${totalGlobalSpend > totalGlobalBudget ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(totalGlobalSpend)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                  <div className={`${spendColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(spendPercentage, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full border-t border-slate-200 pt-6">
            <div className="relative w-full sm:w-48 shrink-0">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <select 
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full pl-10 pr-8 py-2 appearance-none rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium text-slate-700 cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>FY {year}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex w-full gap-3">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by name, amount, category, vendor, etc..."
                  value={globalSearch}
                  onChange={(e) => { setGlobalSearch(e.target.value); resetFilters(); }}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                />
                {globalSearch && (
                  <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" title="Clear Search">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {(selectedCategory || selectedAccount || selectedEmployee) && (
                <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 shadow-sm shrink-0">
                  <FilterX className="w-4 h-4" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        </header>

        {showDisclaimer && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 mb-8 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Data Notice:</strong> This information is sourced directly from Dedham's open data portal. While we apply standard practices to map funds to specific categories and vendor checks, municipal accounting structures are highly complex. Some checks may be imperfectly linked or categorized. Please verify specific inquiries directly with official Town records.
              </p>
            </div>
            <button onClick={handleDismissDisclaimer} className="text-amber-500 hover:text-amber-700 transition-colors shrink-0" title="Dismiss Notice">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* Dynamic Interactive Breadcrumbs */}
          <div className="hidden xl:block w-48 shrink-0">
            <div className="sticky top-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Navigation</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                
                {breadcrumbs.map((bc) => (
                   <div key={bc.id} className="relative flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection(bc.id)}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white z-10 transition-colors ${
                        bc.hasResults ? 'border-emerald-500 text-emerald-500' : 'border-blue-500 text-blue-500'
                      }`}>
                        {bc.hasResults ? <Check className="w-3 h-3" strokeWidth={3} /> : <Minus className="w-3 h-3" strokeWidth={3} />}
                      </div>
                      <span className={`text-sm font-medium transition-colors group-hover:text-blue-600 ${bc.hasResults ? 'text-slate-500' : 'text-blue-600'}`}>
                        {bc.label}
                      </span>
                   </div>
                ))}

              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            
            {!selectedCategory && (
              <div className="p-8 bg-blue-50 border border-blue-100 rounded-2xl text-center shadow-inner animate-in fade-in duration-500 mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">Welcome to Dedham Dollars</h2>
                <p className="text-blue-800 text-lg">To start your analysis, simply click a colorful category on any of the charts below.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col items-center ${selectedDonut === 'budget' ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'}`}>
                <h2 className="text-lg font-bold text-slate-800 text-center">Funds Spent by Category</h2>
                <p className="text-sm text-slate-500 mb-6 text-center">(Excluding Payroll)</p>
                <div className="h-56 w-full cursor-pointer">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={top10Budget} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" onClick={(data) => { setSelectedCategory(data.name); setSelectedDonut('budget'); setSelectedAccount(null); setSelectedEmployee(null); setBudgetPage(1); }}>
                        {top10Budget.map((entry, index) => <Cell key={`budget-cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col items-center ${selectedDonut === 'payroll' ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'}`}>
                <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Payroll Spent by Category</h2>
                <div className="h-56 w-full cursor-pointer">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payrollDonutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total" onClick={(data) => { setSelectedCategory(data.name); setSelectedDonut('payroll'); setSelectedEmployee(null); setSelectedAccount(null); setPayrollPage(1); }}>
                        {payrollDonutData.map((entry, index) => <Cell key={`payroll-cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col items-center ${selectedDonut === 'projects' ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'}`}>
                <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Major Expenditures</h2>
                <div className="h-56 w-full opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={projectsDonutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" onClick={(data) => { setSelectedCategory(data.name); setSelectedDonut('projects'); setSelectedAccount(null); setSelectedEmployee(null); }}>
                        {projectsDonutData.map((entry, index) => <Cell key={`project-cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Dynamic Category Header */}
            {selectedCategory && (
              <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-md border border-blue-700 animate-in fade-in duration-300 mt-8">
                <h2 className="text-3xl font-bold tracking-tight">
                  {selectedDonut === 'budget' ? `Funds Spent: ${selectedCategory}` : 
                   selectedDonut === 'payroll' ? `Payroll Compensation: ${selectedCategory}` : 
                   `Major Expenditures: ${selectedCategory}`}
                </h2>
              </div>
            )}

            {/* BUDGET DRILL DOWN */}
            {(selectedCategory && selectedDonut === 'budget') && (
              <div id="budget-table" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <Table2 className="w-6 h-6 text-slate-600" />
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Budget and Spend</h3>
                      <p className="text-sm text-slate-500">Click any row below to view specific vendor checks for that line item, if check data is available.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input 
                        type="text" placeholder="Filter table..." value={budgetTableSearch}
                        onChange={(e) => { setBudgetTableSearch(e.target.value); setBudgetPage(1); }}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button onClick={() => setIsBudgetExpanded(!isBudgetExpanded)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      {isBudgetExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse Table</> : <><Maximize2 className="w-4 h-4"/> Expand Table</>}
                    </button>
                  </div>
                </div>
                
                {sortedBudgetTable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No account ledgers found matching your criteria.</div>
                ) : (
                  <>
                    <div className={`overflow-y-auto border border-slate-200 rounded-xl shadow-inner transition-all duration-300 ${isBudgetExpanded ? 'max-h-[600px]' : 'max-h-[340px]'}`}>
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestBudgetSort('description')}>
                              <div className="flex items-center gap-1">Expense Description <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestBudgetSort('budget')}>
                              <div className="flex items-center justify-end gap-1">Budgeted <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestBudgetSort('spend')}>
                              <div className="flex items-center justify-end gap-1">Spent <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestBudgetSort('percentage')}>
                              <div className="flex items-center justify-end gap-1">% of Budget <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedBudgetTable.map((row, idx) => {
                            const pct = row.budget > 0 ? ((row.spend / row.budget) * 100).toFixed(1) : 0;
                            const isSelected = selectedAccount?.description === row.description;
                            return (
                              <tr 
                                key={`budget-row-${idx}`} 
                                onClick={() => { setSelectedAccount(isSelected ? null : row); setCheckPage(1); }}
                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                              >
                                <td className="px-4 py-3 font-medium text-slate-800">{row.description}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600">${row.budget.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">${row.spend.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right"><span className={`px-2 py-1 rounded text-xs font-bold ${pct > 100 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{pct}%</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-slate-500">Showing {paginatedBudgetTable.length} of {sortedBudgetTable.length} entries</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBudgetPage(p => Math.max(1, p - 1))} disabled={budgetPage === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="text-sm font-medium text-slate-700">Page {budgetPage} of {totalBudgetPages || 1}</span>
                        <button onClick={() => setBudgetPage(p => Math.min(totalBudgetPages, p + 1))} disabled={budgetPage === totalBudgetPages || totalBudgetPages === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button>
                      </div>
                      <button onClick={() => setIsBudgetExpanded(!isBudgetExpanded)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                        {isBudgetExpanded ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PAYROLL DRILL DOWN */}
            {(selectedCategory && selectedDonut === 'payroll') && (
              <div id="payroll-table" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <Table2 className="w-6 h-6 text-slate-600" />
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Employee Compensation</h3>
                      <p className="text-sm text-slate-500">Click any employee below to view their historical pay trajectory over time.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input 
                        type="text" placeholder="Filter employee or title..." value={payrollTableSearch}
                        onChange={(e) => { setPayrollTableSearch(e.target.value); setPayrollPage(1); }}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button onClick={() => setIsPayrollExpanded(!isPayrollExpanded)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      {isPayrollExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse Table</> : <><Maximize2 className="w-4 h-4"/> Expand Table</>}
                    </button>
                  </div>
                </div>
                
                {sortedPayrollTable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No payroll records found matching your criteria.</div>
                ) : (
                  <>
                    <div className={`overflow-y-auto border border-slate-200 rounded-xl shadow-inner transition-all duration-300 ${isPayrollExpanded ? 'max-h-[800px]' : 'max-h-[440px]'}`}>
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestPayrollSort('name')}>
                              <div className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestPayrollSort('position')}>
                              <div className="flex items-center gap-1">Job Title <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestPayrollSort('basePay')}>
                              <div className="flex items-center justify-end gap-1">Base Pay YTD <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestPayrollSort('overtime')}>
                              <div className="flex items-center justify-end gap-1">Overtime YTD <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestPayrollSort('otherPay')}>
                              <div className="flex items-center justify-end gap-1">Other Pay YTD <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors text-right" onClick={() => requestPayrollSort('total')}>
                              <div className="flex items-center justify-end gap-1">Total Comp. YTD <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedPayrollTable.map((row, idx) => {
                            const isSelected = selectedEmployee?.name === row.name;
                            return (
                              <tr 
                                key={`payroll-row-${idx}`} 
                                onClick={() => setSelectedEmployee(isSelected ? null : row)}
                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                              >
                                <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                                <td className="px-4 py-3 text-slate-600">{row.position}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600">${row.basePay.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600">${row.overtime.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600">${row.otherPay.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">${row.total.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-slate-500">Showing {paginatedPayrollTable.length} of {sortedPayrollTable.length} employees</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPayrollPage(p => Math.max(1, p - 1))} disabled={payrollPage === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="text-sm font-medium text-slate-700">Page {payrollPage} of {totalPayrollPages || 1}</span>
                        <button onClick={() => setPayrollPage(p => Math.min(totalPayrollPages, p + 1))} disabled={payrollPage === totalPayrollPages || totalPayrollPages === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button>
                      </div>
                      <button onClick={() => setIsPayrollExpanded(!isPayrollExpanded)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                        {isPayrollExpanded ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* EMPLOYEE PAY HISTORY BAR CHART */}
            {selectedEmployee && (
              <div id="employee-chart" className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Pay History: {selectedEmployee.name}</h3>
                      <p className="text-sm text-slate-400">{selectedEmployee.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button 
                      onClick={() => setEmployeeTimeRange('3year')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${employeeTimeRange === '3year' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      3 Year Trend
                    </button>
                    <button 
                      onClick={() => setEmployeeTimeRange('allTime')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${employeeTimeRange === 'allTime' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      All Time
                    </button>
                    <button 
                      onClick={() => setEmployeeTimeRange('custom')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${employeeTimeRange === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      Custom Range
                    </button>
                  </div>
                </div>

                {employeeTimeRange === 'custom' && (
                  <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm font-medium">Start:</span>
                      <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm font-medium">End:</span>
                      <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>
                )}
                
                {employeeChartData.length === 0 ? (
                  <div className="text-center py-10 px-6 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50">
                    <p className="text-slate-300 font-medium mb-2">No pay data found for the selected time range.</p>
                    {employeeTimeRange === 'custom' && <p className="text-slate-500 text-sm">Adjust your custom dates above to see historical data.</p>}
                  </div>
                ) : (
                  <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeeChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="fiscalYear" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                        <Tooltip 
                          cursor={{fill: '#1e293b'}}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Total Compensation']}
                          labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                          labelFormatter={(label) => `Fiscal Year: ${label}`}
                        />
                        <Bar dataKey="totalPay" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* VENDOR CHECKS DRILL DOWN (Only visible if Budget is selected) */}
            {(selectedAccount && selectedDonut === 'budget') && (
              <div id="vendor-table" className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <Table2 className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Vendor Checks: {selectedAccount.description}</h3>
                      <p className="text-sm text-slate-400">Raw transaction ledger for this specific line item</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsCheckExpanded(!isCheckExpanded)} className="flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                      {isCheckExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse Table</> : <><Maximize2 className="w-4 h-4"/> Expand Table</>}
                    </button>
                  </div>
                </div>
                
                {sortedCheckTable.length === 0 ? (
                  <div className="text-center py-10 px-6 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50">
                    {selectedAccount.spend === 0 ? (
                      <p className="text-slate-300 font-medium mb-2">No transactions have been recorded against this budget yet.</p>
                    ) : (
                      <>
                        <p className="text-slate-300 font-medium mb-2">No direct Accounts Payable vendor checks are explicitly linked to this line item.</p>
                        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
                          Note: The <span className="font-mono text-emerald-400">${selectedAccount.spend.toLocaleString()}</span> spent here may represent internal town journal entries, inter-departmental chargebacks, or payments processed through a centralized town-wide master account that bypasses this specific budget line.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={`overflow-y-auto border border-slate-700 rounded-xl bg-slate-900 transition-all duration-300 ${isCheckExpanded ? 'max-h-[600px]' : 'max-h-[340px]'}`}>
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="bg-slate-800 sticky top-0 border-b border-slate-700 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => requestCheckSort('date')}><div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => requestCheckSort('vendor')}><div className="flex items-center gap-1">Vendor / Payee <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => requestCheckSort('description')}><div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => requestCheckSort('checkNumber')}><div className="flex items-center gap-1">Check # <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors text-right" onClick={() => requestCheckSort('amount')}><div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {paginatedCheckTable.map((check) => (
                            <tr key={check.id} className="hover:bg-slate-800 transition-colors">
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{check.date}</td>
                              <td className="px-4 py-3 font-medium text-white">{check.vendor}</td>
                              <td className="px-4 py-3 text-slate-400">{check.description}</td>
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{check.checkNumber}</td>
                              <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">${check.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-slate-400">Showing {paginatedCheckTable.length} of {sortedCheckTable.length} entries</span>
                      <div className="flex items-center gap-2 text-slate-300">
                        <button onClick={() => setCheckPage(p => Math.max(1, p - 1))} disabled={checkPage === 1} className="p-1 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="text-sm font-medium">Page {checkPage} of {totalCheckPages || 1}</span>
                        <button onClick={() => setCheckPage(p => Math.min(totalCheckPages, p + 1))} disabled={checkPage === totalCheckPages || totalCheckPages === 0} className="p-1 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button>
                      </div>
                      <button onClick={() => setIsCheckExpanded(!isCheckExpanded)} className="flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300">
                        {isCheckExpanded ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}