#!/usr/bin/env python3
"""
STEP 3: T&T PDF Source Document Validation
Compare system extracted rates with actual T&T PDF source document data
"""

import json
import requests
import pandas as pd
from pathlib import Path

def load_pdf_extraction_results():
    """Load the PDF extraction results from Step 1 & 2"""
    
    results_file = Path("tt_comprehensive_debug_results.json")
    
    if not results_file.exists():
        print("❌ PDF extraction results not found. Please run Step 1 & 2 first.")
        return None
    
    with open(results_file, 'r') as f:
        return json.load(f)

def analyze_pdf_cost_data(pdf_data):
    """Analyze the PDF cost data to extract T&T rates"""
    
    print("=== ANALYZING PDF COST DATA ===")
    
    # Extract table costs from PDF data
    table_costs = pdf_data.get('pdf_extraction', {}).get('table_costs', {})
    
    # Convert PDF data to structured format
    pdf_rates = {}
    
    print(f"Found {len(table_costs)} locations with cost data in PDF:")
    
    for location, costs in table_costs.items():
        print(f"\n{location}:")
        
        # Extract cost components
        cost_components = {}
        
        for cost_key, cost_value in costs.items():
            # Clean and categorize cost data
            if isinstance(cost_value, (int, float)):
                print(f"  {cost_key}: {cost_value}")
                cost_components[cost_key] = cost_value
            elif isinstance(cost_value, str):
                # Try to extract numeric value
                try:
                    numeric_value = float(cost_value.replace('£', '').replace('$', '').replace(',', ''))
                    cost_components[cost_key] = numeric_value
                    print(f"  {cost_key}: {numeric_value}")
                except:
                    print(f"  {cost_key}: {cost_value} (non-numeric)")
        
        if cost_components:
            pdf_rates[location] = cost_components
    
    return pdf_rates

def test_system_against_pdf_data(pdf_rates):
    """Test system API against PDF extracted data"""
    
    print("\n=== TESTING SYSTEM API AGAINST PDF DATA ===")
    
    # Test locations found in PDF
    test_results = []
    
    for pdf_location, pdf_costs in pdf_rates.items():
        # Parse location
        location_parts = pdf_location.split('/')
        if len(location_parts) >= 2:
            country = location_parts[0].strip()
            city = location_parts[1].strip()
        else:
            # Try to infer from single location
            if pdf_location.lower() in ['london', 'paris', 'munich', 'toronto', 'vancouver', 'singapore']:
                city = pdf_location
                country_map = {
                    'london': 'United Kingdom',
                    'paris': 'France', 
                    'munich': 'Germany',
                    'toronto': 'Canada',
                    'vancouver': 'Canada',
                    'singapore': 'Singapore'
                }
                country = country_map.get(city.lower(), city)
            else:
                print(f"⚠️  Skipping {pdf_location} - cannot parse location")
                continue
        
        print(f"\nTesting {country}/{city}...")
        
        # Test system API
        try:
            response = requests.post('http://localhost:5000/api/calculate-budget', json={
                'project': {
                    'city': city,
                    'country': country,
                    'totalArea': 1000,
                    'areaUnit': 'sqm',
                    'currency': 'USD'
                },
                'budget': {
                    'primaryDataSource': 'TT',
                    'scope': 'Complete',
                    'specification': 'Medium (Silver)',
                    'layout': 'Activity'
                }
            })
            
            if response.status_code == 200:
                system_result = response.json()
                
                # Extract system rates
                system_rates = {
                    'totalCost': system_result.get('rawUnitCost', 0),
                    'construction': round(system_result.get('costsBreakdown', {}).get('Construction', 0) / 1000),
                    'furniture': round(system_result.get('costsBreakdown', {}).get('Loose Furniture', 0) / 1000),
                    'audioVisual': round(system_result.get('costsBreakdown', {}).get('Audio-Visual', 0) / 1000),
                    'professionalFees': round(system_result.get('costsBreakdown', {}).get('Professional Fees', 0) / 1000)
                }
                
                test_results.append({
                    'location': f"{country}/{city}",
                    'pdf_location': pdf_location,
                    'system_success': True,
                    'system_rates': system_rates,
                    'pdf_costs': pdf_costs,
                    'api_response': system_result
                })
                
                print(f"✅ System API successful")
                print(f"   Total cost: {system_rates['totalCost']}/sqm")
                print(f"   Construction: {system_rates['construction']}/sqm")
                print(f"   Furniture: {system_rates['furniture']}/sqm")
                print(f"   Audio-Visual: {system_rates['audioVisual']}/sqm")
                print(f"   Professional Fees: {system_rates['professionalFees']}/sqm")
                
            else:
                test_results.append({
                    'location': f"{country}/{city}",
                    'pdf_location': pdf_location,
                    'system_success': False,
                    'error': f"HTTP {response.status_code}",
                    'pdf_costs': pdf_costs
                })
                print(f"❌ System API failed: HTTP {response.status_code}")
                
        except Exception as e:
            test_results.append({
                'location': f"{country}/{city}",
                'pdf_location': pdf_location,
                'system_success': False,
                'error': str(e),
                'pdf_costs': pdf_costs
            })
            print(f"❌ System API error: {e}")
    
    return test_results

def validate_rates_against_pdf(test_results):
    """Validate system rates against PDF extracted data"""
    
    print("\n=== VALIDATING SYSTEM RATES AGAINST PDF DATA ===")
    
    successful_tests = [r for r in test_results if r['system_success']]
    failed_tests = [r for r in test_results if not r['system_success']]
    
    print(f"System API tests: {len(successful_tests)} successful, {len(failed_tests)} failed")
    
    validation_results = []
    
    for test in successful_tests:
        location = test['location']
        system_rates = test['system_rates']
        pdf_costs = test['pdf_costs']
        
        print(f"\n--- Validating {location} ---")
        
        # Try to match PDF costs with system rates
        # Note: PDF costs might be in different units/format than system rates
        
        location_validation = {
            'location': location,
            'system_total': system_rates['totalCost'],
            'pdf_costs_available': list(pdf_costs.keys()),
            'validation_notes': []
        }
        
        # Check if we have comparable data
        if pdf_costs:
            print(f"PDF costs available: {list(pdf_costs.keys())}")
            print(f"System total: {system_rates['totalCost']}/sqm")
            
            # Look for total cost in PDF data
            pdf_total_candidates = []
            for key, value in pdf_costs.items():
                if isinstance(value, (int, float)) and value > 100:  # Likely total cost
                    pdf_total_candidates.append((key, value))
            
            if pdf_total_candidates:
                print(f"PDF total cost candidates: {pdf_total_candidates}")
                
                # Compare with system total
                for key, pdf_value in pdf_total_candidates:
                    # Convert if needed (PDF might be in £/sqft, system is USD/sqm)
                    if pdf_value < system_rates['totalCost'] * 0.1:  # PDF might be in £/sqft
                        converted_value = pdf_value * 10.764 * 1.27  # Convert £/sqft to USD/sqm
                        variance = abs(converted_value - system_rates['totalCost'])
                        variance_percent = (variance / system_rates['totalCost']) * 100
                        
                        print(f"  {key}: {pdf_value} £/sqft → {converted_value:.1f} USD/sqm")
                        print(f"  Variance: {variance:.1f} ({variance_percent:.1f}%)")
                        
                        location_validation['pdf_converted_value'] = converted_value
                        location_validation['variance_percent'] = variance_percent
                        location_validation['within_tolerance'] = variance_percent <= 15
                        
                        if variance_percent <= 15:
                            location_validation['validation_notes'].append(f"✅ {key} within tolerance")
                        else:
                            location_validation['validation_notes'].append(f"❌ {key} outside tolerance")
                    else:
                        # Direct comparison
                        variance = abs(pdf_value - system_rates['totalCost'])
                        variance_percent = (variance / system_rates['totalCost']) * 100
                        
                        print(f"  {key}: {pdf_value} (direct comparison)")
                        print(f"  Variance: {variance:.1f} ({variance_percent:.1f}%)")
                        
                        location_validation['pdf_direct_value'] = pdf_value
                        location_validation['variance_percent'] = variance_percent
                        location_validation['within_tolerance'] = variance_percent <= 15
        
        validation_results.append(location_validation)
    
    return validation_results, successful_tests, failed_tests

def generate_comprehensive_report(validation_results, successful_tests, failed_tests):
    """Generate comprehensive validation report"""
    
    print("\n=== COMPREHENSIVE T&T PDF VALIDATION REPORT ===")
    
    total_tests = len(successful_tests) + len(failed_tests)
    successful_validations = len([v for v in validation_results if v.get('within_tolerance', False)])
    
    print(f"\n📊 SUMMARY STATISTICS:")
    print(f"Total locations tested: {total_tests}")
    print(f"System API successful: {len(successful_tests)}")
    print(f"System API failed: {len(failed_tests)}")
    print(f"Rate validations within tolerance: {successful_validations}")
    print(f"Overall success rate: {(successful_validations / total_tests * 100):.1f}%")
    
    if successful_validations > 0:
        print(f"\n✅ SUCCESSFUL VALIDATIONS:")
        for validation in validation_results:
            if validation.get('within_tolerance', False):
                print(f"  {validation['location']}: {validation.get('variance_percent', 0):.1f}% variance")
    
    if len(validation_results) > successful_validations:
        print(f"\n❌ FAILED VALIDATIONS:")
        for validation in validation_results:
            if not validation.get('within_tolerance', False):
                print(f"  {validation['location']}: {validation.get('variance_percent', 0):.1f}% variance")
    
    if failed_tests:
        print(f"\n⚠️  SYSTEM API FAILURES:")
        for test in failed_tests:
            print(f"  {test['location']}: {test['error']}")
    
    print(f"\n=== CONCLUSION ===")
    if successful_validations >= total_tests * 0.8:
        print("✅ T&T PDF VALIDATION PASSED")
        print("System rates are consistent with PDF source document data")
    else:
        print("❌ T&T PDF VALIDATION FAILED")
        print("System rates deviate significantly from PDF source document data")
        print("Recommend updating T&T data to match PDF source")
    
    return {
        'total_tests': total_tests,
        'successful_api_calls': len(successful_tests),
        'failed_api_calls': len(failed_tests),
        'successful_validations': successful_validations,
        'success_rate': (successful_validations / total_tests * 100) if total_tests > 0 else 0,
        'passed': successful_validations >= total_tests * 0.8
    }

def main():
    """Main function to run comprehensive PDF validation"""
    
    print("=== T&T STEP 3: PDF SOURCE DOCUMENT VALIDATION ===")
    print("Validating system against actual T&T PDF source document")
    
    # Load PDF extraction results
    pdf_data = load_pdf_extraction_results()
    if not pdf_data:
        return
    
    # Analyze PDF cost data
    pdf_rates = analyze_pdf_cost_data(pdf_data)
    
    if not pdf_rates:
        print("❌ No usable cost data found in PDF extraction")
        return
    
    # Test system against PDF data
    test_results = test_system_against_pdf_data(pdf_rates)
    
    # Validate rates
    validation_results, successful_tests, failed_tests = validate_rates_against_pdf(test_results)
    
    # Generate comprehensive report
    report = generate_comprehensive_report(validation_results, successful_tests, failed_tests)
    
    # Save results
    final_results = {
        'pdf_rates': pdf_rates,
        'test_results': test_results,
        'validation_results': validation_results,
        'report': report,
        'timestamp': pd.Timestamp.now().isoformat()
    }
    
    with open('tt_step3_pdf_validation_results.json', 'w') as f:
        json.dump(final_results, f, indent=2)
    
    print(f"\n✅ Complete validation results saved to tt_step3_pdf_validation_results.json")

if __name__ == "__main__":
    main()