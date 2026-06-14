import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, VolumeX, MessageSquare, HelpCircle, Phone, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types.ts';

interface AIChatProps {
  seniorMode: boolean;
  onNavigateToPOI: (poiId: string) => void;
}

export default function AIChat({ seniorMode, onNavigateToPOI }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: seniorMode 
        ? '長輩您好！我是榮護智慧小助理。走累了或找不到診間嗎？直接用超大字寫訊息告訴我「我想去抽血」或「我要領藥」，我就會帶您去喔！'
        : '您好！我是榮總院內導醫與健康行程 AI 助手。您可以詢問我各科別位置、檢查排程建議、或者任何求助諮詢（例如：如何前往抽血中心？一樓中正樓怎麼走？）。',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle SpeechSynthesis (TTS)
  const speakText = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop talking first
    
    // Clean text of emojis and special characters for cleaner speaking.
    const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
                          .replace(/[#*`_~]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-TW';
    utterance.rate = seniorMode ? 0.85 : 1.0; // Slightly slower for elderly
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const prompt = inputValue;
    setInputValue('');
    setLoading(true);
    stopSpeaking();

    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.text || '連線逾時，如需即時協助請點選下方呼叫志工或緊急 SOS。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages((prev) => [...prev, botMsg]);
      speakText(botMsg.text);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: '目前伺服器忙碌中。台北榮總貼心提醒您：抽血請前往中正樓1樓；一般領藥亦在中正樓1樓中央藥局，現場皆有愛心志工隨時為您指路！',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInputValue(q);
    // Trigger automatically
    setTimeout(() => {
      const btn = document.getElementById('chat-submit-btn');
      btn?.click();
    }, 50);
  };

  return (
    <div id="ai_chat_panel" className="bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="bg-teal-700 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          <div>
            <h3 className={`${seniorMode ? 'text-2xl font-black' : 'text-lg font-bold'} tracking-tight`}>
              {seniorMode ? '榮護 AI 智慧助理' : '榮總健檢導醫 AI 客服'}
            </h3>
            <p className="text-xs text-white/80">
              {seniorMode ? '💡 語音報路已開啟 • 字體已放大' : '台北榮總 Beacon 智慧定位客服系統'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`p-2 rounded-full transition ${
              ttsEnabled ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            title={ttsEnabled ? '停用語音導覽' : '啟用語音導覽'}
          >
            {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
              }`}
            >
              <div className={`${seniorMode ? 'text-xl leading-relaxed font-bold' : 'text-sm leading-relaxed'} whitespace-pre-wrap`}>
                {msg.text}
              </div>
              
              {/* If assistant lists action commands inside reply */}
              {msg.sender === 'assistant' && msg.text.includes('【') && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  {msg.text.includes('抽血') && (
                    <button
                      onClick={() => onNavigateToPOI('blood_draw')}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-teal-200"
                    >
                      🗺️ 導航至抽血區
                    </button>
                  )}
                  {msg.text.includes('藥局') && (
                    <button
                      onClick={() => onNavigateToPOI('pharmacy_main')}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-teal-200"
                    >
                      🗺️ 導航至中央藥局
                    </button>
                  )}
                  {msg.text.includes('心臟') && (
                    <button
                      onClick={() => onNavigateToPOI('cardiology')}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-teal-200"
                    >
                      🗺️ 導航至心臟內科
                    </button>
                  )}
                </div>
              )}
              
              <div className="text-[10px] mt-1 text-right opacity-60">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 font-medium ml-1">AI思考分析路線中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Buttons */}
      <div className="px-4 py-2 bg-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none border-t border-slate-200">
        <button
          onClick={() => handleQuickQuestion(seniorMode ? '帶我去中正樓一樓抽血' : '如何前往中正樓1F抽血櫃台？')}
          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-medium border border-slate-200 shadow-sm transition"
        >
          🔍 抽血在哪？
        </button>
        <button
          onClick={() => handleQuickQuestion(seniorMode ? '怎麼去拿藥的地方' : '我的看診單寫在中正樓領藥')}
          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-medium border border-slate-200 shadow-sm transition"
        >
          📋 怎麼領藥？
        </button>
        <button
          onClick={() => handleQuickQuestion(seniorMode ? '我走累了想要輪椅' : '如何呼叫無障礙輪椅接駁服務？')}
          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-medium border border-slate-200 shadow-sm transition"
        >
          ♿ 呼叫輪椅
        </button>
      </div>

      {/* Footer input form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={seniorMode ? '請在此寫下您想去哪裡...' : '輸入任何難題，AI 會協助您...'}
          className={`flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
            seniorMode ? 'text-lg font-bold' : 'text-sm'
          }`}
        />
        <button
          type="submit"
          id="chat-submit-btn"
          disabled={loading || !inputValue.trim()}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold transition flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
