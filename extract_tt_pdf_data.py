#!/usr/bin/env python3
"""
Extract T&T cost data from the actual PDF source document
"""

import pandas as pd
import sys
import json
import re
from pathlib import Path

# Try importing PDF processing libraries
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

def extract_tt_data_from_pdf():
    """Extract T&T cost data from the PDF source document"""
    
    pdf_path = Path("attached_assets/T&T Source Document/T&T Global Fitout Cost Guide 2025.pdf")
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return None
    
    print(f"📖 Processing T&T PDF: {pdf_path}")
    
    # Try different methods to extract data
    extracted_data = None
    
    if PDFPLUMBER_AVAILABLE:
        extracted_data = extract_with_pdfplumber(pdf_path)
    elif PDF_AVAILABLE:
        extracted_data = extract_with_pypdf(pdf_path)
    else:
        print("❌ No PDF processing library available")
        return None
    
    return extracted_data

def extract_with_pdfplumber(pdf_path):
    """Extract data using pdfplumber"""
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
        return process_extracted_data(all_text, tables)
        
    except Exception as e:
        print(f"❌ Error with pdfplumber: {e}")
        return None

def extract_with_pypdf(pdf_path):
    """Extract data using PyPDF2"""
    try:
        import PyPDF2
        
        print("Using PyPDF2 for extraction...")
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            all_text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                all_text += f"\n--- Page {page_num + 1} ---\n"
                all_text += page_text
        
        return process_extracted_data(all_text, [])
        
    except Exception as e:
        print(f"❌ Error with PyPDF2: {e}")
        return None

def process_extracted_data(text, tables):
    """Process extracted text and tables to find cost data"""
    
    print("\n=== PROCESSING EXTRACTED DATA ===")
    
    # Look for cost data patterns
    cost_patterns = [
        r'(\w+(?:\s+\w+)*)\s*[:\-]\s*(?:£|USD?\s*)?(\d+(?:\.\d+)?)\s*(?:per\s*)?(?:sq\s*ft|sqft|m2|sqm)?',
        r'(\w+(?:\s+\w+)*)\s*(?:£|USD?\s*)?(\d+(?:\.\d+)?)\s*(?:per\s*)?(?:sq\s*ft|sqft|m2|sqm)?',
        r'(Construction|Furniture|Audio[- ]?Visual|Professional\s*Fees?)\s*[:\-]?\s*(?:£|USD?\s*)?(\d+(?:\.\d+)?)'
    ]
    
    locations_found = []
    cost_data = {}
    
    # Search for location and cost information
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Look for location patterns
        if any(country in line.lower() for country in ['france', 'germany', 'canada', 'united kingdom', 'united states', 'singapore']):
            locations_found.append(line)
        
        # Look for cost patterns
        for pattern in cost_patterns:
            matches = re.findall(pattern, line, re.IGNORECASE)
            if matches:
                for match in matches:
                    component = match[0].strip()
                    cost = match[1].strip()
                    print(f"Found cost: {component} = {cost}")
    
    # Process tables
    print(f"\n=== PROCESSING {len(tables)} TABLES ===")
    
    for table_num, table in enumerate(tables):
        if not table:
            continue
            
        print(f"\nTable {table_num + 1}:")
        
        # Convert table to DataFrame for easier processing
        if len(table) > 0:
            try:
                df = pd.DataFrame(table[1:], columns=table[0])
                print(f"Table shape: {df.shape}")
                print("Table columns:", df.columns.tolist())
                
                # Look for cost-related columns
                cost_columns = [col for col in df.columns if col and any(
                    keyword in str(col).lower() for keyword in ['cost', 'price', '£', '$', 'usd', 'gbp']
                )]
                
                if cost_columns:
                    print(f"Found cost columns: {cost_columns}")
                    print(df[cost_columns].head())
                
                # Look for location-related data
                location_columns = [col for col in df.columns if col and any(
                    keyword in str(col).lower() for keyword in ['country', 'city', 'location', 'market']
                )]
                
                if location_columns:
                    print(f"Found location columns: {location_columns}")
                    print(df[location_columns].head())
                
            except Exception as e:
                print(f"Error processing table {table_num + 1}: {e}")
    
    return {
        'locations_found': locations_found,
        'cost_data': cost_data,
        'tables_processed': len(tables),
        'text_length': len(text)
    }

def main():
    """Main function to extract and validate T&T data"""
    
    print("=== T&T PDF DATA EXTRACTION ===")
    
    # Check if PDF libraries are available
    print(f"PyPDF2 available: {PDF_AVAILABLE}")
    print(f"pdfplumber available: {PDFPLUMBER_AVAILABLE}")
    
    if not PDF_AVAILABLE and not PDFPLUMBER_AVAILABLE:
        print("❌ No PDF processing libraries available")
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pdfplumber'])
        
        # Try importing again
        try:
            import pdfplumber
            global PDFPLUMBER_AVAILABLE
            PDFPLUMBER_AVAILABLE = True
            print("✅ pdfplumber installed successfully")
        except ImportError:
            print("❌ Failed to install pdfplumber")
            return
    
    # Extract data from PDF
    extracted_data = extract_tt_data_from_pdf()
    
    if extracted_data:
        print("\n=== EXTRACTION RESULTS ===")
        print(json.dumps(extracted_data, indent=2))
        
        # Save results to file
        with open('tt_pdf_extracted_data.json', 'w') as f:
            json.dump(extracted_data, f, indent=2)
        
        print("\n✅ Data extracted and saved to tt_pdf_extracted_data.json")
    else:
        print("\n❌ Failed to extract data from PDF")

if __name__ == "__main__":
    main()