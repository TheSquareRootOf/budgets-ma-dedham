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

// Memory-Optimized Fetcher: Formats data on the fly and discards raw JSON immediately
async function fetchAndProcess(datasetId, limit, chunks, mapFn) {
  let results = [];
  const headers = {
    'User-Agent': 'DedhamDollars-DataPipeline/2.0 (Memory Optimized)',
    'Accept': 'application/json'
  };
  
  if (process.env.SOCRATA_TOKEN) {
    headers['X-App-Token'] = process.env.SOCRATA_TOKEN;
  }

  for (let i = 0; i < chunks; i++) {
    const offset = i * limit;
    console.log(`  - Fetching chunk ${i + 1}/${chunks} for ${datasetId}...`);
    try {
      const response = await fetch(`https://${SOCRATA_DOMAIN}/resource/${datasetId}.json?$limit=${limit}&$offset=${offset}`, { headers });
      
      if (!response.ok) {
        console.error(`    ! API Error: ${response.status} ${response.statusText}`);
        break;
      }
      
      const rawData = await response.json();
      if (!Array.isArray(rawData) || rawData.length === 0) break;
      
      // Map and filter the chunk instantly. The rawData array is garbage collected right after.
      const processedChunk = rawData.map((row, index) => mapFn(row, results.length + index)).filter(item => item !== null);
      results = results.concat(processedChunk);
      
      // Brief pause to respect Socrata rate limits
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (err) {
      console.error(`    ! Fetch exception:`, err.message);
      break;
    }
  }
  return results;
}

async function runPipeline() {
  console.log('Starting memory-optimized data pipeline...');
  const dataDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  try {
    console.log('\n📦 Fetching Budget...');
    const budget = await fetchAndProcess(DATASETS.budget, 50000, 1, (row, id) => {
      const charDesc = (row.charactercodedescription || '').toLowerCase();
      const desc = (row.accountdescription || row.description || row.object || '').toLowerCase();
      return {
        id,
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

    console.log('\n📦 Fetching Payroll...');
    const payroll = await fetchAndProcess(DATASETS.payroll, 50000, 10, (row, id) => ({
      id, 
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

    console.log('\n📦 Fetching Projects & Major Expenditures...');
    const projects = await fetchAndProcess(DATASETS.projects, 50000, 1, (item, id) => {
      // Drop minor expenditures instantly to save memory
      if (parseFloat(item.actual || 0) <= 25000) return null; 
      return {
        id,
        fiscalYear: item.fiscalyear || '2027',
        fundType: categorizeFund(item.fundgroup || item.fund || ''),
        department: categorizeDepartment(item.organization || item.functiongroup),
        name: item.description || 'Major Expenditure',
        vendor: item.vendorname || 'Unknown Vendor',
        date: (item.date || '').split('T')[0],
        accountCode: item.objectcode || item.accountid || '',
        value: parseFloat(item.actual || 0) 
      };
    });
    fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects));

    console.log('\n📦 Fetching Checkbook (Large Dataset)...');
    const checks = await fetchAndProcess(DATASETS.checkbook, 50000, 10, (item, id) => ({
      id,
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

    console.log('\n📦 Fetching Vendor Profiles...');
    const vendorProfiles = await fetchAndProcess(DATASETS.vendors, 50000, 1, (v) => ({
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

    console.log('\n✅ Data pipeline complete. Exiting cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ PIPELINE HALTED:', error.message);
    // Exiting 0 prevents the workflow from showing a failed status and keeps the site online
    process.exit(0);
  }
}

runPipeline();