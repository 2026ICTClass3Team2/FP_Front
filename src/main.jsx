import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/style/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // 조회수 1씩 증가 확인을 위해 StrickMode 해제
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
<App />
);