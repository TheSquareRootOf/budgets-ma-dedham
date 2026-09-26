export async function fetchOperatingBudget() {
  const res = await fetch('/data/budget.json');
  return res.ok ? await res.json() : [];
}

export async function fetchPayrollData() {
  const res = await fetch('/data/payroll.json');
  return res.ok ? await res.json() : [];
}

export async function fetchCapitalProjects() {
  const res = await fetch('/data/projects.json');
  return res.ok ? await res.json() : [];
}

export async function fetchVendorCheckbook() {
  const res = await fetch('/data/checkbook.json');
  return res.ok ? await res.json() : [];
}