import io
import base64
from gtts import gTTS
import re
import os
import requests
import time
import base64
import json
from PIL import Image
from dotenv import load_dotenv


from tensorflow.keras.models import load_model

load_dotenv()

# --- API KEYS ---
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY") 


# ====================================================================
# --- 1. LOCAL CNN RADIOLOGY ENGINE (Replaces Gemini completely!) ---
# ====================================================================
import numpy as np
import os
import h5py
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense
from tensorflow.keras.applications import Xception
from tensorflow.keras.preprocessing import image as keras_image

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'best_model.hdf5')

try:
    print("🧠 Building CNN and Extracting Top-Layer Weights...")
    
    # 1. Base Model (Fresh ImageNet weights, completely bypassing the corrupted H5 Xception base)
    base_model = Xception(weights='imagenet', include_top=False, input_shape=(350, 350, 3))
    base_model.trainable = False 
    
    # 2. Recreate Architecture
    lung_cancer_model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dense(4, activation='softmax')
    ])
    lung_cancer_model.build((None, 350, 350, 3))
    
    # 3. SURGICAL EXTRACTION: Pull ONLY the dense layer weights directly from the HDF5 file
    print("💉 Surgically extracting Dense weights from best_model.hdf5...")
    
    with h5py.File(MODEL_PATH, 'r') as f:
        # Helper function to recursively find arrays by their exact mathematical shape
        def find_weights(group, target_shape):
            for key, item in group.items():
                if isinstance(item, h5py.Dataset):
                    if item.shape == target_shape:
                        return item[()]
                elif isinstance(item, h5py.Group):
                    res = find_weights(item, target_shape)
                    if res is not None:
                        return res
            return None
        
        # Xception outputs 2048 features, and we have 4 classes.
        # So we search the file for the exact matrices: Kernel (2048, 4) and Bias (4,)
        kernel_weights = find_weights(f, (2048, 4))
        bias_weights = find_weights(f, (4,))
        
        if kernel_weights is not None and bias_weights is not None:
            # Inject them straight into the final Dense layer
            lung_cancer_model.layers[-1].set_weights([kernel_weights, bias_weights])
            print("✅ Trained Weights Surgically Injected!")
        else:
            raise ValueError("Could not locate (2048, 4) kernel or (4,) bias in the HDF5 file.")
            
    print("✅ CNN Engine is Fully Armed and Ready!")
    
except Exception as e:
    print(f"⚠️ CRITICAL: Failed to load CNN model: {e}")
    lung_cancer_model = None

def analyze_xray(image_path):
    print("🔍 Analyzing X-Ray using Local CNN Model...")
    
    if lung_cancer_model is None:
        return {"Pneumonia": 0, "Lung_Cancer": 0, "Tuberculosis": 0, "Normal": 100, "error": "Model not loaded"}

    try:
        target_size = (350, 350)
        
        img = keras_image.load_img(image_path, target_size=target_size)
        img_array = keras_image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0  
        
        predictions = lung_cancer_model.predict(img_array)[0]
        
        # --- PROBABILITY SMOOTHING (Margin of Error) ---
        # We reserve 12% uncertainty distributed across all classes to prevent unrealistic 100% / 0% scores
        uncertainty = 0.12 
        
        prob_adeno = (float(predictions[0]) * (1 - uncertainty)) + (uncertainty / 4)
        prob_large = (float(predictions[1]) * (1 - uncertainty)) + (uncertainty / 4)
        prob_normal = (float(predictions[2]) * (1 - uncertainty)) + (uncertainty / 4)
        prob_squamous = (float(predictions[3]) * (1 - uncertainty)) + (uncertainty / 4)
        
        adeno_pct = int(round(prob_adeno * 100))
        large_pct = int(round(prob_large * 100))
        squamous_pct = int(round(prob_squamous * 100))
        normal_pct = int(round(prob_normal * 100))
        
        total_cancer_pct = adeno_pct + large_pct + squamous_pct
        
        print(f"📊 REALISTIC CLINICAL CONFIDENCE:")
        print(f"   Adenocarcinoma:     {adeno_pct}%")
        print(f"   Large Cell Cancer:  {large_pct}%")
        print(f"   Squamous Cancer:    {squamous_pct}%")
        print(f"   Normal/Healthy:     {normal_pct}%")
        print("-" * 40)
        
        return {
            "Pneumonia": 0,  
            "Lung_Cancer": total_cancer_pct, 
            "Tuberculosis": 0, 
            "Normal": normal_pct,
            "Subtypes": {
                "Adenocarcinoma": adeno_pct,
                "Large_Cell": large_pct,
                "Squamous": squamous_pct
            }
        }
        
    except Exception as e:
        print(f"⚠️ Local CNN Error: {str(e)}")
        return {"Pneumonia": 0, "Lung_Cancer": 0, "Tuberculosis": 0, "Normal": 100, "error": str(e)}
    

# --- 2. PROBABILISTIC CLINICAL ENGINE (Simulated ML) ---
def analyze_clinical_vitals(vitals):
    # Extract values
    age = int(vitals.get("age", 0))
    pack_years = int(vitals.get("smoking_history", 0)) 
    o2_saturation = int(vitals.get("o2_saturation", 98))
    heart_rate = int(vitals.get("heart_rate", 75))
    fasting_glucose = float(vitals.get("fasting_glucose", 90))
    hba1c = float(vitals.get("hba1c", 5.0))
    genomic_risk = vitals.get("genomic_risk", "Low").title() 
    weight_loss = vitals.get("weight_loss", "no").lower() == "yes"
    cough_duration = int(vitals.get("cough_duration", 0)) 

    notes = []

    # --- DYNAMIC RISK SCORING ALGORITHM (0-100%) ---
    # LUNG CANCER MATH REMOVED: Lung Cancer is now 100% determined by the CNN.

    # 2. TB Risk Calculation
    tb_risk = 5
    if weight_loss: tb_risk += 40
    if cough_duration > 14: tb_risk += 35
    if tb_risk > 50: notes.append("Constitutional symptoms strongly correlate with Tuberculosis profiles.")

    # 3. Diabetes Risk Calculation
    diabetes_risk = 5
    if fasting_glucose > 100: diabetes_risk += ((fasting_glucose - 100) * 1.5)
    if hba1c > 5.7: diabetes_risk += ((hba1c - 5.7) * 20)
    if diabetes_risk > 60: notes.append("Metabolic panels indicate severe glycemic dysregulation.")

    # 4. Asthma / COPD Calculation
    asthma_risk = 10
    if pack_years > 5: asthma_risk += 20
    if cough_duration > 7: asthma_risk += 15
    if o2_saturation < 95: asthma_risk += ((95 - o2_saturation) * 5)

    # 5. Pneumonia Clinical Base Risk
    pneumonia_risk = 5
    if cough_duration > 3: pneumonia_risk += 15
    if o2_saturation < 94: pneumonia_risk += ((94 - o2_saturation) * 8)
    if heart_rate > 100: pneumonia_risk += 15

    # 6. Heart Disease Risk Calculation
    heart_risk = 5
    if age > 50: heart_risk += (age - 50) * 1.2
    if pack_years > 5: heart_risk += 15
    if heart_rate > 100: heart_risk += 25
    elif heart_rate > 85: heart_risk += 10
    if fasting_glucose > 125: heart_risk += 15
    if heart_risk > 60: notes.append("Cardiovascular parameters indicate elevated risk of heart disease.")

    # Cap all risks at a maximum of 95%
    return {
        "TB_Risk": min(int(tb_risk), 95),
        "Diabetes_Risk": min(int(diabetes_risk), 95),
        "Asthma_Risk": min(int(asthma_risk), 95),
        "Pneumonia_Risk": min(int(pneumonia_risk), 95),
        "Heart_Risk": min(int(heart_risk), 95),
        "Clinical_Notes": notes if notes else ["Vitals are within standard baseline parameters."]
    }


import io
import base64
from gtts import gTTS


# --- 3. HYBRID FUSION ENGINE (Mistral LLM + Fallback) ---
def generate_clinical_insight(radiology_results, clinical_results):
    print("🧠 Attempting Multimodal Fusion via Ollama (Mistral)...")
    
    # 1. PYTHON DOES THE MATH (Never trust the LLM with math)
    cancer_score = radiology_results.get("Lung_Cancer", 0)
    cancer_evaluation = "HIGH RISK / CRITICAL" if cancer_score >= 50 else "LOW RISK / NORMAL"
    
    prompt = f"""You are a strict, expert AI diagnostic assistant. Synthesize these two data points into a medical assessment:
    1. Radiology Output: {radiology_results} 
    (CRITICAL: The math dictates this patient has {cancer_evaluation} of Lung Cancer. You MUST state that it is {cancer_evaluation}).
    2. Clinical Vitals: {clinical_results}

    FORMAT RULES:
    You MUST structure your response into exactly two sections using these exact uppercase headers:
    EXPLANATION:
    [2 paragraphs explaining the {cancer_evaluation} diagnosis and vitals. Bold diseases with HTML <b>.]
    
    RECOMMENDATION:
    [2 sentences of direct clinical advice based ONLY on the actual elevated risks.]
    """

    def get_confidence():
        if not radiology_results or radiology_results.get("error"): return 0
        return max(radiology_results.get("Lung_Cancer", 0), radiology_results.get("Normal", 0))

    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            "model": "mistral", "prompt": prompt, "stream": False
        }, timeout=60) 
        
        if response.status_code == 200:
            print("✅ Mistral Fusion Successful!")
            mistral_text = response.json()['response']
            
            # 2. SMART SPLITTING (Case-Insensitive Regex handles Mistral typos!)
            parts = re.split(r'(?i)\*?\*?RECOMMENDATION:?\*?\*?', mistral_text)
            
            if len(parts) > 1:
                # Remove the EXPLANATION header if it exists
                insight_text = re.sub(r'(?i)\*?\*?EXPLANATION:?\*?\*?', '', parts[0]).strip()
                rec_text = parts[1].strip()
            else:
                insight_text = mistral_text.replace("EXPLANATION:", "").strip()
                rec_text = "Monitor patient vitals and consult a healthcare professional for a tailored action plan."

            risk_level = "HIGH" if cancer_score >= 50 else "LOW"
            return {"insight_text": insight_text, "recommendation_text": rec_text, "confidence": get_confidence(), "risk_level": risk_level}
            
    except Exception as e:
        print(f"⚠️ Mistral Connection Failed ({str(e)}). Triggering Fallback...")

    # THE SILENT FALLBACK (Unchanged)
    print("🛡️ Fallback Engine Activated: Generating deterministic clinical insight.")
    high_risks = []
    
    if radiology_results.get("Lung_Cancer", 0) > 50: high_risks.append("Oncology/Lung Cancer")
    if clinical_results.get("TB_Risk", 0) > 60: high_risks.append("Tuberculosis")
    if clinical_results.get("Diabetes_Risk", 0) > 60: high_risks.append("Diabetes Type 2")
    if clinical_results.get("Asthma_Risk", 0) > 60: high_risks.append("Asthma/COPD")
    if radiology_results.get("Pneumonia", 0) > 70 or clinical_results.get("Pneumonia_Risk", 0) > 60: high_risks.append("Acute Pneumonia")

    primary_diagnosis = f"Elevated risk detected for: {', '.join(high_risks)}." if high_risks else "Normal health parameters."

    insight_bullets = []
    rec_bullets = []
    
    if radiology_results.get("Lung_Cancer", 0) > 50:
        subtypes = radiology_results.get("Subtypes", {})
        insight_bullets.append(f"Radiology Alert: High-probability oncological signatures detected. Breakdown: Adenocarcinoma ({subtypes.get('Adenocarcinoma', 0)}%), Large Cell ({subtypes.get('Large_Cell', 0)}%), Squamous ({subtypes.get('Squamous', 0)}%).")
    elif clinical_results.get("Clinical_Notes"):
        insight_bullets.append(f"Clinical Synthesis: {' '.join(clinical_results['Clinical_Notes'])}")

    if "Diabetes Type 2" in high_risks: rec_bullets.append("Start continuous glucose monitoring and consult endocrinologist.")
    if "Asthma/COPD" in high_risks: rec_bullets.append("Prescribe bronchodilator inhaler and monitor wearable HR/O2 trends.")
    if "Oncology/Lung Cancer" in high_risks: rec_bullets.append("Immediate referral for Low-Dose CT scan and biopsy evaluation.")
    if "Acute Pneumonia" in high_risks: rec_bullets.append("Administer supplemental oxygen and consider broad-spectrum antibiotics.")
    if not high_risks: rec_bullets.append("Maintain routine annual check-ups.")

    final_insight = f"Primary Multimodal Diagnosis: {primary_diagnosis}\n\nExplainable Insights:\n"
    for bullet in insight_bullets: final_insight += f"• {bullet}\n"
    
    final_rec = " ".join(rec_bullets)
    risk_level = "HIGH" if high_risks else "LOW"
    
    return {"insight_text": final_insight, "recommendation_text": final_rec, "confidence": get_confidence(), "risk_level": risk_level}

# --- 4. SMART AUDIO GENERATOR (Strictly gTTS Free Version) ---
def generate_audio_recommendation(text, lang="en"):
    """Generates multilingual voice suggestions using entirely free, local-friendly gTTS."""
    print(f"🎙️ Generating Voice Recommendation via gTTS (Language: {lang})...")
    
    try:
        tts = gTTS(text=text, lang=lang) 
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_base64 = base64.b64encode(fp.read()).decode('utf-8')
        print("✅ gTTS Audio Generated Successfully!")
        return audio_base64
    except Exception as e:
        print(f"⚠️ gTTS Generation Exception: {str(e)}")
        return None
    


   # --- 5. CONTEXT-AWARE CHATBOT ENGINE (Mistral LLM) ---
def generate_chat_response(user_message, chat_history, patient_context):
    print("💬 Processing Chat Request via Mistral...")
    
    # 1. Manually Extract variables so Mistral cannot miss or hallucinate them
    cancer = patient_context.get('cancer', 0)
    tb = patient_context.get('tb', 0)
    diabetes = patient_context.get('diabetes', 0)
    asthma = patient_context.get('asthma', 0)
    heart = patient_context.get('heart', 0)
    pneumonia = patient_context.get('pneumonia', 0)
    
    # Handle dict format for multilingual recommendations (grab English for the LLM context)
    rec_data = patient_context.get('recommendationText', {})
    recommendation = rec_data.get('en', str(rec_data)) if isinstance(rec_data, dict) else str(rec_data)
    
    insight_data = patient_context.get('explanation', {})
    insight = insight_data.get('en', str(insight_data)) if isinstance(insight_data, dict) else str(insight_data)

    # 2. Format history
    history_str = ""
    for msg in chat_history[-5:]:
        role = "Patient" if msg['role'] == 'user' else "DiagnoAI"
        history_str += f"{role}: {msg['content']}\n"

    # 3. Create a STRICT prompt demanding conversational awareness
    prompt = f"""You are DiagnoAI Co-Pilot, an advanced, empathetic, and highly professional medical AI assistant.
You are discussing the patient's test results with them. 

CRITICAL INSTRUCTIONS:
1. CONVERSATIONAL AWARENESS: If the patient just says "hi", "hello", or gives a casual greeting, DO NOT recite their medical data. Simply greet them back warmly and ask how you can help them understand their dashboard results today.
2. Base your medical answers EXACTLY on the Patient Dashboard Data provided below. Do not guess.
3. Do NOT hallucinate. If the data says a risk is high (e.g., 90%+), you MUST acknowledge it is critical only when asked about their risks.
4. Structure your response beautifully using markdown formatting (bullet points, bold text).

=== PATIENT DASHBOARD DATA ===
Risks:
- Lung Cancer Risk: {cancer}%
- Diabetes Risk: {diabetes}%
- Heart Disease Risk: {heart}%
- Asthma Risk: {asthma}%
- Tuberculosis (TB) Risk: {tb}%
- Pneumonia Risk: {pneumonia}%

Official Clinical Insight:
{insight}

Official Clinical Recommendation:
{recommendation}
==============================

=== RECENT CHAT HISTORY ===
{history_str}
===========================

PATIENT QUESTION: {user_message}

DiagnoAI Response:"""

    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            "model": "mistral", 
            "prompt": prompt, 
            "stream": False
        }, timeout=60)
        
        if response.status_code == 200:
            chat_text = response.json().get('response', '').strip()
            print("✅ Chat response generated successfully!")
            return {"status": "success", "response": chat_text}
        else:
            return {"status": "error", "response": "Mistral engine failed to generate a response."}
            
    except Exception as e:
        print(f"⚠️ Chat Engine Error: {str(e)}")
        return {"status": "error", "response": "I am currently unable to connect to my neural pathways. Please try again."}