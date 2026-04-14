import { useState, useEffect } from 'react'
import AppRouter from './routes/AppRouter'
import { AuthProvider } from './components/sidebar/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    const token = localStorage.getItem('token');

    // 토큰이 있고 가려던 주소가 있다면 즉시 이동 (소셜 로그인 후 복구 등)
    if (token && redirectUrl) {
      sessionStorage.removeItem('redirectUrl');
      // AuthContext가 토큰을 세팅할 시간을 벌기 위해 약간 지연
      setTimeout(() => {
        window.location.href = redirectUrl;
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
