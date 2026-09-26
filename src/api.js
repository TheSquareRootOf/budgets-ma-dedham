const SOCRATA_DOMAIN = 'dedhamma.data.socrata.com'; 

const DATASETS = {
  budget: 'dnxw-cwsb',      
  payroll: 'bhma-x87a',     
  projects: 'yd4k-4rzp',    
  checkbook: 'yd4k-4rzp'    
};

function categorizeDepartment(rawName) {
  const name = (rawName || '').toLowerCase();
  
  if (name.includes('school') || name.includes('education') || name.includes('sped') || name.includes('oakdale') || name.includes('avery') || name.includes('greenlodge') || name.includes('riverdale') || name.includes('ecec') || name.includes('dhs') || name.includes('dms') || name.includes('elementary') || name.includes('early childhood')) return 'Education';
  if (name.includes('police') || name.includes('fire') || name.includes('safety') || name.includes('dispatch') || name.includes('animal')) return 'Public Safety';
  if (name.includes('dpw') || name.includes('works') || name.includes('snow') || name.includes('highway') || name.includes('cemetery') || name.includes('engineering') || name.includes('sewer') || name.includes('street') || name.includes('facilities')) return 'Public Works';
  if (name.includes('library') || name.includes('rec') || name.includes('park')) return 'Culture & Recreation';
  if (name.includes('health') || name.includes('aging') || name.includes('veteran') || name.includes('human') || name.includes('youth')) return 'Human Services';
  if (name.includes('retire') || name.includes('benefit') || name.includes('insurance') || name.includes('medicare') || name.includes('empben')) return 'Benefits & Insurance';
  if (name.includes('debt') || name.includes('borrow') || name.includes('interest')) return 'Debt Service';
  
  return 'General Government'; 
}

export async function fetchOperatingBudget() {
  try {
    const response = await fetch(`https://${SOCRATA_DOMAIN}/resource/${DATASETS.budget}.json?$limit=50000&$order=fiscalyear DESC`);
    const rawData = await response.json();
    
    return rawData.map((row, index) => {
      const charDesc = (row.charactercodedescription || '').toLowerCase();
      const desc = (row.accountdescription || row.description || row.object || '').toLowerCase();
      const isPayroll = charDesc.includes('personal services') || desc.includes('salary') || desc.includes('wages') || desc.includes('payroll');

      return {
        id: row.uniqueid || `budg-${index}`,
        fiscalYear: row.fiscalyear || '2027',
        department: categorizeDepartment(row.department || row.organization || row.functiongroup),
        description: row.accountdescription || row.description || row.object || 'Uncategorized Expense',
        accountCode: row.objectcode || row.accountid || '', 
        budget: parseFloat(row.originalbudget || 0),
        spend: parseFloat(row.actual || 0),
        isPayroll
      };
    });
  } catch (error) {
    return [];
  }
}

export async function fetchPayrollData() {
  try {
    const limit = 50000;
    const offsets = [0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000];
    
    const fetchPromises = offsets.map(offset => 
      fetch(`https://${SOCRATA_DOMAIN}/resource/${DATASETS.payroll}.json?$limit=${limit}&$offset=${offset}&$order=fiscalyear DESC`)
        .then(res => res.json())
    );
    
    const results = await Promise.all(fetchPromises);
    const rawData = results.flat(); 
    
    return rawData.map((row, index) => ({
      id: row.uniqueid || `pay-${index}`,
      fiscalYear: row.fiscalyear || '2027',
      department: categorizeDepartment(row.department || row.organization || row.functiongroup),
      name: (row.firstname || row.lastname) ? `${row.firstname || ''} ${row.lastname || ''}`.trim() : 'Unknown Employee',
      position: row.position || 'Unknown Title',
      basePay: parseFloat(row.basepay || 0),
      overtime: parseFloat(row.overtimepay || 0),
      otherPay: parseFloat(row.otherpay || row.other_pay || 0), 
      total: parseFloat(row.totalpay || 0),
      date: row.transactiondate || row.checkdate || row.date || ''
    }));
  } catch (error) {
    return [];
  }
}

export async function fetchCapitalProjects() {
  try {
    const response = await fetch(`https://${SOCRATA_DOMAIN}/resource/${DATASETS.projects}.json?$limit=50000&$order=fiscalyear DESC`);
    const rawData = await response.json();
    
    const largeExpenditures = rawData.filter(row => parseFloat(row.actual) > 25000);
    return largeExpenditures.map((item, index) => ({
      id: item.uniqueid || `proj-${index}`,
      fiscalYear: item.fiscalyear || '2027',
      department: categorizeDepartment(item.organization || item.functiongroup),
      name: item.description || 'Major Expenditure',
      originalBudget: parseFloat(item.actual || 0) 
    }));
  } catch (error) {
    return [];
  }
}

export async function fetchVendorCheckbook() {
  try {
    const limit = 50000;
    const offsets = [0, 50000, 100000, 150000, 200000, 250000];
    const fetchPromises = offsets.map(offset => 
      fetch(`https://${SOCRATA_DOMAIN}/resource/${DATASETS.checkbook}.json?$limit=${limit}&$offset=${offset}&$order=fiscalyear DESC`)
        .then(res => res.json())
    );
    const results = await Promise.all(fetchPromises);
    const rawData = results.flat();
    
    return rawData.map((item, index) => ({
      id: item.uniqueid || `chk-${index}`,
      fiscalYear: item.fiscalyear || '2027',
      department: categorizeDepartment(item.organization || item.functiongroup),
      accountDescription: item.accountdescription || item.charactercodedescription || item.object || 'Uncategorized Expense',
      accountCode: item.objectcode || item.accountid || '',
      vendor: item.vendorname || 'Unknown Vendor', 
      amount: parseFloat(item.actual || 0), 
      description: item.description || '',
      date: item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
      checkNumber: item.paymentchecknumber || item.checknumber || 'N/A'
    }));
  } catch (error) {
    return [];
  }
}