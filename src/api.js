export async function fetchOperatingBudget() {
  return [
    { name: 'Education', budget: 53500000, spend: 52100000 },
    { name: 'Public Safety', budget: 14200000, spend: 13900000 },
    { name: 'Public Works', budget: 8500000, spend: 8100000 },
    { name: 'General Government', budget: 6100000, spend: 5800000 },
    { name: 'Human Services', budget: 1800000, spend: 1750000 }
  ];
}

export async function fetchPayrollData() {
  return [
    { department: 'Education', basePay: 35000000, overtime: 150000, total: 35150000 },
    { department: 'Police', basePay: 4500000, overtime: 850000, total: 5350000 },
    { department: 'Fire', basePay: 4100000, overtime: 920000, total: 5020000 },
    { department: 'Public Works', basePay: 2800000, overtime: 350000, total: 3150000 }
  ];
}

export async function fetchCapitalProjects() {
  return [
    { id: 'PROJ-001', name: 'High School Roof', department: 'Education', originalBudget: 40000 },
    { id: 'PROJ-002', name: 'Sidewalk Flowers', department: 'Public Works', originalBudget: 25000 },
    { id: 'PROJ-003', name: 'Road Marking Paint', department: 'Public Works', originalBudget: 50000 }
  ];
}

export async function fetchVendorCheckbook() {
  return [
    { id: 'CHK-01', vendor: 'Smith Roofing Co.', amount: 25000, department: 'Education', description: 'Roofing Materials' },
    { id: 'CHK-02', vendor: 'Smith Roofing Co.', amount: 10000, department: 'Education', description: 'Labor Install Phase 1' },
    { id: 'CHK-03', vendor: 'Smith Roofing Co.', amount: 45000, department: 'Education', description: 'Labor Install Phase 2 (Overrun)' },
    { id: 'CHK-04', vendor: 'Town Florist', amount: 15000, department: 'Public Works', description: 'Spring Bulbs' },
    { id: 'CHK-05', vendor: 'XYZ Paving', amount: 5000, department: 'Public Works', description: 'Yellow Paint' }
  ];
}