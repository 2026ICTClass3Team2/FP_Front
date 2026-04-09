import { useState } from 'react'
import AppRouter from './routes/AppRouter'
import { AuthProvider } from './components/sidebar/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
