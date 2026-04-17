import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const AnatomyVisualizer = ({ analysisData }) => {
  const { t } = useLanguage();

  const risks = {
    pneumonia: analysisData?.pneumonia || 0,
    tb: analysisData?.tb || 0,
    cancer: analysisData?.cancer || 0,
    asthma: analysisData?.asthma || 0,
    heart: analysisData?.heart || 0,
    diabetes: analysisData?.diabetes || 0,
  };

  const markers = [
    { id: 'asthma', label: t('asthmaRisk'), value: risks.asthma, startX: 50, startY: 34, endX: 18, endY: 28 },
    { id: 'tb', label: t('tbRisk'), value: risks.tb, startX: 50, startY: 44, endX: 82, endY: 32 },
    { id: 'pneumonia', label: t('pneumoniaRisk'), value: risks.pneumonia, startX: 43, startY: 58, endX: 18, endY: 55 },
    { id: 'cancer', label: t('cancerRisk'), value: risks.cancer, startX: 58, startY: 58, endX: 82, endY: 55 },
    { id: 'heart', label: t('heartRisk'), value: risks.heart, startX: 52, startY: 65, endX: 82, endY: 75 },
    { id: 'diabetes', label: t('diabetesRisk'), value: risks.diabetes, startX: 50, startY: 78, endX: 18, endY: 82 }
  ];

  return (
    <div style={{ 
      position: 'relative', width: '100%', height: '520px', borderRadius: '24px', 
      overflow: 'hidden', background: 'rgba(255,255,255,0.4)', 
      border: '1px solid rgba(189, 219, 209, 0.6)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5)'
    }}>
      
      {/* Background Image */}
      <img 
        src="/anatomy_body.jpg" 
        alt="Anatomy" 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.85 }} 
      />

      {/* Target Lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
        {markers.map((marker, idx) => {
          const markerColor = marker.value >= 60 ? '#E55353' : marker.value >= 30 ? '#F4A261' : '#36565F';
          return (
            <line 
              key={`l-${idx}`} 
              x1={`${marker.startX}%`} y1={`${marker.startY}%`} 
              x2={`${marker.endX}%`} y2={`${marker.endY}%`} 
              stroke={markerColor} 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity="0.5" 
              className="dash-animate"
            />
          );
        })}
      </svg>

      {/* Dots and Labels */}
      {markers.map((marker, idx) => {
        const markerColor = marker.value >= 60 ? '#E55353' : marker.value >= 30 ? '#F4A261' : '#36565F';
        return (
          <React.Fragment key={idx}>
            {/* Pulsing Target Dot */}
            <div className="pulse-dot" style={{
              position: 'absolute', top: `${marker.startY}%`, left: `${marker.startX}%`,
              width: '12px', height: '12px', backgroundColor: markerColor, borderRadius: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 10, border: '2px solid white'
            }} />

            {/* Glassmorphism Label */}
            <div style={{
              position: 'absolute', top: `${marker.endY}%`, left: `${marker.endX}%`,
              background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)',
              border: `1px solid rgba(189, 219, 209, 0.5)`, borderLeft: `4px solid ${markerColor}`,
              padding: '8px 14px', borderRadius: '12px', transform: 'translate(-50%, -50%)', 
              zIndex: 15, boxShadow: '0 8px 25px rgba(0,0,0,0.08)', minWidth: '100px'
            }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#5F8190', fontWeight: 800, marginBottom: '2px' }}>
                {marker.label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: markerColor }}>
                {Math.round(marker.value)}%
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -16; } }
        .dash-animate { animation: dash 1s linear infinite; }
        
        @keyframes pulse { 
          0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.2); } 
          70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); } 
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); } 
        }
        .pulse-dot { animation: pulse 2s infinite; }
      `}</style>
    </div>
  );
};

export default AnatomyVisualizer;