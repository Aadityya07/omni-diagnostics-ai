import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator

# Import our robust pipeline
from ai_pipeline import analyze_xray, analyze_clinical_vitals, generate_clinical_insight, generate_audio_recommendation

# --- NEW: Import our Agent ---
# Change this line:
from agents import triage_xray_agent

# To this:
from agents import triage_xray_agent, extract_lab_report_agent

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy, ready to receive data"})

@app.route('/api/analyze', methods=['POST'])
def analyze_patient_data():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        image_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(image_path)

        # ==========================================
        # 🛡️ AGENT 1: TRIAGE (The Bouncer)
        # ==========================================
        triage_result = triage_xray_agent(image_path)
        
        if not triage_result.get("is_valid", True):
            # If the agent rejects the image, delete the fake file and block the process
            if os.path.exists(image_path):
                os.remove(image_path)
            
            print(f"🚫 [Triage Agent] Blocked upload: {triage_result.get('reason')}")
            # We return a 400 status code with the Agent's specific reason
            return jsonify({"error": triage_result.get("reason", "Invalid medical scan detected. Please upload a valid X-Ray.")}), 400
        # ==========================================

        vitals = request.form.to_dict()

        # Run the Analysis (Only happens if the Triage Agent approves the image)
        radiology_results = analyze_xray(image_path)
        clinical_results = analyze_clinical_vitals(vitals)
        insight = generate_clinical_insight(radiology_results, clinical_results)

        final_text = insight.get("insight_text")

        # --- THE MULTILINGUAL FIX ---
        print("🌍 Translating insights to English, Hindi, and Marathi...")
        
        def safe_translate(text, target_lang):
            if not text: return ""
            try:
                return GoogleTranslator(source='en', target=target_lang).translate(text)
            except Exception as e:
                print(f"⚠️ Translation to {target_lang} failed: {e}. Falling back to English.")
                return text 

        insight_text = insight.get("insight_text", "")
        rec_text = insight.get("recommendation_text", "")

        insights_multilingual = {
            "en": insight_text,
            "hi": safe_translate(insight_text, 'hi'),
            "mr": safe_translate(insight_text, 'mr')
        }
        
        recs_multilingual = {
            "en": rec_text,
            "hi": safe_translate(rec_text, 'hi'),
            "mr": safe_translate(rec_text, 'mr')
        }

        return jsonify({
            "status": "success",
            "radiology_analysis": radiology_results,
            "clinical_analysis": clinical_results,
            "explainable_insight": insights_multilingual,
            "audio_recommendation_text": recs_multilingual, # NEW: Hidden text for audio
            "confidence": insight.get("confidence"),
            "risk_level": insight.get("risk_level"),
            "audio_recommendation": None 
        }), 200

    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-audio', methods=['POST'])
def generate_audio():
    try:
        data = request.json
        text = data.get('text')
        language = data.get('language', 'en')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400

        audio_base64 = generate_audio_recommendation(text, language)
        
        if audio_base64:
            return jsonify({"status": "success", "audio_base64": audio_base64}), 200
        else:
            return jsonify({"error": "Failed to generate audio"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/extract-vitals', methods=['POST'])
def extract_vitals():
    try:
        if 'report' not in request.files:
            return jsonify({"error": "No report image provided"}), 400
        
        file = request.files['report']
        report_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(report_path)

        print("📄 Received lab report. Routing to Extraction Agent...")
        
        # Pass the image to our Agent
        extracted_data = extract_lab_report_agent(report_path)
        
        # Delete the image immediately after reading it to save server space (Privacy/Security best practice!)
        if os.path.exists(report_path):
            os.remove(report_path)

        return jsonify({
            "status": "success",
            "data": extracted_data
        }), 200

    except Exception as e:
        print(f"Error extracting vitals: {e}")
        return jsonify({"error": str(e)}), 500
    
        
if __name__ == '__main__':
    print("🚀 Omni-Diagnostics AI Backend is running on port 5000...")
    app.run(debug=True, port=5000)