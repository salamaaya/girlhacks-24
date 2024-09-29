// src/pages/LandingPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Howler } from 'howler'; // Import Howler to manage AudioContext

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // Resume the AudioContext after user gesture
    Howler.ctx.resume().then(() => {
      console.log('AudioContext resumed');
      navigate('/game'); // Navigate to the game page after resuming AudioContext
    }).catch((err) => {
      console.error('Failed to resume AudioContext:', err);
      // Optionally, navigate to the game page even if resuming fails
      navigate('/game');
    });
  };

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '20%',
        color: 'black',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '40px' }}>Your Project Name</h1> {/* Add your project name here */}
      <button
        onClick={handleStart}
        style={{
          fontSize: '24px',
          padding: '15px 30px',
          cursor: 'pointer',
          backgroundColor: 'white',
          border: '2px solid black',
          borderRadius: '8px',
          transition: 'background-color 0.3s, color 0.3s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'black';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = 'black';
        }}
      >
        Start
      </button>
    </div>
  );
};

export default LandingPage;
