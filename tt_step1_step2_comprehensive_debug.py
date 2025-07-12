#!/usr/bin/env python3
"""
STEP 1 & 2: T&T Comprehensive Location Discovery and Data Extraction
Using actual T&T PDF source document for validation
"""

import pandas as pd
import json
import re
from pathlib import Path
import sys

def extract_tt_source_data():
    """Extract T&T cost data from the actual PDF source document"""
    
    pdf_path = Path("attached_assets/T&T Source Document/T&T Global Fitout Cost Guide 2025.pdf")
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return None
    
    print(f"📖 Processing T&T PDF: {pdf_path}")
    
    try:
        import pdfplumber
        
        print("Using pdfplumber for extraction...")
        
        with pdfplumber.open(pdf_path) as pdf:
            all_text = ""
            tables = []
            
            for page_num, page in enumerate(pdf.pages):
                print(f"Processing page {page_num + 1}/{len(pdf.pages)}")
                
                # Extract text
                page_text = page.extract_text()
                if page_text:
                    all_text += f"\n--- Page {page_num + 1} ---\n"
                    all_text += page_text
                
                # Extract tables
                page_tables = page.extract_tables()
                if page_tables:
                    tables.extend(page_tables)
                    print(f"Found {len(page_tables)} tables on page {page_num + 1}")
        
        # Process and analyze the extracted data
        return process_tt_data(all_text, tables)
        
    except Exception as e:
        print(f"❌ Error extracting PDF: {e}")
        return None

def process_tt_data(text, tables):
    """Process extracted text and tables to find cost data"""
    
    print("\n=== STEP 1: T&T LOCATION DISCOVERY ===")
    
    # Look for location patterns in the text
    location_patterns = [
        r'(France|Germany|Canada|United Kingdom|United States|Singapore)[\s\-/]*(Paris|Munich|Toronto|Vancouver|London|New York|Singapore)',
        r'(London|Paris|Munich|Toronto|Vancouver|New York|Singapore)[\s,\-]*(?:UK|France|Germany|Canada|US|USA|Singapore)?',
        r'(EMEA|AMERICAS|APAC)[\s\-:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
    ]
    
    locations_found = set()
    cost_data = {}
    
    # Search for location information
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Look for location patterns
        for pattern in location_patterns:
            matches = re.findall(pattern, line, re.IGNORECASE)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        location = '/'.join(match)
                    else:
                        location = match
                    locations_found.add(location)
                    print(f"Found location: {location} in line: {line[:100]}...")
    
    print(f"\nSTEP 1 RESULTS: Found {len(locations_found)} locations")
    for loc in sorted(locations_found):
        print(f"  - {loc}")
    
    print("\n=== STEP 2: T&T COST DATA EXTRACTION ===")
    
    # Process tables for cost data
    extracted_costs = {}
    
    for table_num, table in enumerate(tables):
        if not table or len(table) < 2:
            continue
            
        print(f"\nAnalyzing Table {table_num + 1} (size: {len(table)}x{len(table[0]) if table else 0}):")
        
        try:
            # Convert table to DataFrame
            df = pd.DataFrame(table[1:], columns=table[0])
            print(f"Table columns: {df.columns.tolist()}")
            
            # Look for cost-related data
            cost_columns = [col for col in df.columns if col and any(
                keyword in str(col).lower() for keyword in ['cost', 'price', '£', '$', 'usd', 'gbp', 'low', 'medium', 'high']
            )]
            
            if cost_columns:
                print(f"Found cost columns: {cost_columns}")
                
                # Look for location data in the same table
                location_columns = [col for col in df.columns if col and any(
                    keyword in str(col).lower() for keyword in ['country', 'city', 'location', 'market']
                )]
                
                if location_columns:
                    print(f"Found location columns: {location_columns}")
                    
                    # Extract cost data by location
                    for idx, row in df.iterrows():
                        location_info = []
                        for loc_col in location_columns:
                            if pd.notna(row[loc_col]):
                                location_info.append(str(row[loc_col]))
                        
                        if location_info:
                            location_key = '/'.join(location_info)
                            cost_info = {}
                            
                            for cost_col in cost_columns:
                                if pd.notna(row[cost_col]):
                                    try:
                                        cost_value = float(str(row[cost_col]).replace('£', '').replace('$', '').replace(',', ''))
                                        cost_info[cost_col] = cost_value
                                    except:
                                        cost_info[cost_col] = str(row[cost_col])
                            
                            if cost_info:
                                extracted_costs[location_key] = cost_info
                                print(f"  {location_key}: {cost_info}")
                
                # Also show sample data
                print(f"Sample data from table {table_num + 1}:")
                print(df.head(3).to_string())
                
        except Exception as e:
            print(f"Error processing table {table_num + 1}: {e}")
    
    # Look for cost patterns in text
    cost_patterns = [
        r'(Construction|Furniture|Audio[- ]?Visual|Professional\s*Fees?)\s*[:\-]?\s*(?:£|USD?\s*)?(\d+(?:\.\d+)?)',
        r'(Low|Medium|High)\s*[:\-]?\s*(?:£|USD?\s*)?(\d+(?:\.\d+)?)',
        r'(\d+(?:\.\d+)?)\s*(?:£|USD?\s*)?(?:per\s*)?(?:sq\s*ft|sqft|m2|sqm)?'
    ]
    
    text_costs = {}
    for line in lines:
        for pattern in cost_patterns:
            matches = re.findall(pattern, line, re.IGNORECASE)
            if matches:
                for match in matches:
                    component = match[0].strip()
                    try:
                        cost = float(match[1].strip())
                        if component not in text_costs:
                            text_costs[component] = []
                        text_costs[component].append(cost)
                        print(f"Found cost in text: {component} = {cost}")
                    except:
                        pass
    
    print(f"\nSTEP 2 RESULTS: Extracted cost data from {len(tables)} tables")
    print(f"Table-based costs: {len(extracted_costs)} locations")
    print(f"Text-based costs: {len(text_costs)} components")
    
    return {
        'locations_found': list(locations_found),
        'table_costs': extracted_costs,
        'text_costs': text_costs,
        'tables_processed': len(tables),
        'text_length': len(text)
    }

def compare_with_system_data():
    """Compare extracted PDF data with current system data"""
    
    print("\n=== STEP 3: SYSTEM COMPARISON ===")
    
    # Current system data (from our existing implementation)
    system_locations = [
        "France/Paris",
        "Germany/Munich", 
        "Canada/Toronto",
        "Canada/Vancouver",
        "United Kingdom/London",
        "United States/New York",
        "Singapore/Singapore"
    ]
    
    system_rates = {
        "France/Paris": {"construction": 2232, "furniture": 315, "audioVisual": 95, "professionalFees": 220},
        "Germany/Munich": {"construction": 2540, "furniture": 187, "audioVisual": 42, "professionalFees": 425},
        "Canada/Toronto": {"construction": 2275, "furniture": 325, "audioVisual": 228, "professionalFees": 423},
        "Canada/Vancouver": {"construction": 2205, "furniture": 315, "audioVisual": 221, "professionalFees": 410},
        "United Kingdom/London": {"construction": 2992, "furniture": 572, "audioVisual": 267, "professionalFees": 499},
        "United States/New York": {"construction": 3640, "furniture": 520, "audioVisual": 364, "professionalFees": 676},
        "Singapore/Singapore": {"construction": 2080, "furniture": 312, "audioVisual": 182, "professionalFees": 326}
    }
    
    print(f"System has {len(system_locations)} locations:")
    for loc in system_locations:
        print(f"  - {loc}")
    
    return system_locations, system_rates

def main():
    """Main function to run comprehensive T&T debugging"""
    
    print("=== T&T COMPREHENSIVE DEBUG: STEPS 1 & 2 ===")
    print("Extracting data from actual T&T PDF source document")
    
    # Extract data from PDF
    pdf_data = extract_tt_source_data()
    
    if not pdf_data:
        print("❌ Failed to extract PDF data")
        return
    
    # Compare with system data
    system_locations, system_rates = compare_with_system_data()
    
    # Generate comprehensive validation report
    print("\n=== COMPREHENSIVE VALIDATION REPORT ===")
    
    if pdf_data['locations_found']:
        print(f"✅ PDF locations found: {len(pdf_data['locations_found'])}")
        for loc in pdf_data['locations_found']:
            print(f"  - {loc}")
    else:
        print("❌ No locations found in PDF")
    
    if pdf_data['table_costs']:
        print(f"✅ Table costs extracted: {len(pdf_data['table_costs'])}")
        for loc, costs in pdf_data['table_costs'].items():
            print(f"  - {loc}: {costs}")
    else:
        print("❌ No table costs found in PDF")
    
    if pdf_data['text_costs']:
        print(f"✅ Text costs extracted: {len(pdf_data['text_costs'])}")
        for comp, costs in pdf_data['text_costs'].items():
            print(f"  - {comp}: {costs}")
    else:
        print("❌ No text costs found in PDF")
    
    # Save results for further analysis
    result_data = {
        'pdf_extraction': pdf_data,
        'system_data': {
            'locations': system_locations,
            'rates': system_rates
        },
        'validation_timestamp': pd.Timestamp.now().isoformat()
    }
    
    with open('tt_comprehensive_debug_results.json', 'w') as f:
        json.dump(result_data, f, indent=2)
    
    print("\n✅ Comprehensive debug results saved to tt_comprehensive_debug_results.json")
    
    # Generate recommendations
    print("\n=== RECOMMENDATIONS ===")
    
    if not pdf_data['locations_found'] and not pdf_data['table_costs']:
        print("❌ CRITICAL: No cost data found in PDF")
        print("   Recommendation: Check PDF structure and extraction method")
    elif len(pdf_data['locations_found']) < len(system_locations):
        print("⚠️  WARNING: Fewer locations in PDF than system")
        print("   Recommendation: Verify PDF completeness or extraction accuracy")
    else:
        print("✅ PDF extraction appears successful")
        print("   Recommendation: Proceed with detailed rate validation")

if __name__ == "__main__":
    main()