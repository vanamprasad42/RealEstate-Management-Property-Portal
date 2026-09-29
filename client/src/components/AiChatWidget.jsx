import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Minimize2, Maximize2, ExternalLink, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import AssistantMessage from './AssistantMessage';
import AiPropertyCard from './AiPropertyCard';
import ContactAgentModal from './ContactAgentModal';

const starterQuestions = [
  'Find 3 BHK in Hyderabad under 80 lakhs',
  'Show villas in Gachibowli',
  'What are the best areas to invest in Hyderabad?',
  'Compare these two properties',
  'Tell me about home loan options'
];

const AiChatWidget = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // If already on the full dedicated /ai-assistant page, don't display the floating widget
  const isDedicatedPage = location.pathname === '/ai-assistant';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your AI Property Assistant. I can help you search verified properties, compare deals, analyze investment hotspots, and calculate home loans.",
      timestamp: 'Now',
      properties: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPropertyForContact, setSelectedPropertyForContact] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (customText) => {
    const text = (customText || inputQuery).trim();
    if (!text || loading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeNow
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ sender: m.sender, text: m.text }));
      const { data } = await api.post('/ai/chat', {
        message: text,
        conversationHistory: history
      });

      if (!data?.reply || typeof data.reply !== 'string') {
        throw new Error('The assistant returned an invalid response.');
      }

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: data.timestamp || timeNow,
        properties: data.properties || [],
        followUp: data.followUps?.[0]
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const isTimeout = err.code === 'ECONNABORTED';
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: isTimeout
            ? 'The assistant is taking longer than expected. Please try again in a moment.'
            : serverMessage || err.message || 'I could not reach the assistant service. Please try again.',
          timestamp: timeNow,
          properties: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isDedicatedPage) return null;

  return (
    <>
      {/* Floating Trigger Pill matching Image 2 Step 1 */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-5 rounded-full shadow-2xl shadow-blue-600/40 border-2 border-white transition-all transform hover:scale-105 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={20} className="text-white group-hover:rotate-12 transition-transform" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Ask AI</div>
              <div className="text-sm font-black">Property Assistant</div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Modal matching Image 2 Step 2 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[460px] h-[620px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">AI Property Assistant</h3>
                <p className="text-[11px] text-blue-100">Ask anything about properties. I'm here to help!</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors"
                title="Open full page assistant"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
            {/* Starter Suggestion Chips (Shown initially) */}
            {messages.length === 1 && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-left text-xs bg-white hover:bg-blue-50/80 border border-gray-200/90 hover:border-blue-300 text-gray-700 hover:text-blue-700 py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {m.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white text-xs font-medium py-2.5 px-4 rounded-2xl rounded-tr-xs max-w-[85%] shadow-sm">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot size={15} />
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden">
                      <div className="bg-white border border-gray-100 text-gray-800 text-xs p-3 rounded-2xl rounded-tl-xs shadow-xs leading-relaxed">
                        <AssistantMessage text={m.text} />
                      </div>

                      {/* Property Cards Carousel inside widget */}
                      {m.properties && m.properties.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                          {m.properties.map((prop) => (
                            <AiPropertyCard
                              key={prop._id || prop.slug}
                              property={prop}
                              onContactAgent={(p) => setSelectedPropertyForContact(p)}
                              onViewDetails={(p) => {
                                setIsOpen(false);
                                navigate(`/property/${p.slug || p._id}`);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                <RefreshCw size={13} className="animate-spin text-blue-600" />
                <span>Searching properties & consulting AI Assistant...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white transition-all shadow-inner"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      <ContactAgentModal
        property={selectedPropertyForContact}
        isOpen={Boolean(selectedPropertyForContact)}
        onClose={() => setSelectedPropertyForContact(null)}
      />
    </>
  );
};

export default AiChatWidget;
