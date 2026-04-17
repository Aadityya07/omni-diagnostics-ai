import React, { useState, useEffect } from 'react';
import RiskCard from './RiskCard';
import InsightBox from './InsightBox';
import RecommendationBox from './RecommendationBox';
import AnatomyVisualizer from './AnatomyVisualizer';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import { Loader2, Activity } from 'lucide-react';

const OutputDashboard = ({ analysisData, isAnalyzing, error, progress, onRetry }) => {
  const { t } = useLanguage();
  
  // NEW: State for the Anatomical Map illusion
  const [showAnatomy, setShowAnatomy] = useState(false);
  const [isGeneratingAnatomy, setIsGeneratingAnatomy] = useState(false);

  // Reset the anatomy map if a new analysis starts
  useEffect(() => {
    if (isAnalyzing) {
      setShowAnatomy(false);
      setIsGeneratingAnatomy(false);
    }
  }, [isAnalyzing]);

  const handleGenerateMap = () => {
    setIsGeneratingAnatomy(true);
    // 1.5 second illusion of generating the map
    setTimeout(() => {
      setIsGeneratingAnatomy(false);
      setShowAnatomy(true);
    }, 1500);
  };

  const riskItems = analysisData ? [
    { title: t('cancerRisk'), value: analysisData.cancer, key: 'cancer' },
    { title: t('tbRisk'), value: analysisData.tb, key: 'tb' },
    { title: t('diabetesRisk'), value: analysisData.diabetes, key: 'diabetes' },
    { title: t('asthmaRisk'), value: analysisData.asthma, key: 'asthma' },
    { title: t('pneumoniaRisk'), value: analysisData.pneumonia, key: 'pneumonia' }
  ] : [];

  if (error) return (
    <div className="glass-premium" style={{ width: '65%', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ color: '#E55353' }}>Analysis Failed</h3>
      <p>{error}</p>
      <button onClick={onRetry} style={{ padding: '10px 24px', borderRadius: '12px', background: '#36565F', color: 'white', border: 'none', cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  return (
    <div className="glass-premium custom-scrollbar" style={{ width: '65%', padding: '28px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', position: 'relative' }}>
      <LanguageToggle />

      {/* PROCESSING ANIMATION */}
      {isAnalyzing && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
          zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px'
        }}>
          <Loader2 size={48} className="animate-spin" style={{ color: '#36565F', marginBottom: '16px' }} />
          <h3 style={{ fontWeight: 800, color: '#36565F', margin: 0 }}>Synthesizing Multimodal Data...</h3>
          <div style={{ width: '60%', height: '6px', background: '#BDDBD1', borderRadius: '10px', marginTop: '20px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#36565F', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ marginTop: '12px', color: '#5F8190', fontSize: '0.9rem', fontWeight: 600 }}>{progress}% Complete</p>
        </div>
      )}

      {/* Awaiting Data Placeholder */}
      {!isAnalyzing && !analysisData && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', flexDirection: 'column' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🩺</div>
          <p style={{ color: '#5F8190', fontWeight: 500 }}>{t('awaitingData')}</p>
        </div>
      )}

      {analysisData && !isAnalyzing && (
        <div className="animate-fadeIn">
          
          {/* 1. Risk Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {riskItems.map(risk => <RiskCard key={risk.key} title={risk.title} value={risk.value} />)}
          </div>
          
          {/* 2. Anatomical Map Section (Placed BEFORE Insights) */}
          <div style={{ margin: '30px 0' }}>
            {!showAnatomy && !isGeneratingAnatomy && (
              <button 
                onClick={handleGenerateMap}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)',
                  border: '1px dashed #36565F', color: '#36565F', fontWeight: 700, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderStyle = 'solid'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderStyle = 'dashed'; }}
              >
                <Activity size={20} /> Generate Anatomical Risk Map
              </button>
            )}

            {isGeneratingAnatomy && (
              <div style={{
                width: '100%', height: '150px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)',
                border: '1px solid #BDDBD1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#36565F', marginBottom: '12px' }} />
                <span style={{ color: '#2C4A52', fontWeight: 600, fontSize: '0.9rem' }}>Mapping biometrics to anatomical diagram...</span>
              </div>
            )}

            {showAnatomy && (
              <div className="animate-fadeIn">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#36565F', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Anatomical Mapping Complete</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #BDDBD1, transparent)' }} />
                </div>
                <AnatomyVisualizer analysisData={analysisData} />
              </div>
            )}
          </div>

          {/* 3. AI Insights */}
          <InsightBox explanation={analysisData.explanation} />
          
          {/* 4. Recommendation Audio Player */}
          <RecommendationBox recommendationText={analysisData.recommendationText} />
          
        </div>
      )}
      

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default OutputDashboard;