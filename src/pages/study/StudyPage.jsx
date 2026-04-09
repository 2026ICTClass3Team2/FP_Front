import React, { useState, useEffect } from 'react';

// 테스트 데이터 (소스 상단 유지)
const testLanguages = ["JavaScript", "React", "Spring Boot"];
const testChapters = [
    { id: 1, language: "JavaScript", title: "변수와 자료형",subtitle: "LET, CONST, VAR의 차이점", content: "자바스크립트에는 let, const, var가 있습니다..." },
    { id: 2, language: "JavaScript", title: "화살표 함수", content: "ES6에서 도입된 화살표 함수는 문법이 간결합니다." },
    { id: 3, language: "React", title: "컴포넌트란?", content: "리액트의 핵심은 UI를 독립적인 단위로 쪼개는 것입니다." },
    { id: 4, language: "Spring Boot", title: "Annotation 정리", content: "@RestController, @Service 등 주요 어노테이션 설명..." }
];

const StudyPage = ({ incomingLanguages = testLanguages, incomingChapters = testChapters }) => {
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // 키보드 방향키 선택을 위한 상태 인덱스
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // 초기 로드 시 첫 번째 언어와 첫 번째 챕터 설정
    useEffect(() => {
        if (incomingLanguages.length > 0 && !selectedLanguage) {
            handleLanguageSelect(incomingLanguages[0]);
        }
    }, [incomingLanguages]);

    // 언어 선택 시 로직: 언어와 해당 언어의 첫 챕터를 동시에 업데이트
    const handleLanguageSelect = (lang) => {
        setSelectedLanguage(lang);
        const firstChapter = incomingChapters.find(c => c.language === lang);
        if (firstChapter) {
            setSelectedChapter(firstChapter);
        }
        setIsSearching(false);
        setSearchQuery("");
    };

    // 특정 항목 선택 공통 로직 (검색 결과 클릭/엔터 시 사용)
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

    // 키보드 이벤트 핸들러 (방향키, 엔터)
    const handleKeyDown = (e) => {
        if (!isSearching || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === "Enter") {
            if (focusedIndex >= 0) {
                handleItemSelect(suggestions[focusedIndex]);
            }
        } else if (e.key === "Escape") {
            setIsSearching(false);
        }
    };

    const currentChapters = incomingChapters.filter(c => c.language === selectedLanguage);

    const suggestions = searchQuery
        ? [...incomingLanguages, ...incomingChapters.map(c => c.title)].filter(item =>
            item.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">

            {/* --- 사이드바 --- */}
            <aside className="w-80 md:w-96 shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-surface border-t border border-border rounded-tl-[3rem] rounded-tr-[3rem] flex flex-col overflow-hidden shadow-md">

                    {/* 검색 영역 */}
                    <div className="p-10 pb-8 border-b border-border/50 relative">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearching(true);
                                    setFocusedIndex(-1); // 검색어 변경 시 포커스 초기화
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="검색 (언어 또는 챕터)"
                                className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl text-base font-medium focus:outline-none focus:border-primary/50 transition-all"
                            />
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">🔍</span>
                        </div>

                        {/* 자동완성 드롭다운 */}
                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleItemSelect(item)}
                                        className={`w-full text-left px-6 py-4 text-base font-bold border-b border-border/30 last:border-0 transition-colors ${focusedIndex === idx ? "bg-primary text-white" : "hover:bg-secondary text-foreground"
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-10">
                        {/* 언어 선택 */}
                        <section>
                            <h3 className="text-lg font-black text-muted-foreground uppercase tracking-[0.25em] mb-6 px-4">언어 선택</h3>
                            <div className="space-y-2">
                                {incomingLanguages.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl transition-all transform ${selectedLanguage === lang
                                                ? "bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02] text-lg font-black"
                                                : "text-foreground hover:bg-secondary hover:translate-x-1 text-lg font-bold"
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 챕터 목록 */}
                        <section>
                            <h3 className="text-lg font-black text-muted-foreground uppercase tracking-[0.25em] mb-6 px-4">
                                {selectedLanguage} 챕터
                            </h3>
                            <div className="space-y-2">
                                {currentChapters.map(chapter => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl transition-all border-2 ${selectedChapter?.id === chapter.id
                                                ? "border-primary/40 bg-primary/5 text-primary text-lg font-black"
                                                : "border-transparent text-foreground/80 hover:bg-secondary hover:text-foreground text-lg font-bold"
                                            }`}
                                    >
                                        {chapter.title}
                                    </button>
                                ))}
                                {currentChapters.length === 0 && (
                                    <p className="px-6 py-4 text-muted-foreground italic font-medium">등록된 챕터가 없습니다.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </aside>

            {/* --- 메인 콘텐츠 --- */}
            <main className="flex-1 overflow-y-auto scrollbar-hide p-16 pt-20 bg-background" onClick={() => setIsSearching(false)}>
                <div className="max-w-5xl ml-16">
                    {selectedChapter ? (
                        <>
                            <nav className="flex items-center gap-4 mb-14">
                                <span className="px-4 py-1.5 bg-foreground text-background text-xs font-black rounded-lg uppercase tracking-widest">
                                    {selectedLanguage}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span className="text-lg font-bold text-muted-foreground">{selectedChapter.title}</span>
                            </nav>

                            <article className="space-y-24">
                                <header className="mb-20">
                                    <h1 className="text-4xl font-black tracking-tight text-foreground leading-[1.1]">
                                        {selectedChapter.title}
                                    </h1>
                                </header>

                                <section className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="h-14 w-auto min-w-[24rem] inline-flex bg-secondary/70 rounded-2xl items-center px-8">
                                            <span className="text-base font-black text-foreground/60 uppercase tracking-widest">
                                                {selectedChapter.subtitle || "Main Content"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="min-h-[40rem] w-full bg-surface border-2 border-border rounded-[4rem] p-20 shadow-sm leading-relaxed">
                                        <p className="text-foreground text-xl font-bold leading-[1.6]">
                                            {selectedChapter.content}
                                        </p>
                                    </div>
                                </section>
                            </article>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-2xl font-black text-muted-foreground italic">Loading Knowledge...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudyPage;