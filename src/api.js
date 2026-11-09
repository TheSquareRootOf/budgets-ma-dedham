export const fetchOperatingBudget = async () => {
  try {
    const res = await fetch('/data/budget.json');
    return res.ok ? await res.json() : [];
  } catch (err) { return []; }
};

export const fetchPayrollData = async () => {
  try {
    const parts = await Promise.all([1, 2, 3, 4].map(i => 
      fetch(`/data/payroll-${i}.json`).then(r => r.ok ? r.json() : [])
    ));
    return parts.flat();
  } catch (err) { return []; }
};

export const fetchCapitalProjects = async () => {
  try {
    const res = await fetch('/data/projects.json');
    return res.ok ? await res.json() : [];
  } catch (err) { return []; }
};

export const fetchVendorCheckbook = async () => {
  try {
    const parts = await Promise.all([1, 2, 3, 4].map(i => 
      fetch(`/data/checkbook-${i}.json`).then(r => r.ok ? r.json() : [])
    ));
    return parts.flat();
  } catch (err) { return []; }
};

export const fetchVendorProfiles = async () => {
  try {
    const res = await fetch('/data/vendors.json');
    return res.ok ? await res.json() : [];
  } catch (err) { return []; }
};