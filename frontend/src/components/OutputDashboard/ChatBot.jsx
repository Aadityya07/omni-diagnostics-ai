import React, { useState, useRef, useEffect } from 'react';
import { endpoints } from '../../services/api';
import { Aperture, X, Send, Loader2, User } from 'lucide-react';

// --- CUSTOM TYPEWRITER EFFECT COMPONENT ---
const TypewriterMessage = ({ content, isTypingEffect }) => {
  const [displayedText, setDisplayedText] = useState(isTypingEffect ? "" : content);

  useEffect(() => {
    if (!isTypingEffect) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 3; // Speed of typing
      if (i > content.length) i = content.length;
      
      let currentText = content.slice(0, i);
      if ((currentText.match(/\*\*/g) || []).length % 2 !== 0) {
        currentText += '**';
      }
      setDisplayedText(currentText);
      
      if (i >= content.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [content, isTypingEffect]);

  const renderHTML = (text) => {
    const htmlText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    return { __html: htmlText };
  };

  return <span dangerouslySetInnerHTML={renderHTML(displayedText)} />;
};

// --- 1. THE CHAT PANEL (Matches Input Panel Size Perfectly) ---
export const ChatBotPanel = ({ contextData, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I am your DiagnoAI Co-Pilot. I have fully analyzed your dashboard results. **How can I help you understand your diagnosis today?**", isNew: true }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isWaiting]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const history = messages.map(m => ({ ...m, isNew: false }));
    const newHistory = [...history, { role: 'user', content: userText, isNew: false }];
    
    setMessages(newHistory);
    setInputMessage("");
    setIsWaiting(true);

    try {
      const result = await endpoints.chatWithMistral(userText, newHistory, contextData);
      setMessages(prev => [...prev, { role: 'ai', content: result.response, isNew: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Connection interrupted. Please try again.", isNew: true }]);
    } finally {
      setIsWaiting(false);
    }
  };

  return (
    <div className="glass-premium custom-scrollbar" style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', 
      maxHeight: 'calc(100vh - 100px)', overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', borderBottom: '1px solid rgba(189, 219, 209, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#36565F', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Aperture size={16} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#141414' }}>
            Diagno<span style={{ color: '#36565F' }}>AI</span> Co-Pilot
          </span>
        </div>
        <button onClick={onClose} style={{ 
          background: 'rgba(229, 83, 83, 0.1)', border: 'none', color: '#E55353', 
          cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(229, 83, 83, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(229, 83, 83, 0.1)'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar" style={{ 
        flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? '#BDDBD1' : '#36565F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: msg.role === 'user' ? '#141414' : '#FFF'
            }}>
              {msg.role === 'user' ? <User size={16}/> : <Aperture size={16}/>}
            </div>
            <div style={{
              color: msg.role === 'user' ? '#FFF' : '#2C4A52', 
              fontSize: '0.95rem', lineHeight: 1.6, padding: '12px 16px',
              background: msg.role === 'user' ? '#36565F' : 'rgba(255,255,255,0.6)',
              borderRadius: '16px', borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.role === 'ai' ? '4px' : '16px',
              maxWidth: '85%', border: msg.role === 'ai' ? '1px solid rgba(189, 219, 209, 0.3)' : 'none'
            }}>
              <TypewriterMessage content={msg.content} isTypingEffect={msg.role === 'ai' && msg.isNew} />
            </div>
          </div>
        ))}
        {isWaiting && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#36565F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Aperture size={16}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5F8190', fontSize: '0.9rem', fontStyle: 'italic' }}>
              <Loader2 size={16} className="animate-spin" /> Analyzing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ 
        padding: '16px 24px', borderTop: '1px solid rgba(189, 219, 209, 0.4)', background: 'transparent'
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your results..." disabled={isWaiting}
            style={{ 
              width: '100%', padding: '14px 50px 14px 20px', border: '1px solid #BDDBD1', 
              borderRadius: '24px', fontSize: '0.95rem', background: '#FFF', color: '#141414', outline: 'none'
            }}
          />
          <button type="submit" disabled={isWaiting || !inputMessage.trim()} style={{ 
              position: 'absolute', right: '8px', background: inputMessage.trim() ? '#36565F' : 'transparent', 
              color: inputMessage.trim() ? '#FFF' : '#BDDBD1', border: 'none', borderRadius: '50%', 
              width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s'
            }}>
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

// --- 2. THE FLOATING DRAGGABLE BUTTON (Bulletproof Positioning) ---
export const ChatFloatingButton = ({ onClick }) => {
  // We use drag offset instead of exact screen coordinates to prevent it hiding off-screen
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const hasDragged = useRef(false);

  const tooltips = ["Discuss your results ✨", "Get more info 🔍", "Ask DiagnoAI 🩺"];
  const [tooltipIdx, setTooltipIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setTooltipIdx((prev) => (prev + 1) % tooltips.length); setFade(true); }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    hasDragged.current = true;
    setDragOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <div style={{ 
      position: 'fixed', right: '40px', bottom: '40px', zIndex: 9999, touchAction: 'none',
      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` // Safe translating!
    }}>
      <div style={{
        position: 'absolute', right: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '8px 16px', 
        borderRadius: '20px', border: '1px solid #BDDBD1', color: '#36565F', fontWeight: 600, 
        fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', opacity: fade ? 1 : 0,
        transition: 'opacity 0.5s ease', pointerEvents: 'none', whiteSpace: 'nowrap'
      }}>
        {tooltips[tooltipIdx]}
      </div>
      <button 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => { if (!hasDragged.current) onClick(); }}
        style={{
          width: '56px', height: '56px', borderRadius: '50%', background: '#36565F', 
          border: '2px solid rgba(255,255,255,0.5)', color: '#FFF', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', cursor: 'grab', 
          boxShadow: '0 8px 30px rgba(54, 86, 95, 0.4)', transition: isDragging.current ? 'none' : 'transform 0.3s'
        }}
        onMouseEnter={(e) => { if(!isDragging.current) e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { if(!isDragging.current) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Aperture size={28} />
      </button>
    </div>
  );
};