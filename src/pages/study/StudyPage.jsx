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

    // 데이터 불러오기
    const fetchDBData = async () => {
        setIsLoading(true);
        try {
            // 1. n8n이 POST만 허용하므로 다시 POST로 복구합니다.
            const res = await fetch("http://localhost:5679/webhook/study-data", {
                method: "POST",
                // 2. 중요: 'Content-Type' 헤더를 명시하지 않거나 빈 객체를 보냅니다.
                // n8n Webhook 설정에 따라 특정 헤더가 Preflight(CORS) 에러를 일으킬 수 있습니다.
                headers: {
                    "Accept": "application/json",
                },
                body: JSON.stringify({}), // 빈 데이터를 보내서 POST 규격을 맞춥니다.
            });

            if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);

            const data = await res.json();
            console.log("📥 n8n에서 받은 데이터:", data);

            // n8n 데이터 구조 대응
            const result = Array.isArray(data) ? data[0] : data;

            // result가 비어있을 경우를 대비한 방어 코드
            const languagesRaw = result?.languages || [];
            const chaptersRaw = result?.chapters || [];

            const langMap = {};
            languagesRaw.forEach(lang => {
                const id = lang.language_id || lang.id;
                if (id) langMap[id] = lang.name;
            });

            const chapters = chaptersRaw.map((ch, idx) => ({
                id: ch.chapter_id || ch.id || `chapter-${idx}`,
                title: ch.title || "제목 없음",
                content: ch.content || "",
                language: langMap[ch.language_id] || "",
                order_index: ch.order_index,
            }));

            setIncomingLanguages(languagesRaw.map(l => l.name));
            setIncomingChapters(chapters);
        } catch (err) {
            console.error("데이터 불러오기 실패:", err);
            setIncomingLanguages([]);
            setIncomingChapters([]);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setSelectedFile(event.target.result);
            reader.readAsText(file);
        }
    };

    // 언어 추가 (GitHub URL 제거 + 성공 후 자동 새로고침)
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

                // 성공하면 바로 DB 다시 불러와서 화면에 반영
                await fetchDBData();

                // 추가된 언어로 바로 이동
                setSelectedLanguage(newLangName);
            } else {
                throw new Error("HTTP error");
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장에 실패했습니다.");
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
                            placeholder="검색..."
                            className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl"
                        />
                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button
                                        // item이 겹칠 수 있으므로 index와 함께 조합해서 유일성 보장
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
                            {/* StudyPage.jsx 195라인 근처 언어 선택 부분 */}
                            <div className="space-y-2">
                                {/* (lang) 뒤에 , idx 를 추가해야 idx 변수를 사용할 수 있습니다! */}
                                {incomingLanguages.map((lang, idx) => (
                                    <button
                                        key={`lang-select-${idx}-${lang}`}
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`w-full text-left px-6 py-5 rounded-2xl ${selectedLanguage === lang ?
                                            "bg-primary text-white" : "hover:bg-secondary"}`}
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
                                {currentChapters.map((chapter, idx) => (
                                    <button
                                        // chapter.id가 없으면 index라도 써서 강제로 유일하게 만듦
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

                    {/* 언어 추가 모달 (GitHub URL 제거) */}
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
                                        className="w-full p-2 text-sm border border-dashed border-primary rounded-xl"
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