import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Sparkles, 
  Clock, 
  User, 
  Home, 
  Building2, 
  Heart, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  Bell, 
  Search, 
  ChevronRight, 
  IndianRupee, 
  MapPin, 
  Sliders, 
  Code, 
  Database, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Scale,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import AssistantMessage from '../components/AssistantMessage';
import AiPropertyCard from '../components/AiPropertyCard';
import ContactAgentModal from '../components/ContactAgentModal';
import PropertyCompareModal from '../components/PropertyCompareModal';
import AiPreferencesModal from '../components/AiPreferencesModal';

const AiAssistant = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  // Search in header
  const [headerSearch, setHeaderSearch] = useState('');

  // Messages state
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'user',
      text: 'Find 3 BHK properties in Hyderabad under ₹80 lakhs',
      timestamp: '10:24 AM',
    },
    {
      id: 'msg-2',
      sender: 'assistant',
      text: 'I found matching properties based on your budget, location and bedroom preference. Here are the best options for you:',
      timestamp: '10:24 AM',
      properties: [], // Populated on mount
      followUp: 'Would you like to see more properties, apply additional filters, or compare these options?'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState([]);
  const [preferences, setPreferences] = useState({
    budget: 'Up to ₹80 Lakhs',
    propertyType: '3 BHK',
    preferredLocation: 'Hyderabad'
  });

  // Modals state
  const [selectedPropertyForContact, setSelectedPropertyForContact] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial load: Fetch initial properties, recent queries & preferences
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Fetch preferences
        const prefRes = await api.get('/ai/preferences');
        if (prefRes.data) setPreferences(prefRes.data);

        // 2. Fetch recent queries
        const queriesRes = await api.get('/ai/recent-queries');
        if (queriesRes.data) setRecentQueries(queriesRes.data);

        // 3. Populate default initial message properties
        const propRes = await api.get('/properties?city=Hyderabad&bedrooms=3&maxPrice=8000000&limit=3');
        if (propRes.data && propRes.data.properties && propRes.data.properties.length > 0) {
          setMessages(prev => {
            const copy = [...prev];
            copy[1].properties = propRes.data.properties;
            return copy;
          });
        }
      } catch (err) {
        console.error('Error loading AI data:', err);
      }
    };
    initData();
  }, []);

  // Submit query
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeNow
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const { data } = await api.post('/ai/chat', {
        message: query,
        conversationHistory: history,
        preferences
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
        followUp: data.followUps?.[0] || 'Would you like to explore further or refine your search?',
        provider: data.provider
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Refresh recent queries
      const qRes = await api.get('/ai/recent-queries');
      if (qRes.data) setRecentQueries(qRes.data);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const isTimeout = err.code === 'ECONNABORTED';
      const errorMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: isTimeout
          ? 'The assistant is taking longer than expected. Please try again in a moment.'
          : serverMessage || err.message || 'I could not reach the assistant service. Please check your connection and try again.',
        timestamp: timeNow,
        properties: [],
        followUp: 'Try sending your question again.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Compare Handler
  const handleToggleCompare = (property) => {
    if (compareList.some(p => p._id === property._id)) {
      setCompareList(compareList.filter(p => p._id !== property._id));
    } else {
      if (compareList.length >= 2) {
        setCompareList([compareList[1], property]);
      } else {
        setCompareList([...compareList, property]);
      }
    }
  };

  const userName = userInfo?.name || 'Vinam Prasad';
  const userRole = userInfo?.role === 'vendor' ? 'Agent' : userInfo?.role === 'admin' ? 'Admin' : 'Buyer';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-900 flex flex-col font-sans">
      {/* Top Navigation Bar Matching Image 1 */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Home size={22} />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900 tracking-tight flex items-center">
              Home<span className="text-blue-600">Nest</span>
            </span>
            <p className="text-[10px] font-semibold text-gray-400 -mt-1 tracking-wider uppercase">Find Your Perfect Place</p>
          </div>
        </Link>

        {/* Global AI Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (headerSearch.trim()) {
                handleSendMessage(headerSearch);
                setHeaderSearch('');
              }
            }}
            className="w-full relative"
          >
            <Search className="absolute left-4 top-3 text-gray-400" size={17} />
            <input 
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search properties, locations, or ask our AI assistant..."
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
            />
          </form>
        </div>

        {/* User Pill & Notifications */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
              1
            </span>
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-gray-900 leading-tight">{userName}</div>
              <div className="text-[11px] text-gray-500">{userRole}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Left Sidebar + Center Chat Area + Right Sidebar */}
      <div className="flex-grow max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar (2.5 Cols) */}
        <aside className="hidden lg:flex lg:col-span-2 flex-col gap-6 sticky top-20">
          <div className="bg-white rounded-2xl border border-gray-200/70 p-3 shadow-xs">
            <nav className="flex flex-col gap-1">
              <Link to="/" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link to="/properties" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                <Building2 size={18} />
                <span>Properties</span>
              </Link>
              <Link to="/properties" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                <Heart size={18} />
                <span>Favorites</span>
              </Link>
              
              {/* Active AI Assistant Pill */}
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 shadow-xs">
                <Bot size={18} className="text-blue-600" />
                <span>AI Assistant</span>
              </div>

              <Link to="/vendor/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                <MessageSquare size={18} />
                <span>My Inquiries</span>
              </Link>
              <Link to="/vendor/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                <User size={18} />
                <span>Profile</span>
              </Link>
              
              <div className="my-2 border-t border-gray-100"></div>

              <button className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors w-full text-left">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors w-full text-left">
                <HelpCircle size={18} />
                <span>Help</span>
              </button>
            </nav>
          </div>

          {/* Left Sidebar Promo Card Matching Image 1 */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-blue-100/80 p-5 text-center flex flex-col items-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-3 text-blue-600 border border-blue-50">
              <Building2 size={28} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Find Better Homes with AI</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Smart search.<br />Better decisions.<br />Happier living.
            </p>
          </div>
        </aside>

        {/* Center Main Chat Panel (7 Cols) */}
        <main className="col-span-1 lg:col-span-7 flex flex-col bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden min-h-[750px]">
          {/* AI Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3.5 bg-gradient-to-r from-blue-50/30 via-white to-transparent">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
              <Bot size={26} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">AI Property Assistant</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ask anything about properties. Get instant answers, recommendations, and insights.
              </p>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-6 max-h-[620px]">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  /* User Message Bubble (Aligned Right) */
                  <div className="flex justify-end items-end gap-2.5">
                    <div className="flex flex-col items-end max-w-[80%]">
                      <div className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-md shadow-blue-600/15 text-sm font-medium leading-relaxed">
                        {msg.text}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 mr-1">{msg.timestamp}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mb-5">
                      <User size={16} />
                    </div>
                  </div>
                ) : (
                  /* Assistant Message Bubble (Aligned Left) */
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                      <Bot size={20} />
                    </div>
                    <div className="flex-1 space-y-4">
                      {/* Text Bubble */}
                      <div className="bg-gray-50 border border-gray-100/90 text-gray-800 p-4 rounded-2xl rounded-tl-xs text-sm leading-relaxed shadow-xs">
                        <AssistantMessage text={msg.text} />
                        {msg.provider && (
                          <div className="mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> Powered by {msg.provider}
                          </div>
                        )}
                      </div>

                      {/* Property Cards Grid (if properties returned) */}
                      {msg.properties && msg.properties.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                          {msg.properties.map((prop) => (
                            <AiPropertyCard
                              key={prop._id || prop.slug}
                              property={prop}
                              onContactAgent={(p) => setSelectedPropertyForContact(p)}
                              onViewDetails={(p) => navigate(`/property/${p.slug || p._id}`)}
                              onAddToCompare={handleToggleCompare}
                              isCompared={compareList.some(c => c._id === prop._id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Follow-up question bubble */}
                      {msg.followUp && (
                        <div className="bg-blue-50/60 border border-blue-100/70 p-3.5 rounded-xl text-xs text-blue-900 flex flex-col gap-2">
                          <p className="font-medium">{msg.followUp}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={() => handleSendMessage('Suggest more similar properties based on my preferences')}
                              className="bg-white hover:bg-blue-100/60 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-xs transition-colors cursor-pointer"
                            >
                              Show more options
                            </button>
                            <button
                              onClick={() => handleSendMessage('Compare these properties')}
                              className="bg-white hover:bg-blue-100/60 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-xs transition-colors cursor-pointer"
                            >
                              Compare options
                            </button>
                            <button
                              onClick={() => handleSendMessage('Tell me about home loan options')}
                              className="bg-white hover:bg-blue-100/60 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-xs transition-colors cursor-pointer"
                            >
                              Home loan details
                            </button>
                          </div>
                        </div>
                      )}

                      <span className="text-[11px] text-gray-400 block ml-1">{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot size={20} />
                </div>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl rounded-tl-xs text-xs text-gray-500 flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-blue-600" />
                  <span>Consulting AI Assistant & querying MongoDB property records...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar Matching Image 1 */}
          <div className="p-4 border-t border-gray-100 bg-white">
            {compareList.length > 0 && (
              <div className="mb-2.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-800">
                <span className="font-semibold">{compareList.length} properties selected for comparison</span>
                <div className="flex items-center gap-2">
                  {compareList.length >= 2 && (
                    <button
                      onClick={() => setIsCompareOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Compare Now
                    </button>
                  )}
                  <button
                    onClick={() => setCompareList([])}
                    className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-gray-50/90 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white transition-all shadow-inner"
            >
              <button 
                type="button" 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                title="Attach reference"
              >
                <Paperclip size={18} />
              </button>

              <input 
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about properties (e.g., 'Show villas in Hyderabad', 'Compare these properties')"
                className="flex-1 bg-transparent py-2.5 px-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />

              <button 
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 text-xs transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </main>

        {/* Right Sidebar (3 Cols) */}
        <aside className="col-span-1 lg:col-span-3 flex flex-col gap-6 sticky top-20">
          
          {/* Card 1: AI Recommendations Based on Preferences Matching Image 1 */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-600" size={20} />
              <div>
                <h3 className="font-extrabold text-gray-900 text-base leading-tight">AI Recommendations</h3>
                <p className="text-[11px] text-gray-400">Based on your preferences</p>
              </div>
            </div>

            {/* Preference Items */}
            <div className="space-y-2.5">
              {/* Budget */}
              <div 
                onClick={() => setIsPreferencesOpen(true)}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-emerald-50/50 border border-gray-100 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <IndianRupee size={15} />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Budget</div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {preferences.budget}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Property Type */}
              <div 
                onClick={() => setIsPreferencesOpen(true)}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-purple-50/50 border border-gray-100 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Property Type</div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {preferences.propertyType}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Preferred Location */}
              <div 
                onClick={() => setIsPreferencesOpen(true)}
                className="p-3 rounded-2xl bg-gray-50 hover:bg-rose-50/50 border border-gray-100 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Preferred Location</div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-rose-700 transition-colors">
                      {preferences.preferredLocation}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Subcard */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col gap-2.5">
              <h5 className="font-bold text-gray-900 text-xs">Get Better Recommendations</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Tell us your preferences and we'll find the perfect properties for you.
              </p>
              <button 
                onClick={() => setIsPreferencesOpen(true)}
                className="w-full bg-white hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 font-bold text-xs py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Update Preferences
              </button>
            </div>
          </div>

          {/* Card 2: Recent Queries Matching Image 1 */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-gray-500" size={17} />
                <h3 className="font-extrabold text-gray-900 text-sm">Recent Queries</h3>
              </div>
              <button 
                onClick={() => handleSendMessage('Find 3 BHK properties in Hyderabad under ₹80 lakhs')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {recentQueries.map((q) => (
                <div 
                  key={q.id}
                  onClick={() => handleSendMessage(q.query)}
                  className="py-2.5 px-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 overflow-hidden">
                    <MessageSquare size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {q.query}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{q.timeLabel || q.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Horizontal Pipeline Architecture "How It Works" Section Matching Image 1 & 2 */}
      <footer className="w-full bg-white border-t border-gray-200/90 py-8 px-4 sm:px-8 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Settings size={17} />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-base">How It Works</h4>
                <p className="text-xs text-gray-400">From your question to the perfect answer</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold shadow-xs">
              <Sparkles size={14} />
              <span>Smarter Property Decisions with AI</span>
            </div>
          </div>

          {/* 6-Step Pipeline Flow matching the exact diagram */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative">
            {/* Step 1: User */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-sm">
                <User size={18} />
              </div>
              <span className="font-bold text-gray-900 text-xs">User</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Asks a question</span>
            </div>

            {/* Step 2: React UI */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-2 shadow-sm">
                <Code size={18} />
              </div>
              <span className="font-bold text-gray-900 text-xs">React UI</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Chat interface</span>
            </div>

            {/* Step 3: Node.js API */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-sm">
                <Layers size={18} />
              </div>
              <span className="font-bold text-gray-900 text-xs">Node.js API</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Processes request</span>
            </div>

            {/* Step 4: MongoDB */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
                <Database size={18} />
              </div>
              <span className="font-bold text-gray-900 text-xs">MongoDB</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Fetches relevant data</span>
            </div>

            {/* Step 5: AI Engine */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-2 shadow-sm">
                <Cpu size={18} />
              </div>
              <span className="font-bold text-gray-900 text-xs">AI Intelligence Engine</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Generates response</span>
            </div>

            {/* Step 6: Response */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center mb-2 shadow-sm">
                <FileText size={18} />
              </div>
              <span className="font-bold text-gray-900 text-xs">Response</span>
              <span className="text-[10px] text-gray-500 mt-0.5">Shown to user</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ContactAgentModal
        property={selectedPropertyForContact}
        isOpen={Boolean(selectedPropertyForContact)}
        onClose={() => setSelectedPropertyForContact(null)}
      />

      <PropertyCompareModal
        properties={compareList}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onContactAgent={(p) => setSelectedPropertyForContact(p)}
      />

      <AiPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onPreferencesUpdated={(newPref) => {
          setPreferences(newPref);
          handleSendMessage(`Show properties matching my updated preferences: ${newPref.budget}, ${newPref.propertyType} in ${newPref.preferredLocation}`);
        }}
      />
    </div>
  );
};

export default AiAssistant;
