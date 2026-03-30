import os
import requests
import time
import io
import base64
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# --- API KEYS ---
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY") # Add this to your .env file

HF_API_URL = "https://api-inference.huggingface.co/models/nickmuchi/vit-finetuned-chest-xray-pneumonia"
headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# --- 1. REAL HUGGING FACE INFERENCE API (Cloud Vision) ---
def analyze_xray(image_path):
    print("🔍 Compressing and Sending X-Ray to Hugging Face Cloud...")
    
    try:
        # Compressing the image to prevent IncompleteRead network errors
        img = Image.open(image_path).convert('RGB')
        img.thumbnail((512, 512)) # Shrinking the dimensions
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        image_data = img_byte_arr.getvalue()
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(HF_API_URL, headers=headers, data=image_data, timeout=30)
                
                if response.status_code == 200:
                    results = response.json()
                    cleaned_results = {res['label'].capitalize(): round(res['score'] * 100, 2) for res in results}
                    print("✅ Precision Vision Analysis Complete!")
                    return cleaned_results
                else:
                    print(f"⚠️ HF API Error (Attempt {attempt+1}): {response.status_code}")
                    time.sleep(2)
            except Exception as e:
                print(f"⚠️ Network Drop (Attempt {attempt+1}): {str(e)}")
                time.sleep(2)

        print("❌ HF API Failed after 3 retries. Returning baseline.")
        return {"Pneumonia": 0.0, "Normal": 100.0, "error": "Network unstable. Defaulting to baseline."}
    
    except Exception as e:
        print(f"⚠️ Compression/File Error: {str(e)}")
        return {"error": str(e)}

# --- 2. CLINICAL LOGIC ENGINE ---
def analyze_clinical_vitals(vitals):
    risk_factors = {
        "Cancer_Risk": "Low",
        "TB_Risk": "Low",
        "Pneumonia_Risk": "Low",
        "Clinical_Notes": []
    }
    age = int(vitals.get("age", 0))
    smoking_history = int(vitals.get("smoking_history", 0)) 
    o2_saturation = int(vitals.get("o2_saturation", 98))
    weight_loss = vitals.get("weight_loss", "no").lower() == "yes"
    cough_duration = int(vitals.get("cough_duration", 0)) 

    if smoking_history > 15 and age > 50:
        risk_factors["Cancer_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("High smoking history combined with age indicates elevated lung cancer risk.")
    elif smoking_history > 5:
        risk_factors["Cancer_Risk"] = "Moderate"

    if weight_loss and cough_duration > 14:
        risk_factors["TB_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("Unexplained weight loss and prolonged cough strongly suggest Tuberculosis evaluation.")

    if o2_saturation < 92:
        risk_factors["Pneumonia_Risk"] = "High"
        risk_factors["Clinical_Notes"].append("Critical drop in O2 saturation indicates acute respiratory distress/infection.")

    return risk_factors

# --- 3. HYBRID FUSION ENGINE (Mistral LLM + Fallback) ---
def generate_clinical_insight(radiology_results, clinical_results):
    print("🧠 Attempting Multimodal Fusion via Ollama (Mistral)...")
    prompt = f"""You are an expert AI diagnostic assistant. I am providing you with two data points for a patient:
1. Radiology (X-Ray Model Output): {radiology_results}
2. Clinical Vitals & Risk Factors: {clinical_results}

Task: 
1. Provide a final prioritized diagnosis based on the synthesis of both modalities.
2. Write a highly professional, explainable clinical insight detailing *why* this diagnosis was reached.
3. Outline immediate preventive care strategies.
Keep the response concise, structured, and strictly medical. Use bullet points."""

    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            "model": "mistral", 
            "prompt": prompt,
            "stream": False
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

    print("🛡️ Fallback Engine Activated: Generating deterministic clinical insight.")
    high_risks = []
    if clinical_results.get("Cancer_Risk") == "High": high_risks.append("Lung Cancer")
    if clinical_results.get("TB_Risk") == "High": high_risks.append("Tuberculosis")
    if radiology_results.get("Pneumonia", 0) > 70 or clinical_results.get("Pneumonia_Risk") == "High": high_risks.append("Acute Pneumonia")

    primary_diagnosis = f"Elevated risk detected for: {', '.join(high_risks)}." if high_risks else "Normal respiratory function."

    insight_bullets = []
    pneumonia_prob = radiology_results.get('Pneumonia', 0)
    insight_bullets.append(f"Radiological Assessment: Model detected opacity consistent with infection (Confidence: {pneumonia_prob}%)." if pneumonia_prob > 50 else "Radiological Assessment: No significant acute opacities detected.")
    
    if clinical_results.get("Clinical_Notes"):
        insight_bullets.append(f"Clinical Vitals Synthesis: {' '.join(clinical_results['Clinical_Notes'])}")

    if "Lung Cancer" in high_risks:
        insight_bullets.append("Preventive Action: Immediate referral for Low-Dose CT (LDCT) scan and pulmonology consultation.")
    elif "Tuberculosis" in high_risks:
        insight_bullets.append("Preventive Action: Isolate patient, initiate sputum AFB smear/culture.")
    elif "Acute Pneumonia" in high_risks:
        insight_bullets.append("Preventive Action: Administer supplemental oxygen and consider broad-spectrum antibiotics.")
    else:
        insight_bullets.append("Preventive Action: Maintain routine annual check-ups.")

    final_text = f"Primary Multimodal Diagnosis: {primary_diagnosis}\n\nExplainable Insights:\n"
    for bullet in insight_bullets:
        final_text += f"• {bullet}\n"

    confidence = max(radiology_results.values()) if radiology_results and not radiology_results.get("error") else 0
    risk_level = "HIGH" if high_risks else "LOW"
    
    return {"insight_text": final_text, "confidence": confidence, "risk_level": risk_level}

# --- 4. ELEVENLABS AUDIO GENERATOR (NEW USP) ---
def generate_audio_recommendation(text):
    """Generates multilingual voice suggestions using ElevenLabs."""
    if not ELEVENLABS_API_KEY:
        print("⚠️ ElevenLabs API Key missing!")
        return None
        
    print("🎙️ Generating Voice Recommendation via ElevenLabs...")
    url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" # Bella voice ID
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    # Extract just a short summary for audio to save API credits & time
    short_text = text.split("Preventive Action:")[-1] if "Preventive Action:" in text else "Stay alert and consult a doctor."
    if len(short_text) > 200:
        short_text = short_text[:200] + "..."

    data = {
        "text": short_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            # Convert audio to Base64 so React can play it directly
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            print("✅ Audio Generated Successfully!")
            return audio_base64
        else:
            print(f"⚠️ ElevenLabs Error: {response.text}")
            return None
    except Exception as e:
        print(f"⚠️ ElevenLabs Exception: {str(e)}")
        return None
    
    