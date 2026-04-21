import { useState, useEffect } from 'react'
import AppRouter from './routes/AppRouter'
import { AuthProvider } from './components/sidebar/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    const token = localStorage.getItem('token');

    // 토큰이 있고 가려던 안전한 주소가 있다면 이동 (OAuth 콜백 등 민감 경로 제외)
    if (token && redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/oauth/')) {
      sessionStorage.removeItem('redirectUrl');
      setTimeout(() => {
        window.location.replace(redirectUrl);
      }, 150);
    }
  }, []);

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
