import React, { useRef, useState, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import { FiSmile } from 'react-icons/fi';
// @ts-ignore
import 'react-quill-new/dist/quill.snow.css';

// 1. 임시 스티커 데이터
const STICKER_LIST = [
  { id: 1, name: '버그+1', url: 'https://cdn-icons-png.flaticon.com/512/826/826963.png' },
  { id: 2, name: '코딩중', url: 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png' },
  { id: 3, name: '에러', url: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '', readOnly = false }) => {
  const quillRef = useRef<ReactQuill>(null);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  
  // 여러 에디터가 렌더링될 수 있으므로 툴바의 고유 ID를 생성합니다. (오류 방지를 위해 랜덤 ID 사용)
  const [toolbarId] = useState(() => `toolbar-${Math.random().toString(36).substring(2, 9)}`);

  // 2. 에디터 툴바 설정
  const modules = useMemo(() => ({
    toolbar: {
      container: `#${toolbarId}`,
      // Quill의 자체 핸들러 대신 React onClick을 직접 사용하기 위해 핸들러 제거
    },
  }), [toolbarId]);

  // 3. 스티커 삽입 처리 로직
  const handleStickerSelect = (stickerUrl: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true); // true는 에디터에 포커스를 줍니다.
    const position = range ? range.index : editor.getLength();

    // 이미지 삽입 및 커서 이동
    editor.insertEmbed(position, 'image', stickerUrl);
    editor.setSelection(position + 1, 0);
    
    // 삽입 후 모달 닫기
    setIsStickerPickerOpen(false);
  };

  return (
    <div className={`relative flex flex-col border border-gray-300 dark:border-gray-700 rounded-xl bg-transparent transition-shadow ${className}`}>
      
      {/* 커스텀 툴바 */}
      <div id={toolbarId} className="flex flex-wrap items-center gap-1 p-2 bg-transparent border-b border-gray-300 dark:border-gray-700 rounded-t-xl z-10" style={{ display: 'flex' }}>
        <span className="ql-formats !mr-2">
          <span className="relative group inline-block">
            <button className="ql-bold"></button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-sm">굵게</span>
          </span>
          <span className="relative group inline-block">
            <button className="ql-code-block"></button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-sm">코드 블록</span>
          </span>
        </span>
        <span className="ql-formats !mr-2">
          <span className="relative group inline-block">
            <button className="ql-link"></button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-sm">링크</span>
          </span>
        </span>
        <span className="ql-formats !mr-2">
          <span className="relative group inline-block">
            <button className="ql-image"></button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-sm">이미지</span>
          </span>
        </span>
        <span className="ql-formats">
          <button 
            type="button" 
            onClick={() => setIsStickerPickerOpen(prev => !prev)}
            className="relative group !w-auto !p-1 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors" 
          >
            <FiSmile size={18} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-sm">스티커</span>
          </button>
        </span>
      </div>

      {/* React Quill 에디터 */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        readOnly={readOnly}
        placeholder={placeholder || "내용을 입력하세요..."}
        className="bg-transparent [&_.ql-container]:!border-none [&_.ql-editor]:min-h-[120px] rounded-b-xl"
      />

      {/* 4. 스티커 선택 모달창 */}
      {isStickerPickerOpen && (
        <>
          {/* 외부 클릭 시 닫히도록 투명 배경 추가 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsStickerPickerOpen(false)} />
          <div className="absolute z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl p-4 right-2 top-14 w-72 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3 mb-3">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">이모티콘 목록</h4>
              <button type="button" onClick={() => setIsStickerPickerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
                &times;
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
              {STICKER_LIST.map((sticker) => (
                <button key={sticker.id} type="button" onClick={() => handleStickerSelect(sticker.url)} className="w-full p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:outline-none" title={sticker.name}>
                  <img src={sticker.url} alt={sticker.name} className="w-full h-auto object-contain drop-shadow-sm" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RichTextEditor;