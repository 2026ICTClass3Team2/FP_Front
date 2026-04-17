import React, { useState, useEffect, useMemo } from 'react';
import { getChoseong } from 'es-hangul';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const StudyPage = () => {
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
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

    const fetchDBData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:5679/webhook/study-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ user_id: 1 }),
            });

            const data = await res.json();
            console.log("n8n 원본 데이터:", data); // 브라우저 콘솔에서 구조 확인용

            // [방어 코드 추가] n8n 응답 구조에 따른 데이터 추출
            let result = {};
            if (Array.isArray(data) && data.length > 0) {
                // [{ json: { languages, ... } }] 형태일 때
                result = data[0].json || data[0];
            } else {
                // { languages, ... } 형태일 때
                result = data.json || data;
            }

            // result가 languages를 가지고 있는지 확인 (없으면 빈 배열로 초기화)
            const resRaw = result?.languages || [];
            const oriRaw = result?.chapters || [];
            const transRaw = result?.translated || [];

            const resourceMap = {};
            resRaw.forEach(r => {
                if (r.resource_id) resourceMap[r.resource_id] = r.name;
            });

            const chapters = oriRaw.map(ori => {
                const trans = transRaw.find(t => t.original_id === ori.original_id && t.language === 'ko');

                return {
                    id: ori.original_id,
                    title: trans ? trans.title : ori.title,
                    content: trans ? trans.content : ori.content,
                    rawContent: ori.content,
                    resourceName: resourceMap[ori.resource_id] || "미분류",
                    order: ori.index_order,
                    status: ori.is_translated ? "번역됨" : "원문",
                    language: resourceMap[ori.resource_id] || "미분류",
                };
            });

            setIncomingLanguages(resRaw.map(r => r.name));
            setIncomingChapters(chapters);

        } catch (err) {
            console.error("데이터 로드 실패:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDBData();
    }, []);

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

    const handleSearchKeyDown = (e) => {
        if (!isSearching || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeSuggestionIndex >= 0) {
                handleItemSelect(suggestions[activeSuggestionIndex]);
            } else {
                handleItemSelect(suggestions[0]);
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setSelectedFile(event.target.result);
            reader.readAsText(file);
        }
    };

    const handleAddLanguage = async () => {
        if (!newLangName) return alert("언어 이름을 입력해주세요.");
        if (!selectedFile) return alert("MD 파일을 업로드해주세요.");

        const payload = {
            name: newLangName,
            content: selectedFile
        };

        try {
            const res = await fetch("http://localhost:5679/webhook/add-language", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`${newLangName} 추가 완료!`);
                setIsModalOpen(false);
                setNewLangName("");
                setSelectedFile(null);

                await fetchDBData();
                setSelectedLanguage(newLangName);
            } else {
                throw new Error("HTTP error");
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장에 실패했습니다.");
        }
    };

    const handleDeleteLanguage = (e, lang) => {
        e.stopPropagation();
        if (window.confirm(`정말 '${lang}' 언어를 삭제하시겠습니까?`)) {
            alert(`'${lang}' 삭제 요청 완료! (n8n 삭제 Webhook 연동이 필요합니다)`);
        }
    };

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

    const currentChapters = useMemo(() => {
        return incomingChapters.filter(c => c.language === selectedLanguage);
    }, [incomingChapters, selectedLanguage]);

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
                            onKeyDown={handleSearchKeyDown}
                            placeholder="검색..."
                            className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl"
                        />
                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={`search-item-${idx}-${item}`}
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
                                {incomingLanguages.map((lang, idx) => (
                                    <div
                                        key={`lang-select-${idx}-${lang}`}
                                        onClick={() => handleLanguageSelect(lang)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleLanguageSelect(lang); }}
                                        tabIndex={0}
                                        className={`group flex items-center justify-between w-full px-6 py-5 rounded-2xl cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${selectedLanguage === lang ? "bg-primary text-white" : "hover:bg-secondary"
                                            }`}
                                    >
                                        <span>{lang}</span>
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => handleDeleteLanguage(e, lang)}
                                                className="hidden group-hover:block text-red-500 hover:text-red-700 font-bold px-2 transition-transform hover:scale-110"
                                                title="언어 삭제"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-black mb-6 px-4">
                                {selectedLanguage || "언어를 선택해주세요"} 챕터
                            </h3>
                            <div className="space-y-2">
                                {currentChapters.map((chapter, idx) => (
                                    <button
                                        key={chapter.id || `chapter-list-${idx}`}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl border-2 ${selectedChapter?.id === chapter.id ?
                                            "border-primary bg-primary/5" : "border-transparent"}`}
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
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
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

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                            <div className="bg-surface p-8 rounded-2xl w-full max-w-md border border-border">
                                <h2 className="text-xl font-bold mb-4">언어 추가</h2>
                                <input
                                    type="text"
                                    placeholder="언어 이름"
                                    value={newLangName}
                                    onChange={(e) => setNewLangName(e.target.value)}
                                    className="w-full mb-4 p-3 border border-border rounded-xl"
                                />
                                <div className="relative mb-4">
                                    <p className="text-sm text-gray-500 mb-1">MD 파일(.md) 업로드:</p>
                                    <input
                                        type="file"
                                        accept=".md"
                                        onChange={handleFileChange}
                                        className="w-full p-2 text-sm border border-dashed border-primary rounded-xl cursor-pointer hover:bg-primary/5 transition-colors duration-200"
                                    />
                                    {selectedFile && <p className="text-xs text-primary mt-1">✅ 파일이 준비되었습니다.</p>}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setIsModalOpen(false); setSelectedFile(null); }}
                                        className="flex-1 p-3 bg-secondary rounded-xl"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleAddLanguage}
                                        className="flex-1 p-3 bg-primary text-white rounded-xl"
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