import React, { useState, useRef, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import VitalsForm from './VitalsForm';
import AnalyzeButton from './AnalyzeButton';
import { useLanguage } from '../../context/LanguageContext';
import { endpoints } from '../../services/api';

const InputPanel = ({ onAnalyze, isAnalyzing }) => {
  const { currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    age: '',
    packYears: 0,
    o2Saturation: 98,  // Sliders need a base number, but it will auto-move on upload!
    heartRate: '',     // Blank to show placeholder
    fastingGlucose: '',// Blank to show placeholder
    hba1c: '',         // Blank to show placeholder
    genomicRisk: 'Low',
    weightLoss: false,
    coughDuration: ''
  });

  const [missingFields, setMissingFields] = useState([]);

  // Watch the form data. If the user manually types in a missing field, remove the warning!
  // This completely ignores the "Unexplained Weight loss" toggle.
  useEffect(() => {
    setMissingFields(prevMissing => prevMissing.filter(field => {
      if (field === "Age" && formData.age !== '') return false;
      if (field === "Heart Rate" && formData.heartRate !== '') return false;
      if (field === "O2 Saturation" && formData.o2Saturation !== '') return false;
      if (field === "Fasting Glucose" && formData.fastingGlucose !== '') return false;
      if (field === "HbA1c" && formData.hba1c !== '') return false;
      return true; // Keep the warning if it's still missing
    }));
  }, [formData.age, formData.heartRate, formData.o2Saturation, formData.fastingGlucose, formData.hba1c]);
  
  const [uploadedImage, setUploadedImage] = useState(null);
  const [errors, setErrors] = useState({});
  
  // States for Agent
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.age || formData.age < 0) newErrors.age = 'Required';
    if (formData.coughDuration === '' || formData.coughDuration < 0) newErrors.coughDuration = 'Required';
    if (!uploadedImage) newErrors.image = 'Chest X-ray is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    if (errors[Object.keys(updates)[0]]) {
      setErrors(prev => ({ ...prev, [Object.keys(updates)[0]]: null }));
    }
  };

  const handleAnalyzeClick = () => {
    if (validateForm()) {
      onAnalyze({ ...formData, uploadedImage, language: currentLanguage });
    }
  };

  // Agentic Upload Handler
  const handleLabReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const result = await endpoints.extractVitals(file);
      if (result.status === 'success' && result.data) {
        const extracted = result.data;
        const missing = [];
        
        // Check what LLaVA couldn't find in the report
        if (extracted.age === null) missing.push("Age");
        if (extracted.heart_rate === null) missing.push("Heart Rate");
        if (extracted.o2_saturation === null) missing.push("O2 Saturation");
        if (extracted.fasting_glucose === null) missing.push("Fasting Glucose");
        if (extracted.hba1c === null) missing.push("HbA1c");
        
        setMissingFields(missing); // Update the UI warning state

        // Update the form data, keeping existing values if the report was missing them
        setFormData(prev => ({
          ...prev,
          age: extracted.age !== null ? extracted.age : prev.age,
          heartRate: extracted.heart_rate !== null ? extracted.heart_rate : prev.heartRate,
          o2Saturation: extracted.o2_saturation !== null ? extracted.o2_saturation : prev.o2Saturation,
          fastingGlucose: extracted.fasting_glucose !== null ? extracted.fasting_glucose : prev.fastingGlucose,
          hba1c: extracted.hba1c !== null ? extracted.hba1c : prev.hba1c
        }));
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      alert("⚠️ Agent failed to extract data. Please check the image and try again.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-premium custom-scrollbar" style={{
      width: '100%',
      minWidth: '380px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto'
    }}>
      <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(189, 219, 209, 0.4)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#141414', margin: 0 }}>Patient Data</h2>
        <p style={{ fontSize: '0.85rem', color: '#5F8190', margin: '4px 0 0 0' }}>Enter vitals & scan for multimodal fusion.</p>
      </div>

      {/* 1. X-Ray Upload Box */}
      <ImageUpload onImageUpload={setUploadedImage} error={errors.image} />
      
      <div style={{ marginTop: '4px' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C4A52', display: 'block', marginBottom: '12px' }}>
          Clinical Vitals
        </span>

        {/* 2. Redesigned Lab Report Upload Box */}
        <div 
          onClick={() => !isExtracting && fileInputRef.current?.click()}
          style={{
            position: 'relative',
            height: '90px',
            borderRadius: '16px',
            border: '2px dashed #BDDBD1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isExtracting ? 'not-allowed' : 'pointer',
            backgroundColor: 'rgba(255,255,255,0.4)',
            transition: 'all 0.3s',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            if (!isExtracting) {
              e.currentTarget.style.borderColor = '#36565F';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExtracting) {
              e.currentTarget.style.borderColor = '#BDDBD1';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          {isExtracting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#36565F', fontWeight: 600 }}>
               <div style={{ width: '16px', height: '16px', border: '2px solid rgba(54,86,95,0.3)', borderTopColor: '#36565F', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
               Extracting Data...
            </div>
          ) : (
            <>
              <svg style={{ width: '26px', height: '26px', color: '#5F8190', marginBottom: '6px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ fontSize: '13px', color: '#141414', fontWeight: 600, margin: 0 }}>
                Auto-fill from Lab Report
              </p>
              <p style={{ fontSize: '11px', color: '#5F8190', marginTop: '4px', margin: 0 }}>
                Upload document image
              </p>
            </>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        <input 
          type="file" 
          accept="image/*,.pdf,application/pdf"
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleLabReportUpload}
        />

        {/* Missing Data Warning Banner */}
        {missingFields.length > 0 && (
          <div className="animate-fadeIn" style={{ 
            marginTop: '12px', padding: '12px', 
            backgroundColor: 'rgba(229, 83, 83, 0.1)', border: '1px solid rgba(229, 83, 83, 0.4)', 
            borderRadius: '12px', color: '#E55353', fontSize: '0.85rem', lineHeight: '1.5'
          }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
               ⚠️ Incomplete Lab Report
            </strong>
            The uploaded report does not contain the following necessary details: <b>{missingFields.join(", ")}</b>. Please fill them manually.
          </div>
        )}

        {/* The rest of the manual sliders */}
        <VitalsForm formData={formData} onChange={handleFormChange} errors={errors} />
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
        <AnalyzeButton onClick={handleAnalyzeClick} isLoading={isAnalyzing} />
      </div>
    </div>
  );
};

export default InputPanel;