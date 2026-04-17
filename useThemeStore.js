import { create } from 'zustand';

const useThemeStore = create((set) => ({
  // 초기 상태: localStorage에 'dark'로 저장되어 있거나, 
  // 저장된 값이 없을 때 시스템 설정이 다크 모드인 경우 true
  isDarkMode: 
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),

  toggleTheme: () => set((state) => {
    const newIsDarkMode = !state.isDarkMode;
    
    // 변경된 테마를 localStorage에 저장
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    
    // DOM에 반영
    const html = document.documentElement;
    newIsDarkMode ? html.classList.add('dark') : html.classList.remove('dark');
    
    return { isDarkMode: newIsDarkMode };
  }),
}));

export default useThemeStore;