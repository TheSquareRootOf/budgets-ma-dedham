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

export const fetchVendorProfiles = async () => {
  try {
    const res = await fetch('/data/vendors.json');
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching vendor profiles:", error);
    return [];
  }
};