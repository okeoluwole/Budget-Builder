/**
 * Comprehensive Frontend Data Flow Debugging
 * Tests the exact data flow from server to frontend component breakdown table
 */

// Mock the expected server response
const mockServerResponse = {
  "totalCost": 2033150.3676746325,
  "fitoutCost": 1170970,
  "furnitureCost": 294782.43923924793,
  "technologyCost": 302204.4022169543,
  "costsBreakdown": {
    "FITOUT COSTS": 1170970,
    "TECHNOLOGY COSTS": 302204.4022169543,
    "FURNITURE COSTS": 294782.43923924793,
    "PROFESSIONAL FEES": 265193.5262184303
  },
  "rawUnitCost": 2033.1503676746324,
  "adjustedUnitCost": 2033.1503676746324,
  "areaUnit": "sqm",
  "localCurrencyCode": "USD",
  "datasetInfo": {
    "source": "CBRE",
    "location": "Tel Aviv, Israel",
    "specification": "High (Gold)",
    "layout": "Activity"
  }
};

console.log("=== FRONTEND DATA FLOW DEBUGGING ===");
console.log();

// Test 1: Simulate setBudgetBreakdown(result)
console.log("✅ Test 1: setBudgetBreakdown Storage");
const budgetBreakdown = mockServerResponse; // This is what we store now
console.log("budgetBreakdown keys:", Object.keys(budgetBreakdown));
console.log("budgetBreakdown.costsBreakdown:", budgetBreakdown.costsBreakdown);
console.log();

// Test 2: Simulate the frontend breakdown extraction
console.log("✅ Test 2: Frontend Breakdown Extraction");
const breakdown = budgetBreakdown?.costsBreakdown || {};
console.log("breakdown object:", breakdown);
console.log("Object.keys(breakdown):", Object.keys(breakdown));
console.log("Object.entries(breakdown):", Object.entries(breakdown));
console.log();

// Test 3: Simulate the component mapping
console.log("✅ Test 3: Component Mapping");
const componentDisplayMap = {
  'FITOUT COSTS': {
    displayName: "Construction Costs",
    color: "#3B82F6",
    description: "Partitions, flooring, ceilings, mechanical works, electrical systems"
  },
  'FURNITURE COSTS': {
    displayName: "Furniture Costs",
    color: "#10B981", 
    description: "Desks, chairs, storage, meeting room furniture, workstations"
  },
  'TECHNOLOGY COSTS': {
    displayName: "Technology Costs",
    color: "#F59E0B",
    description: "AV systems, displays, conferencing equipment, IT infrastructure"
  },
  'PROFESSIONAL FEES': {
    displayName: "Professional Fees",
    color: "#8B5CF6",
    description: "Design, project management, consulting, contract administration"
  }
};

// Test 4: Simulate the component costs building
console.log("✅ Test 4: Component Costs Building");
const area = 1000;
const totalCost = budgetBreakdown.totalCost;

let cbreComponentCosts = [];

if (breakdown && Object.keys(breakdown).length > 0) {
  console.log(`✅ Breakdown has ${Object.keys(breakdown).length} keys`);
  
  cbreComponentCosts = Object.entries(breakdown)
    .filter(([key, value]) => {
      const hasMapping = !!componentDisplayMap[key];
      const isPositive = value > 0;
      console.log(`  ${key}: hasMapping=${hasMapping}, value=${value}, isPositive=${isPositive}`);
      return hasMapping && isPositive;
    })
    .map(([key, amount]) => {
      const config = componentDisplayMap[key];
      const rate = amount / area;
      const percentage = (amount / totalCost) * 100;
      
      console.log(`  Creating component: ${key} -> ${config.displayName}`);
      console.log(`    Amount: $${amount}`);
      console.log(`    Rate: $${Math.round(rate)}/sqm`);
      console.log(`    Percentage: ${percentage.toFixed(1)}%`);
      
      return {
        name: config.displayName,
        amount: amount,
        rate: rate,
        percentage: percentage,
        color: config.color,
        description: config.description
      };
    });
} else {
  console.log("❌ Breakdown is empty or invalid");
}

console.log();
console.log("✅ Test 5: Final Component Array");
console.log(`Component count: ${cbreComponentCosts.length}`);
cbreComponentCosts.forEach((comp, index) => {
  console.log(`  ${index + 1}. ${comp.name}: $${comp.amount.toLocaleString()} ($${Math.round(comp.rate)}/sqm) - ${comp.percentage.toFixed(1)}%`);
});

console.log();
console.log("=== EXPECTED FRONTEND RENDER ===");
console.log("Should render 4 component rows:");
console.log("1. Construction Costs: $1,170,970 ($1,171/sqm) - 57.6%");
console.log("2. Technology Costs: $302,204 ($302/sqm) - 14.9%");
console.log("3. Furniture Costs: $294,782 ($295/sqm) - 14.5%");
console.log("4. Professional Fees: $265,194 ($265/sqm) - 13.0%");

console.log();
console.log("=== DEBUGGING CONCLUSION ===");
if (cbreComponentCosts.length === 4) {
  console.log("✅ Data flow is correct - should render 4 component rows");
} else {
  console.log(`❌ Data flow error - only ${cbreComponentCosts.length} components created`);
}