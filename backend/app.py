import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator

# Import our robust pipeline
from ai_pipeline import analyze_xray, analyze_clinical_vitals, generate_clinical_insight, generate_audio_recommendation

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

        # Catch the Clinical Vitals AND the requested language
        vitals = request.form.to_dict()
        target_lang = vitals.get('language', 'en') 

        # Run the Analysis
        radiology_results = analyze_xray(image_path)
        clinical_results = analyze_clinical_vitals(vitals)
        insight = generate_clinical_insight(radiology_results, clinical_results)

        final_text = insight.get("insight_text")

        # --- THE MULTILINGUAL USP ---
        if target_lang != 'en':
            print(f"🌍 Translating insight to {target_lang}...")
            try:
                final_text = GoogleTranslator(source='auto', target=target_lang).translate(final_text)
            except Exception as e:
                print(f"Translation failed: {e}")

        # --- ELEVENLABS AUDIO USP ---
        audio_base64 = None
        # Only generate audio for non-English requests (as per your USP)
        if target_lang != 'en':
             audio_base64 = generate_audio_recommendation(final_text)

        # Return the final payload
        return jsonify({
            "status": "success",
            "radiology_analysis": radiology_results,
            "clinical_analysis": clinical_results,
            "explainable_insight": final_text,
            "confidence": insight.get("confidence"),
            "risk_level": insight.get("risk_level"),
            "audio_recommendation": audio_base64 
        }), 200

    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Omni-Diagnostics AI Backend is running on port 5000...")
    app.run(debug=True, port=5000)