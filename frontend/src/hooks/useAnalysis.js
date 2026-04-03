import { useState, useCallback } from 'react';
import { endpoints } from '../services/api';

export const useAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 500);
    
    try {
      const response = await endpoints.analyzePatient(formData);
      clearInterval(progressInterval);
      setProgress(100);
      
      const rad = response.radiology_analysis;
      const clin = response.clinical_analysis;

      // MULTIMODAL FUSION
      const transformedData = {
        pneumonia: Math.max(rad?.Pneumonia || 0, clin?.Pneumonia_Risk || 0),
        cancer: rad?.Lung_Cancer || 0, 
        tb: Math.max(rad?.Tuberculosis || 0, clin?.TB_Risk || 0),
        diabetes: clin?.Diabetes_Risk || 5,
        asthma: clin?.Asthma_Risk || 5,
        heart: clin?.Heart_Risk || 5, 
        
        explanation: response.explainable_insight,
        recommendationText: response.audio_recommendation_text, // Maps the hidden text!
        confidence: response.confidence,
        riskLevel: response.risk_level,
        clinicalFindings: clin?.Clinical_Notes || [],
        radiologyError: rad?.error || null
      };
      
      setAnalysisData(transformedData);
      return transformedData;
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.response?.data?.error || err.message || 'Analysis failed. Please check backend connection.');
      throw err;
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisData(null);
    setError(null);
    setProgress(0);
  }, []);

  return { analysisData, isLoading, error, progress, analyze, resetAnalysis };
};