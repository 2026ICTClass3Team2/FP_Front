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