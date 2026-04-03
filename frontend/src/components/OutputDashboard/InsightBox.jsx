import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { endpoints } from '../../services/api';
import { Volume2, Loader2, Square } from 'lucide-react';

const InsightBox = ({ explanation }) => {
  const { t, currentLanguage } = useLanguage();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  let rawText = "";
  if (typeof explanation === 'object' && explanation !== null) {
    rawText = explanation[currentLanguage] || explanation['en'] || "";
  } else {
    rawText = explanation || "";
  }

  useEffect(() => {
    setAudioSrc(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [currentLanguage, explanation]);

  const handleAudioToggle = async () => {
    if (audioSrc) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const cleanText = rawText.replace(/<[^>]*>?/gm, '').replace(/[*#]/g, '');
      const response = await endpoints.generateAudio(cleanText, currentLanguage); 
      
      if (response.audio_base64) {
        setAudioSrc(`data:audio/mpeg;base64,${response.audio_base64}`);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      }
    } catch (err) {
      console.error("Audio generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedPoints = rawText
    .split('\n')
    .filter(point => point.trim().length > 2)
    .map(point => point.replace(/^[-\*•\d\.]+\s*/, '').trim());

  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '28px',
      borderLeft: '5px solid #36565F', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      position: 'relative'
    }}>
      
      {/* Header with Restore Listen Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#141414', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#36565F' }}>✦</span> {t('aiInsight')}
        </h3>

        <button 
          onClick={handleAudioToggle}
          disabled={isGenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: isPlaying ? 'rgba(229, 83, 83, 0.1)' : 'rgba(54, 86, 95, 0.1)',
            color: isPlaying ? '#E55353' : '#36565F',
            border: `1px solid ${isPlaying ? 'rgba(229, 83, 83, 0.3)' : 'rgba(54, 86, 95, 0.2)'}`,
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.3s'
          }}
        >
          {isGenerating ? (
             <><Loader2 size={16} className="animate-spin" /> Generating...</>
          ) : isPlaying ? (
             <><Square size={16} fill="currentColor" /> Stop</>
          ) : (
             <><Volume2 size={16} /> Listen</>
          )}
        </button>
      </div>

      {audioSrc && (
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          onEnded={() => setIsPlaying(false)} 
          style={{ display: 'none' }} 
        />
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {formattedPoints.map((point, idx) => {
          const parts = point.split(':');
          const isBolded = parts.length > 1;

          return (
            <div key={idx} style={{ fontSize: '0.95rem', color: '#2C4A52', lineHeight: 1.7, padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid rgba(189, 219, 209, 0.3)' }}>
              {isBolded ? (
                <>
                  <strong style={{ color: '#141414', display: 'block', marginBottom: '4px', fontSize: '1rem' }}>
                    <span dangerouslySetInnerHTML={{ __html: parts[0].replace(/\*/g, '') }} />
                  </strong>
                  <span dangerouslySetInnerHTML={{ __html: parts.slice(1).join(':').replace(/\*/g, '') }} />
                </>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: point.replace(/\*/g, '') }} />
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
};

export default InsightBox;