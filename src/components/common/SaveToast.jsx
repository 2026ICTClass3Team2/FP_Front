import { createPortal } from 'react-dom';

const SaveToast = ({ visible }) => {
  return createPortal(
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2
        px-4 py-2.5 rounded-full bg-foreground text-background text-sm font-medium shadow-lg
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      임시저장 완료
    </div>,
    document.body
  );
};

export default SaveToast;
