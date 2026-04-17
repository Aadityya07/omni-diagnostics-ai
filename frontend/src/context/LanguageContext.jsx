import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const languages = {
  en: {
    code: 'en',
    name: 'English',
    translations: {
      analyzing: 'Neural inference in progress...',
      awaitingData: 'Awaiting patient data. Complete vitals and upload X-ray to initiate AI analysis.',
      pneumoniaRisk: 'Pneumonia Risk',
      tbRisk: 'TB Risk',
      cancerRisk: 'Cancer Risk',
      diabetesRisk: 'Diabetes Risk',
      asthmaRisk: 'Asthma Risk',
      heartRisk: 'Heart Risk',
      aiInsight: 'AI Clinical Insight',
      clinicalAdvice: 'Clinical Advice', // Added Here
      whyResult: 'Why this result?',
      radiologyEvidence: 'Radiology Evidence',
      clinicalFactors: 'Clinical Factors'
    }
  },
  hi: {
    code: 'hi',
    name: 'हिंदी',
    translations: {
      analyzing: 'तंत्रिका अनुमान प्रगति पर...',
      awaitingData: 'रोगी डेटा की प्रतीक्षा। विश्लेषण शुरू करने के लिए आंकड़े पूरे करें और एक्स-रे अपलोड करें।',
      pneumoniaRisk: 'निमोनिया जोखिम',
      tbRisk: 'टीबी जोखिम',
      cancerRisk: 'कैंसर जोखिम',
      diabetesRisk: 'मधुमेह जोखिम',
      asthmaRisk: 'अस्थमा जोखिम',
      heartRisk: 'हृदय जोखिम',
      aiInsight: 'एआई नैदानिक अंतर्दृष्टि',
      clinicalAdvice: 'नैदानिक सलाह', // Added Here
      whyResult: 'यह परिणाम क्यों?',
      radiologyEvidence: 'रेडियोलॉजी साक्ष्य',
      clinicalFactors: 'नैदानिक कारक'
    }
  },
  mr: {
    code: 'mr',
    name: 'मराठी',
    translations: {
      analyzing: 'न्यूरल इन्फरन्स प्रगतीपथावर...',
      awaitingData: 'रुग्ण डेटाची प्रतीक्षा. विश्लेषण सुरू करण्यासाठी माहिती पूर्ण करा आणि एक्स-रे अपलोड करा.',
      pneumoniaRisk: 'न्यूमोनिया धोका',
      tbRisk: 'क्षयरोग धोका',
      cancerRisk: 'कर्करोग धोका',
      diabetesRisk: 'मधुमेह धोका',
      asthmaRisk: 'अस्थमा धोका',
      heartRisk: 'हृदय धोका',
      aiInsight: 'एआय क्लिनिकल अंतर्दृष्टी',
      clinicalAdvice: 'क्लिनिकल सल्ला', // Added Here
      whyResult: 'हे परिणाम का?',
      radiologyEvidence: 'रेडिओलॉजी पुरावा',
      clinicalFactors: 'नैदानिक घटक'
    }
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved && languages[saved] ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const t = (key) => {
    return languages[currentLanguage]?.translations[key] || languages.en.translations[key] || key;
  };

  const value = { currentLanguage, setCurrentLanguage, t, languages: Object.keys(languages) };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};