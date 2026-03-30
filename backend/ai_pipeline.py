import os
import requests
import time
import base64
import json
from PIL import Image
from dotenv import load_dotenv

import google.generativeai as genai

load_dotenv()

# --- API KEYS ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY") 

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# --- 1. GEMINI VISION API (Using gemini-3-flash-preview) ---
def analyze_xray(image_path):
    print("🔍 Sending X-Ray to Gemini Vision API (gemini-3-flash-preview)...")
    
    if not GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY is missing!")
        return {"Pneumonia": 0.0, "Normal": 100.0, "error": "API Key Missing"}

    try:
        # Using your exact working model
        model = genai.GenerativeModel("models/gemini-3-flash-preview")
        
        # Open the image using PIL (Gemini SDK handles PIL images directly!)
        img = Image.open(image_path).convert('RGB')
        
        vision_prompt = """
        You are an expert AI radiologist. Analyze this chest X-ray image. 
        Return ONLY a raw JSON object with exactly two keys: "Pneumonia" and "Normal". 
        The values must be numbers (probabilities out of 100) that add up to 100. 
        Do not include markdown blocks, text, or explanations. 
        Example: {"Pneumonia": 85.5, "Normal": 14.5}
        """
        
        # Pass both the text prompt and the image object directly
        response = model.generate_content([vision_prompt, img])
        
        result_text = response.text.strip()
        
        # Clean up markdown formatting if Gemini adds it
        if result_text.startswith("```json"):
            result_text = result_text.replace("```json", "").replace("```", "").strip()
        elif result_text.startswith("```"):
            result_text = result_text.replace("```", "").strip()
            
        cleaned_results = json.loads(result_text)
        print("✅ Gemini Vision Analysis Complete!")
        
        return cleaned_results
        
    except Exception as e:
        print(f"⚠️ Gemini API Error: {str(e)}")
        return {"Pneumonia": 0.0, "Normal": 100.0, "error": "Gemini API failed. Defaulting to baseline."}


# --- 2. MULTIMODAL CLINICAL LOGIC ENGINE ---
def analyze_clinical_vitals(vitals):
    risk_factors = {
        "Cancer_Risk": "Low", "TB_Risk": "Low", "Pneumonia_Risk": "Low",
        "Diabetes_Risk": "Low", "Asthma_Risk": "Low", "Clinical_Notes": []
    }
    
    # A. Lifestyle Info
    age = int(vitals.get("age", 0))
    smoking_history = int(vitals.get("smoking_history", 0)) 
    
    # B. Wearable Sensor Streams
    o2_saturation = int(vitals.get("o2_saturation", 98))
    heart_rate = int(vitals.get("heart_rate", 75))
    
    # C. EHR / Lab Results
    fasting_glucose = float(vitals.get("fasting_glucose", 90))
    hba1c = float(vitals.get("hba1c", 5.0))
    
    # D. Genomic Data
    genomic_risk = vitals.get("genomic_risk", "Low").title() 
    
    # E. Symptoms
    weight_loss = vitals.get("weight_loss", "no").lower() == "yes"
    cough_duration = int(vitals.get("cough_duration", 0)) 

    # --- DISEASE PREDICTION LOGIC ---

    if smoking_history > 15 or (genomic_risk == "High" and smoking_history > 5):
        risk_factors["Cancer_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("Genomic markers combined with lifestyle (smoking) indicate elevated lung cancer risk.")

    if fasting_glucose > 125 or hba1c >= 6.5:
        risk_factors["Diabetes_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("EHR lab results (Elevated HbA1c/Glucose) strongly indicate Diabetes Mellitus.")

    if cough_duration > 14 and 92 <= o2_saturation <= 95 and heart_rate > 90:
        risk_factors["Asthma_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("Wearable sensor streams (elevated HR, mild O2 drop) with chronic cough suggest Asthma/COPD.")

    if weight_loss and cough_duration > 14:
        risk_factors["TB_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("Unexplained weight loss and prolonged cough strongly suggest Tuberculosis evaluation.")

    if o2_saturation < 92:
        risk_factors["Pneumonia_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("Critical drop in wearable O2 saturation indicates acute respiratory distress/infection.")

    return risk_factors

# --- 3. HYBRID FUSION ENGINE (Mistral LLM + Fallback) ---
def generate_clinical_insight(radiology_results, clinical_results):
    print("🧠 Attempting Multimodal Fusion via Ollama (Mistral)...")
    prompt = f"""You are an expert AI diagnostic assistant. I am providing you with two data points for a patient:
1. Radiology (X-Ray Model Output): {radiology_results}
2. Clinical Vitals, EHR, Genomics & Wearables: {clinical_results}

Task: 
1. Provide a final prioritized diagnosis based on the synthesis of all modalities.
2. Write a highly professional, explainable clinical insight detailing *why* this diagnosis was reached.
3. Outline immediate preventive care strategies.
Keep the response concise, structured, and strictly medical. Use bullet points."""

    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            "model": "mistral", "prompt": prompt, "stream": False
        }, timeout=60) 
        
        if response.status_code == 200:
            print("✅ Mistral Fusion Successful!")
            mistral_text = response.json()['response']
            confidence = max(radiology_results.values()) if radiology_results and not radiology_results.get("error") else 0
            risk_level = "LOW" if "Normal respiratory function" in mistral_text else "HIGH"
            return {"insight_text": mistral_text, "confidence": confidence, "risk_level": risk_level}
        else:
            print(f"⚠️ Mistral returned {response.status_code}. Triggering Fallback...")
    except Exception as e:
        print(f"⚠️ Mistral Connection Failed ({str(e)}). Triggering Fallback...")

    # THE SILENT FALLBACK 
    print("🛡️ Fallback Engine Activated: Generating deterministic clinical insight.")
    high_risks = []
    if clinical_results.get("Cancer_Risk") == "High": high_risks.append("Lung Cancer")
    if clinical_results.get("TB_Risk") == "High": high_risks.append("Tuberculosis")
    if clinical_results.get("Diabetes_Risk") == "High": high_risks.append("Diabetes Type 2")
    if clinical_results.get("Asthma_Risk") == "High": high_risks.append("Asthma/COPD")
    if radiology_results.get("Pneumonia", 0) > 70 or clinical_results.get("Pneumonia_Risk") == "High": high_risks.append("Acute Pneumonia")

    primary_diagnosis = f"Elevated risk detected for: {', '.join(high_risks)}." if high_risks else "Normal health parameters."

    insight_bullets = []
    pneumonia_prob = radiology_results.get('Pneumonia', 0)
    if pneumonia_prob > 50: insight_bullets.append(f"Radiological Assessment: Infection opacity detected ({pneumonia_prob}%).")
    
    if clinical_results.get("Clinical_Notes"):
        insight_bullets.append(f"Multimodal Synthesis: {' '.join(clinical_results['Clinical_Notes'])}")

    if "Diabetes Type 2" in high_risks: insight_bullets.append("Preventive Action: Start continuous glucose monitoring and consult endocrinologist.")
    if "Asthma/COPD" in high_risks: insight_bullets.append("Preventive Action: Prescribe bronchodilator inhaler and monitor wearable HR/O2 trends.")
    if "Lung Cancer" in high_risks: insight_bullets.append("Preventive Action: Immediate referral for Low-Dose CT (LDCT) scan.")
    if "Tuberculosis" in high_risks: insight_bullets.append("Preventive Action: Isolate patient, initiate sputum AFB smear/culture.")
    if "Acute Pneumonia" in high_risks: insight_bullets.append("Preventive Action: Administer supplemental oxygen and consider broad-spectrum antibiotics.")
    
    if not high_risks: insight_bullets.append("Preventive Action: Maintain routine annual check-ups.")

    final_text = f"Primary Multimodal Diagnosis: {primary_diagnosis}\n\nExplainable Insights:\n"
    for bullet in insight_bullets: final_text += f"• {bullet}\n"

    confidence = max(radiology_results.values()) if radiology_results and not radiology_results.get("error") else 0
    risk_level = "HIGH" if high_risks else "LOW"
    return {"insight_text": final_text, "confidence": confidence, "risk_level": risk_level}

# --- 4. ELEVENLABS AUDIO GENERATOR ---
def generate_audio_recommendation(text):
    """Generates multilingual voice suggestions using ElevenLabs."""
    
    # TEMPORARY KILL SWITCH TO SAVE CREDITS DURING DEVELOPMENT
    print("⏸️ ElevenLabs is temporarily disabled for testing. (Remove 'return None' to activate)")
    return None

    if not ELEVENLABS_API_KEY:
        print("⚠️ ElevenLabs API Key missing!")
        return None
        
    print("🎙️ Generating Voice Recommendation via ElevenLabs...")
    url = "[https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL](https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL)"
    headers = {"Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY}
    
    short_text = text.split("Preventive Action:")[-1] if "Preventive Action:" in text else "Stay alert and consult a doctor."
    if len(short_text) > 200: short_text = short_text[:200] + "..."

    data = {"text": short_text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}}
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            print("✅ Audio Generated Successfully!")
            return audio_base64
        else:
            print(f"⚠️ ElevenLabs Error: {response.text}")
            return None
    except Exception as e:
        print(f"⚠️ ElevenLabs Exception: {str(e)}")
        return None