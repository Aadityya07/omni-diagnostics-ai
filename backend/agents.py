import base64
import requests
import json
import os
import fitz  # PyMuPDF for handling PDFs

# --- AGENT 1: THE TRIAGE AGENT (The Bouncer via Local Ollama) ---
def triage_xray_agent(image_path):
    """
    Acts as a strict bouncer. Verifies if the uploaded image is actually a Chest X-Ray using LLaVA.
    """
    print("🕵️ [Agent: Triage] Scanning image via local Ollama (llava) to verify it is a valid Chest X-Ray...")
    
    try:
        # Convert the saved image file into a base64 string that Ollama can read
        with open(image_path, "rb") as img_file:
            base64_image = base64.b64encode(img_file.read()).decode('utf-8')
        
        prompt = """
        You are a medical triage AI. Your ONLY job is to determine if this image is a radiological scan of the chest/lungs.
        
        VALID images include:
        1. Chest X-Rays.
        2. Axial CT Scans. Axial CT scans look like grayscale ovals/circles with a white spine at the bottom, white ribs around the edges, and dark spaces for lungs.
        
        CRITICAL INSTRUCTION: Grayscale cross-sectional CT slices are VALID medical scans. Do NOT mistake them for photographs of open bodies or abdomens. If it is a grayscale image showing internal anatomy (bones, lungs, tissue), it is valid.
        
        If it is a normal color photograph of a person, animal, or object, it is invalid.
        
        Answer ONLY with a JSON object containing two keys: "is_valid" (boolean) and "reason" (string).
        Example 1: {"is_valid": true, "reason": "This is a valid grayscale CT scan showing lung and heart tissue."}
        Example 2: {"is_valid": false, "reason": "This is a color photograph of a dog, not a medical scan."}
        Do not include any markdown, backticks, or extra text. Just the raw JSON.
        """
        
        # Send the request to local Ollama
        response = requests.post('http://localhost:11434/api/generate', json={
            "model": "llava", 
            "prompt": prompt,
            "images": [base64_image],
            "stream": False
            # Notice: NO "format": "json" here to prevent the 500 crash!
        }, timeout=60)
        
        if response.status_code == 200:
            result_text = response.json().get('response', '').strip()
            
            # Smart extraction: Find the first '{' and last '}' just in case LLaVA adds conversational text
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                result_text = result_text[start_idx:end_idx+1]
                
            return json.loads(result_text)
        else:
            print(f"⚠️ [Agent: Triage] Ollama returned status {response.status_code}")
            return {"is_valid": True, "reason": "Local vision agent unavailable. Permitting upload."}
            
    except Exception as e:
        print(f"⚠️ [Agent: Triage] Verification Error: {str(e)}")
        return {"is_valid": True, "reason": f"Local vision agent failed ({str(e)}). Permitting upload."}


# --- AGENT 2: THE MEDICAL EXTRACTION AGENT (Via Local Ollama) ---
def extract_lab_report_agent(report_image_path):
    """
    Reads a patient's physical lab report (image or PDF) and extracts vitals automatically using LLaVA.
    """
    print("📄 [Agent: Data Extractor] Scanning lab report for patient vitals via local Ollama...")
    
    try:
        base64_image = ""
        
        # Check if the file is a PDF
        if report_image_path.lower().endswith('.pdf'):
            print("📄 Detected PDF. Converting first page to image...")
            pdf_document = fitz.open(report_image_path)
            first_page = pdf_document[0]
            # Zoom in 2x so the text is crisp and readable for LLaVA
            pix = first_page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_bytes = pix.tobytes("png")
            base64_image = base64.b64encode(img_bytes).decode('utf-8')
            pdf_document.close()
        else:
            # It's an image file
            with open(report_image_path, "rb") as img_file:
                base64_image = base64.b64encode(img_file.read()).decode('utf-8')
            
        prompt = """
        You are a highly precise data extraction bot. Read this medical document and find these four numbers.
        Respond ONLY with a valid JSON dictionary. Do not write any other words, explanations, or markdown formatting. 
        If a value is missing, use null.
        
        Example Output:
        {"heart_rate": 88, "o2_saturation": 96, "fasting_glucose": 145.5, "hba1c": 7.2}
        """
        
        response = requests.post('http://localhost:11434/api/generate', json={
            "model": "llava", 
            "prompt": prompt,
            "images": [base64_image],
            "stream": False
        }, timeout=60)
        
        if response.status_code == 200:
            result_text = response.json().get('response', '').strip()
            
            # --- NEW: Print exact LLaVA output to terminal for debugging ---
            print(f"🤖 RAW LLaVA Output: {result_text}")
            
            # Smart extraction: Find the first '{' and last '}' to ignore extra text
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                clean_json = result_text[start_idx:end_idx+1]
                parsed_data = json.loads(clean_json)
                print(f"✅ Successfully Extracted: {parsed_data}")
                return parsed_data
            else:
                print("⚠️ [Agent: Data Extractor] LLaVA did not return valid JSON brackets.")
                return {"heart_rate": None, "o2_saturation": None, "fasting_glucose": None, "hba1c": None}
        else:
            print(f"⚠️ [Agent: Data Extractor] Ollama returned status {response.status_code}")
            return {"heart_rate": None, "o2_saturation": None, "fasting_glucose": None, "hba1c": None}
            
    except Exception as e:
        print(f"⚠️ [Agent: Data Extractor] Error: {str(e)}")
        return {"heart_rate": None, "o2_saturation": None, "fasting_glucose": None, "hba1c": None}