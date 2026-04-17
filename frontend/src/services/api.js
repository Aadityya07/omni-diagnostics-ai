import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, 
  headers: {
    'Accept': 'application/json',
  },
});

export const endpoints = {
  analyzePatient: async (formData) => {
    const formDataToSend = new FormData();
    
    // Append the Image File
    if (formData.uploadedImage) {
      const blob = await fetch(formData.uploadedImage).then(r => r.blob());
      formDataToSend.append('image', blob, 'chest_xray.jpg');
    }
    
    // Append all Vitals
    formDataToSend.append('age', formData.age);
    formDataToSend.append('smoking_history', formData.packYears);
    formDataToSend.append('o2_saturation', formData.o2Saturation);
    formDataToSend.append('heart_rate', formData.heartRate || 75);
    formDataToSend.append('fasting_glucose', formData.fastingGlucose || 90);
    formDataToSend.append('hba1c', formData.hba1c || 5.0);
    formDataToSend.append('genomic_risk', formData.genomicRisk || 'Low');
    formDataToSend.append('weight_loss', formData.weightLoss ? 'yes' : 'no');
    formDataToSend.append('cough_duration', formData.coughDuration);
    formDataToSend.append('language', formData.language || 'en');
    
    const response = await api.post('/analyze', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateAudio: async (text, language) => {
    const response = await api.post('/generate-audio', { text, language });
    return response.data;
  },

  // --- NEW: The Extraction Agent Endpoint ---
  extractVitals: async (file) => {
    const formData = new FormData();
    formData.append('report', file);
    const response = await api.post('/extract-vitals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- NEW: Chatbot Endpoint ---
  chatWithMistral: async (message, history, context) => {
    const response = await api.post('/chat', { message, history, context });
    return response.data;
  }
};

export default api;