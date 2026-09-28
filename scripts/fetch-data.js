import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOCRATA_DOMAIN = 'dedhamma.data.socrata.com'; 
const DATASETS = { budget: 'dnxw-cwsb', payroll: 'bhma-x87a', projects: 'yd4k-4rzp', checkbook: 'yd4k-4rzp', vendors: 'jxte-uwe9' };

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

function categorizeFund(fundStr) {
  const str = (fundStr || '').toLowerCase();
  if (str.includes('grant') || str.includes('state') || str.includes('federal') || str.includes('arpa') || str.includes('trust') || str.includes('special revenue') || str.includes('chapter')) return 'External Funds';
  return 'Local Funds';
}

async function fetchSocrata(datasetId, limit, chunks) {
  const results = [];
  for (let i = 0; i < chunks; i++) {
    const offset = i * limit;
    console.log(`  - Fetching chunk ${i + 1}/${chunks} for ${datasetId}...`);
    const response = await fetch(`https://${SOCRATA_DOMAIN}/resource/${datasetId}.json?$limit=${limit}&$offset=${offset}&$order=fiscalyear DESC`);
    const data = await response.json();
    if (data.length === 0) break;
    results.push(...data);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return results;
}

async function runPipeline() {
  console.log('Starting optimized data pipeline...');
  const dataDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  console.log('Fetching Budget...');
  const rawBudget = await fetchSocrata(DATASETS.budget, 50000, 1);
  const budget = rawBudget.map((row, i) => {
    const charDesc = (row.charactercodedescription || '').toLowerCase();
    const desc = (row.accountdescription || row.description || row.object || '').toLowerCase();
    return {
      id: i,
      fiscalYear: row.fiscalyear || '2027',
      fundType: categorizeFund(row.fundgroup || row.fund || ''),
      department: categorizeDepartment(row.department || row.organization || row.functiongroup),
      description: row.accountdescription || row.description || row.object || 'Uncategorized Expense',
      accountCode: row.objectcode || row.accountid || '', 
      budget: parseFloat(row.originalbudget || 0),
      spend: parseFloat(row.actual || 0),
      isPayroll: charDesc.includes('personal services') || desc.includes('salary') || desc.includes('wages') || desc.includes('payroll')
    };
  });
  fs.writeFileSync(path.join(dataDir, 'budget.json'), JSON.stringify(budget));

  console.log('Fetching Payroll...');
  const rawPayroll = await fetchSocrata(DATASETS.payroll, 50000, 10); 
  const payroll = rawPayroll.map((row, i) => ({
    id: i, 
    fiscalYear: row.fiscalyear || '2027',
    fundType: categorizeFund(row.fundgroup || row.fund || ''),
    department: categorizeDepartment(row.department || row.organization || row.functiongroup),
    name: (row.firstname || row.lastname) ? `${row.firstname || ''} ${row.lastname || ''}`.trim() : 'Unknown Employee',
    position: row.position || 'Unknown Title',
    basePay: parseFloat(row.basepay || 0),
    overtime: parseFloat(row.overtimepay || 0),
    otherPay: parseFloat(row.otherpay || row.other_pay || 0), 
    total: parseFloat(row.totalpay || 0),
    date: (row.transactiondate || row.checkdate || row.date || '').split('T')[0]
  }));
  fs.writeFileSync(path.join(dataDir, 'payroll.json'), JSON.stringify(payroll));

  console.log('Fetching Projects & Major Expenditures...');
  const rawProjects = await fetchSocrata(DATASETS.projects, 50000, 1);
  const projects = rawProjects.filter(row => parseFloat(row.actual) > 25000).map((item, i) => ({
    id: i,
    fiscalYear: item.fiscalyear || '2027',
    fundType: categorizeFund(item.fundgroup || item.fund || ''),
    department: categorizeDepartment(item.organization || item.functiongroup),
    name: item.description || 'Major Expenditure',
    vendor: item.vendorname || 'Unknown Vendor',
    date: (item.date || '').split('T')[0],
    accountCode: item.objectcode || item.accountid || '',
    value: parseFloat(item.actual || 0) 
  }));
  fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects));

  console.log('Fetching Checkbook...');
  const rawChecks = await fetchSocrata(DATASETS.checkbook, 50000, 10); 
  const checks = rawChecks.map((item, i) => ({
    id: i,
    fiscalYear: item.fiscalyear || '2027',
    fundType: categorizeFund(item.fundgroup || item.fund || ''),
    department: categorizeDepartment(item.organization || item.functiongroup),
    accountDescription: item.accountdescription || item.charactercodedescription || item.object || 'Uncategorized Expense',
    accountCode: item.objectcode || item.accountid || '',
    vendor: item.vendorname || 'Unknown Vendor', 
    amount: parseFloat(item.actual || 0), 
    description: item.description || '',
    date: (item.date || '').split('T')[0],
    checkNumber: item.paymentchecknumber || item.checknumber || 'N/A'
  }));
  fs.writeFileSync(path.join(dataDir, 'checkbook.json'), JSON.stringify(checks));

  console.log('Fetching Vendor Profiles...');
  const rawVendors = await fetch(`https://${SOCRATA_DOMAIN}/resource/${DATASETS.vendors}.json?$limit=50000`).then(res => res.json());
  const vendorProfiles = rawVendors.map(v => ({
    name: v.vendorname || 'Unknown Vendor',
    address: v.address1 || '',
    city: v.city || '',
    state: v.state || '',
    zip: v.zip || '',
    phone: v.phone || v.contactphone || '',
    contactName: v.contactname || '',
    contactEmail: v.contactemail || '',
    website: v.webaddress || '',
    isWMBE: String(v.iswomenorminoritybusinessenterprise).toLowerCase() === 'y' || String(v.iswomenorminoritybusinessenterprise).toLowerCase() === 'true'
  }));
  fs.writeFileSync(path.join(dataDir, 'vendors.json'), JSON.stringify(vendorProfiles));

  console.log('Data pipeline complete! Files saved to public/data/');
}

runPipeline();