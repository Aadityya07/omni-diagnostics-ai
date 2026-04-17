import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { endpoints } from '../../services/api';
import { Play, Square, Loader2, AlertCircle } from 'lucide-react';

const RecommendationBox = ({ recommendationText }) => {
  const { t, currentLanguage } = useLanguage(); // Added 't' here
  
  const [audioCache, setAudioCache] = useState({});
  const [loadingStatus, setLoadingStatus] = useState({});
  const [wantsToPlay, setWantsToPlay] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  
  // NEW: State for psychological delay
  const [hasPlayedMap, setHasPlayedMap] = useState({});
  const [artificialLoading, setArtificialLoading] = useState(false);
  
  const audioRef = useRef(null);
  const typewriterTimerRef = useRef(null);

  let fullText = "";
  if (typeof recommendationText === 'object' && recommendationText !== null) {
    fullText = recommendationText[currentLanguage] || recommendationText['en'] || "";
  } else {
    fullText = recommendationText || "No recommendation available.";
  }
  
  const cleanText = fullText.replace(/<[^>]*>?/gm, '').replace(/[*#]/g, '');

  // SILENT BACKGROUND PRE-FETCH
  useEffect(() => {
    if (!recommendationText || typeof recommendationText !== 'object') return;

    const prefetchAudio = async () => {
      const langs = ['en', 'hi', 'mr'];
      for (const lang of langs) {
        const textToSpeak = recommendationText[lang];
        if (textToSpeak && !audioCache[lang] && loadingStatus[lang] !== 'loading' && loadingStatus[lang] !== 'ready') {
          setLoadingStatus(prev => ({ ...prev, [lang]: 'loading' }));
          try {
            const cText = textToSpeak.replace(/<[^>]*>?/gm, '').replace(/[*#]/g, '');
            const response = await endpoints.generateAudio(cText, lang); 
            if (response.audio_base64) {
              setAudioCache(prev => ({ ...prev, [lang]: `data:audio/mpeg;base64,${response.audio_base64}` }));
              setLoadingStatus(prev => ({ ...prev, [lang]: 'ready' }));
            } else {
              setLoadingStatus(prev => ({ ...prev, [lang]: 'error' }));
            }
          } catch (err) {
            setLoadingStatus(prev => ({ ...prev, [lang]: 'error' }));
          }
        }
      }
    };
    prefetchAudio();
  }, [recommendationText]);

  useEffect(() => {
    setIsPlaying(false);
    setDisplayedText("");
    setProgress(0);
    setHasFinished(false);
    setWantsToPlay(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
    }
  }, [currentLanguage, recommendationText]);

  useEffect(() => {
    if (wantsToPlay && !artificialLoading) {
      if (audioCache[currentLanguage]) {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
        setWantsToPlay(false);
      } else if (loadingStatus[currentLanguage] === 'error') {
        startFallbackTypewriter();
        setWantsToPlay(false);
      }
    }
  }, [audioCache, currentLanguage, wantsToPlay, loadingStatus, artificialLoading]);

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

  const handlePlayClick = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      setIsPlaying(false);
      setWantsToPlay(false);
      return;
    }

    // NEW: 2-Second Psychological Delay for the FIRST time playing this language
    if (!hasPlayedMap[currentLanguage]) {
      setArtificialLoading(true);
      setTimeout(() => {
        setArtificialLoading(false);
        setHasPlayedMap(prev => ({ ...prev, [currentLanguage]: true }));
        
        if (audioCache[currentLanguage]) {
          if (audioRef.current) audioRef.current.play();
          setIsPlaying(true);
        } else if (loadingStatus[currentLanguage] === 'error') {
          startFallbackTypewriter();
        } else {
          setWantsToPlay(true);
        }
      }, 2000);
      return;
    }

    // Instant Play if they've already heard it once
    if (audioCache[currentLanguage]) {
      if (audioRef.current) audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (loadingStatus[currentLanguage] === 'loading') {
      setWantsToPlay(true);
      return;
    }

    if (loadingStatus[currentLanguage] === 'error') {
      startFallbackTypewriter();
      return;
    }

    setWantsToPlay(true);
  };

  const showGenerating = artificialLoading || (loadingStatus[currentLanguage] === 'loading' && wantsToPlay);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '28px',
      borderLeft: '5px solid #99DDCC', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      marginTop: '24px', position: 'relative', overflow: 'hidden'
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#141414', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#36565F' }}>✦</span> DiagnoAI {t('clinicalAdvice')}
        </h3>

        <button 
          onClick={handlePlayClick}
          disabled={(hasFinished && !isPlaying) || showGenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: isPlaying ? 'rgba(229, 83, 83, 0.1)' : 'rgba(153, 221, 204, 0.2)',
            color: isPlaying ? '#E55353' : '#2C4A52',
            border: `1px solid ${isPlaying ? 'rgba(229, 83, 83, 0.3)' : 'rgba(153, 221, 204, 0.5)'}`,
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            cursor: (hasFinished || showGenerating) ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
          }}
        >
          {showGenerating ? (
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
      
      {audioCache[currentLanguage] && (
        <audio 
          ref={audioRef} 
          src={audioCache[currentLanguage]} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnd} 
          style={{ display: 'none' }} 
        />
      )}

      <div style={{ 
        minHeight: '80px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', 
        padding: '16px', color: '#2C4A52', fontSize: '1.05rem', lineHeight: 1.6, fontStyle: 'italic',
        border: '1px solid rgba(189, 219, 209, 0.3)'
      }}>
        {displayedText || <span style={{ opacity: 0.5 }}>Awaiting audio initialization...</span>}
        {isPlaying && <span className="typing-cursor">|</span>}
      </div>

      <div style={{ width: '100%', height: '4px', background: 'rgba(189, 219, 209, 0.4)', borderRadius: '4px', marginTop: '20px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#36565F', transition: 'width 0.1s linear' }} />
      </div>

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