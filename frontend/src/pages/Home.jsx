import React, { useEffect } from 'react';

const Home = () => {
  useEffect(() => {
    // Add paper.js and howler.js scripts dynamically to the head
    const paperScript = document.createElement('script');
    paperScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js';
    paperScript.type = 'text/javascript';
    document.head.appendChild(paperScript);

    const howlerScript = document.createElement('script');
    howlerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js';
    howlerScript.type = 'text/javascript';
    document.head.appendChild(howlerScript);

    const songsScript = document.createElement('script');
    songsScript.src = 'songs.js';
    songsScript.type = 'text/javascript';
    document.head.appendChild(songsScript);

    const customScript = document.createElement('script');
    customScript.src = 'script.js';
    customScript.type = 'text/javascript';
    document.head.appendChild(customScript);

    return () => {
      // Clean up the scripts when the component unmounts
      document.head.removeChild(paperScript);
      document.head.removeChild(howlerScript);
      document.head.removeChild(songsScript);
      document.head.removeChild(customScript);
    };
  }, []);

  return (
    <div>
      <canvas id="myCanvas" width="1200" height="400" resize="true" style={{ width: '100%', height: '100vh' }}></canvas>
      <audio id="sound1" src="sounds/PinkPanther30.wav"></audio>
    </div>
  );
}

export default Home;
