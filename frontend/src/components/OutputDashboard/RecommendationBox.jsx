import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { endpoints } from '../../services/api';
import { Play, Square, Loader2, AlertCircle } from 'lucide-react';

const RecommendationBox = ({ recommendationText }) => {
  const { currentLanguage } = useLanguage();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  
  const audioRef = useRef(null);
  const typewriterTimerRef = useRef(null);

  // Get the localized text
  let fullText = "";
  if (typeof recommendationText === 'object' && recommendationText !== null) {
    fullText = recommendationText[currentLanguage] || recommendationText['en'] || "";
  } else {
    fullText = recommendationText || "No recommendation available.";
  }
  
  // Clean text for audio
  const cleanText = fullText.replace(/<[^>]*>?/gm, '').replace(/[*#]/g, '');

  // Reset when language or patient changes
  useEffect(() => {
    setAudioSrc(null);
    setIsPlaying(false);
    setDisplayedText("");
    setProgress(0);
    setHasFinished(false);
    setAudioFailed(false);
    if (audioRef.current) audioRef.current.pause();
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
  }, [currentLanguage, recommendationText]);

  // Sync Text with Audio Time
  const handleTimeUpdate = () => {
    if (audioRef.current && !hasFinished) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (total) {
        const percent = (current / total) * 100;
        setProgress(percent);
        
        const charsToShow = Math.floor((current / total) * cleanText.length);
        setDisplayedText(cleanText.substring(0, charsToShow));
      }
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setHasFinished(true);
    setProgress(100);
    setDisplayedText(cleanText); 
  };

  // Fallback typewriter if internet/gTTS fails
  const startFallbackTypewriter = () => {
    setIsPlaying(true);
    let i = 0;
    const speed = 40; 
    typewriterTimerRef.current = setInterval(() => {
      i += 1;
      setDisplayedText(cleanText.substring(0, i));
      setProgress((i / cleanText.length) * 100);
      if (i >= cleanText.length) {
        clearInterval(typewriterTimerRef.current);
        handleAudioEnd();
      }
    }, speed);
  };

  const handlePlayClick = async () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      setIsPlaying(false);
      return;
    }

    if (audioSrc && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    
    if (audioFailed) {
      startFallbackTypewriter();
      return;
    }

    setIsGenerating(true);
    try {
      const response = await endpoints.generateAudio(cleanText, currentLanguage); 
      if (response.audio_base64) {
        setAudioSrc(`data:audio/mpeg;base64,${response.audio_base64}`);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      } else {
        throw new Error("No audio returned");
      }
    } catch (err) {
      console.error("Audio generation failed:", err);
      setAudioFailed(true);
      startFallbackTypewriter(); 
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '28px',
      borderLeft: '5px solid #99DDCC', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      marginTop: '24px', position: 'relative', overflow: 'hidden'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#141414', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#36565F' }}>✦</span> DiagnoAI Clinical Advice
        </h3>

        {/* The Play Button */}
        <button 
          onClick={handlePlayClick}
          disabled={isGenerating || hasFinished}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: isPlaying ? 'rgba(229, 83, 83, 0.1)' : 'rgba(153, 221, 204, 0.2)',
            color: isPlaying ? '#E55353' : '#2C4A52',
            border: `1px solid ${isPlaying ? 'rgba(229, 83, 83, 0.3)' : 'rgba(153, 221, 204, 0.5)'}`,
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            cursor: (isGenerating || hasFinished) ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
          }}
        >
          {isGenerating ? (
             <><Loader2 size={16} className="animate-spin" /> Connecting...</>
          ) : isPlaying ? (
             <><Square size={16} fill="currentColor" /> Pause</>
          ) : hasFinished ? (
             "Completed"
          ) : (
             <><Play size={16} fill="currentColor" /> Initialize Audio</>
          )}
        </button>
      </div>
      
      {audioSrc && (
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnd} 
          style={{ display: 'none' }} 
        />
      )}

      {/* The Text Box (Glassmorphism Style) */}
      <div style={{ 
        minHeight: '80px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', 
        padding: '16px', color: '#2C4A52', fontSize: '1.05rem', lineHeight: 1.6, fontStyle: 'italic',
        border: '1px solid rgba(189, 219, 209, 0.3)'
      }}>
        {displayedText || <span style={{ opacity: 0.5 }}>Awaiting audio initialization...</span>}
        {isPlaying && <span className="typing-cursor">|</span>}
      </div>

      {/* Progress Bar Strip */}
      <div style={{ width: '100%', height: '4px', background: 'rgba(189, 219, 209, 0.4)', borderRadius: '4px', marginTop: '20px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#36565F', transition: 'width 0.1s linear' }} />
      </div>

      {/* Disclaimer */}
      {hasFinished && (
        <div className="animate-fadeIn" style={{ 
          marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', 
          color: '#E55353', fontSize: '0.8rem', fontWeight: 600, opacity: 0.8
        }}>
          <AlertCircle size={14} />
          <span>Disclaimer: This clinical advice is generated by Artificial Intelligence and may be inaccurate. It must be verified by a licensed medical professional before patient application.</span>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .typing-cursor { animation: blink 1s step-end infinite; margin-left: 4px; color: #36565F; font-weight: bold; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease forwards; }
      `}</style>
    </div>
  );
};

export default RecommendationBox;