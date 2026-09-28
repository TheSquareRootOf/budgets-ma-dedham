import React, { useState, useEffect } from 'react';
import { 
  Search, FilterX, Table2, ArrowUpDown, CalendarDays, 
  ChevronRight, ChevronLeft, Maximize2, Minimize2, X, ChevronDown, Check, Minus, TrendingUp, Calendar,
  Loader2, Info, ShieldAlert, HelpCircle, Zap, TrendingDown, DollarSign, CalendarClock, MapPin, Globe, PhoneCall, UserCircle, BadgeCheck, Store
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  fetchOperatingBudget, 
  fetchPayrollData, 
  fetchCapitalProjects, 
  fetchVendorCheckbook,
  fetchVendorProfiles
} from './api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6366f1', '#ec4899'];

// Custom Abstract Town Seal SVG Component
const TownSealLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#fbbf24" strokeWidth="4"/>
    <circle cx="50" cy="50" r="38" fill="#38bdf8" stroke="#fbbf24" strokeWidth="1.5"/>
    <path d="M30 35 h40 v25 c0 15 -20 25 -20 25 c0 0 -20 -10 -20 -25 v-25 z" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="2"/>
    <path d="M48 75 v-15" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
    <path d="M50 40 c-12 0 -18 10 -10 20 c5 5 15 5 20 0 c8 -10 2 -20 -10 -20 z" fill="#15803d" stroke="#fbbf24" strokeWidth="1.5"/>
    <path d="M50 15 v12 M35 18 h30 M35 18 L30 25 M35 18 L40 25 M30 25 Q35 28 40 25 M65 18 L60 25 M65 18 L70 25 M60 25 Q65 28 70 25" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 80 Q50 88 65 80" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [rawBudget, setRawBudget] = useState([]);
  const [rawPayroll, setRawPayroll] = useState([]);
  const [rawProjects, setRawProjects] = useState([]);
  const [rawCheckbook, setRawCheckbook] = useState([]);
  const [vendorProfiles, setVendorProfiles] = useState([]);
  
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [fundFilter, setFundFilter] = useState('All'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  const [showDisclaimerModal, setShowDisclaimerModal] = useState(() => {
    return localStorage.getItem('dedhamDisclaimerDismissed') !== 'true';
  });

  const [selectedDonut, setSelectedDonut] = useState(null); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  const [budgetTableSearch, setBudgetTableSearch] = useState('');
  const [budgetSort, setBudgetSort] = useState({ key: 'description', direction: 'asc' });
  const [budgetPage, setBudgetPage] = useState(1);
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(false);
  
  const [payrollTableSearch, setPayrollTableSearch] = useState('');
  const [payrollSort, setPayrollSort] = useState({ key: 'name', direction: 'asc' });
  const [payrollPage, setPayrollPage] = useState(1);
  const [isPayrollExpanded, setIsPayrollExpanded] = useState(false);
  
  const [projectsSort, setProjectsSort] = useState({ key: 'value', direction: 'desc' });
  const [projectsPage, setProjectsPage] = useState(1);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  const [vendorTableSearch, setVendorTableSearch] = useState('');
  const [vendorSort, setVendorSort] = useState({ key: 'total', direction: 'desc' });
  const [vendorPage, setVendorPage] = useState(1);
  const [isVendorExpanded, setIsVendorExpanded] = useState(false);

  const [chartTimeRange, setChartTimeRange] = useState('3year'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [checkSort, setCheckSort] = useState({ key: 'amount', direction: 'desc' });
  const [checkPage, setCheckPage] = useState(1);
  const [isCheckExpanded, setIsCheckExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      const [budget, payroll, projects, vendors, profiles] = await Promise.all([
        fetchOperatingBudget(), fetchPayrollData(), fetchCapitalProjects(), fetchVendorCheckbook(), fetchVendorProfiles()
      ]);
      
      setRawBudget(budget); setRawPayroll(payroll); setRawProjects(projects); setRawCheckbook(vendors); setVendorProfiles(profiles);
      
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
    fullyReset();
  };

  const handleSearch = (val) => {
    setGlobalSearch(val);
    setSelectedDonut(null);
    setSelectedCategory(null);
    setSelectedAccount(null);
    setSelectedEmployee(null);
    setSelectedVendor(null);
    setBudgetTableSearch('');
    setPayrollTableSearch('');
    setVendorTableSearch('');
  };

  const fullyReset = () => {
    setGlobalSearch('');
    setSelectedDonut(null);
    setSelectedCategory(null);
    setSelectedAccount(null);
    setSelectedEmployee(null);
    setSelectedVendor(null);
    setBudgetTableSearch('');
    setPayrollTableSearch('');
    setVendorTableSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDismissDisclaimer = () => {
    setShowDisclaimerModal(false);
    localStorage.setItem('dedhamDisclaimerDismissed', 'true');
  };

  const triggerInsight = (type) => {
    setGlobalSearch('');
    setSelectedAccount(null);
    setSelectedEmployee(null);
    setSelectedVendor(null);
    setBudgetTableSearch('');
    setPayrollTableSearch('');
    setVendorTableSearch('');
    
    if (type === 'overbudget') {
      setSelectedCategory('ALL');
      setSelectedDonut('budget');
      setBudgetSort({ key: 'percentage', direction: 'desc' });
      setIsBudgetExpanded(true);
      setTimeout(() => scrollToSection('budget-table'), 200);
    } else if (type === 'underbudget') {
      setSelectedCategory('ALL');
      setSelectedDonut('budget');
      setBudgetSort({ key: 'percentage', direction: 'asc' });
      setIsBudgetExpanded(true);
      setTimeout(() => scrollToSection('budget-table'), 200);
    } else if (type === 'overtime') {
      setSelectedCategory('ALL');
      setSelectedDonut('payroll');
      setPayrollSort({ key: 'overtime', direction: 'desc' });
      setIsPayrollExpanded(true);
      setTimeout(() => scrollToSection('payroll-table'), 200);
    } else if (type === 'highpay') {
      setSelectedCategory('ALL');
      setSelectedDonut('payroll');
      setPayrollSort({ key: 'total', direction: 'desc' });
      setIsPayrollExpanded(true);
      setTimeout(() => scrollToSection('payroll-table'), 200);
    } else if (type === 'largestchecks') {
      setSelectedCategory('ALL');
      setSelectedDonut('vendor');
      setVendorSort({ key: 'total', direction: 'desc' });
      setIsVendorExpanded(true);
      setTimeout(() => scrollToSection('master-vendor-table'), 200);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TownSealLogo className="w-16 h-16 drop-shadow-md" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Dedham Dollars</h1>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center max-w-md w-full animate-in fade-in zoom-in duration-500 delay-150">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Preparing Dashboard...</h2>
          <p className="text-slate-500">Loading town financial ledgers for lightning-fast analysis.</p>
        </div>
      </div>
    );
  }

  const currentBudget = rawBudget.filter(d => d.fiscalYear === selectedYear && (fundFilter === 'All' || d.fundType === fundFilter));
  const currentPayroll = rawPayroll.filter(d => d.fiscalYear === selectedYear && (fundFilter === 'All' || d.fundType === fundFilter));
  const currentProjects = rawProjects.filter(d => d.fiscalYear === selectedYear && (fundFilter === 'All' || d.fundType === fundFilter));
  const currentCheckbook = rawCheckbook.filter(d => d.fiscalYear === selectedYear && (fundFilter === 'All' || d.fundType === fundFilter));

  const globalSearchLower = globalSearch.toLowerCase();
  
  const searchFilteredBudget = currentBudget.filter(row => {
    if (!globalSearch) return true;
    if (row.description.toLowerCase().includes(globalSearchLower) || row.department.toLowerCase().includes(globalSearchLower)) return true;
    
    const hasMatchingCheck = currentCheckbook.some(c => 
      c.accountCode === row.accountCode && 
      c.department === row.department &&
      (c.vendor.toLowerCase().includes(globalSearchLower) || 
       c.description.toLowerCase().includes(globalSearchLower) ||
       c.checkNumber.toLowerCase().includes(globalSearchLower))
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
    if (row.name.toLowerCase().includes(globalSearchLower) || row.department.toLowerCase().includes(globalSearchLower)) return true;
    
    const matchingCheck = currentCheckbook.find(c => c.department === row.department && c.amount === row.value && c.date === row.date);
    if (matchingCheck && matchingCheck.checkNumber.toLowerCase().includes(globalSearchLower)) return true;

    return false;
  });

  const searchFilteredCheckbook = currentCheckbook.filter(row => {
    if (!globalSearch) return true;
    return row.vendor.toLowerCase().includes(globalSearchLower) || 
           row.description.toLowerCase().includes(globalSearchLower) || 
           row.checkNumber.toLowerCase().includes(globalSearchLower) ||
           row.department.toLowerCase().includes(globalSearchLower);
  });

  const nonPayrollBudget = searchFilteredBudget.filter(d => !d.isPayroll);

  const totalGlobalBudget = nonPayrollBudget.reduce((sum, item) => sum + item.budget, 0);
  const totalGlobalSpend = nonPayrollBudget.reduce((sum, item) => sum + item.spend, 0);
  const spendPercentage = totalGlobalBudget > 0 ? (totalGlobalSpend / totalGlobalBudget) * 100 : 0;
  const spendColor = totalGlobalSpend > totalGlobalBudget ? 'bg-red-500' : 'bg-emerald-500';

  const formatCurrency = (value) => `$${value.toLocaleString()}`;

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
    acc[row.department].value += row.value;
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 10);

  const vendorDonutData = Object.values(searchFilteredCheckbook.reduce((acc, row) => {
    if (!row.vendor || row.vendor === 'Unknown Vendor') return acc;
    if (!acc[row.vendor]) acc[row.vendor] = { name: row.vendor, value: 0 };
    acc[row.vendor].value += row.amount;
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 10);

  const categoryBudgetItems = (selectedCategory && selectedDonut === 'budget') ? (selectedCategory === 'ALL' ? nonPayrollBudget : nonPayrollBudget.filter(r => r.department === selectedCategory)) : [];
  const tableSearchLower = budgetTableSearch.toLowerCase();
  const filteredCategoryItems = categoryBudgetItems.filter(row => !budgetTableSearch || row.description.toLowerCase().includes(tableSearchLower));

  const groupedBudgetTable = Object.values(filteredCategoryItems.reduce((acc, row) => {
    if (!acc[row.description]) acc[row.description] = { description: row.description, accountCode: row.accountCode, budget: 0, spend: 0, fundType: row.fundType };
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

  const categoryPayrollItems = (selectedCategory && selectedDonut === 'payroll') ? (selectedCategory === 'ALL' ? searchFilteredPayroll : searchFilteredPayroll.filter(r => r.department === selectedCategory)) : [];
  const payrollSearchLower = payrollTableSearch.toLowerCase();
  
  const groupedPayrollTable = Object.values(categoryPayrollItems.reduce((acc, row) => {
    const key = `${row.name}-${row.position}`;
    if (!acc[key]) acc[key] = { name: row.name, position: row.position, basePay: 0, overtime: 0, otherPay: 0, total: 0, fundType: row.fundType };
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

  const categoryProjectsItems = (selectedCategory && selectedDonut === 'projects') ? (selectedCategory === 'ALL' ? searchFilteredProjects : searchFilteredProjects.filter(r => r.department === selectedCategory)) : [];
  
  const requestProjectsSort = (key) => setProjectsSort({ key, direction: projectsSort.key === key && projectsSort.direction === 'desc' ? 'asc' : 'desc' });
  const sortedProjectsTable = [...categoryProjectsItems].sort((a, b) => {
    let aVal = a[projectsSort.key]; let bVal = b[projectsSort.key];
    if (typeof aVal === 'string') return projectsSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return projectsSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const projectsPageSize = isProjectsExpanded ? 20 : 6;
  const totalProjectsPages = Math.ceil(sortedProjectsTable.length / projectsPageSize);
  const paginatedProjectsTable = sortedProjectsTable.slice((projectsPage - 1) * projectsPageSize, projectsPage * projectsPageSize);

  const vendorTableSearchLower = vendorTableSearch.toLowerCase();
  const groupedVendorTable = Object.values(searchFilteredCheckbook.reduce((acc, row) => {
    if (!row.vendor || row.vendor === 'Unknown Vendor') return acc;
    if (!acc[row.vendor]) acc[row.vendor] = { name: row.vendor, total: 0, count: 0 };
    acc[row.vendor].total += row.amount;
    acc[row.vendor].count += 1;
    return acc;
  }, {})).filter(row => !vendorTableSearch || row.name.toLowerCase().includes(vendorTableSearchLower));

  const requestVendorSort = (key) => setVendorSort({ key, direction: vendorSort.key === key && vendorSort.direction === 'desc' ? 'asc' : 'desc' });
  const sortedVendorTable = [...groupedVendorTable].sort((a, b) => {
    let aVal = a[vendorSort.key]; let bVal = b[vendorSort.key];
    if (typeof aVal === 'string') return vendorSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return vendorSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const vendorPageSize = isVendorExpanded ? 50 : 15;
  const totalVendorPages = Math.ceil(sortedVendorTable.length / vendorPageSize);
  const paginatedVendorTable = sortedVendorTable.slice((vendorPage - 1) * vendorPageSize, vendorPage * vendorPageSize);

  const activeVendorProfile = selectedVendor ? vendorProfiles.find(v => v.name.toLowerCase() === selectedVendor.name.toLowerCase()) : null;

  let chartData = [];
  if (selectedEmployee) {
    let history = rawPayroll.filter(r => r.name === selectedEmployee.name);
    if (chartTimeRange === '3year') {
      const curr = parseInt(selectedYear);
      const validYears = [curr, curr - 1, curr - 2].map(String);
      history = history.filter(r => validYears.includes(r.fiscalYear));
    } else if (chartTimeRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      history = history.filter(r => {
        if (!r.date) return false;
        const rowDate = new Date(r.date);
        return rowDate >= start && rowDate <= end;
      });
    }
    const grouped = history.reduce((acc, row) => {
      const fy = row.fiscalYear || 'Unknown';
      if (!acc[fy]) acc[fy] = { fiscalYear: fy, value: 0 };
      acc[fy].value += row.total;
      return acc;
    }, {});
    chartData = Object.values(grouped).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
  } else if (selectedVendor) {
    let history = rawCheckbook.filter(r => r.vendor === selectedVendor.name);
    if (chartTimeRange === '3year') {
      const curr = parseInt(selectedYear);
      const validYears = [curr, curr - 1, curr - 2].map(String);
      history = history.filter(r => validYears.includes(r.fiscalYear));
    } else if (chartTimeRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      history = history.filter(r => {
        if (!r.date) return false;
        const rowDate = new Date(r.date);
        return rowDate >= start && rowDate <= end;
      });
    }
    const grouped = history.reduce((acc, row) => {
      const fy = row.fiscalYear || 'Unknown';
      if (!acc[fy]) acc[fy] = { fiscalYear: fy, value: 0 };
      acc[fy].value += row.amount;
      return acc;
    }, {});
    chartData = Object.values(grouped).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
  }

  let accountChecks = [];
  if (selectedAccount && selectedDonut === 'budget') {
    accountChecks = currentCheckbook.filter(c => {
      if (!selectedAccount.spend || selectedAccount.spend === 0) return false;
      if (selectedCategory !== 'ALL' && c.department !== selectedCategory) return false;
      if (selectedAccount.accountCode && c.accountCode && c.accountCode === selectedAccount.accountCode) return true;
      const targetDesc = (selectedAccount.description || '').toLowerCase().trim();
      const checkAccDesc = (c.accountDescription || '').toLowerCase().trim();
      if (!targetDesc) return false;
      if (checkAccDesc === targetDesc) return true;
      return false;
    });
  } else if (selectedVendor && selectedDonut === 'vendor') {
    accountChecks = currentCheckbook.filter(c => c.vendor === selectedVendor.name);
  }

  if (globalSearch) {
    accountChecks = accountChecks.filter(c => 
      c.vendor.toLowerCase().includes(globalSearchLower) ||
      c.description.toLowerCase().includes(globalSearchLower) ||
      c.checkNumber.toLowerCase().includes(globalSearchLower)
    );
  }

  const requestCheckSort = (key) => setCheckSort({ key, direction: checkSort.key === key && checkSort.direction === 'desc' ? 'asc' : 'desc' });
  const sortedCheckTable = [...accountChecks].sort((a, b) => {
    let aVal = a[checkSort.key]; let bVal = b[checkSort.key];
    if (typeof aVal === 'string') return checkSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return checkSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const checkPageSize = isCheckExpanded ? 20 : 6;
  const totalCheckPages = Math.ceil(sortedCheckTable.length / checkPageSize);
  const paginatedCheckTable = sortedCheckTable.slice((checkPage - 1) * checkPageSize, checkPage * checkPageSize);

  let breadcrumbs = [{ id: 'dashboard-top', label: 'Dashboard', hasResults: true }];
  if (selectedDonut === 'budget') {
    breadcrumbs.push({ id: 'budget-table', label: 'Budget & Spend', hasResults: sortedBudgetTable.length > 0 });
    breadcrumbs.push({ id: 'vendor-table', label: 'Vendor Checks', hasResults: selectedAccount && sortedCheckTable.length > 0 });
  } else if (selectedDonut === 'payroll') {
    breadcrumbs.push({ id: 'payroll-table', label: 'Payroll by Category', hasResults: sortedPayrollTable.length > 0 });
    breadcrumbs.push({ id: 'dynamic-chart', label: 'Payroll Detail', hasResults: selectedEmployee && chartData.length > 0 });
  } else if (selectedDonut === 'vendor') {
    breadcrumbs.push({ id: 'master-vendor-table', label: 'Vendor Master List', hasResults: sortedVendorTable.length > 0 });
    breadcrumbs.push({ id: 'dynamic-chart', label: 'Vendor Detail', hasResults: selectedVendor && chartData.length > 0 });
  } else if (selectedDonut === 'projects') {
    breadcrumbs.push({ id: 'projects-table', label: 'Major Expenditures', hasResults: sortedProjectsTable.length > 0 });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 relative" id="dashboard-top">

      {/* MODAL OVERLAYS */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border-t-4 border-blue-500">
            <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <TownSealLogo className="w-8 h-8 drop-shadow-sm" />
              <h2 className="text-xl sm:text-2xl font-bold">About Dedham Dollars</h2>
            </div>
            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
              <p>
                Dedham Dollars is an open-source initiative designed to make municipal finances accessible, readable, and actionable for all taxpayers. 
              </p>
              <p>
                Our goal is to pull the curtain back on the complex ledger codes and sprawling datasets, presenting the town's operations in a clean, interactive dashboard.
              </p>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4">
                <p className="text-blue-800 text-sm font-medium">
                  Developed independently by a local Dedham resident to support transparency and civic engagement.
                </p>
              </div>
            </div>
            <button onClick={() => setShowAboutModal(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors shadow-sm">
              Close
            </button>
          </div>
        </div>
      )}

      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border-t-4 border-amber-500">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <ShieldAlert className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Data Notice & Disclaimer</h2>
            </div>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4">
              This information is sourced directly from Dedham's open data portal APIs. While we apply standard practices to map funds to specific categories and vendor checks, municipal accounting structures are highly complex.
            </p>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6">
              Some checks may be imperfectly linked, categorized to obscure master accounts, or represent internal journal transfers rather than direct cash payouts. Please verify specific inquiries directly with official Town records.
            </p>
            <button onClick={handleDismissDisclaimer} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto w-full p-4 sm:p-6 md:p-8 flex-1">
        <header className="mb-6 relative">
          
          <div className="absolute top-0 right-0 flex items-center gap-4 text-sm font-medium z-10">
            <button onClick={() => setShowAboutModal(true)} className="text-slate-500 hover:text-blue-600 transition-colors">About</button>
            <button onClick={() => setShowDisclaimerModal(true)} className="text-slate-500 hover:text-amber-600 transition-colors">Disclaimer</button>
          </div>

          <div className="flex items-center gap-4 mb-6 pt-2">
            <TownSealLogo className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dedham Dollars</h1>
              <p className="text-slate-500 text-xs sm:text-sm">Making Our Town Finances Easier To Understand</p>
            </div>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">FY {selectedYear} Operating Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700">Approved Budget</span>
                  <span className="font-bold text-blue-600">{formatCurrency(totalGlobalBudget)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 sm:h-4 overflow-hidden border border-slate-200">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700">Funds Spent</span>
                  <span className={`font-bold ${totalGlobalSpend > totalGlobalBudget ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(totalGlobalSpend)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 sm:h-4 overflow-hidden border border-slate-200">
                  <div className={`${spendColor} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(spendPercentage, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-1.5 w-full md:w-auto shrink-0">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1 md:w-40 shrink-0">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <select 
                    value={selectedYear} onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 sm:py-2 appearance-none rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium text-slate-700 cursor-pointer text-sm"
                  >
                    {availableYears.map(year => <option key={year} value={year}>FY {year}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 md:w-44 shrink-0">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <select 
                    value={fundFilter} 
                    onChange={(e) => { 
                      setFundFilter(e.target.value); 
                      setGlobalSearch('');
                      setSelectedDonut(null);
                      setSelectedCategory(null);
                      setSelectedAccount(null);
                      setSelectedEmployee(null);
                      setSelectedVendor(null);
                      setBudgetTableSearch('');
                      setPayrollTableSearch('');
                      setVendorTableSearch('');
                    }}
                    className="w-full pl-9 pr-8 py-2.5 sm:py-2 appearance-none rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium text-slate-700 cursor-pointer text-sm"
                  >
                    <option value="All">All Funds</option>
                    <option value="Local Funds">Local Funds Only</option>
                    <option value="External Funds">External Grants</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 pl-1 font-medium italic">Municipal fiscal years run July 1 to June 30.</span>
            </div>

            <div className="flex flex-col sm:flex-row w-full gap-3">
              <div className="relative flex-1 max-w-5xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={isMobile ? "Search: Name, Vendor, Check #, Description, etc." : "Search by: Name (teacher, officer, staff, vendor), by Category (safety), by Description (street, road), by Check Number, etc."}
                  value={globalSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-sm"
                />
                {globalSearch && (
                  <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" title="Clear Search">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Inline mobile clear button (hidden on desktop) */}
              {(selectedCategory || selectedAccount || selectedEmployee || selectedVendor || globalSearch) && (
                <button onClick={fullyReset} className="xl:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 shadow-sm shrink-0">
                  <FilterX className="w-4 h-4" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-col xl:flex-row gap-6 sm:gap-8">
          
          <div className="xl:hidden w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2 min-w-max">
              {breadcrumbs.map((bc, i) => (
                <React.Fragment key={bc.id}>
                  <button onClick={() => scrollToSection(bc.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${bc.hasResults ? 'bg-white border-slate-200 text-slate-600 shadow-sm' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    {bc.hasResults ? <Check className="w-3 h-3 text-emerald-500" /> : <Minus className="w-3 h-3" />}
                    {bc.label}
                  </button>
                  {i < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="hidden xl:block w-48 shrink-0">
            <div className="sticky top-8">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Navigation</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {breadcrumbs.map((bc) => (
                    <div key={bc.id} className="relative flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection(bc.id)}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white z-10 transition-colors ${bc.hasResults ? 'border-emerald-500 text-emerald-500' : 'border-blue-500 text-blue-500'}`}>
                          {bc.hasResults ? <Check className="w-3 h-3" strokeWidth={3} /> : <Minus className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium transition-colors group-hover:text-blue-600 ${bc.hasResults ? 'text-slate-500' : 'text-blue-600'}`}>
                          {bc.label}
                        </span>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedCategory || selectedAccount || selectedEmployee || selectedVendor || globalSearch) && (
                <button 
                  onClick={fullyReset} 
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all font-bold text-sm active:scale-95"
                >
                  <FilterX className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6 sm:space-y-8 w-full overflow-hidden">

            {!selectedCategory && (
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-xl text-center shadow-inner animate-in fade-in duration-500">
                <p className="text-blue-800 text-sm sm:text-base font-medium">To start your analysis, simply tap a colorful category on any of the charts below.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              
              {/* DONUT 1: BUDGET */}
              <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border transition-all flex-col items-center hover:shadow-md ${selectedDonut === 'budget' ? 'border-blue-400 ring-2 ring-blue-50 flex' : selectedDonut ? 'hidden lg:flex' : 'flex border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Funds Spent</h2>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                    <div className="absolute z-50 w-48 p-3 mt-2 -ml-24 text-xs text-white bg-slate-800 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-xl leading-relaxed">
                      General town operating budget expenses by department, excluding employee payroll.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-4 text-center">(Excluding Payroll)</p>
                <div className="h-44 w-full cursor-pointer touch-pan-y relative pb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={top10Budget} innerRadius="50%" outerRadius="80%" paddingAngle={5} dataKey="spend" onClick={(data) => { setSelectedCategory(data.name); setSelectedDonut('budget'); setSelectedAccount(null); setSelectedEmployee(null); setSelectedVendor(null); setBudgetPage(1); setTimeout(() => scrollToSection('budget-table'), 200); }}>
                        {top10Budget.map((entry, index) => <Cell key={`budget-cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} wrapperStyle={{ pointerEvents: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCategory('ALL'); setSelectedDonut('budget'); setSelectedAccount(null); setSelectedEmployee(null); setSelectedVendor(null); setBudgetPage(1); setTimeout(() => scrollToSection('budget-table'), 200); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors border border-blue-200 shadow-sm">
                      View All Data
                    </button>
                  </div>
                </div>
                <div className="w-full mt-4 flex flex-col gap-2 sm:hidden animate-in fade-in">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">Tap below to explore</p>
                  {top10Budget.slice(0, 5).map((entry, index) => {
                    const isSelected = selectedCategory === entry.name && selectedDonut === 'budget';
                    return (
                      <button 
                        key={`mob-budg-${index}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(entry.name); setSelectedDonut('budget'); setSelectedAccount(null); setSelectedEmployee(null); setSelectedVendor(null); setBudgetPage(1); setTimeout(() => scrollToSection('budget-table'), 200); }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="truncate">{entry.name}</span>
                        </div>
                        <span className="shrink-0">{formatCurrency(entry.spend)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DONUT 2: PAYROLL */}
              <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border transition-all flex-col items-center hover:shadow-md ${selectedDonut === 'payroll' ? 'border-blue-400 ring-2 ring-blue-50 flex' : selectedDonut ? 'hidden lg:flex' : 'flex border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Payroll Spent</h2>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                    <div className="absolute z-50 w-48 p-3 mt-2 -ml-24 text-xs text-white bg-slate-800 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-xl leading-relaxed">
                      Total compensation including base pay, overtime, and other pay for all town employees.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-4 text-center">(Payroll Only)</p>
                <div className="h-44 w-full cursor-pointer touch-pan-y relative pb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payrollDonutData} innerRadius="50%" outerRadius="80%" paddingAngle={5} dataKey="total" onClick={(data) => { setSelectedCategory(data.name); setSelectedDonut('payroll'); setSelectedEmployee(null); setSelectedAccount(null); setSelectedVendor(null); setPayrollPage(1); setTimeout(() => scrollToSection('payroll-table'), 200); }}>
                        {payrollDonutData.map((entry, index) => <Cell key={`payroll-cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} wrapperStyle={{ pointerEvents: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCategory('ALL'); setSelectedDonut('payroll'); setSelectedEmployee(null); setSelectedAccount(null); setSelectedVendor(null); setPayrollPage(1); setTimeout(() => scrollToSection('payroll-table'), 200); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors border border-blue-200 shadow-sm">
                      View All Data
                    </button>
                  </div>
                </div>
                <div className="w-full mt-4 flex flex-col gap-2 sm:hidden animate-in fade-in">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">Tap below to explore</p>
                  {payrollDonutData.slice(0, 5).map((entry, index) => {
                    const isSelected = selectedCategory === entry.name && selectedDonut === 'payroll';
                    return (
                      <button 
                        key={`mob-pay-${index}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(entry.name); setSelectedDonut('payroll'); setSelectedEmployee(null); setSelectedAccount(null); setPayrollPage(1); setTimeout(() => scrollToSection('payroll-table'), 200); }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }}></div>
                          <span className="truncate">{entry.name}</span>
                        </div>
                        <span className="shrink-0">{formatCurrency(entry.total)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DONUT 3: VENDORS */}
              <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border transition-all flex-col items-center hover:shadow-md ${selectedDonut === 'vendor' ? 'border-blue-400 ring-2 ring-blue-50 flex' : selectedDonut ? 'hidden lg:flex' : 'flex border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Funds by Vendor</h2>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                    <div className="absolute z-50 w-48 p-3 mt-2 -ml-32 text-xs text-white bg-slate-800 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-xl leading-relaxed">
                      Total payments issued to external vendors, contractors, and suppliers across all departments.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-4 text-center">(Totals by Vendor)</p>
                <div className="h-44 w-full cursor-pointer touch-pan-y relative pb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={vendorDonutData} innerRadius="50%" outerRadius="80%" paddingAngle={5} dataKey="value" onClick={(data) => { setSelectedCategory('ALL'); setSelectedDonut('vendor'); setSelectedVendor({ name: data.name }); setSelectedAccount(null); setSelectedEmployee(null); setVendorPage(1); setTimeout(() => scrollToSection('dynamic-chart'), 200); }}>
                        {vendorDonutData.map((entry, index) => <Cell key={`vendor-cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} wrapperStyle={{ pointerEvents: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCategory('ALL'); setSelectedDonut('vendor'); setSelectedVendor(null); setSelectedAccount(null); setSelectedEmployee(null); setVendorPage(1); setTimeout(() => scrollToSection('master-vendor-table'), 200); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors border border-blue-200 shadow-sm">
                      View All Data
                    </button>
                  </div>
                </div>
                <div className="w-full mt-4 flex flex-col gap-2 sm:hidden animate-in fade-in">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">Tap below to explore</p>
                  {vendorDonutData.slice(0, 5).map((entry, index) => {
                    const isSelected = selectedCategory === 'ALL' && selectedDonut === 'vendor' && selectedVendor?.name === entry.name;
                    return (
                      <button 
                        key={`mob-vendor-${index}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory('ALL'); setSelectedDonut('vendor'); setSelectedVendor({ name: entry.name }); setSelectedAccount(null); setSelectedEmployee(null); setVendorPage(1); setTimeout(() => scrollToSection('dynamic-chart'), 200); }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></div>
                          <span className="truncate">{entry.name}</span>
                        </div>
                        <span className="shrink-0">{formatCurrency(entry.value)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DONUT 4: PROJECTS */}
              <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border transition-all flex-col items-center hover:shadow-md ${selectedDonut === 'projects' ? 'border-blue-400 ring-2 ring-blue-50 flex' : selectedDonut ? 'hidden lg:flex' : 'flex border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Major Expenditures</h2>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                    <div className="absolute z-50 w-48 p-3 mt-2 -ml-24 text-xs text-white bg-slate-800 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-xl leading-relaxed">
                      Individual large capital projects and special expenditures over $25,000 from the town's project ledger.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-4 text-center">(Over $25,000)</p>
                <div className="h-44 w-full cursor-pointer touch-pan-y relative pb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={projectsDonutData} innerRadius="50%" outerRadius="80%" paddingAngle={5} dataKey="value" onClick={(data) => { setSelectedCategory(data.name); setSelectedDonut('projects'); setSelectedAccount(null); setSelectedEmployee(null); setSelectedVendor(null); setProjectsPage(1); setTimeout(() => scrollToSection('projects-table'), 200); }}>
                        {projectsDonutData.map((entry, index) => <Cell key={`project-cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={formatCurrency} wrapperStyle={{ pointerEvents: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCategory('ALL'); setSelectedDonut('projects'); setSelectedAccount(null); setSelectedEmployee(null); setSelectedVendor(null); setProjectsPage(1); setTimeout(() => scrollToSection('projects-table'), 200); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors border border-blue-200 shadow-sm">
                      View All Data
                    </button>
                  </div>
                </div>
                <div className="w-full mt-4 flex flex-col gap-2 sm:hidden animate-in fade-in opacity-80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">Tap below to explore</p>
                  {projectsDonutData.slice(0, 5).map((entry, index) => {
                    const isSelected = selectedCategory === entry.name && selectedDonut === 'projects';
                    return (
                      <button 
                        key={`mob-proj-${index}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(entry.name); setSelectedDonut('projects'); setSelectedAccount(null); setSelectedEmployee(null); setProjectsPage(1); setTimeout(() => scrollToSection('projects-table'), 200); }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}></div>
                          <span className="truncate">{entry.name}</span>
                        </div>
                        <span className="shrink-0">{formatCurrency(entry.value)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Quick Insights Dashboard (Always visible) */}
            <div className="bg-slate-800 text-white rounded-2xl shadow-lg border border-slate-700 overflow-hidden mt-6 transition-all duration-300">
              <div 
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-750"
                onClick={() => setShowInsights(!showInsights)}
              >
                <div className="flex items-center gap-3">
                  <Zap className={`w-5 h-5 ${showInsights ? 'text-amber-400' : 'text-slate-400'} transition-colors`} />
                  <div>
                    <h3 className="font-bold text-slate-100">Discrepancy & Quick Insights</h3>
                    <p className="text-xs text-slate-400">One-click analysis for budget overages, under-spends, and high payroll.</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showInsights ? 'rotate-180' : ''}`} />
              </div>
              
              {showInsights && (
                <div className="p-4 sm:p-5 border-t border-slate-700 bg-slate-900/50 grid grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-4">
                  <button onClick={() => triggerInsight('overbudget')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors gap-2 text-center group">
                    <TrendingDown className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Most Over-Budget</span>
                    <span className="text-xs text-slate-400 hidden sm:block">Highest % over spend</span>
                  </button>
                  <button onClick={() => triggerInsight('underbudget')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors gap-2 text-center group">
                    <TrendingUp className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Most Under-Budget</span>
                    <span className="text-xs text-slate-400 hidden sm:block">Lowest % of spend</span>
                  </button>
                  <button onClick={() => triggerInsight('overtime')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors gap-2 text-center group">
                    <DollarSign className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Top Overtime</span>
                    <span className="text-xs text-slate-400 hidden sm:block">Highest overtime paid</span>
                  </button>
                  <button onClick={() => triggerInsight('highpay')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors gap-2 text-center group">
                    <DollarSign className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Highest Paid Staff</span>
                    <span className="text-xs text-slate-400 hidden sm:block">Total compensation</span>
                  </button>
                  <button onClick={() => triggerInsight('largestchecks')} className="col-span-2 lg:col-span-1 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors gap-2 text-center group">
                    <Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Largest Vendors</span>
                    <span className="text-xs text-slate-400 hidden sm:block">Absolute highest paid</span>
                  </button>
                </div>
              )}
            </div>

            {selectedCategory && (
              <div className="bg-blue-600 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-blue-700 animate-in fade-in duration-300">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {selectedCategory === 'ALL' 
                    ? (selectedDonut === 'budget' ? 'Entire Town Ledger: Operating Budget' : selectedDonut === 'payroll' ? 'Entire Town Ledger: Payroll' : selectedDonut === 'vendor' ? 'Entire Town Ledger: Vendor Checks' : 'Entire Town Ledger: Major Expenditures')
                    : (selectedDonut === 'budget' ? `Funds Spent: ${selectedCategory}` : selectedDonut === 'payroll' ? `Payroll Compensation: ${selectedCategory}` : `Major Expenditures: ${selectedCategory}`)
                  }
                </h2>
              </div>
            )}

            {/* BUDGET TABLE */}
            {(selectedCategory && selectedDonut === 'budget') && (
              <div id="budget-table" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className={`flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 flex`}>
                  <div className="flex items-center gap-3">
                    <Table2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 shrink-0" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">Budget and Spend</h3>
                      <p className="text-xs sm:text-sm text-slate-500">Click a row to view vendor checks (if available).</p>
                    </div>
                  </div>
                  
                  {!selectedAccount && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input 
                          type="text" placeholder="Filter table..." value={budgetTableSearch}
                          onChange={(e) => { setBudgetTableSearch(e.target.value); setBudgetPage(1); }}
                          className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button onClick={() => setIsBudgetExpanded(!isBudgetExpanded)} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        {isBudgetExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse</> : <><Maximize2 className="w-4 h-4"/> Expand</>}
                      </button>
                    </div>
                  )}
                </div>
                
                {sortedBudgetTable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No ledgers found.</div>
                ) : (
                  <>
                    <div className={`overflow-x-auto w-full border border-slate-200 rounded-xl shadow-inner transition-all duration-300 ${isBudgetExpanded ? 'max-h-[600px]' : 'max-h-[400px]'}`}>
                      <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestBudgetSort('description')}><div className="flex items-center gap-1">Expense Description <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestBudgetSort('fundType')}><div className="flex items-center gap-1">Source <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestBudgetSort('budget')}><div className="flex items-center justify-end gap-1">Budgeted <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestBudgetSort('spend')}><div className="flex items-center justify-end gap-1">Spent <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedBudgetTable.map((row, idx) => {
                            const pct = row.budget > 0 ? ((row.spend / row.budget) * 100).toFixed(1) : 0;
                            const isSelected = selectedAccount?.description === row.description;
                            const isHidden = selectedAccount && !isSelected;
                            
                            return (
                              <tr key={`budget-row-${idx}`} onClick={() => { setSelectedAccount(isSelected ? null : row); setCheckPage(1); }} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'} ${isHidden ? 'hidden' : ''}`}>
                                <td className="px-4 py-4 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    {row.description}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md whitespace-nowrap ${row.fundType === 'Local Funds' ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>{row.fundType}</span>
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-slate-500">${row.budget.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex flex-col items-end gap-1.5">
                                    <span className="font-mono font-medium text-slate-800">${row.spend.toLocaleString()}</span>
                                    <div className="flex items-center gap-2 w-28">
                                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${pct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                      </div>
                                      <span className={`text-[10px] font-bold w-9 text-right ${pct > 100 ? 'text-red-600' : 'text-slate-500'}`}>{pct}%</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          
                          {selectedAccount && (
                            <tr className="bg-blue-50/50 border-t border-blue-200 animate-in fade-in">
                              <td colSpan="4" className="p-0">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedAccount(null); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
                                  <X className="w-4 h-4"/> Return to {selectedCategory === 'ALL' ? 'All Data' : selectedCategory} List
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className={`flex-col sm:flex-row justify-between items-center gap-3 mt-4 ${selectedAccount ? 'hidden' : 'flex'}`}>
                      <span className="text-xs sm:text-sm text-slate-500">Showing {paginatedBudgetTable.length} of {sortedBudgetTable.length} entries</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBudgetPage(p => Math.max(1, p - 1))} disabled={budgetPage === 1} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">Page {budgetPage} of {totalBudgetPages || 1}</span>
                        <button onClick={() => setBudgetPage(p => Math.min(totalBudgetPages, p + 1))} disabled={budgetPage === totalBudgetPages || totalBudgetPages === 0} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PAYROLL TABLE */}
            {(selectedCategory && selectedDonut === 'payroll') && (
              <div id="payroll-table" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className={`flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 flex`}>
                  <div className="flex items-center gap-3">
                    <Table2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 shrink-0" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">Employee Compensation</h3>
                      <p className="text-xs sm:text-sm text-slate-500">Click any employee to view their pay history.</p>
                    </div>
                  </div>
                  
                  {!selectedEmployee && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input 
                          type="text" placeholder="Filter table..." value={payrollTableSearch}
                          onChange={(e) => { setPayrollTableSearch(e.target.value); setPayrollPage(1); }}
                          className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button onClick={() => setIsPayrollExpanded(!isPayrollExpanded)} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                        {isPayrollExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse</> : <><Maximize2 className="w-4 h-4"/> Expand</>}
                      </button>
                    </div>
                  )}
                </div>
                
                {sortedPayrollTable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No payroll records found.</div>
                ) : (
                  <>
                    <div className={`overflow-x-auto w-full border border-slate-200 rounded-xl shadow-inner transition-all duration-300 ${isPayrollExpanded ? 'max-h-[800px]' : 'max-h-[440px]'}`}>
                      <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestPayrollSort('name')}><div className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestPayrollSort('position')}><div className="flex items-center gap-1">Job Title <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestPayrollSort('fundType')}><div className="flex items-center gap-1">Source <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestPayrollSort('basePay')}><div className="flex items-center justify-end gap-1">Base Pay <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestPayrollSort('overtime')}><div className="flex items-center justify-end gap-1">Overtime <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestPayrollSort('total')}><div className="flex items-center justify-end gap-1">Total Comp. <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedPayrollTable.map((row, idx) => {
                            const isSelected = selectedEmployee?.name === row.name;
                            const isHidden = selectedEmployee && !isSelected;
                            
                            return (
                              <tr key={`payroll-row-${idx}`} onClick={() => setSelectedEmployee(isSelected ? null : row)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'} ${isHidden ? 'hidden' : ''}`}>
                                <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                                <td className="px-4 py-3 text-slate-600">{row.position}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md whitespace-nowrap ${row.fundType === 'Local Funds' ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>{row.fundType}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600">${row.basePay.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600">${row.overtime.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">${row.total.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                          
                          {selectedEmployee && (
                            <tr className="bg-indigo-50/50 border-t border-indigo-200 animate-in fade-in">
                              <td colSpan="6" className="p-0">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedEmployee(null); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors">
                                  <X className="w-4 h-4"/> Return to {selectedCategory === 'ALL' ? 'All Employees' : selectedCategory} List
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className={`flex-col sm:flex-row justify-between items-center gap-3 mt-4 ${selectedEmployee ? 'hidden' : 'flex'}`}>
                      <span className="text-xs sm:text-sm text-slate-500">Showing {paginatedPayrollTable.length} of {sortedPayrollTable.length} employees</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPayrollPage(p => Math.max(1, p - 1))} disabled={payrollPage === 1} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">Page {payrollPage} of {totalPayrollPages || 1}</span>
                        <button onClick={() => setPayrollPage(p => Math.min(totalPayrollPages, p + 1))} disabled={payrollPage === totalPayrollPages || totalPayrollPages === 0} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* MASTER VENDOR LIST */}
            {(selectedCategory && selectedDonut === 'vendor') && (
              <div id="master-vendor-table" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className={`flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 flex`}>
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 shrink-0" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">Master Vendor List</h3>
                      <p className="text-xs sm:text-sm text-slate-500">Click any vendor to view historical charts and check details.</p>
                    </div>
                  </div>
                  
                  {!selectedVendor && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input 
                          type="text" placeholder="Filter vendors..." value={vendorTableSearch}
                          onChange={(e) => { setVendorTableSearch(e.target.value); setVendorPage(1); }}
                          className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button onClick={() => setIsVendorExpanded(!isVendorExpanded)} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                        {isVendorExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse</> : <><Maximize2 className="w-4 h-4"/> Expand</>}
                      </button>
                    </div>
                  )}
                </div>
                
                {sortedVendorTable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No vendor records found.</div>
                ) : (
                  <>
                    <div className={`overflow-x-auto w-full border border-slate-200 rounded-xl shadow-inner transition-all duration-300 ${isVendorExpanded ? 'max-h-[800px]' : 'max-h-[440px]'}`}>
                      <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestVendorSort('name')}><div className="flex items-center gap-1">Vendor Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestVendorSort('count')}><div className="flex items-center justify-end gap-1">Total Checks <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestVendorSort('total')}><div className="flex items-center justify-end gap-1">Total Spend <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedVendorTable.map((row, idx) => {
                            const isSelected = selectedVendor?.name === row.name;
                            const isHidden = selectedVendor && !isSelected;
                            
                            return (
                              <tr key={`vendor-row-${idx}`} onClick={() => setSelectedVendor(isSelected ? null : row)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'} ${isHidden ? 'hidden' : ''}`}>
                                <td className="px-4 py-4 font-bold text-slate-800">{row.name}</td>
                                <td className="px-4 py-4 text-right font-mono text-slate-600">{row.count}</td>
                                <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">${row.total.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                          
                          {selectedVendor && (
                            <tr className="bg-blue-50/50 border-t border-blue-200 animate-in fade-in">
                              <td colSpan="3" className="p-0">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedVendor(null); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
                                  <X className="w-4 h-4"/> Return to All Vendors List
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className={`flex-col sm:flex-row justify-between items-center gap-3 mt-4 ${selectedVendor ? 'hidden' : 'flex'}`}>
                      <span className="text-xs sm:text-sm text-slate-500">Showing {paginatedVendorTable.length} of {sortedVendorTable.length} vendors</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setVendorPage(p => Math.max(1, p - 1))} disabled={vendorPage === 1} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">Page {vendorPage} of {totalVendorPages || 1}</span>
                        <button onClick={() => setVendorPage(p => Math.min(totalVendorPages, p + 1))} disabled={vendorPage === totalVendorPages || totalVendorPages === 0} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PROJECTS TABLE */}
            {(selectedCategory && selectedDonut === 'projects') && (
              <div id="projects-table" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className={`flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 flex`}>
                  <div className="flex items-center gap-3">
                    <Table2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 shrink-0" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">Major Expenditures</h3>
                      <p className="text-xs sm:text-sm text-slate-500">Individual ledger expenditures exceeding $25,000.</p>
                    </div>
                  </div>
                  
                  {!selectedAccount && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button onClick={() => setIsProjectsExpanded(!isProjectsExpanded)} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        {isProjectsExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse</> : <><Maximize2 className="w-4 h-4"/> Expand</>}
                      </button>
                    </div>
                  )}
                </div>
                
                {sortedProjectsTable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No major expenditures found.</div>
                ) : (
                  <>
                    <div className={`overflow-x-auto w-full border border-slate-200 rounded-xl shadow-inner transition-all duration-300 ${isProjectsExpanded ? 'max-h-[600px]' : 'max-h-[400px]'}`}>
                      <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestProjectsSort('name')}><div className="flex items-center gap-1">Project Description <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestProjectsSort('department')}><div className="flex items-center gap-1">Department <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => requestProjectsSort('fundType')}><div className="flex items-center gap-1">Source <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 text-right" onClick={() => requestProjectsSort('value')}><div className="flex items-center justify-end gap-1">Expenditure Amount <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedProjectsTable.map((row, idx) => {
                            return (
                              <tr key={`project-row-${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4 font-medium text-slate-800">
                                  <div className="flex flex-col">
                                    <span>{row.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-slate-600">{row.department}</td>
                                <td className="px-4 py-4">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md whitespace-nowrap ${row.fundType === 'Local Funds' ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>{row.fundType}</span>
                                </td>
                                <td className="px-4 py-4 text-right font-mono font-medium text-slate-800">${row.value.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex-col sm:flex-row justify-between items-center gap-3 mt-4 flex">
                      <span className="text-xs sm:text-sm text-slate-500">Showing {paginatedProjectsTable.length} of {sortedProjectsTable.length} entries</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setProjectsPage(p => Math.max(1, p - 1))} disabled={projectsPage === 1} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">Page {projectsPage} of {totalProjectsPages || 1}</span>
                        <button onClick={() => setProjectsPage(p => Math.min(totalProjectsPages, p + 1))} disabled={projectsPage === totalProjectsPages || totalProjectsPages === 0} className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* DYNAMIC CHART AND VENDOR PROFILE (Supports both Employee and Vendor) */}
            {(selectedEmployee || selectedVendor) && (
              <div id="dynamic-chart" className="flex flex-col gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* VENDOR PROFILE CARD */}
                {selectedVendor && activeVendorProfile && (
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                           <Store className="w-5 h-5" />
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-slate-800">{activeVendorProfile.name}</h3>
                           <div className="flex flex-wrap gap-2 mt-1">
                             {activeVendorProfile.city.toLowerCase() === 'dedham' && (
                               <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Local Business</span>
                             )}
                             {activeVendorProfile.isWMBE && (
                               <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><BadgeCheck className="w-3 h-3"/> WMBE Certified</span>
                             )}
                           </div>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                         {activeVendorProfile.city && (
                           <div className="flex items-start gap-2 text-sm text-slate-600">
                             <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                             <span>{activeVendorProfile.address}<br/>{activeVendorProfile.city}, {activeVendorProfile.state} {activeVendorProfile.zip}</span>
                           </div>
                         )}
                         {activeVendorProfile.phone && (
                           <div className="flex items-center gap-2 text-sm text-slate-600">
                             <PhoneCall className="w-4 h-4 text-slate-400 shrink-0" />
                             <span>{activeVendorProfile.phone}</span>
                           </div>
                         )}
                         {activeVendorProfile.website && (
                           <div className="flex items-center gap-2 text-sm text-blue-600">
                             <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                             <a href={activeVendorProfile.website.startsWith('http') ? activeVendorProfile.website : `https://${activeVendorProfile.website}`} target="_blank" rel="noreferrer" className="hover:underline truncate">{activeVendorProfile.website}</a>
                           </div>
                         )}
                         {activeVendorProfile.contactName && (
                           <div className="flex items-center gap-2 text-sm text-slate-600">
                             <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                             <span>{activeVendorProfile.contactName} {activeVendorProfile.contactEmail && `(${activeVendorProfile.contactEmail})`}</span>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${selectedEmployee ? 'text-indigo-400' : 'text-blue-400'}`} />
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {selectedEmployee ? `Pay History: ${selectedEmployee.name}` : `Spend History: ${selectedVendor.name}`}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400">
                          {selectedEmployee ? selectedEmployee.position : 'Historical aggregated check data'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm bg-slate-900 p-1 rounded-lg border border-slate-700">
                      <button onClick={() => setChartTimeRange('3year')} className={`px-2 sm:px-3 py-1.5 rounded-md font-medium transition-colors ${chartTimeRange === '3year' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>3 Year Trend</button>
                      <button onClick={() => setChartTimeRange('allTime')} className={`px-2 sm:px-3 py-1.5 rounded-md font-medium transition-colors ${chartTimeRange === 'allTime' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>All Time</button>
                      <button onClick={() => setChartTimeRange('custom')} className={`px-2 sm:px-3 py-1.5 rounded-md font-medium transition-colors ${chartTimeRange === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Custom Range</button>
                    </div>
                  </div>

                  {chartTimeRange === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 w-full">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-300 text-sm font-medium">Start:</span>
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="w-full sm:w-auto bg-slate-800 border border-slate-600 text-white text-sm rounded-md px-2 py-1.5 sm:py-1 focus:ring-blue-500" />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-300 text-sm font-medium">End:</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="w-full sm:w-auto bg-slate-800 border border-slate-600 text-white text-sm rounded-md px-2 py-1.5 sm:py-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                  
                  {chartData.length === 0 ? (
                    <div className="text-center py-10 px-6 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50">
                      <p className="text-slate-300 font-medium mb-2">No historical data found.</p>
                    </div>
                  ) : (
                    <div className="h-64 sm:h-72 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="fiscalYear" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                          <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => `$${(val/1000)}k`} />
                          <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }} formatter={(value) => [`$${value.toLocaleString()}`, selectedEmployee ? 'Total Comp' : 'Total Spend']} labelStyle={{ color: '#94a3b8', marginBottom: '4px' }} labelFormatter={(label) => `FY: ${label}`} wrapperStyle={{ pointerEvents: 'none' }} />
                          <Bar dataKey="value" fill={selectedEmployee ? "#818cf8" : "#38bdf8"} radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VENDOR CHECKS TABLE (Supports both Budget & Vendor drilldowns) */}
            {((selectedAccount && selectedDonut === 'budget') || (selectedVendor && selectedDonut === 'vendor')) && (() => {
              return (
              <div id="vendor-table" className="bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-700 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <Table2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 shrink-0" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {selectedDonut === 'vendor' ? 'Individual Checks' : 'Vendor Checks'}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[250px] sm:max-w-md">
                        {selectedDonut === 'vendor' ? selectedVendor.name : selectedAccount.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsCheckExpanded(!isCheckExpanded)} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300">
                      {isCheckExpanded ? <><Minimize2 className="w-4 h-4"/> Collapse</> : <><Maximize2 className="w-4 h-4"/> Expand</>}
                    </button>
                  </div>
                </div>
                
                {selectedDonut === 'vendor' && (
                  <div className="mb-6 bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Detailed vendor contact information is fully displayed in the profile card above. Additional financial routing data has been redacted from the public Socrata open data portal for security purposes.
                    </p>
                  </div>
                )}

                {sortedCheckTable.length === 0 ? (
                  <div className="text-center py-8 px-4 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50">
                    <p className="text-slate-300 text-sm sm:text-base font-medium mb-2">No vendor checks linked to this item.</p>
                    <p className="text-slate-500 text-xs sm:text-sm">The spent amount may represent internal journal entries or centralized master accounts.</p>
                  </div>
                ) : (
                  <>
                    <div className={`overflow-x-auto w-full border border-slate-700 rounded-xl bg-slate-900 transition-all duration-300 ${isCheckExpanded ? 'max-h-[600px]' : 'max-h-[400px]'}`}>
                      <table className="w-full text-sm text-left text-slate-300 min-w-[650px]">
                        <thead className="bg-slate-800 sticky top-0 border-b border-slate-700 shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer" onClick={() => requestCheckSort('date')}><div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer" onClick={() => requestCheckSort('vendor')}><div className="flex items-center gap-1">Vendor <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer" onClick={() => requestCheckSort('description')}><div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer" onClick={() => requestCheckSort('checkNumber')}><div className="flex items-center gap-1">Check # <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                            <th className="px-4 py-3 font-semibold text-slate-200 cursor-pointer text-right" onClick={() => requestCheckSort('amount')}><div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="w-3 h-3 text-slate-500" /></div></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {paginatedCheckTable.map((check) => (
                            <tr key={check.id} className="hover:bg-slate-800 transition-colors">
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{check.date}</td>
                              
                              {/* VENDOR HOVER CARD */}
                              <td className="px-4 py-3 font-medium text-white group">
                                <div className="relative inline-block">
                                  <span className="cursor-help border-b border-dashed border-slate-500 hover:text-blue-300 transition-colors truncate max-w-[150px] sm:max-w-[200px]" title={check.vendor}>{check.vendor}</span>
                                  {(() => {
                                    const vp = vendorProfiles.find(v => v.name.toLowerCase() === check.vendor.toLowerCase());
                                    if (!vp) return null;
                                    return (
                                      <div className="absolute z-[100] left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all flex flex-col gap-2 scale-95 group-hover:scale-100 origin-bottom">
                                        <div className="flex items-start gap-2 border-b border-slate-700 pb-2">
                                          <Store className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                          <span className="font-bold text-sm text-slate-100 leading-tight whitespace-normal">{vp.name}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 whitespace-normal">
                                          {vp.city ? (
                                            <span className="text-[11px] text-slate-300 flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0"/> {vp.address} {vp.city}, {vp.state} {vp.zip}</span>
                                          ) : (
                                            <span className="text-[11px] text-slate-500 italic">No address on file</span>
                                          )}
                                          {vp.phone && <span className="text-[11px] text-slate-300 flex items-center gap-1.5"><PhoneCall className="w-3 h-3 shrink-0"/> {vp.phone}</span>}
                                          {vp.contactName && <span className="text-[11px] text-slate-300 flex items-center gap-1.5"><UserCircle className="w-3 h-3 shrink-0"/> {vp.contactName} {vp.contactEmail && `(${vp.contactEmail})`}</span>}
                                        </div>
                                        {(vp.city.toLowerCase() === 'dedham' || vp.isWMBE) && (
                                          <div className="flex flex-wrap gap-1 mt-1 pt-2 border-t border-slate-700">
                                            {vp.city.toLowerCase() === 'dedham' && <span className="bg-emerald-900/50 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1"><MapPin className="w-2.5 h-2.5"/> Local</span>}
                                            {vp.isWMBE && <span className="bg-purple-900/50 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-800 flex items-center gap-1"><BadgeCheck className="w-2.5 h-2.5"/> WMBE</span>}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]" title={check.description}>{check.description}</td>
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{check.checkNumber}</td>
                              <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">${check.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                      <span className="text-xs sm:text-sm text-slate-400">Showing {paginatedCheckTable.length} of {sortedCheckTable.length} entries</span>
                      <div className="flex items-center gap-2 text-slate-300">
                        <button onClick={() => setCheckPage(p => Math.max(1, p - 1))} disabled={checkPage === 1} className="p-1 sm:p-2 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        <span className="text-xs sm:text-sm font-medium">Page {checkPage} of {totalCheckPages || 1}</span>
                        <button onClick={() => setCheckPage(p => Math.min(totalCheckPages, p + 1))} disabled={checkPage === totalCheckPages || totalCheckPages === 0} className="p-1 sm:p-2 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
            })()}
          </div>
        </div>
      </div>
      
      {/* GLOBAL FOOTER */}
      <footer className="mt-12 pt-8 pb-12 border-t border-slate-200 w-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500">
          <div className="text-center md:text-left space-y-1.5">
            <p className="font-medium text-slate-600">&copy; {new Date().getFullYear()} Dedham Dollars. An independent civic tech initiative.</p>
            <p>Not an official application of the <a href="https://www.dedham-ma.gov" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">Town of Dedham</a>.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-medium">
            <a href="https://dedhamma.data.socrata.com/" target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">Data Source (Socrata)</a>
            <button onClick={() => setShowAboutModal(true)} className="hover:text-slate-800 transition-colors">About & Credits</button>
            <button onClick={() => setShowDisclaimerModal(true)} className="hover:text-slate-800 transition-colors">Disclaimer & Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}