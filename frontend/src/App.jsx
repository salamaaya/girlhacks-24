import Login from './pages/Login'
import { Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import Home from './pages/Home';

function App() {
  return (
    <Routes>
        <Route path="/" element={ <Login /> } />
        <Route path="/home" element={ <Home /> } />
        <Route path="/signup" element={ <Signup /> } />
    </Routes>
  )
}

export default App
