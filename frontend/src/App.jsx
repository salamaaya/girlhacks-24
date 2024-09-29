import Login from './pages/Login'
import { Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';

function App() {
  return (
    <Routes>
        <Route path="/" element={ <Login /> } />
        <Route path="/login" element={ <Login /> } />
        <Route path="/signup" element={ <Signup /> } />
    </Routes>
  )
}

export default App
