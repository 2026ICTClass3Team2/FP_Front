import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getChoseong } from 'es-hangul';



const StudyPage = () => {
    // 1. 상태 선언 (초기값을 [] 빈 배열로 설정)
    const [incomingLanguages, setIncomingLanguages] = useState([]);
    const [incomingChapters, setIncomingChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false); // 로딩 중 상태
    const [isDone, setIsDone] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림 여부
    const [newLangName, setNewLangName] = useState("");     // 입력한 언어 이름
    const [newLangUrl, setNewLangUrl] = useState("");      // 입력한 참고 URL

    useEffect(() => {
        const fetchDBData = async () => {
            setIsLoading(true);
            try {


            } catch (err) {
                console.log("데이터 로드 중 (가짜 데이터 없음) ");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDBData();


    }, []);
    // 사용자 정보 불러오기 useEffect (완전히 별도)
    useEffect(() => {
        // 백엔드가 아직 준비되지 않았으므로 임시로 바로 관리자 권한 부여
        // (나중에 /api/auth/me 엔드포인트가 생기면 아래 fetch 코드로 다시 바꾸면 됩니다)
        setIsAdmin(true);
        setCurrentUser({ nickname: "개발자" });

        // 백엔드 준비된 후에 사용할 코드 (지금은 주석 처리)
        /*
        const loadUserInfo = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const userData = await res.json();
                    setCurrentUser(userData);
                    setIsAdmin(userData?.role === 'admin' || userData?.isAdmin === true);
                }
            } catch (err) {
                console.error("사용자 정보 로드 실패", err);
                setIsAdmin(true);
                setCurrentUser({ nickname: "개발자" });
            }
        };

        loadUserInfo();
        */
    }, []);


    // 3. 핸들러 함수들
    const handleLanguageSelect = (lang) => {
        setSelectedLanguage(lang);
        const firstChapter = incomingChapters.find(c => c.language === lang);
        if (firstChapter) setSelectedChapter(firstChapter);
        setIsSearching(false);
        setSearchQuery("");
        setFocusedIndex(-1);
    };

    const handleItemSelect = (item) => {
        if (incomingLanguages.includes(item)) {
            handleLanguageSelect(item);
        } else {
            const target = incomingChapters.find(c => c.title === item);
            if (target) {
                setSelectedLanguage(target.language);
                setSelectedChapter(target);
            }
        }
        setSearchQuery("");
        setIsSearching(false);
        setFocusedIndex(-1);
    };

    const handleSubmitToAI = async () => {
        if (!newLangName.trim()) return alert("언어 이름을 입력해주세요.");

        setIsSubmitting(true);
        setIsDone(false);

        const payload = {
            languageName: newLangName.trim(),
            referenceUrl: newLangUrl.trim(),
            requestedBy: currentUser?.nickname || "관리자",
            timestamp: new Date().toISOString()
        };

        try {
            // 1. n8n으로 요약/번역 요청 전송
            const res = await fetch('http://localhost:5678/webhook-test/admin-input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // 2. n8n이 번역/요약해서 돌려준 최종 JSON 데이터를 받습니다.
                const aiGeneratedData = await res.json();
                console.log("n8n 결과물:", aiGeneratedData);

                // 3. 화면(사이드바/본문)에 즉시 반영하기 위해 상태 업데이트
                // n8n 응답 데이터에 id, language, title, content가 포함되어 있어야 합니다.
                setIncomingChapters(prev => [...prev, aiGeneratedData]);

                // 만약 새 언어라면 언어 목록에도 추가 (중복 방지)
                if (!incomingLanguages.includes(aiGeneratedData.language)) {
                    setIncomingLanguages(prev => [...prev, aiGeneratedData.language]);
                }

                setIsDone(true); // ✅ 생성 완료 UI로 변경

                // 4. [선택] 백엔드(Spring Boot) DB에 영구 저장
                try {
                    await fetch('http://localhost:8080/api/study-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(aiGeneratedData)
                    });
                } catch (dbErr) {
                    console.error("DB 저장 중 오류:", dbErr);
                }

                // 5. 완료 후 2.5초 뒤에 모달을 닫고 상태 초기화
                setTimeout(() => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                    setIsDone(false);
                    setNewLangName("");
                    setNewLangUrl("");
                }, 2500);
            } else {
                throw new Error("전송 실패");
            }
        } catch (err) {
            console.error(err);
            alert("n8n 서버 연결에 실패했습니다.");
            setIsSubmitting(false);
        }
    };


    // 4. 검색 필터 로직
    const suggestions = useMemo(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return [];
        const query = trimmed.toLowerCase();
        const queryChoseong = getChoseong(trimmed);
        const allItems = Array.from(new Set([...incomingLanguages, ...incomingChapters.map(c => c.title)]));

        return allItems.filter(item => {
            if (!item) return false;
            const itemLower = item.toLowerCase();
            const itemChoseong = getChoseong(item);
            return itemLower.startsWith(query) || (queryChoseong !== "" && itemChoseong.startsWith(queryChoseong));
        }).slice(0, 10);
    }, [searchQuery, incomingLanguages, incomingChapters]);

    const currentChapters = useMemo(() =>
        incomingChapters.filter(c => c.language === selectedLanguage),
        [incomingChapters, selectedLanguage]
    );

    // 로딩 화면
    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                <p className="ml-4 font-bold">데이터 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            {/* 사이드바 */}
            <aside className="w-80 md:w-96 shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-surface border-t border border-border rounded-tl-[3rem] rounded-tr-[3rem] flex flex-col overflow-hidden shadow-md">
                    <div className="p-10 pb-8 border-b border-border/50 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                            placeholder="검색..."
                            className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl"
                        />
                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button key={idx} onClick={() => handleItemSelect(item)} className="w-full text-left px-6 py-4 hover:bg-secondary">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                        <section>
                            <h3 className="text-lg font-black mb-6 px-4">언어 선택</h3>
                            <div className="space-y-2">
                                {incomingLanguages.map(lang => (
                                    <button key={lang} onClick={() => handleLanguageSelect(lang)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl ${selectedLanguage === lang ? "bg-primary text-white" : "hover:bg-secondary"}`}>
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h3 className="text-lg font-black mb-6 px-4">{selectedLanguage} 챕터</h3>
                            <div className="space-y-2">
                                {currentChapters.map(chapter => (
                                    <button key={chapter.id} onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl border-2 ${selectedChapter?.id === chapter.id ? "border-primary bg-primary/5" : "border-transparent"}`}>
                                        {chapter.title}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 overflow-y-auto p-16 pt-20 bg-background" onClick={() => setIsSearching(false)}>

                {/* ==================== 관리자 전용 입력 버튼 ==================== */}
                {isAdmin && currentUser && (
                    <div className="mb-8 flex justify-end">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl flex items-center gap-2 shadow-md transition-all"
                        >
                            ➕ AI 학습 자료 생성 요청
                        </button>

                        {/* 모달창 본체 */}
                        {isModalOpen && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                                <div className="bg-surface p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-border min-h-[350px] flex flex-col justify-center relative">

                                    {!isSubmitting && !isDone ? (
                                        /* 1단계: 입력 화면 */
                                        <div className="flex flex-col gap-6">
                                            <h2 className="text-2xl font-black">새로운 언어 추가</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-bold ml-1">언어 이름</label>
                                                    <input
                                                        type="text"
                                                        value={newLangName}
                                                        onChange={(e) => setNewLangName(e.target.value)}
                                                        placeholder="예: Python"
                                                        className="w-full h-14 px-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none mt-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-bold ml-1">참고 URL (위키독스 등)</label>
                                                    <input
                                                        type="text"
                                                        value={newLangUrl}
                                                        onChange={(e) => setNewLangUrl(e.target.value)}
                                                        placeholder="https://..."
                                                        className="w-full h-14 px-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none mt-2"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setIsModalOpen(false)}
                                                    className="flex-1 py-4 bg-secondary font-bold rounded-2xl hover:bg-secondary/80 transition-all"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={handleSubmitToAI}
                                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg"
                                                >
                                                    생성 요청
                                                </button>
                                            </div>
                                        </div>
                                    ) : isSubmitting && !isDone ? (
                                        /* 2단계: 로딩 화면 (n8n 작업 중) */
                                        <div className="flex flex-col items-center gap-8 py-10">
                                            <div className="relative">
                                                <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary animate-pulse">AI</span>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className="text-xl font-black">학습 자료 정리 중...</h3>
                                                <p className="text-sm text-gray-400">AI가 위키독스 내용을 분석하고 있습니다.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        /* 3단계: 완료 화면 */
                                        <div className="flex flex-col items-center gap-6 py-10 animate-in zoom-in-95 duration-300">
                                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-5xl">✅</span>
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black text-primary">생성 완료!</h3>
                                                <p className="text-gray-500 mt-2 font-medium">학습 페이지에 자료가 추가되었습니다.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}


                <div className="max-w-5xl ml-16">
                    {selectedChapter && (
                        <article className="space-y-24">
                            <header><h1 className="text-4xl font-black">{selectedChapter.title}</h1></header>
                            <div className="min-h-[40rem] w-full bg-surface border-2 border-border rounded-[4rem] p-20 shadow-sm">
                                <p className="text-xl font-bold leading-relaxed">{selectedChapter.content}</p>
                            </div>
                        </article>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudyPage;