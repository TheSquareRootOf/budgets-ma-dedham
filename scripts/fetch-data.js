import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOCRATA_DOMAIN = 'dedhamma.data.socrata.com'; 
const DATASETS = { budget: 'dnxw-cwsb', payroll: 'bhma-x87a', projects: 'yd4k-4rzp', checkbook: 'yd4k-4rzp' };

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

async function fetchSocrata(datasetId, limit, chunks) {
  const offsets = Array.from({length: chunks}, (_, i) => i * limit);
  const fetchPromises = offsets.map(offset => 
    fetch(`https://${SOCRATA_DOMAIN}/resource/${datasetId}.json?$limit=${limit}&$offset=${offset}&$order=fiscalyear DESC`).then(res => res.json())
  );
  const results = await Promise.all(fetchPromises);
  return results.flat();
}

async function runPipeline() {
  console.log('Starting data pipeline...');
  const dataDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // 1. Budget
  console.log('Fetching Budget...');
  const rawBudget = await fetchSocrata(DATASETS.budget, 50000, 1);
  const budget = rawBudget.map((row, i) => {
    const charDesc = (row.charactercodedescription || '').toLowerCase();
    const desc = (row.accountdescription || row.description || row.object || '').toLowerCase();
    return {
      id: row.uniqueid || `budg-${i}`,
      fiscalYear: row.fiscalyear || '2027',
      department: categorizeDepartment(row.department || row.organization || row.functiongroup),
      description: row.accountdescription || row.description || row.object || 'Uncategorized Expense',
      accountCode: row.objectcode || row.accountid || '', 
      budget: parseFloat(row.originalbudget || 0),
      spend: parseFloat(row.actual || 0),
      isPayroll: charDesc.includes('personal services') || desc.includes('salary') || desc.includes('wages') || desc.includes('payroll')
    };
  });
  fs.writeFileSync(path.join(dataDir, 'budget.json'), JSON.stringify(budget));

  // 2. Payroll
  console.log('Fetching Payroll...');
  const rawPayroll = await fetchSocrata(DATASETS.payroll, 50000, 10); // 500k rows
  const payroll = rawPayroll.map((row, i) => ({
    id: row.uniqueid || `pay-${i}`,
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
  fs.writeFileSync(path.join(dataDir, 'payroll.json'), JSON.stringify(payroll));

  // 3. Projects
  console.log('Fetching Projects...');
  const rawProjects = await fetchSocrata(DATASETS.projects, 50000, 1);
  const projects = rawProjects.filter(row => parseFloat(row.actual) > 25000).map((item, i) => ({
    id: item.uniqueid || `proj-${i}`,
    fiscalYear: item.fiscalyear || '2027',
    department: categorizeDepartment(item.organization || item.functiongroup),
    name: item.description || 'Major Expenditure',
    originalBudget: parseFloat(item.actual || 0) 
  }));
  fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects));

  // 4. Checks
  console.log('Fetching Checkbook...');
  const rawChecks = await fetchSocrata(DATASETS.checkbook, 50000, 6); // 300k rows
  const checks = rawChecks.map((item, i) => ({
    id: item.uniqueid || `chk-${i}`,
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
  fs.writeFileSync(path.join(dataDir, 'checkbook.json'), JSON.stringify(checks));

  console.log('Data pipeline complete! Files saved to public/data/');
}

runPipeline();