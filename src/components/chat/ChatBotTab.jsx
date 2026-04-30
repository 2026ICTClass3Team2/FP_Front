import React, { useState, useRef, useEffect } from 'react';
import { FiCpu, FiCode, FiMessageCircle, FiArrowLeft, FiSend, FiPlay } from 'react-icons/fi';
import { reviewCode, chatWithBot } from '../../api/chatbot';
import jwtAxios from '../../api/jwtAxios';
import { markTypeAsRead } from '../../api/notification';

const ChatBotTab = () => {
  const [mode, setMode] = useState(null); // 'faq' or 'code'
  
  // FAQ State
  const [faqHistory, setFaqHistory] = useState([
    { role: 'bot', text: '안녕하세요! AI 챗봇 비서입니다. 궁금한 점을 입력하시거나 아래의 자주 묻는 질문을 선택해주세요.' }
  ]);
  const [faqInput, setFaqInput] = useState('');
  const [faqLoading, setFaqLoading] = useState(false);
  
  // Code Analysis State
  const [codeInput, setCodeInput] = useState('');
  const [codeReview, setCodeReview] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const predefinedFaqs = [
    { q: "DeadBug의 주요 기능은 무엇인가요?", a: "DeadBug는 개발자들을 위한 Q&A 및 커뮤니티 플랫폼입니다. 질문과 답변을 통한 지식 공유, 코드 리뷰, 채널 구독 기능 등을 제공합니다." },
    { q: "포인트는 어떻게 얻나요?", a: "질문에 좋은 답변을 달아 채택을 받거나, 활동 보상 등을 통해 포인트를 획득할 수 있습니다. 획득한 포인트는 포인트 상점에서 이용 가능합니다." },
    { q: "신고 기능은 어떻게 작동하나요?", a: "부적절한 게시물이나 댓글의 우측 메뉴에서 '신고'를 누르면 관리자에게 전달되며, 검토 후 적절한 조치가 이루어집니다." }
  ];

  const handleFixedQuestionClick = (faq) => {
    setFaqHistory(prev => [
      ...prev,
      { role: 'user', text: faq.q },
      { role: 'bot', text: faq.a }
    ]);
  };

  const handleFaqSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!faqInput.trim()) return;

    const userMessage = faqInput.trim();
    setFaqInput('');
    
    // Add user message to UI
    const updatedHistory = [...faqHistory, { role: 'user', text: userMessage }];
    setFaqHistory(updatedHistory);
    setFaqLoading(true);

    try {
      // Extract text from history to pass to API
      const historyStrings = updatedHistory.map(h => `${h.role}: ${h.text}`);
      const data = await chatWithBot(userMessage, historyStrings);
      
      setFaqHistory(prev => [
        ...prev,
        { role: 'bot', text: data.response }
      ]);
    } catch (err) {
      console.error(err);
      setFaqHistory(prev => [
        ...prev,
        { role: 'bot', text: '오류가 발생했습니다. AI 서버 연결을 확인해주세요.' }
      ]);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!codeInput.trim()) return;
    setLoading(true);
    setCodeReview('');
    try {
      // Use the dedicated chatbot API service
      const data = await reviewCode(codeInput);
      setCodeReview(data.review);
    } catch (err) {
      console.error(err);
      setCodeReview("분석 중 오류가 발생했습니다. AI 서버 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 탭을 열 때 챗봇 알림(bot 타입)을 모두 읽음 처리합니다.
    markTypeAsRead('bot').catch(err => console.error('Failed to mark bot notifications as read:', err));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [faqHistory, codeReview]);

  // 메인 메뉴
  if (!mode) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
          <FiCpu size={40} />
        </div>
        
        <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">AI 비서</h3>
        <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-8">
          도움이 필요하신가요? 원하는 기능을 선택해주세요.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={() => setMode('faq')}
            className="p-4 bg-surface hover:bg-muted/50 border border-border rounded-2xl flex items-center gap-4 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><FiMessageCircle size={20} /></div>
            <div className="text-left"><p className="font-bold">자주 묻는 질문 (FAQ)</p><p className="text-xs text-muted-foreground mt-0.5">DeadBug 이용 방법에 대한 질문</p></div>
          </button>
          
          <button 
            onClick={() => setMode('code')}
            className="p-4 bg-surface hover:bg-muted/50 border border-border rounded-2xl flex items-center gap-4 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center"><FiCode size={20} /></div>
            <div className="text-left"><p className="font-bold">클린 코드 분석기</p><p className="text-xs text-muted-foreground mt-0.5">AI가 내 코드를 리뷰하고 개선해줍니다</p></div>
          </button>
        </div>
      </div>
    );
  }

  // FAQ 모드
  if (mode === 'faq') {
    return (
      <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
        <div className="p-3 border-b border-border bg-surface flex items-center gap-3">
          <button onClick={() => setMode(null)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><FiArrowLeft size={20} /></button>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><FiMessageCircle size={20} /></div>
          <p className="text-sm font-bold text-foreground">FAQ 챗봇</p>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {faqHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {msg.role === 'bot' && <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><FiCpu size={16}/></div>}
              <div className={`px-4 py-3 rounded-2xl text-[13px] shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-surface border border-border rounded-tl-none text-foreground'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {faqHistory.length === 1 && (
            <div className="flex flex-col gap-2 mt-4 ml-10">
              {predefinedFaqs.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFixedQuestionClick(faq)}
                  className="text-left text-[13px] px-4 py-2.5 rounded-xl border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                >
                  {faq.q}
                </button>
              ))}
            </div>
          )}

          {faqLoading && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><FiCpu size={16}/></div>
              <div className="px-4 py-3 rounded-2xl text-[13px] shadow-sm bg-surface border border-border rounded-tl-none text-muted-foreground flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Input Form */}
        <form onSubmit={handleFaqSubmit} className="p-3 bg-surface border-t border-border flex gap-2">
          <input 
            type="text"
            value={faqInput}
            onChange={(e) => setFaqInput(e.target.value)}
            placeholder="AI에게 질문해보세요..."
            disabled={faqLoading}
            className="flex-1 bg-muted/40 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
          <button 
            type="submit"
            disabled={!faqInput.trim() || faqLoading}
            className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all shadow-sm"
          >
            <FiSend size={18} />
          </button>
        </form>
      </div>
    );
  }

  // 코드 리뷰 모드
  if (mode === 'code') {
    return (
      <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
        <div className="p-3 border-b border-border bg-surface flex items-center gap-3 shrink-0">
          <button onClick={() => setMode(null)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><FiArrowLeft size={20} /></button>
          <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center"><FiCode size={20} /></div>
          <p className="text-sm font-bold text-foreground">클린 코드 분석기</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
            <p className="text-[13px] text-purple-700 dark:text-purple-300 font-medium">
              분석할 코드를 아래에 붙여넣어주세요. AI가 클린 코드 표준에 맞춰 리뷰를 진행합니다.
            </p>
          </div>

          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="코드를 여기에 입력하세요..."
            className="w-full h-40 bg-muted/30 border border-border rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-purple-500/30 outline-none resize-none"
          />
          
          <button
            onClick={handleCodeSubmit}
            disabled={loading || !codeInput.trim()}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FiPlay />}
            {loading ? '분석 중...' : '코드 분석 시작'}
          </button>

          {codeReview && (
            <div ref={scrollRef} className="mt-4 bg-surface border border-border rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <FiCpu className="text-purple-500" />
                <span className="text-sm font-bold text-foreground">AI 리뷰 결과</span>
              </div>
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground">
                {codeReview}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ChatBotTab;

