async function getSocrataIDs() {
  const domains = [
    'dedhamma.budget.socrata.com', 
    'dedhamma.payroll.socrata.com', 
    'dedhamma.data.socrata.com',
    'dedhamma.spending.socrata.com',
    'dedhamma.finance.socrata.com'
  ];
  
  console.log("Pinging Socrata Master Catalog for Dedham datasets...\n");

  for (const domain of domains) {
    try {
      const response = await fetch(`https://api.us.socrata.com/api/catalog/v1?domains=${domain}&limit=50`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        console.log(`=== Datasets found on ${domain} ===`);
        data.results.forEach(r => console.log(`${r.resource.name}: ${r.resource.id}`));
        console.log("\n");
      }
    } catch (error) {
      console.log(`Could not scan ${domain}`);
    }
  }
}

getSocrataIDs();