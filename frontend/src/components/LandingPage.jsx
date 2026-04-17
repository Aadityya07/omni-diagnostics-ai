import React from 'react';
import { Aperture, FileText, ShieldCheck, Volume2, ArrowRight } from 'lucide-react';

const LandingPage = ({ onLaunch }) => {
  return (
    <div 
      className="custom-scrollbar"
      style={{
        position: 'relative',
        zIndex: 10,
        height: '100vh',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ===== TRUE GLASS NAVIGATION BAR ===== */}
      <div style={{ 
        position: 'fixed', 
        top: '24px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        zIndex: 100 
      }}>
        <nav style={{
          width: '90%',
          maxWidth: '1000px',
          padding: '12px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          
          /* The True Glassmorphism Effect */
          background: 'rgba(255, 255, 255, 0.25)', 
          backdropFilter: 'blur(24px)', 
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.7)', 
          borderRadius: '100px',
          boxShadow: '0 8px 32px rgba(54, 86, 95, 0.08)' 
        }}>
          
          {/* 1. Left side: New Unique AI Logo (Aperture) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#36565F', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <Aperture size={18} color="#FFFFFF" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#141414', letterSpacing: '-0.5px' }}>
              Diagno<span style={{ color: '#36565F' }}>AI</span>
            </div>
          </div>
          
          {/* 2. Middle: Centered Links */}
          <div style={{ flex: 2, display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'center' }}>
            <a href="#home" style={{ textDecoration: 'none', color: '#141414', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#36565F'} onMouseLeave={(e) => e.target.style.color = '#141414'}>Home</a>
            <a href="#features" style={{ textDecoration: 'none', color: '#141414', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#36565F'} onMouseLeave={(e) => e.target.style.color = '#141414'}>Features</a>
            <a href="#about" style={{ textDecoration: 'none', color: '#141414', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#36565F'} onMouseLeave={(e) => e.target.style.color = '#141414'}>About Us</a>
          </div>

          {/* 3. Right side: Empty div to force perfect centering of the middle links */}
          <div style={{ flex: 1 }}></div>

        </nav>
      </div>

      {/* ===== HERO SECTION (HOME) ===== */}
      <section id="home" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '80px 24px 0'
      }}>
        
        {/* Headline - Sleek and Clean */}
        <h1 className="animate-fadeIn" style={{
          fontSize: '3.4rem', 
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1px', 
          marginBottom: '20px',
          color: '#141414',
          maxWidth: '800px'
        }}>
          Your Health Data, Decoded. <br />
          <span style={{ color: '#36565F' }}>Agentic Medical Intelligence.</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fadeIn" style={{
          fontSize: '1.1rem',
          color: '#2C4A52',
          maxWidth: '600px',
          marginBottom: '40px',
          lineHeight: 1.6,
          animationDelay: '0.1s'
        }}>
          Transform confusing lab reports and complex radiological scans into clear, actionable, and secure insights using a fully local, multimodal AI co-pilot.
        </p>

        {/* Action Buttons - With sleek ArrowRight icon */}
        <div className="animate-fadeIn" style={{ display: 'flex', gap: '16px', animationDelay: '0.2s' }}>
          <button 
            onClick={onLaunch}
            style={{
              background: '#36565F',
              color: '#FFFFFF',
              padding: '14px 32px', 
              borderRadius: '40px',
              fontSize: '1.05rem',
              fontWeight: 600,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(54, 86, 95, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(54, 86, 95, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(54, 86, 95, 0.2)';
            }}
          >
            Initialize Analysis 
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" style={{
        padding: '120px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#141414', marginBottom: '16px' }}>Why DiagnoAI?</h2>
        <p style={{ color: '#36565F', fontSize: '1.1rem', marginBottom: '64px', maxWidth: '600px', margin: '0 auto 64px' }}>
          We bridge the health literacy gap by giving every patient access to a secure, autonomous medical translator.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* Feature 1 */}
          <div className="glass-premium" style={{ padding: '40px 32px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(153, 221, 204, 0.3)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#36565F', marginBottom: '24px' }}>
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#141414', marginBottom: '12px' }}>Clinical Translation</h3>
            <p style={{ color: '#2C4A52', lineHeight: 1.6, fontSize: '0.95rem' }}>
              We instantly translate complex medical jargon and tabular lab reports into clear, understandable insights so you never have to blindly Google your symptoms again.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-premium" style={{ padding: '40px 32px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(153, 221, 204, 0.3)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#36565F', marginBottom: '24px' }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#141414', marginBottom: '12px' }}>Zero-Leakage Privacy</h3>
            <p style={{ color: '#2C4A52', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Your health data is highly sensitive. Our local Agentic architecture processes your medical scans and vitals directly on-device, ensuring 100% HIPAA-grade data privacy.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-premium" style={{ padding: '40px 32px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(153, 221, 204, 0.3)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#36565F', marginBottom: '24px' }}>
              <Volume2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#141414', marginBottom: '12px' }}>Multilingual Voice AI</h3>
            <p style={{ color: '#2C4A52', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Accessibility matters. Our hybrid engine not only synthesizes your health risks but explains them to you aloud in English, Hindi, or Marathi for total comprehension.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ABOUT US SECTION ===== */}
      <section id="about" style={{
        padding: '100px 24px 150px',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#141414', marginBottom: '32px' }}>Empowering the Patient</h2>
        <div className="glass-premium" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#2C4A52', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '24px' }}>
            Receiving a medical report shouldn't be a terrifying experience. Yet, millions of patients are handed complex lab results and radiological scans filled with dense medical jargon, leaving them anxious, confused, and prone to medical misinformation online. 
          </p>
          <p style={{ color: '#2C4A52', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '32px' }}>
            <strong>DiagnoAI</strong> was built to bridge this health literacy gap. By orchestrating deterministic math filters, deep learning OCR, and local vision models, we created an autonomous, secure medical co-pilot that empowers you to understand your own body before you even step into the doctor's office.
          </p>
          <button 
            onClick={onLaunch}
            style={{
              padding: '12px 32px',
              borderRadius: '24px',
              background: 'transparent',
              color: '#36565F',
              border: '2px solid #36565F',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#36565F';
              e.currentTarget.style.color = '#FFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#36565F';
            }}
          >
            Try the Dashboard
          </button>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;