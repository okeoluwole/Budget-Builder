// Simple browser console test - copy this line by line
console.log('🧪 Testing Multi-Source Comparison');

// Test 1: CBRE → T&T
fetch('/api/calculate-multi-guide', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    primaryGuide: "CBRE",
    comparisonGuides: ["TT"],
    project: { country: "United Kingdom", city: "London", totalArea: 1000, areaUnit: "sqm", currency: "USD" },
    budget: { scope: "Complete", specification: "Medium (Silver)", layout: "Event", primaryDataSource: "CBRE" }
  })
}).then(r => r.json()).then(data => {
  console.log('✅ CBRE→T&T Test Result:', data);
  if (data.success && data.data) {
    console.log('Primary cost:', data.data.primary?.result?.totalCost);
    console.log('Comparisons:', data.data.comparisons?.length);
    console.log('Assumptions:', data.data.comparisons?.[0]?.assumptions?.length);
  }
}).catch(e => console.log('❌ Test failed:', e));