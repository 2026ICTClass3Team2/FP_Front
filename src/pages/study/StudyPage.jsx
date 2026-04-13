import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getChoseong } from 'es-hangul';

const StudyPage = () => {
    // 1. 상태 선언
    const [incomingLanguages, setIncomingLanguages] = useState([]);
    const [incomingChapters, setIncomingChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLangName, setNewLangName] = useState("");
    const [newLangUrl, setNewLangUrl] = useState("");

    // 2. 초기 데이터 로드
    useEffect(() => {
        const fetchDBData = async () => {
            setIsLoading(true);
            try {
                // 실제 fetch 로직 추가 시 활용
            } catch (err) {
                console.log("데이터 로드 중 오류 발생");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDBData();
    }, []);

    useEffect(() => {
        setIsAdmin(true);
        setCurrentUser({ nickname: "개발자" });
    }, []);

    // 3. 핸들러 함수들
    const handleLanguageSelect = (lang) => {
        setSelectedLanguage(lang);
        const firstChapter = incomingChapters.find(c => c.language === lang);
        if (firstChapter) setSelectedChapter(firstChapter);
        setIsSearching(false);
        setSearchQuery("");
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
    };

    const handleWikiDocsRequest = async () => {
        if (!newLangName.trim()) return alert("언어 이름을 입력해주세요.");
        if (!newLangUrl.trim()) return alert("위키독스 URL을 입력해주세요.");

        setIsSubmitting(true);
        setIsDone(false);

        const payload = {
            languageName: newLangName.trim(),
            referenceUrl: newLangUrl.trim(),
            requestedBy: currentUser?.nickname || "관리자"
        };

        try {
            const res = await fetch('http://localhost:5678/webhook/admin-input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                const finalChapter = {
                    ...data,
                    id: data.id || `wiki-${Date.now()}`,
                    language: newLangName.trim()
                };

                setIncomingChapters(prev => [...prev, finalChapter]);
                setIncomingLanguages(prev => {
                    if (!prev.includes(finalChapter.language)) {
                        return [...prev, finalChapter.language];
                    }
                    return prev;
                });

                setIsDone(true);

                setTimeout(() => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                    setIsDone(false);
                    setNewLangName("");
                    setNewLangUrl("");
                    setSelectedLanguage(finalChapter.language);
                    setSelectedChapter(finalChapter);
                }, 2000);
            } else {
                throw new Error("n8n 응답 에러");
            }
        } catch (err) {
            console.error("데이터 가져오기 실패:", err);
            alert("서버 연결 실패 또는 크롤링 오류가 발생했습니다.");
            setIsSubmitting(false);
        }
    };

    // 4. 필터 로직
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

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                <p className="ml-4 font-bold text-foreground">데이터 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-background overflow-hidden text-foreground">
            {/* 사이드바 */}
            <aside className="w-80 md:w-96 shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-surface border-t border border-border rounded-tl-[3rem] rounded-tr-[3rem] flex flex-col overflow-hidden shadow-md">
                    <div className="p-10 pb-8 border-b border-border/50 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                            placeholder="검색..."
                            className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none"
                        />
                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={`suggest-${idx}`}
                                        onClick={() => handleItemSelect(item)}
                                        className="w-full text-left px-6 py-4 hover:bg-secondary transition-colors"
                                    >
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
                                {incomingLanguages.map((lang, idx) => (
                                    <button
                                        key={`lang-${lang}-${idx}`}
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl transition-all ${selectedLanguage === lang ? "bg-primary text-white shadow-lg" : "hover:bg-secondary"}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-black mb-6 px-4">{selectedLanguage || "언어"} 챕터</h3>
                            <div className="space-y-2">
                                {currentChapters.map((chapter, idx) => (
                                    <button
                                        key={chapter.id || `chapter-${idx}`}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all ${selectedChapter?.id === chapter.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-secondary"}`}
                                    >
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
                {isAdmin && (
                    <div className="mb-8 flex justify-end">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                        >
                            ➕ AI 학습 자료 생성 요청
                        </button>
                    </div>
                )}

                {/* 모달: isAdmin과 별개로 관리하거나, 논리적으로 분리하는 것이 안전함 */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                        <div className="bg-surface p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-border min-h-[350px] flex flex-col justify-center relative mx-4">
                            {!isSubmitting && !isDone ? (
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
                                            <label className="text-sm font-bold ml-1">참고 URL</label>
                                            <input
                                                type="text"
                                                value={newLangUrl}
                                                onChange={(e) => setNewLangUrl(e.target.value)}
                                                placeholder="https://wikidocs.net/..."
                                                className="w-full h-14 px-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none mt-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-secondary font-bold rounded-2xl hover:bg-border transition-all">취소</button>
                                        <button onClick={handleWikiDocsRequest} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg">생성 요청</button>
                                    </div>
                                </div>
                            ) : isSubmitting && !isDone ? (
                                <div className="flex flex-col items-center gap-8 py-10">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-bold text-primary animate-pulse">AI</span>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-black">학습 자료 정리 중...</h3>
                                        <p className="text-sm text-muted-foreground">AI가 내용을 분석하고 있습니다.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6 py-10 animate-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-5xl">✅</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-primary">생성 완료!</h3>
                                        <p className="text-muted-foreground mt-2 font-medium">자료가 성공적으로 추가되었습니다.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="max-w-5xl">
                    {selectedChapter ? (
                        <article className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header>
                                <span className="text-primary font-bold tracking-widest uppercase">{selectedLanguage}</span>
                                <h1 className="text-5xl font-black mt-2">{selectedChapter.title}</h1>
                            </header>
                            <div className="min-h-[30rem] w-full bg-surface border-2 border-border rounded-[3rem] p-12 md:p-20 shadow-sm">
                                <p className="text-xl leading-relaxed whitespace-pre-wrap">{selectedChapter.content}</p>
                            </div>
                        </article>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
                            <p className="text-2xl font-medium">왼쪽 사이드바에서 학습할 내용을 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudyPage;