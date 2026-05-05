import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getChoseong } from 'es-hangul';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../components/sidebar/AuthContext';
import jwtAxios from '../../api/jwtAxios';

const SquarePenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
    </svg>
);

const TranslateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
        <path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
    </svg>
);

const TranslateIconLg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
        <path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
    </svg>
);

const TRANS_LANGUAGES = [
    { code: 'ko', label: '한국어 (Korean)' },
    { code: 'en', label: '영어 (English)' },
    { code: 'jp', label: '일본어 (日本語)' },
    { code: 'zh', label: '중국어 (中文)' },
    { code: 'es', label: '스페인어 (Español)' },
    { code: 'fr', label: '프랑스어 (Français)' },
    { code: 'de', label: '독일어 (Deutsch)' },
];

const StudyPage = () => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    // ── 기존 상태
    const [incomingLanguages, setIncomingLanguages] = useState([]);
    const [incomingChapters, setIncomingChapters]   = useState([]);
    const [hiddenLanguages, setHiddenLanguages]     = useState([]);
    const [languageIdMap, setLanguageIdMap]         = useState({});
    const [isLoading, setIsLoading]                 = useState(true);
    const [selectedLanguage, setSelectedLanguage]   = useState("");
    const [selectedChapter, setSelectedChapter]     = useState(null);
    const [searchQuery, setSearchQuery]             = useState("");
    const [isSearching, setIsSearching]             = useState(false);
    const [isModalOpen, setIsModalOpen]             = useState(false);
    const [newLangName, setNewLangName]             = useState("");
    const [selectedFile, setSelectedFile]           = useState(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [isSubmitting, setIsSubmitting]           = useState(false);

    // ── 챕터 숨김
    const [hiddenChapterIds, setHiddenChapterIds] = useState([]);

    // ── 삭제한 목록 모달
    const [isDeletedListOpen, setIsDeletedListOpen]   = useState(false);
    const [deletedListTab, setDeletedListTab]         = useState('language');
    const [deletedLangsDetail, setDeletedLangsDetail] = useState([]);
    const [deletedChapsDetail, setDeletedChapsDetail] = useState([]);
    const [deletedListLoading, setDeletedListLoading] = useState(false);

    // ── 편집 모달
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm]     = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError]   = useState("");

    // ── 커스텀 확인 다이얼로그 (window.confirm 대체)
    const [confirmDialog, setConfirmDialog] = useState(null);

    // ── 번역 관련 상태
    const [rawTranslations, setRawTranslations]               = useState([]);
    const [translatedLangsByResource, setTranslatedLangsByResource] = useState({});
    const [adminTransModal, setAdminTransModal]               = useState(null);
    const [adminTransTarget, setAdminTransTarget]             = useState('');
    const [adminTransLoading, setAdminTransLoading]           = useState(false);
    const [adminTransError, setAdminTransError]               = useState('');
    const [adminTransMode, setAdminTransMode]                 = useState('select'); // 'select' | 'add'
    const [adminTransAddLoading, setAdminTransAddLoading]     = useState(false);
    const [adminTransAddPending, setAdminTransAddPending]     = useState('');
    const [userTransModal, setUserTransModal]                 = useState(null);   // { lang, resourceId } | null
    const [userTransMode, setUserTransMode]                   = useState('select'); // 'select' | 'add'
    const [userTransPending, setUserTransPending]             = useState('');
    const [userTransAddLoading, setUserTransAddLoading]       = useState(false);
    const [userTransLang, setUserTransLang]                   = useState({});

    const addButtonRef = useRef(null);
    const langRefs = useRef({});
    const chapterRefs = useRef({});

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            if (confirmDialog) { setConfirmDialog(null); return; }
            if (adminTransModal) { setAdminTransModal(null); setAdminTransTarget(''); setAdminTransError(''); return; }
            if (userTransModal) { setUserTransModal(null); return; }
            if (editTarget) { setEditTarget(null); setEditError(""); return; }
            if (isDeletedListOpen) { setIsDeletedListOpen(false); return; }
            if (isModalOpen) { setIsModalOpen(false); setSelectedFile(null); setNewLangName(""); }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [confirmDialog, adminTransModal, userTransModal, editTarget, isDeletedListOpen, isModalOpen]);

    const checkAdminAccess = (callback) => {
        if (!isAdmin) { alert('권한이 없어 접속을 제한 합니다.'); return; }
        callback();
    };

    const fetchHiddenLanguages = useCallback(async () => {
        try {
            const res = await jwtAxios.get('study/hidden-languages');
            setHiddenLanguages(res.data || []);
        } catch {
            setHiddenLanguages([]);
        }
    }, []);

    const fetchHiddenChapters = useCallback(async () => {
        try {
            const res = await jwtAxios.get('study/hidden-chapters');
            setHiddenChapterIds(res.data || []);
        } catch {
            setHiddenChapterIds([]);
        }
    }, []);

    const fetchDBData = async () => {
        setIsLoading(true);
        try {
            const res = await jwtAxios.get('study/data');
            const data = res.data;

            const resRaw   = data?.languages  || [];
            const oriRaw   = data?.chapters   || [];
            const transRaw = data?.translated || [];

            const resourceMap = {};
            resRaw.forEach(r => { if (r.resource_id && r.name) resourceMap[r.resource_id] = r.name; });

            const chapters = oriRaw.map(ori => {
                const trans = transRaw.find(t => t.original_id === ori.original_id && t.language === 'ko');
                return {
                    id: ori.original_id,
                    title: trans ? trans.title : ori.title,
                    content: trans ? trans.content : ori.content,
                    rawContent: ori.content,
                    rawTitle: ori.title,
                    resourceName: resourceMap[ori.resource_id] || "미분류",
                    order: ori.index_order,
                    status: ori.is_translated ? "번역됨" : "원문",
                    language: resourceMap[ori.resource_id] || "미분류",
                };
            }).filter(ch =>
                ch.title && ch.title.trim() !== "" && ch.title.trim() !== "/" &&
                ch.content && ch.content.trim() !== ""
            );

            const idMap = {};
            resRaw.forEach(r => { if (r.resource_id && r.name) idMap[r.name] = r.resource_id; });
            setLanguageIdMap(idMap);
            setIncomingLanguages(resRaw.map(r => r.name).filter(Boolean));
            setIncomingChapters(chapters);

            // 중복 제거 (original_id + language 기준, 첫 번째만 유지)
            const seenTrans = new Set();
            const dedupedTrans = transRaw.filter(t => {
                const key = `${t.original_id}::${t.language}`;
                if (seenTrans.has(key)) return false;
                seenTrans.add(key);
                return true;
            });
            setRawTranslations(dedupedTrans);

            // 리소스별 전체 챕터 수 계산
            const chapCountByResource = {};
            oriRaw.forEach(ori => {
                if (!ori.resource_id) return;
                chapCountByResource[ori.resource_id] = (chapCountByResource[ori.resource_id] || 0) + 1;
            });

            // original_id → resource_id 역매핑 (translated 테이블에 resource_id 없으므로 파생)
            const originalToResource = {};
            oriRaw.forEach(ori => {
                if (ori.original_id && ori.resource_id) originalToResource[ori.original_id] = ori.resource_id;
            });

            // 언어별로 번역된 original_id 집합 계산
            const transSetByResourceLang = {};
            transRaw.forEach(t => {
                if (!t.language || !t.original_id) return;
                const rid = t.resource_id || originalToResource[t.original_id];
                if (!rid) return;
                const key = `${rid}::${t.language}`;
                if (!transSetByResourceLang[key]) transSetByResourceLang[key] = new Set();
                transSetByResourceLang[key].add(t.original_id);
            });

            // 모든 챕터가 번역된 언어만 포함
            const byResourceArr = {};
            Object.entries(chapCountByResource).forEach(([rid, total]) => {
                const completedLangs = [];
                Object.entries(transSetByResourceLang).forEach(([key, ids]) => {
                    const [keyRid, lang] = key.split('::');
                    if (keyRid === rid && ids.size >= total) completedLangs.push(lang);
                });
                if (completedLangs.length > 0) byResourceArr[rid] = completedLangs;
            });
            setTranslatedLangsByResource(byResourceArr);

        } catch (err) {
            console.error("데이터 로드 실패:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDBData();
        fetchHiddenLanguages();
        fetchHiddenChapters();
    }, []);

    // 챕터 데이터 갱신 시 선택된 챕터도 최신 상태로 동기화 (수정 즉시 반영)
    useEffect(() => {
        setSelectedChapter(prev => {
            if (!prev) return prev;
            const latest = incomingChapters.find(c => c.id === prev.id);
            return latest ?? prev;
        });
    }, [incomingChapters]);

    const visibleLanguages = useMemo(
        () => incomingLanguages.filter(l => !hiddenLanguages.includes(languageIdMap[l])),
        [incomingLanguages, hiddenLanguages, languageIdMap]
    );

    const visibleChapters = useMemo(
        () => incomingChapters.filter(c =>
            visibleLanguages.includes(c.language) && !hiddenChapterIds.includes(c.id)
        ),
        [incomingChapters, visibleLanguages, hiddenChapterIds]
    );

    const handleLanguageSelect = (lang) => {
        setSelectedLanguage(lang);
        const first = visibleChapters.find(c => c.language === lang);
        if (first) setSelectedChapter(first);
        setIsSearching(false);
        setSearchQuery("");
        setTimeout(() => {
            langRefs.current[lang]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    };

    const handleItemSelect = (item) => {
        if (visibleLanguages.includes(item)) {
            handleLanguageSelect(item);
        } else {
            const target = visibleChapters.find(c => c.title === item);
            if (target) {
                setSelectedLanguage(target.language);
                setSelectedChapter(target);
                setTimeout(() => {
                    chapterRefs.current[target.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        }
        setSearchQuery("");
        setIsSearching(false);
    };

    const handleSearchKeyDown = (e) => {
        if (!isSearching || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleItemSelect(suggestions[activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0]);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.md')) {
            alert("MD 파일(.md)만 업로드할 수 있습니다.");
            e.target.value = "";
            setSelectedFile(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedFile(event.target.result);
            if (addButtonRef.current) addButtonRef.current.focus();
        };
        reader.readAsText(file);
    };

    const handleAddLanguage = async () => {
        if (!isAdmin) { alert('권한이 없어 접속을 제한 합니다.'); return; }
        if (isSubmitting) return;
        if (!newLangName) return alert("언어 이름을 입력해주세요.");

        const trimmedName = newLangName.trim();
        const trimmedLower = trimmedName.toLowerCase();

        if (visibleLanguages.includes(trimmedName)) {
            alert('이미 등록된 파일입니다.');
            return;
        }

        const caseInsensitiveMatch = incomingLanguages.find(
            l => l && l.toLowerCase() === trimmedLower && l !== trimmedName
        );
        if (caseInsensitiveMatch) {
            alert('이미 등록되어 등록할 수 없습니다.');
            return;
        }

        const hiddenResourceId = languageIdMap[trimmedName];
        if (hiddenResourceId !== undefined && hiddenLanguages.includes(hiddenResourceId)) {
            try {
                await jwtAxios.delete('study/hidden-languages', { data: { resourceId: hiddenResourceId } });
                await fetchHiddenLanguages();
                setIsModalOpen(false);
                setNewLangName("");
                setSelectedFile(null);
            } catch {
                alert("복원 중 오류가 발생했습니다.");
            }
            return;
        }

        if (!selectedFile) return alert("MD 파일을 업로드해주세요.");

        setIsSubmitting(true);
        try {
            const res = await fetch("https://n8n.deadbug.site/webhook/add-language", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmedName, content: selectedFile })
            });
            if (res.ok) {
                alert(`${trimmedName} 추가 완료!`);
                setIsModalOpen(false);
                setNewLangName("");
                setSelectedFile(null);
                await fetchDBData();
                setSelectedLanguage(trimmedName);
            } else {
                throw new Error("HTTP error");
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLanguage = (e, lang) => {
        e.stopPropagation();
        if (!isAdmin) return;
        setConfirmDialog({
            message: `정말 '${lang}' 언어를 삭제하시겠습니까?\n(DB 데이터는 유지됩니다)`,
            onConfirm: async () => {
                try {
                    const resourceId = languageIdMap[lang];
                    await jwtAxios.post('study/hidden-languages', { resourceId });
                    await fetchHiddenLanguages();
                    if (selectedLanguage === lang) {
                        setSelectedLanguage("");
                        setSelectedChapter(null);
                    }
                } catch (err) {
                    console.error("언어 삭제 실패:", err?.response?.status, err?.response?.data, err);
                }
            },
        });
    };

    const handleDeleteChapter = (e, chapter) => {
        e.stopPropagation();
        if (!isAdmin) return;
        setConfirmDialog({
            message: `정말 '${chapter.title}' 챕터를 삭제하시겠습니까?\n(DB 데이터는 유지됩니다)`,
            onConfirm: async () => {
                try {
                    await jwtAxios.post('study/hidden-chapters', { originalId: chapter.id });
                    await fetchHiddenChapters();
                    if (selectedChapter?.id === chapter.id) setSelectedChapter(null);
                } catch {
                    console.error("챕터 삭제 실패");
                }
            },
        });
    };

    const openDeletedList = async () => {
        setIsDeletedListOpen(true);
        setDeletedListTab('language');
        setDeletedListLoading(true);
        try {
            const [langRes, chapRes] = await Promise.all([
                jwtAxios.get('study/hidden-languages-detail'),
                jwtAxios.get('study/hidden-chapters-detail'),
            ]);
            setDeletedLangsDetail(langRes.data || []);
            setDeletedChapsDetail(chapRes.data || []);
        } catch {
            setDeletedLangsDetail([]);
            setDeletedChapsDetail([]);
        } finally {
            setDeletedListLoading(false);
        }
    };

    const handleRestoreLanguage = async (resourceId) => {
        try {
            await jwtAxios.delete('study/hidden-languages', { data: { resourceId } });
            await fetchHiddenLanguages();
            setDeletedLangsDetail(prev => prev.filter(l => l.resourceId !== resourceId));
        } catch {
            alert("복원 중 오류가 발생했습니다.");
        }
    };

    const handleRestoreChapter = async (originalId) => {
        try {
            await jwtAxios.delete('study/hidden-chapters', { data: { originalId } });
            await fetchHiddenChapters();
            setDeletedChapsDetail(prev => prev.filter(c => c.originalId !== originalId));
        } catch {
            alert("복원 중 오류가 발생했습니다.");
        }
    };

    const handleOpenEdit = (e, type, item) => {
        e.stopPropagation();
        if (!isAdmin) return;
        if (type === 'language') {
            setEditTarget({ type: 'language', id: languageIdMap[item] });
            setEditForm({ name: item });
        } else {
            setEditTarget({ type: 'chapter', id: item.id });
            setEditForm({ title: item.title, content: item.content });
        }
    };

    const handleSaveEdit = async () => {
        if (!editTarget) return;
        setEditLoading(true);
        setEditError("");
        try {
            if (editTarget.type === 'language') {
                await jwtAxios.patch(`study/resource/${editTarget.id}`, { name: editForm.name });
            } else {
                await jwtAxios.patch(`study/chapter/${editTarget.id}`, { title: editForm.title, content: editForm.content });
            }
            await fetchDBData();
            setEditTarget(null);
        } catch {
            setEditError("수정 중 오류가 발생했습니다.");
        } finally {
            setEditLoading(false);
        }
    };

    // 선택된 번역 언어에 따라 챕터 내용을 반환
    const getDisplayedChapter = useCallback((chapter) => {
        if (!chapter) return chapter;
        const activeLangCode = userTransLang[chapter.language];

        // 명시적으로 원문 선택 시 → MD 파일 원래 언어
        if (activeLangCode === 'original') {
            return { ...chapter, title: chapter.rawTitle || chapter.title, content: chapter.rawContent || chapter.content };
        }

        // 특정 언어 선택 시 → rawTranslations에서 찾아서 반환
        if (activeLangCode) {
            const trans = rawTranslations.find(
                t => t.original_id === chapter.id && t.language === activeLangCode
            );
            if (!trans) return chapter;
            return { ...chapter, title: trans.title || chapter.title, content: trans.content || chapter.content };
        }

        // 아무것도 선택 안 한 기본 상태 → ko 번역본이 있으면 한국어, 없으면 원문
        // chapter.title/content는 fetchDBData에서 이미 ko 번역이 있으면 한국어로 세팅됨
        return chapter;
    }, [userTransLang, rawTranslations]);

    const handleAdminTranslate = async () => {
        if (!adminTransTarget || adminTransTarget === 'original') return;
        const resourceId = adminTransModal?.resourceId;
        if (!resourceId) return;
        setAdminTransLoading(true);
        setAdminTransError('');
        try {
            await fetch("https://n8n.deadbug.site/webhook/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resource_id: resourceId, target_language: adminTransTarget }),
            });
            await fetchDBData();
            setAdminTransModal(null);
            setAdminTransTarget('');
        } catch {
            setAdminTransError('번역 중 오류가 발생했습니다.');
        } finally {
            setAdminTransLoading(false);
        }
    };

    const suggestions = useMemo(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return [];
        const query = trimmed.toLowerCase();
        const queryChoseong = getChoseong(trimmed);
        const allItems = Array.from(new Set([...visibleLanguages, ...visibleChapters.map(c => c.title)]));
        return allItems.filter(item => {
            if (!item) return false;
            const itemChoseong = getChoseong(item);
            return item.toLowerCase().startsWith(query) ||
                   (queryChoseong !== "" && itemChoseong.startsWith(queryChoseong));
        }).slice(0, 10);
    }, [searchQuery, visibleLanguages, visibleChapters]);

    const currentChapters = useMemo(
        () => visibleChapters.filter(c => c.language === selectedLanguage),
        [visibleChapters, selectedLanguage]
    );

    const modalStatus = (() => {
        const t = newLangName.trim();
        if (!t) return null;
        const tLower = t.toLowerCase();
        if (visibleLanguages.includes(t)) return 'duplicate-exact';
        const caseMatch = incomingLanguages.find(l => l && l.toLowerCase() === tLower && l !== t);
        if (caseMatch) return 'duplicate-case';
        const rid = languageIdMap[t];
        if (rid !== undefined && hiddenLanguages.includes(rid)) return 'restore';
        return null;
    })();

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            {/* 사이드바 */}
            <aside className="w-80 md:w-96 shrink-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-surface border-t border border-border rounded-tl-[3rem] rounded-tr-[3rem] flex flex-col overflow-hidden shadow-md">
                    <div className="p-10 pb-8 border-b border-border/50 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); setActiveSuggestionIndex(-1); }}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="검색..."
                            className="w-full h-14 pl-14 bg-background border-2 border-border rounded-2xl text-foreground placeholder:text-muted-foreground"
                        />
                        {isSearching && suggestions.length > 0 && (
                            <div className="absolute left-10 right-10 top-[6.5rem] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={`search-item-${idx}-${item}`}
                                        onClick={() => handleItemSelect(item)}
                                        className={`w-full text-left px-6 py-4 text-foreground transition-colors ${activeSuggestionIndex === idx ? 'bg-secondary' : 'hover:bg-secondary'}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-10">
                        {/* 언어 선택 섹션 */}
                        <section>
                            <h3 className="text-lg font-black mb-6 px-4 text-foreground">언어 선택</h3>
                            <div className="space-y-2">
                                {visibleLanguages.map((lang, idx) => (
                                    <div
                                        key={`lang-select-${idx}-${lang}`}
                                        ref={el => { langRefs.current[lang] = el; }}
                                        onClick={() => handleLanguageSelect(lang)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleLanguageSelect(lang); }}
                                        tabIndex={0}
                                        className={`group flex items-center justify-between w-full px-6 py-5 rounded-2xl cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary
                                            ${selectedLanguage === lang
                                                ? "bg-primary text-primary-foreground"
                                                : "text-foreground hover:bg-secondary hover:text-foreground"
                                            }`}
                                    >
                                        <span>{lang}</span>
                                        {isAdmin ? (
                                            <div className="hidden group-hover:flex items-center gap-1">
                                                <button
                                                    onClick={(e) => handleOpenEdit(e, 'language', lang)}
                                                    className="text-foreground/60 hover:text-foreground transition-colors p-1 rounded cursor-pointer"
                                                    title="편집"
                                                >
                                                    <SquarePenIcon />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLanguage(e, lang); }}
                                                    className="text-red-500 hover:text-red-700 font-bold px-1 transition-transform hover:scale-110 cursor-pointer"
                                                    title="언어 삭제"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 챕터 섹션 */}
                        <section>
                            <h3 className="text-lg font-black mb-6 px-4 text-foreground">
                                {selectedLanguage || "언어를 선택해주세요"} 챕터
                            </h3>
                            <div className="space-y-2">
                                {currentChapters.map((chapter, idx) => (
                                    <div
                                        key={chapter.id || `chapter-list-${idx}`}
                                        ref={el => { chapterRefs.current[chapter.id] = el; }}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`group flex items-center justify-between gap-2 w-full text-left px-6 py-5 rounded-2xl border-2 text-foreground cursor-pointer transition-colors duration-200
                                            ${selectedChapter?.id === chapter.id
                                                ? "border-primary bg-primary/5"
                                                : "border-transparent hover:bg-secondary"}`}
                                    >
                                        <span className="flex-1 min-w-0 break-words">{getDisplayedChapter(chapter)?.title}</span>
                                        {isAdmin && (
                                            <div className="hidden group-hover:flex shrink-0 items-center gap-1">
                                                <button
                                                    onClick={(e) => handleOpenEdit(e, 'chapter', chapter)}
                                                    className="text-foreground/60 hover:text-foreground transition-colors p-1 rounded cursor-pointer"
                                                    title="편집"
                                                >
                                                    <SquarePenIcon />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteChapter(e, chapter)}
                                                    className="text-red-500 hover:text-red-700 font-bold px-1 transition-transform hover:scale-110 cursor-pointer"
                                                    title="챕터 삭제"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-10 lg:p-16 bg-background transform-gpu" onClick={() => { setIsSearching(false); }}>
                {isAdmin && (
                    <div className="mb-6 flex justify-end gap-3">
                        <button
                            onClick={openDeletedList}
                            className="px-6 py-3 bg-secondary text-foreground rounded-2xl transition hover:bg-secondary/80 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            삭제한 목록
                        </button>
                        <button
                            onClick={() => checkAdminAccess(() => setIsModalOpen(true))}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl transition hover:bg-primary/80 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            언어 추가
                        </button>
                    </div>
                )}

                <div className="max-w-5xl mx-auto w-full">
                    {selectedChapter ? (
                        <article className="space-y-12 md:space-y-24">
                            <header>
                                <h1 className="text-2xl md:text-4xl font-black break-words text-foreground">{getDisplayedChapter(selectedChapter)?.title}</h1>
                            </header>
                            <div className="min-h-[30rem] md:min-h-[40rem] w-full bg-surface border-2 border-border rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 lg:p-20 shadow-sm overflow-hidden">
                                <div className="text-base md:text-xl leading-relaxed prose prose-slate dark:prose-invert max-w-none break-words [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_table]:block [&_table]:overflow-x-auto [&_img]:max-w-full">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {getDisplayedChapter(selectedChapter)?.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div className="flex items-center justify-center h-96 text-muted-foreground">
                            왼쪽에서 언어와 챕터를 선택해주세요.
                        </div>
                    )}
                </div>
            </main>

            {/* ── 관리자 번역 관리 모달 ── */}
            {adminTransModal && isAdmin && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
                    <div className="bg-surface p-8 rounded-2xl w-full max-w-sm border border-border">
                        <h2 className="text-lg font-bold mb-5 text-foreground">번역</h2>

                        {/* 탭 버튼 */}
                        <div className="flex gap-2 mb-5">
                            <button
                                onClick={() => setAdminTransMode('select')}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${adminTransMode === 'select' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                            >
                                번역 언어 선택
                            </button>
                            <button
                                onClick={async () => {
                                    setAdminTransMode('add');
                                    setAdminTransAddLoading(true);
                                    await fetchDBData();
                                    setAdminTransAddLoading(false);
                                    const availForAdd = translatedLangsByResource[adminTransModal.resourceId] || [];
                                    const hasKoForAdd = availForAdd.includes('ko');
                                    setAdminTransAddPending(userTransLang[adminTransModal.lang] ?? (hasKoForAdd ? 'ko' : 'original'));
                                }}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${adminTransMode === 'add' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                            >
                                추가
                            </button>
                        </div>

                        {adminTransMode === 'select' ? (
                            <>
                                {/* 번역 요청 드롭다운 */}
                                <div className="mb-5">
                                    <select
                                        value={adminTransTarget}
                                        onChange={e => setAdminTransTarget(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                    >
                                        <option value="">-- 선택 --</option>
                                        <option value="original">원문</option>
                                        {TRANS_LANGUAGES.map(t => {
                                            const resourceId = adminTransModal.resourceId;
                                            const done = (translatedLangsByResource[resourceId] || []).includes(t.code);
                                            return (
                                                <option key={t.code} value={t.code}>
                                                    {t.label}{done ? ' ✓' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* 원문 미리보기 */}
                                {adminTransTarget === 'original' && (
                                    <div className="mb-4 p-3 bg-background border border-border rounded-xl max-h-40 overflow-y-auto">
                                        <p className="text-xs text-muted-foreground mb-1 font-semibold">원문 ({adminTransModal.lang})</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                            {(() => {
                                                const resourceId = adminTransModal.resourceId;
                                                const firstChap = incomingChapters.find(c => languageIdMap[c.language] === resourceId);
                                                return firstChap?.rawContent?.slice(0, 300) || '(내용 없음)';
                                            })()}
                                            ...
                                        </p>
                                    </div>
                                )}

                                {adminTransError && <p className="text-red-500 text-xs mb-3">{adminTransError}</p>}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setAdminTransModal(null); setAdminTransTarget(''); setAdminTransError(''); }}
                                        className="flex-1 p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleAdminTranslate}
                                        disabled={!adminTransTarget || adminTransTarget === 'original' || adminTransLoading}
                                        className="flex-1 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {adminTransLoading ? '번역 중...' : '등록'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* 추가 탭 - DB 완역본 선택 */}
                                <div className="mb-5">
                                    {adminTransAddLoading ? (
                                        <div className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-muted-foreground text-sm text-center">
                                            불러오는 중...
                                        </div>
                                    ) : (
                                        <select
                                            value={adminTransAddPending}
                                            onChange={e => setAdminTransAddPending(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                        >
                                            <option value="original">원문</option>
                                            {(translatedLangsByResource[adminTransModal.resourceId] || []).map(code => {
                                                const found = TRANS_LANGUAGES.find(t => t.code === code);
                                                return (
                                                    <option key={code} value={code}>
                                                        {found ? found.label : code}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setAdminTransModal(null); setAdminTransTarget(''); setAdminTransError(''); }}
                                        className="flex-1 p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUserTransLang(prev => ({ ...prev, [adminTransModal.lang]: adminTransAddPending }));
                                            setAdminTransModal(null);
                                            setAdminTransTarget('');
                                            setAdminTransError('');
                                        }}
                                        disabled={adminTransAddLoading}
                                        className="flex-1 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        적용
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── 사용자 번역 선택 모달 ── */}
            {userTransModal && !isAdmin && (() => {
                const { lang, resourceId } = userTransModal;
                const availLangs = translatedLangsByResource[resourceId] || [];
                return (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setUserTransModal(null)}>
                        <div className="bg-surface p-8 rounded-2xl w-full max-w-sm border border-border" onClick={e => e.stopPropagation()}>
                            <h2 className="text-lg font-bold mb-5 text-foreground">번역 선택</h2>

                            {/* 드롭다운 영역 */}
                            <div className="mb-5">
                                {userTransAddLoading ? (
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-muted-foreground text-sm text-center">
                                        불러오는 중...
                                    </div>
                                ) : (
                                    <select
                                        value={userTransPending}
                                        onChange={e => setUserTransPending(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                    >
                                        <option value="original">원문</option>
                                        {availLangs.map(code => {
                                            const found = TRANS_LANGUAGES.find(t => t.code === code);
                                            return (
                                                <option key={code} value={code}>
                                                    {found ? found.label : code}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setUserTransModal(null)}
                                    className="flex-1 p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => {
                                        setUserTransLang(prev => ({ ...prev, [lang]: userTransPending }));
                                        setUserTransModal(null);
                                    }}
                                    disabled={userTransAddLoading}
                                    className="flex-1 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    적용
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── 커스텀 확인 다이얼로그 ── */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
                    <div className="bg-surface p-8 rounded-2xl w-full max-w-sm border border-border">
                        <p className="text-foreground mb-6 whitespace-pre-line text-center leading-relaxed">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="flex-1 p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                                취소
                            </button>
                            <button
                                onClick={async () => {
                                    const fn = confirmDialog.onConfirm;
                                    setConfirmDialog(null);
                                    await fn();
                                }}
                                className="flex-1 p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 언어 추가 모달 ── */}
            {isModalOpen && isAdmin && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-surface p-8 rounded-2xl w-full max-w-md border border-border">
                        <h2 className="text-xl font-bold mb-4 text-foreground">언어 추가</h2>
                        <input
                            type="text"
                            placeholder="언어 이름"
                            value={newLangName}
                            onChange={(e) => setNewLangName(e.target.value)}
                            className="w-full mb-3 p-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground"
                        />
                        {modalStatus === 'duplicate-exact' ? (
                            <p className="text-xs text-red-500 mb-4">이미 등록된 파일입니다.</p>
                        ) : modalStatus === 'duplicate-case' ? (
                            <p className="text-xs text-red-500 mb-4">이미 등록된 언어입니다. 등록할 수 없습니다.</p>
                        ) : modalStatus === 'restore' ? (
                            <p className="text-xs text-primary mb-4">
                                이전에 삭제된 언어입니다. 추가 버튼을 누르면 복원됩니다.
                            </p>
                        ) : (
                            <div className="relative mb-4">
                                <p className="text-sm text-muted-foreground mb-1">MD 파일(.md) 업로드:</p>
                                <input
                                    type="file"
                                    accept=".md"
                                    onChange={handleFileChange}
                                    className="w-full p-2 text-sm border border-dashed border-primary rounded-xl cursor-pointer hover:bg-primary/5 transition-colors duration-200 text-foreground"
                                />
                                {selectedFile && <p className="text-xs text-primary mt-1">✅ 파일이 준비되었습니다.</p>}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsModalOpen(false); setSelectedFile(null); setNewLangName(""); }}
                                className="flex-1 p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                                취소
                            </button>
                            <button
                                ref={addButtonRef}
                                onClick={handleAddLanguage}
                                disabled={isSubmitting || modalStatus === 'duplicate-exact' || modalStatus === 'duplicate-case'}
                                className={`flex-1 p-3 rounded-xl transition-colors ${
                                    isSubmitting || modalStatus === 'duplicate-exact' || modalStatus === 'duplicate-case'
                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                }`}
                            >
                                {isSubmitting ? "추가 중..." : "추가"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 삭제한 목록 모달 ── */}
            {isDeletedListOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-2xl w-full max-w-lg border border-border flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">삭제한 목록</h2>
                            <button
                                onClick={() => setIsDeletedListOpen(false)}
                                className="text-muted-foreground hover:text-foreground text-2xl leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setDeletedListTab('language')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${deletedListTab === 'language' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                언어
                            </button>
                            <button
                                onClick={() => setDeletedListTab('chapter')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${deletedListTab === 'chapter' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                챕터
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            {deletedListLoading ? (
                                <p className="text-center py-10 text-muted-foreground text-sm">불러오는 중...</p>
                            ) : deletedListTab === 'language' ? (
                                deletedLangsDetail.length === 0 ? (
                                    <p className="text-center py-10 text-muted-foreground text-sm">삭제된 언어가 없습니다.</p>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {[...deletedLangsDetail]
                                            .sort((a, b) => new Date(b.hiddenAt) - new Date(a.hiddenAt))
                                            .map(lang => (
                                                <div key={lang.resourceId} className="py-3 flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground">{lang.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{lang.firstChapterContent || '(내용 없음)'}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {lang.hiddenAt ? new Date(lang.hiddenAt).toLocaleDateString('ko-KR') : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRestoreLanguage(lang.resourceId)}
                                                        className="shrink-0 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                                                    >
                                                        복구
                                                    </button>
                                                </div>
                                            ))
                                        }
                                    </div>
                                )
                            ) : (
                                deletedChapsDetail.length === 0 ? (
                                    <p className="text-center py-10 text-muted-foreground text-sm">삭제된 챕터가 없습니다.</p>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {[...deletedChapsDetail]
                                            .sort((a, b) => new Date(b.hiddenAt) - new Date(a.hiddenAt))
                                            .map(chap => {
                                                const isLangDeleted = deletedLangsDetail.some(l => l.name === chap.languageName);
                                                return (
                                                <div key={chap.originalId} className="py-3 flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground">{chap.languageName} / {chap.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{chap.firstContent || '(내용 없음)'}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {chap.hiddenAt ? new Date(chap.hiddenAt).toLocaleDateString('ko-KR') : ''}
                                                        </p>
                                                        {isLangDeleted && (
                                                            <p className="text-xs text-red-400 mt-0.5">언어가 삭제된 상태입니다</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => !isLangDeleted && handleRestoreChapter(chap.originalId)}
                                                        disabled={isLangDeleted}
                                                        className={`shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                                            isLangDeleted
                                                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                                : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                                                        }`}
                                                    >
                                                        복구
                                                    </button>
                                                </div>
                                                );
                                            })
                                        }
                                    </div>
                                )
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-border flex justify-end">
                            <button
                                onClick={() => setIsDeletedListOpen(false)}
                                className="px-5 py-2 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors text-sm cursor-pointer"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 편집 모달 ── */}
            {editTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-surface p-8 rounded-2xl w-full max-w-2xl border border-border">
                        <h2 className="text-xl font-bold mb-4 text-foreground">
                            {editTarget.type === 'language' ? '언어 이름 수정' : '챕터 수정'}
                        </h2>
                        {editTarget.type === 'language' ? (
                            <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ name: e.target.value })}
                                placeholder="언어 이름"
                                className="w-full mb-4 p-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground"
                            />
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={editForm.title || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="챕터 제목"
                                    className="w-full mb-3 p-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground"
                                />
                                <textarea
                                    value={editForm.content || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="챕터 내용 (Markdown)"
                                    rows={12}
                                    className="w-full mb-4 p-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground resize-y font-mono text-sm"
                                />
                            </>
                        )}
                        {editError && <p className="text-sm text-red-500 mb-3">{editError}</p>}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setEditTarget(null); setEditError(""); }}
                                className="flex-1 p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={editLoading}
                                className="flex-1 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {editLoading ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPage;
