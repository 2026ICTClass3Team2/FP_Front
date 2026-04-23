import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import { FiSmile, FiX, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
// @ts-ignore
import 'react-quill-new/dist/quill.snow.css';
import jwtAxios from '../../api/jwtAxios';

// Quill의 기본 Image 블롯을 확장하여 inline style 속성을 보존
const Quill = ReactQuill.Quill;
const BaseImage = Quill.import('formats/image') as any;

class StyledImage extends BaseImage {
  static formats(domNode: HTMLElement) {
    const formats = super.formats(domNode);
    const style = domNode.getAttribute('style');
    if (style) formats.style = style;
    return formats;
  }

  format(name: string, value: any) {
    if (name === 'style') {
      if (value) {
        (this as any).domNode.setAttribute('style', value);
      } else {
        (this as any).domNode.removeAttribute('style');
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(StyledImage, true);

const STICKER_LIST = [
  { id: 1, name: '버그', url: 'https://cdn-icons-png.flaticon.com/512/826/826963.png' },
  { id: 2, name: '코딩중', url: 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png' },
  { id: 3, name: '에러', url: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' },
  { id: 4, name: '완료', url: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' },
  { id: 5, name: '질문', url: 'https://cdn-icons-png.flaticon.com/512/1436/1436664.png' },
  { id: 6, name: '커피', url: 'https://cdn-icons-png.flaticon.com/512/924/924514.png' },
  { id: 7, name: '로켓', url: 'https://cdn-icons-png.flaticon.com/512/2950/2950741.png' },
  { id: 8, name: '좋아요', url: 'https://cdn-icons-png.flaticon.com/512/1104/1104970.png' },
  { id: 9, name: '스터디', url: 'https://cdn-icons-png.flaticon.com/512/3976/3976625.png' },
  { id: 10, name: '팀워크', url: 'https://cdn-icons-png.flaticon.com/512/681/681494.png' },
  { id: 11, name: '아이디어', url: 'https://cdn-icons-png.flaticon.com/512/1998/1998087.png' },
  { id: 12, name: '알림', url: 'https://cdn-icons-png.flaticon.com/512/1792/1792931.png' },
  { id: 13, name: '성공', url: 'https://cdn-icons-png.flaticon.com/512/2583/2583387.png' },
  { id: 14, name: '화남', url: 'https://cdn-icons-png.flaticon.com/512/742/742789.png' },
  { id: 15, name: '신남', url: 'https://cdn-icons-png.flaticon.com/512/742/742736.png' },
  { id: 16, name: '졸림', url: 'https://cdn-icons-png.flaticon.com/512/742/742751.png' },
];


const IMAGE_SIZES = [
  { label: '25%', value: '25%' },
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '원본', value: '' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  compact?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  readOnly = false,
  compact = false,
  onImageUpload,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<() => void>(() => { });

  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [imgResize, setImgResize] = useState<{
    visible: boolean; imgEl: HTMLImageElement | null; top: number; left: number;
  }>({ visible: false, imgEl: null, top: 0, left: 0 });

  // Image upload: file picker (used by toolbar button + drag & drop)
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      try {
        let url: string;
        if (onImageUpload) {
          url = await onImageUpload(file);
        } else {
          url = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (ev) => res(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
        const range = quill.getSelection(true);
        const pos = range ? range.index : quill.getLength();
        quill.insertEmbed(pos, 'image', url, 'user');
        quill.setSelection(pos + 1, 0);
      } catch {
        alert('이미지 업로드에 실패했습니다.');
      }
    };
    input.click();
  }, [onImageUpload]);

  useEffect(() => { imageUploadRef.current = handleImageUpload; }, [handleImageUpload]);

  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  
  // 여러 에디터가 렌더링될 수 있으므로 툴바의 고유 ID를 생성합니다. (오류 방지를 위해 랜덤 ID 사용)
  const [toolbarId] = useState(() => `toolbar-${Math.random().toString(36).substring(2, 9)}`);

  // 2. 에디터 툴바 설정
  const modules = useMemo(() => ({
    toolbar: {
      container: `#${toolbarId}`,
      handlers: { image: () => imageUploadRef.current() },
    },
    history: { delay: 1000, maxStack: 100, userOnly: true },
    syntax: false,
  }), [toolbarId]);

  // Sticker insert
  const insertSticker = (url: string) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection(true);
    const pos = range ? range.index : quill.getLength();
    quill.insertEmbed(pos, 'image', url, 'user');
    quill.insertText(pos + 1, ' ', 'user');
    quill.setSelection(pos + 2, 0);
    setIsStickerOpen(false);
    setTimeout(() => quill.focus(), 0);
  };

  // Character count
  useEffect(() => {
    try {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      const update = () => setCharCount(quill.getText().replace(/\n$/, '').length);
      quill.on('text-change', update);
      return () => { quill.off('text-change', update); };
    } catch { return; }
  }, []);

  // Image click → resize menu
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && !target.closest('.rte-sticker-picker')) {
        const img = target as HTMLImageElement;
        const contRect = containerRef.current?.getBoundingClientRect() ?? { top: 0, left: 0 };
        const imgRect = img.getBoundingClientRect();
        setImgResize({
          visible: true,
          imgEl: img,
          top: imgRect.bottom - contRect.top + 6,
          left: imgRect.left - contRect.left,
        });
      } else if (!(target as HTMLElement).closest('.rte-img-resize-menu')) {
        setImgResize({ visible: false, imgEl: null, top: 0, left: 0 });
      }
    };
    quill.root.addEventListener('click', handler);
    return () => quill.root.removeEventListener('click', handler);
  }, []);

  // Drag & drop image into editor
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const onDrop = async (e: DragEvent) => {
      const images = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
      if (!images.length) return;
      e.preventDefault(); e.stopPropagation();
      const range = quill.getSelection(true);
      let pos = range ? range.index : quill.getLength();
      for (const file of images) {
        try {
          let url: string;
          if (onImageUpload) {
            url = await onImageUpload(file);
          } else {
            url = await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onload = (ev) => res(ev.target?.result as string);
              reader.readAsDataURL(file);
            });
          }
          quill.insertEmbed(pos, 'image', url, 'user');
          pos += 1;
        } catch { alert('이미지 업로드에 실패했습니다.'); }
      }
      quill.setSelection(pos, 0);
    };
    quill.root.addEventListener('dragover', onDragOver);
    quill.root.addEventListener('drop', onDrop);
    return () => {
      quill.root.removeEventListener('dragover', onDragOver);
      quill.root.removeEventListener('drop', onDrop);
    };
  }, [onImageUpload]);

  // Empty area click: escape code block
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const root = quill.root;
    const handler = (e: MouseEvent) => {
      if (e.target !== root) return;
      const clickY = e.clientY;
      const first = root.firstElementChild;
      if (!first) { quill.focus(); return; }
      if (clickY < first.getBoundingClientRect().top) {
        const fmt = quill.getFormat(0, 1);
        if (fmt['code-block']) {
          quill.insertText(0, '\n', 'api');
          quill.formatLine(0, 1, 'code-block', false, 'api');
        }
        quill.setSelection(0, 0, 'user');
      } else if (clickY > root.lastElementChild!.getBoundingClientRect().bottom) {
        const len = quill.getLength();
        const fmt = quill.getFormat(len - 1, 1);
        if (fmt['code-block']) {
          quill.insertText(len, '\n', 'user');
          quill.formatLine(len, 1, 'code-block', false, 'api');
          quill.setSelection(len + 1, 0, 'user');
        } else {
          quill.setSelection(len, 0, 'user');
        }
      }
      
      quill.focus(); // 에디터 자체에 포커스 강제
    };
    root.addEventListener('click', handler);
    return () => root.removeEventListener('click', handler);

  }, []);

  // ── Mention logic ──
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleTextChange = () => {
      const range = quill.getSelection();
      if (!range || range.length > 0) {
        setMentionQuery(null);
        return;
      }

      const textBefore = quill.getText(0, range.index);
      const mentionMatch = textBefore.match(/@([^\s@]*)$/);

      if (mentionMatch) {
        const query = mentionMatch[1];
        setMentionQuery(query);

        // Position popup
        const bounds = quill.getBounds(range.index - query.length - 1);
        const editorRect = containerRef.current?.getBoundingClientRect();
        if (bounds && editorRect) {
          setMentionPosition({
            top: bounds.bottom + 45, // 툴바 높이 등을 고려
            left: bounds.left
          });
        }
      } else {
        setMentionQuery(null);
      }
    };

    quill.on('text-change', handleTextChange);
    quill.on('selection-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
      quill.off('selection-change', handleTextChange);
    };
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (mentionQuery === null) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await jwtAxios.get(`member/search?query=${mentionQuery}`);
        setSuggestions(res.data);
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleMentionSelect = (nickname: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor || mentionQuery === null) return;

    const range = editor.getSelection();
    if (!range) return;

    const startIndex = range.index - mentionQuery.length - 1;
    editor.deleteText(startIndex, mentionQuery.length + 1);
    editor.insertText(startIndex, `@${nickname} `);
    editor.setSelection(startIndex + nickname.length + 2, 0);

    setMentionQuery(null);
    setSuggestions([]);
    editor.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col border rounded-xl bg-transparent transition-all duration-150 ${isFocused ? 'border-ring ring-2 ring-ring/10' : 'border-border'
        } ${className}`}
    >

      {/* ── Image resize menu ── */}
      {imgResize.visible && !readOnly && (
        <div
          className="rte-img-resize-menu absolute z-[70] flex items-center gap-1
                     bg-surface border border-border rounded-lg shadow-xl px-2 py-1.5"
          style={{ top: imgResize.top, left: imgResize.left }}
        >
          <span className="text-[11px] text-muted-foreground mr-1">이미지 크기:</span>
          {IMAGE_SIZES.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (imgResize.imgEl) {
                  const quill = quillRef.current?.getEditor();
                  const blot = quill && Quill.find(imgResize.imgEl);
                  if (blot) {
                    if (value) {
                      blot.format('style', `width: ${value}; height: auto;`);
                    } else {
                      blot.format('style', false);
                    }
                    quill!.update('user');
                  }
                }
                setImgResize({ visible: false, imgEl: null, top: 0, left: 0 });
              }}
              className="px-2 py-0.5 text-xs bg-secondary hover:bg-muted rounded transition-colors text-foreground"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setImgResize({ visible: false, imgEl: null, top: 0, left: 0 })}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            <FiX size={12} />
          </button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div
        id={toolbarId}
        style={{ display: readOnly ? 'none' : 'flex' }}
        className="flex-wrap items-center gap-0.5 px-2 py-2 border-b border-border rounded-t-xl bg-muted/30 z-10"
      >
        {/* Undo / Redo */}
        <span className="ql-formats !mr-0 flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); try { quillRef.current?.getEditor()?.history?.undo(); } catch { } }}
            className="rte-icon-btn" title="실행 취소 (Ctrl+Z)"
          >
            <FiRotateCcw size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); try { quillRef.current?.getEditor()?.history?.redo(); } catch { } }}
            className="rte-icon-btn" title="다시 실행 (Ctrl+Y)"
          >
            <FiRotateCw size={13} />
          </button>
        </span>

        <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />

        {/* Headers – full mode only */}
        {!compact && (
          <>
            <span className="ql-formats !mr-0">
              <select className="ql-header" defaultValue="">
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
                <option value="">본문</option>
              </select>
            </span>
            <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />
          </>
        )}

        {/* Text formatting */}
        <span className="ql-formats !mr-0">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          {!compact && <button className="ql-strike" />}
        </span>

        {/* Color – full mode */}
        {!compact && (
          <span className="ql-formats !mr-0">
            <select className="ql-color">
              <option value="" />
              <option value="#ef4444" />
              <option value="#f97316" />
              <option value="#eab308" />
              <option value="#22c55e" />
              <option value="#3b82f6" />
              <option value="#8b5cf6" />
              <option value="#ec4899" />
              <option value="#6b7280" />
            </select>
          </span>
        )}

        <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />

        {/* Alignment – full mode */}
        {!compact && (
          <>
            <span className="ql-formats !mr-0">
              <select className="ql-align">
                <option value="" />
                <option value="center" />
                <option value="right" />
                <option value="justify" />
              </select>
            </span>
            <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />
          </>
        )}

        {/* Lists – full mode */}
        {!compact && (
          <>
            <span className="ql-formats !mr-0">
              <button className="ql-list" value="bullet" />
              <button className="ql-list" value="ordered" />
            </span>
            <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />
          </>
        )}

        {/* Block formats */}
        <span className="ql-formats !mr-0">
          {!compact && <button className="ql-blockquote" />}
          <button className="ql-code-block" />
        </span>

        <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />

        {/* Link + Image */}
        <span className="ql-formats !mr-0">
          <button className="ql-link" />
          <button className="ql-image" title="이미지 삽입 (드래그&드롭도 가능)" />
        </span>

        <span className="w-px h-4 bg-border mx-1 self-center shrink-0" />

        {/* Sticker */}
        <button
          type="button"
          onClick={() => setIsStickerOpen(p => !p)}
          className="rte-icon-btn"
          title="스티커"
        >
          <FiSmile size={14} />
        </button>
      </div>

      {/* ── Quill editor ── */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        readOnly={readOnly}
        placeholder={placeholder ?? '내용을 입력하세요...'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={[
          'bg-transparent',
          '[&_.ql-container]:!border-none',
          compact ? '[&_.ql-editor]:min-h-[120px]' : '[&_.ql-editor]:min-h-[360px]',
          '[&_.ql-editor]:px-5',
          '[&_.ql-editor]:py-4',
          '[&_.ql-editor_img]:inline-block',
          '[&_.ql-editor_img]:align-middle',
          '[&_.ql-editor_img]:mx-1',
          '[&_.ql-editor_img]:max-w-full',
          '[&_.ql-editor_img[src*="flaticon"]]:w-24',
          '[&_.ql-editor_img[src*="flaticon"]]:h-24',
          '[&_.ql-editor_img]:cursor-pointer',
          '[&_.ql-editor_img]:rounded',
          '[&_.ql-editor_img]:transition-all',
          '[&_.ql-editor_img:hover]:ring-2',
          '[&_.ql-editor_img:hover]:ring-primary/40',
        ].join(' ')}
      />

      {/* ── Bottom bar ── */}
      {!readOnly && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border rounded-b-xl">
          {!compact ? (
            <span className="text-[11px] text-muted-foreground select-none">
              이미지를 에디터로 드래그하여 바로 삽입 · 이미지 클릭 시 크기 조절
            </span>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-muted-foreground tabular-nums">{charCount}자</span>
        </div>
      )}

      {/* ── Sticker picker ── */}
      {isStickerOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsStickerOpen(false)} />
          <div className="rte-sticker-picker absolute z-50 bg-surface border border-border
                          rounded-xl shadow-2xl p-4 right-2 top-14 w-[300px]
                          animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-border pb-2.5 mb-3">
              <h4 className="font-semibold text-foreground text-sm">스티커</h4>
              <button
                type="button"
                onClick={() => setIsStickerOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {STICKER_LIST.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => insertSticker(s.url)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl
                             hover:bg-secondary transition-all border border-transparent
                             hover:border-border focus:outline-none group"
                  title={s.name}
                >
                  <img
                    src={s.url}
                    alt={s.name}
                    className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {/* 5. 멘션 추천 목록 */}
      {mentionQuery !== null && suggestions.length > 0 && (
        <div 
          className="absolute z-[70] bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-48 animate-in fade-in slide-in-from-top-1"
          style={{ 
            top: mentionPosition?.top, 
            left: mentionPosition?.left 
          }}
        >
          {suggestions.map((user: any) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleMentionSelect(user.nickname)}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b border-border last:border-0"
            >
              <img 
                src={user.profilePicUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                alt={user.nickname} 
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">{user.nickname}</p>
                <p className="text-[10px] text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
