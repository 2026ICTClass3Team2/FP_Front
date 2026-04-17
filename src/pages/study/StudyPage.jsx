import React, { useState, useEffect, useMemo } from 'react';
import { getChoseong } from 'es-hangul';
import ReactMarkdown from 'react-markdown';
const StudyPage = () => {
    // 상태 선언
    const [incomingLanguages, setIncomingLanguages] = useState([]);
    const [incomingChapters, setIncomingChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [isAdmin, setIsAdmin] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLangName, setNewLangName] = useState("");
    const [newLangUrl, setNewLangUrl] = useState("");

    // 데이터 불러오기
    useEffect(() => {
        const fetchDBData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("http://localhost:5679/webhook/study-data", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    
                    body: JSON.stringify({})
                });

                if (!res.ok) {
                    throw new Error(`HTTP 오류: ${res.status}`);
                }

                const data = await res.json();

                // ★★★ n8n에서 어떤 데이터가 오는지 확인용 ★★★
                
                const result = Array.isArray(data) ? data[0] : data;
                // 안전하게 배열로 변환
                setIncomingLanguages(Array.isArray(result.languages) ? result.languages : []);
                setIncomingChapters(Array.isArray(result.chapters) ? result.chapters : []);

            } catch (err) {
               
                // 에러 발생 시 빈 배열로 설정 (화면 크래시 방지)
                setIncomingLanguages([]);
                setIncomingChapters([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDBData();
    }, []);

    // 언어 선택
    const handleLanguageSelect = (lang) => {
        setSelectedLanguage(lang);
        const firstChapter = incomingChapters.find(c => c.language === lang);
        if (firstChapter) setSelectedChapter(firstChapter);
        setIsSearching(false);
        setSearchQuery("");
    };

    // 검색 결과 클릭 시 처리
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

    // 언어 추가
    const handleAddLanguage = async () => {
        try {
            const res = await fetch("http://localhost:5679/webhook/add-language", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: newLangName,
                    url: newLangUrl
                })
            });

            if (!res.ok) throw new Error("추가 실패");

            // 추가 후 데이터 다시 불러오기
            const reload = await fetch("http://localhost:5679/webhook/study-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const data = await reload.json();
            setIncomingLanguages(Array.isArray(data.languages) ? data.languages : []);
            setIncomingChapters(Array.isArray(data.chapters) ? data.chapters : []);

            setIsModalOpen(false);
            setNewLangName("");
            setNewLangUrl("");

        } catch (err) {
           
        }
    };

    // 검색 제안
    const suggestions = useMemo(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return [];

        const query = trimmed.toLowerCase();
        const queryChoseong = getChoseong(trimmed);

        const allItems = Array.from(
            new Set([...incomingLanguages, ...incomingChapters.map(c => c.title)])
        );

        return allItems.filter(item => {
            if (!item) return false;
            const itemLower = item.toLowerCase();
            const itemChoseong = getChoseong(item);
            return itemLower.startsWith(query) || 
                   (queryChoseong !== "" && itemChoseong.startsWith(queryChoseong));
        }).slice(0, 10);
    }, [searchQuery, incomingLanguages, incomingChapters]);

    // 선택된 언어의 챕터 필터링 (안전 처리 추가)
    const currentChapters = useMemo(() => {
        if (!Array.isArray(incomingChapters)) return [];
        return incomingChapters.filter(c => c.language === selectedLanguage);
    }, [incomingChapters, selectedLanguage]);

    // 로딩 화면
    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                <span className="ml-4 font-bold">데이터 불러오는 중...</span>
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
                            onChange={(e) => { 
                                setSearchQuery(e.target.value); 
                                setIsSearching(true); 
                            }}
                            placeholder="검색..."
                            className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl"
                        />

                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => handleItemSelect(item)} 
                                        className="w-full text-left px-6 py-4 hover:bg-secondary"
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
                                {incomingLanguages.map(lang => (
                                    <button 
                                        key={lang} 
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl 
                                            ${selectedLanguage === lang ? "bg-primary text-white" : "hover:bg-secondary"}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-black mb-6 px-4">
                                {selectedLanguage || "언어를 선택해주세요"} 챕터
                            </h3>
                            <div className="space-y-2">
                                {currentChapters.map(chapter => (
                                    <button 
                                        key={chapter.id} 
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl border-2 
                                            ${selectedChapter?.id === chapter.id ? "border-primary bg-primary/5" : "border-transparent"}`}
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
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-primary text-white rounded-2xl transition hover:bg-primary/80 hover:scale-105 active:scale-95"
                        >
                            언어 추가
                        </button>
                    </div>
                )}

                <div className="max-w-5xl ml-16">
                    {selectedChapter ? (
                        <article className="space-y-24">
                            <header>
                                <h1 className="text-4xl font-black">{selectedChapter.title}</h1>
                            </header>
                            <div className="min-h-[40rem] w-full bg-surface border-2 border-border rounded-[4rem] p-20 shadow-sm">
                                <div className="text-xl leading-relaxed">
                                    <ReactMarkdown>
                                    {selectedChapter.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div className="flex items-center justify-center h-96 text-gray-500">
                            왼쪽에서 언어와 챕터를 선택해주세요.
                        </div>
                    )}

                    {/* 언어 추가 모달 */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                            <div className="bg-surface p-8 rounded-2xl w-full max-w-md border border-border">
                                <h2 className="text-xl font-bold mb-4">언어 추가</h2>

                                <input
                                    type="text"
                                    placeholder="언어 이름"
                                    value={newLangName}
                                    onChange={(e) => setNewLangName(e.target.value)}
                                    className="w-full mb-3 p-3 border border-border rounded-xl"
                                />

                                <input
                                    type="text"
                                    placeholder="데이터 주소"
                                    value={newLangUrl}
                                    onChange={(e) => setNewLangUrl(e.target.value)}
                                    className="w-full mb-4 p-3 border border-border rounded-xl"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 p-3 bg-secondary rounded-xl transition hover:bg-secondary/70"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleAddLanguage}
                                        className="flex-1 p-3 bg-primary text-white rounded-xl transition hover:bg-primary/80"
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudyPage;