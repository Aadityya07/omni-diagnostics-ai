```markdown
# 🩺 DiagnoAI
**An Agentic AI diagnostic assistant powered by Multimodal Orchestration, deterministic filtering, and local Vision-Language Models.**

![Project Status](https://img.shields.io/badge/Status-Hackathon_Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-Python_%7C_React_%7C_TensorFlow_%7C_LLaVA-blue)

🎥 **[Watch the Demo Video Here](./Demo/DemoVideo_DiagnoAI.mp4)** *(Or view the Demo folder in this repository)*

## 💡 The Problem
Medical misdiagnoses and diagnostic bottlenecks often occur because clinical data (vitals, lab reports) and radiological data (X-rays, CT scans) are analyzed in silos. Furthermore, integrating AI into healthcare requires immense precision; traditional probabilistic LLMs are prone to hallucinations when reading complex medical tables or handling edge-case image uploads.

## 🚀 The Solution: An Agentic Approach
DiagnoAI is a fully local, multimodal AI diagnostic pipeline. Rather than relying on a single, hallucination-prone model, it utilizes an **Agentic AI Workflow**. It routes tasks dynamically, employs deterministic Python tools for mathematical filtering, and synthesizes data across multiple specialized AI models.

### Key Features
* **DiagnoAI Co-Pilot (New!):** An interactive, context-aware chatbot that overlays seamlessly onto the dashboard. It reads the patient's generated risks and recommendations, allowing users to ask natural language questions about their diagnosis in a beautiful, glassmorphism UI.
* **Two-Phase Agentic Triage (The "Bouncer"):** A hybrid security layer that mathematically filters out non-medical images (using pixel color variance) before passing grayscale scans to a localized Vision Model for structural validation.
* **Dual-Pipeline OCR Extraction:** Automatically detects document types and dynamically routes physical scanned PDFs through a deep learning OCR engine (`EasyOCR`), piping the raw text into Mistral for flawless JSON parsing.
* **Local CNN Pathology Engine:** A custom-trained deep learning CNN mathematically scores lung cancer probabilities from Axial CTs and Chest X-rays.
* **Multimodal Fusion:** Synthesizes extracted clinical vitals with radiological CNN scores to generate explainable diagnostic insights and actionable recommendations.
* **Accessible UI/UX:** Features a glassmorphism interface with an interactive Anatomical Risk Map and synced, multilingual TTS (Text-to-Speech) audio generation.

---

## 🧠 System Architecture & Agent Workflow

1.  **Agent 1: Triage Security & Validation**
    * *Deterministic Phase:* Uses `PIL.ImageStat` to calculate RGB variance. Instantly rejects colorful photos (saving compute and preventing hallucinations).
    * *Probabilistic Phase:* Valid grayscale images are routed to **LLaVA**, strictly prompted to recognize internal chest anatomy and Axial CT cross-sections.
2.  **Agent 2: Medical Data Extraction**
    * Detects if the input is a native PDF or image.
    * Extracts raw text via **PyMuPDF** or **EasyOCR** (Neural Network OCR).
    * Passes pure text to **Mistral** with a strict system prompt to map synonymous medical terms into a structured JSON.
3.  **The Clinical Engine**
    * **TensorFlow CNN** processes the validated radiological scan.
    * **Mistral** fuses the CNN output with the JSON vitals to generate a cohesive diagnostic explanation.
4.  **DiagnoAI Co-Pilot (Chat Engine)**
    * A draggable, floating UI component that swaps seamlessly with the patient data panel.
    * Passes the synthesized clinical context back to **Mistral** with strict conversational boundaries to ensure hallucination-free, empathetic patient Q&A.
5.  **Frontend Generation**
    * React UI dynamically maps CNN probabilities to an animated Anatomical Risk UI.
    * Python `gTTS` translates and dictates the clinical recommendation to the user in English, Hindi, or Marathi.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, TailwindCSS, Lucide Icons
* **Backend:** Python, Flask
* **Machine Learning / AI:** TensorFlow/Keras (Custom CNN), Ollama (Local LLaVA & Mistral), EasyOCR
* **Data Processing:** PyMuPDF, Python PIL, Regex 
* **Audio & Localization:** Google Text-to-Speech (gTTS), deep-translator

---

## ⚙️ Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* [Ollama](https://ollama.ai/) installed locally with `llava` and `mistral` models pulled.

### Backend Setup
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the Flask Server
python app.py
```

### Frontend Setup
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

---

*⚠️ **Disclaimer:** DiagnoAI is a prototype designed to demonstrate Agentic AI workflows in a healthcare context. It is not intended for actual medical use, diagnosis, or treatment. Always consult a certified healthcare professional.*
```

---

### 3. Git Commands to Push Your Code

Open a new terminal window inside your main project folder (`C:\Users\aditya\Documents\Projects\DiagnoAI`), and run these commands one by one to push everything to your repository:

```bash
# 1. Add all the modified files to the staging area
git add .

# 2. Commit the changes with a clear message
git commit -m "feat: Add Context-Aware Chatbot Co-Pilot with Glassmorphism UI"

# 3. Push to your main branch on GitHub
git push origin main
```