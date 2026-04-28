// HTML 태그 및 엔티티를 제거해 순수 텍스트 반환
export const stripHtml = (html: string): string => {
  if (!html) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || el.innerText || '';
};
