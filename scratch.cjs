const fs = require('fs');
let content = fs.readFileSync('src/utils/expertAudit.js', 'utf8');

// Replace exports
content = content.replace('export const getExpertAudit = ', 'const getExpertAudit = ');
content = content.replace('export const runBasicAudit = ', 'window.runBasicAudit = ');

// Replace the existing scrapeAndAudit with the fetch version
content = content.replace(/export const scrapeAndAudit = async \(supabase, url\) => \{[\s\S]*?\n\};\n/, `
window.scrapeAndAudit = async (url) => {
  try {
    const res = await fetch('https://oyvumdmtimcggqzbgotc.supabase.co/functions/v1/scrape-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dnVtZG10aW1jZ2dxemJnb3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzQ4NTgsImV4cCI6MjA5MzExMDg1OH0.3eKtR-MdfLhO0NHEo2l7OOZ3AlTyEmaXiTG94VI6QKE'
      },
      body: JSON.stringify({ url })
    });
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch (e) {
    return null;
  }
};
`);

fs.writeFileSync('extension/audit.js', content);
console.log('Done rewriting audit.js');
