// LandingPage.jsx
import { useHistory } from 'react-router-dom';

const LandingPage = () => {
  const history = useHistory();

  const handleStart = () => {
    history.push('/game');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20%', color: 'black' }}>
      <h1>Your Project Name</h1>
      <button
        onClick={handleStart}
        style={{
          fontSize: '24px',
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: 'white',
          border: '1px solid black',
        }}
      >
        Start
      </button>
    </div>
  );
};

export default LandingPage;
