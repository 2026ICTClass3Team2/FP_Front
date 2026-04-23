import React, { useRef } from 'react';

const techStacks = ['Java', 'Spring', 'React', 'Vue', 'Python', 'Node.js', 'MySQL'];

const TechStackModal = ({ isOpen, onClose, selectedTechStack, onToggle }) => {
  const backdropClickRef = useRef(false);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 transition-opacity duration-300 animate-in fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          backdropClickRef.current = true;
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && backdropClickRef.current) {
          onClose();
        }
        backdropClickRef.current = false;
      }}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-3xl p-7 shadow-2xl border border-gray-100 transition-all duration-300 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">관심 기술 스택 선택</h2>
            <p className="text-sm text-gray-500 mt-1.5">자신 있는 기술이나 관심 있는 기술을 선택해주세요.(최대 5개)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl leading-none p-1 transition-colors">&times;</button>
        </div>
        
        <div className="my-8 flex flex-wrap gap-2.5">
          {techStacks.map(tech => (
            <button
              key={tech}
              type="button"
              onClick={() => onToggle(tech)}z
              className={`px-4 py-2 text-sm font-bold rounded-2xl border-2 transition-all duration-200 ${
                selectedTechStack.includes(tech)
                  ? 'bg-blue-500 border-blue-500 text-white shadow-md -translate-y-0.5'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500 hover:-translate-y-0.5'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="px-7 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechStackModal;