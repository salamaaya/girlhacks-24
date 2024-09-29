// src/App.jsx

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage'; // Import LandingPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<LandingPage />} /> {/* Landing page at /home */}
      <Route path="/game" element={<Home />} /> {/* Game at /game */}
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;