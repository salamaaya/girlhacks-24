// src/pages/Home.jsx

import React, { useEffect, useRef } from 'react';
import paper from 'paper';
import { Howl, Howler } from 'howler';
import songs from '../../public/songs'; // Ensure the path is correct

// Utility function to check array equality
const arraysEqual = (a1, a2) => {
  return JSON.stringify(a1) === JSON.stringify(a2);
};

const Home = () => {
  const canvasRef = useRef(null);
  const previewSoundsPlayingRef = useRef([]);
  const playbackSoundsPlayingRef = useRef([]);
  const gameStateRef = useRef({
    gameWon: false,
    attempts: 0,
    maxAttempts: 3,
    selectedTiles: [],
    groups: [],
    targetSong: null,
    targetSongSounds: [],
    allTiles: [],
  });

  // Define shuffleArray using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  useEffect(() => {
    // Disable Howler's autoUnlock to manage it manually
    Howler.autoUnlock = false;

    // Initialize Paper.js
    paper.setup(canvasRef.current);

    // Initialize the game
    initializeGame();

    // Cleanup on unmount
    return () => {
      // Stop all sounds
      Howler.unload();
      // Clear Paper.js project
      paper.project.clear();
    };
  }, []);

  const initializeGame = () => {
    // Reset game state
    gameStateRef.current = {
      gameWon: false,
      attempts: 0,
      maxAttempts: 3,
      selectedTiles: [],
      groups: [],
      targetSong: null,
      targetSongSounds: [],
      allTiles: [],
    };

    // Load the game
    loadGame();
  };

  const loadGame = () => {
    // Define variables
    const { PointText, Path, Color } = paper;
    const rows = 3;
    const columns = 6;
    const tileMargin = 10;
    const viewWidth = paper.view.size.width;
    const viewHeight = paper.view.size.height;
    const tileWidth = (viewWidth - (columns + 1) * tileMargin) / columns;
    const tileHeight = (viewHeight * 0.7 - (rows + 1) * tileMargin) / rows;
    const totalTiles = rows * columns;
    const originalColor = new Color(0.8, 0.8, 0.8, 1); // Light grey
    const clickAnimationColor = new Color(0.5, 0.5, 0.5, 1); // Darker grey
    const correctTileHighlightColor = new Color(0.8, 1, 0.8, 1); // Super light green
    const revealColor = new Color(0.4, 0.9, 0.4, 1); // Slightly darker green

    // Randomly select a target song
    const targetSongIndex = Math.floor(Math.random() * songs.length);
    const targetSong = songs[targetSongIndex];
    gameStateRef.current.targetSong = targetSong;

    // Load target song parts
    const targetSongSounds = targetSong.parts.map(
      (file) => new Howl({ src: [`/sounds/${file}`] })
    );
    gameStateRef.current.targetSongSounds = targetSongSounds;

    // Load other song parts
    let otherSongs = songs.slice();
    otherSongs.splice(targetSongIndex, 1); // Remove the target song from otherSongs
    let otherSongParts = otherSongs.flatMap((song) => song.parts);
    const otherSongSounds = otherSongParts.map(
      (file) => new Howl({ src: [`/sounds/${file}`] })
    );

    // Assign sounds to tiles
    let tileIndices = [...Array(totalTiles).keys()];
    shuffleArray(tileIndices); // Shuffle tile indices
    const tileSoundMap = {};
    for (let i = 0; i < targetSongSounds.length; i++) {
      tileSoundMap[tileIndices[i]] = {
        sound: targetSongSounds[i],
        isTarget: true,
      };
    }
    for (let i = targetSongSounds.length; i < totalTiles; i++) {
      const randomIndex = Math.floor(Math.random() * otherSongSounds.length);
      tileSoundMap[tileIndices[i]] = {
        sound: otherSongSounds[randomIndex],
        isTarget: false,
      };
    }

    // Create tiles
    let tileIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = tileMargin + col * (tileWidth + tileMargin);
        const y = viewHeight * 0.3 + tileMargin + row * (tileHeight + tileMargin);
        createTile(x, y, tileIndex, tileWidth, tileHeight, tileSoundMap, originalColor, clickAnimationColor);
        tileIndex++;
      }
    }

    // Create UI elements (buttons, prompts)
    createPrompt();
    createButtons();
  };

  const createTile = (
    x,
    y,
    index,
    tileWidth,
    tileHeight,
    tileSoundMap,
    originalColor,
    clickAnimationColor
  ) => {
    // Create the tile
    const tile = new paper.Path.Rectangle({
      point: [x, y],
      size: [tileWidth, tileHeight],
      fillColor: originalColor.clone(),
      radius: 5,
    });

    // Assign properties
    tile.index = index;
    tile.isSelected = false;
    tile.group = null;
    tile.isCorrect = false;
    tile.sound = tileSoundMap[index]?.sound || null;
    tile.isTarget = tileSoundMap[index]?.isTarget || false;

    // Add event handlers
    tile.onMouseEnter = () => {
      if (tile.sound) {
        stopAllPreviewSounds();
        const soundId = tile.sound.play();
        previewSoundsPlayingRef.current.push({ sound: tile.sound, id: soundId });

        // Change fill color to lighter version on hover
        const newColor = adjustBrightness(tile.fillColor, 0.2);
        if (newColor instanceof paper.Color) {
          tile.fillColor = newColor;
        }
      }
    };

    tile.onMouseLeave = () => {
      stopAllPreviewSounds();

      // Reset fill color based on state
      if (tile.isSelected) {
        tile.fillColor = clickAnimationColor.clone();
      } else if (tile.group) {
        tile.fillColor = tile.group.color.clone();
      } else {
        tile.fillColor = originalColor.clone();
      }
    };

    tile.onMouseDown = () => {
      if (gameStateRef.current.gameWon) return;
      stopAllPlaybackSounds();
      if (tile.group) {
        removeTileFromGroup(tile);
      } else {
        if (tile.isSelected) {
          deselectTile(tile, originalColor);
        } else {
          selectTile(tile, clickAnimationColor);
        }
      }
    };

    // Add tile to the list
    gameStateRef.current.allTiles.push(tile);
  };

  const selectTile = (tile, clickAnimationColor) => {
    if (gameStateRef.current.selectedTiles.length >= gameStateRef.current.targetSongSounds.length) {
      return; // Do not allow more selections
    }
    tile.isSelected = true;
    tile.fillColor = clickAnimationColor.clone();
    gameStateRef.current.selectedTiles.push(tile);
  };

  const deselectTile = (tile, originalColor) => {
    tile.isSelected = false;
    tile.fillColor = originalColor.clone();
    const index = gameStateRef.current.selectedTiles.indexOf(tile);
    if (index > -1) {
      gameStateRef.current.selectedTiles.splice(index, 1);
    }
  };

  const createButtons = () => {
    // Define button properties
    const buttonWidth = 120;
    const buttonHeight = 70;
    const buttonY = paper.view.size.height * 0.15; // Position the buttons at 15% of the view height

    // Calculate total width for five buttons including margins
    const totalButtonsWidth = buttonWidth * 5 + 80; // 20px margin between buttons

    // Calculate starting X position to center buttons
    const startX = (paper.view.size.width - totalButtonsWidth) / 2;

    // Create Play Button
    const playButtonGroup = createButton({
      x: startX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      color: new paper.Color(0.2, 0.7, 0.5, 1), // Green
      borderColor: new paper.Color(0.1, 0.6, 0.4, 1), // Darker green
      textContent: 'Play',
      onClick: function () {
        if (gameStateRef.current.gameWon) return; // Prevent playing after winning

        // Stop all sounds
        stopAllPreviewSounds();
        stopAllPlaybackSounds();

        // Play sounds of all groups
        playAllTileSounds();
      },
    });

    // Create Stop Button
    const stopButtonGroup = createButton({
      x: startX + buttonWidth + 20, // 20px margin
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      color: new paper.Color(0.8, 0.2, 0.2, 1), // Red
      borderColor: new paper.Color(0.7, 0.1, 0.1, 1), // Darker red
      textContent: 'Stop',
      onClick: function () {
        // Stop all sounds
        stopAllPreviewSounds();
        stopAllPlaybackSounds();
      },
    });

    // Create Group Button
    const groupButtonGroup = createButton({
      x: startX + (buttonWidth + 20) * 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      color: new paper.Color(1, 0.65, 0, 1), // Orange
      borderColor: new paper.Color(0.85, 0.55, 0, 1), // Darker orange
      textContent: 'Group',
      onClick: function () {
        groupSelectedTiles();
      },
    });

    // Create Submit Button
    const submitButtonGroup = createButton({
      x: startX + (buttonWidth + 20) * 3, // 20px margin
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      color: new paper.Color(0.2, 0.4, 0.8, 1), // Blue
      borderColor: new paper.Color(0.1, 0.3, 0.7, 1), // Darker blue
      textContent: 'Submit',
      onClick: function () {
        if (gameStateRef.current.gameWon) return; // Prevent submitting after winning

        // Stop all sounds
        stopAllPreviewSounds();
        stopAllPlaybackSounds();

        // Check if the selected groups are correct
        checkUserSelection();
      },
    });

    // Create Refresh Button
    const refreshButtonGroup = createButton({
      x: startX + (buttonWidth + 20) * 4, // 20px margin
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      color: new paper.Color(0.56, 0, 1, 1), // Purple
      borderColor: new paper.Color(0.4, 0, 0.8, 1), // Darker purple
      textContent: 'Refresh',
      onClick: function () {
        // Reset the game state and initialize a new game
        resetGame();
      },
    });
  };

  const createButton = ({ x, y, width, height, color, borderColor, textContent, onClick }) => {
    // Create the button border (larger rectangle for border effect)
    const buttonBorder = new paper.Path.Rectangle({
      point: [x - 5, y - 5],
      size: [width + 10, height + 10],
      fillColor: borderColor,
      radius: 15, // Rounded corners for border
    });

    // Create the button rectangle (inner button)
    const buttonRect = new paper.Path.Rectangle({
      point: [x, y],
      size: [width, height],
      fillColor: color,
      radius: 15, // Rounded corners
    });

    // Add shadow to the button
    buttonRect.shadowColor = new paper.Color(0, 0, 0, 0.5); // Black shadow with 50% opacity
    buttonRect.shadowBlur = 10;
    buttonRect.shadowOffset = new paper.Point(5, 5);

    // Add text to the button
    const buttonText = new paper.PointText({
      point: [x + width / 2, y + height / 2 + 10],
      justification: 'center',
      fontSize: 24,
      fillColor: 'white',
      content: textContent,
    });

    // Group the button elements
    const buttonGroup = new paper.Group([buttonBorder, buttonRect, buttonText]);

    // Function to adjust brightness
    const adjustBrightness = (color, factor) => {
      if (!(color instanceof paper.Color)) {
        console.error('Expected paper.Color, got:', color);
        return color; // Return original color if not a paper.Color
      }
      const newColor = color.clone();
      if (typeof newColor.brighten === 'function') {
        newColor.brighten(factor); // Adjust brightness
      } else {
        console.error('brighten is not a function on newColor:', newColor);
      }
      return newColor;
    };

    // On mouse enter, manually adjust the color for hover effect
    buttonGroup.onMouseEnter = function () {
      const brightenedColor = adjustBrightness(color, 0.2); // Lighten the color
      if (brightenedColor instanceof paper.Color) {
        buttonRect.fillColor = brightenedColor;
      }
    };

    // On mouse leave, return to original color
    buttonGroup.onMouseLeave = function () {
      buttonRect.fillColor = color;
    };

    // On click, animate with both scaling and color change
    buttonGroup.onMouseDown = function () {
      // Scale up the button and text for a pressing effect
      buttonGroup.scale(1.1);

      // Briefly darken the button
      const darkenedColor = adjustBrightness(color, -0.2); // Darken the color
      if (darkenedColor instanceof paper.Color) {
        buttonRect.fillColor = darkenedColor;
      }

      // Return to original size and color after animation
      setTimeout(() => {
        buttonGroup.scale(1 / 1.1);
        buttonRect.fillColor = color;
      }, 100); // Return after 100ms

      // Execute the onClick function
      onClick();
    };

    // Bring the button group to the front
    buttonGroup.bringToFront();

    return buttonGroup;
  };

  const createPrompt = () => {
    const { PointText } = paper;

    const promptText = new PointText({
      point: [paper.view.size.width / 2, paper.view.size.height * 0.08],
      justification: 'center',
      fontSize: 28,
      fillColor: 'black',
      content: 'Group the right song!',
    });

    // Attempts indicator
    const attemptsText = new PointText({
      point: [paper.view.size.width / 2, paper.view.size.height * 0.13],
      justification: 'center',
      fontSize: 20,
      fillColor: 'black',
      content: `Attempts: ${gameStateRef.current.attempts} / ${gameStateRef.current.maxAttempts}`,
    });

    // Function to update attempts text
    const updateAttempts = () => {
      attemptsText.content = `Attempts: ${gameStateRef.current.attempts} / ${gameStateRef.current.maxAttempts}`;
    };

    // Expose the updateAttempts function
    window.updateAttempts = updateAttempts;
  };

  const stopAllPreviewSounds = () => {
    previewSoundsPlayingRef.current.forEach((soundObj) => {
      soundObj.sound.stop(soundObj.id);
    });
    previewSoundsPlayingRef.current = [];
  };

  const stopAllPlaybackSounds = () => {
    playbackSoundsPlayingRef.current.forEach((soundObj) => {
      soundObj.sound.stop(soundObj.id);
    });
    playbackSoundsPlayingRef.current = [];
  };

  const playAllTileSounds = () => {
    // Stop all previous sounds
    stopAllPreviewSounds();
    stopAllPlaybackSounds();

    // Iterate through all groups and play their sounds
    gameStateRef.current.groups.forEach((group) => {
      group.tiles.forEach((tile) => {
        if (tile.sound) {
          const soundId = tile.sound.play();
          playbackSoundsPlayingRef.current.push({ sound: tile.sound, id: soundId });
        }
      });
    });
  };

  const groupSelectedTiles = () => {
    if (gameStateRef.current.selectedTiles.length > 0) {
      // Generate a new random color for the group
      const newColor = new paper.Color(Math.random(), Math.random(), Math.random());

      // Create a new group
      const group = {
        color: newColor,
        tiles: [...gameStateRef.current.selectedTiles], // Clone the selected tiles
      };

      // Assign group to tiles and change their color
      group.tiles.forEach((tile) => {
        tile.group = group;
        tile.isSelected = false; // Deselect tile
        tile.fillColor = newColor.clone(); // Change color to group color
      });

      // Add group to groups array
      gameStateRef.current.groups.push(group);

      // Clear selectedTiles array
      gameStateRef.current.selectedTiles = [];

      // Play the sounds of the newly grouped tiles
      playGroupSounds(group.tiles);
    }
  };

  const playGroupSounds = (tiles) => {
    // Stop all previous sounds
    stopAllPreviewSounds();
    stopAllPlaybackSounds();

    // Play sounds of provided tiles
    tiles.forEach((tile) => {
      if (tile.sound) {
        const soundId = tile.sound.play();
        playbackSoundsPlayingRef.current.push({ sound: tile.sound, id: soundId });
      }
    });
  };

  const removeTileFromGroup = (tile) => {
    const group = tile.group;
    if (group) {
      // Remove tile from group
      const index = group.tiles.indexOf(tile);
      if (index > -1) {
        group.tiles.splice(index, 1);
      }

      // If group is empty, remove it from groups array
      if (group.tiles.length === 0) {
        const groupIndex = gameStateRef.current.groups.indexOf(group);
        if (groupIndex > -1) {
          gameStateRef.current.groups.splice(groupIndex, 1);
        }
      }

      // Clear tile's group property
      tile.group = null;

      // Reset tile color
      tile.fillColor = new paper.Color(0.8, 0.8, 0.8, 1); // Original light grey
    }
  };

  const resetGame = () => {
    // Stop all sounds
    stopAllPreviewSounds();
    stopAllPlaybackSounds();

    // Clear Paper.js project to remove previous elements
    paper.project.clear();

    // Re-initialize the game
    initializeGame();
  };

  const checkUserSelection = () => {
    // Get target tiles
    const targetTiles = gameStateRef.current.allTiles.filter((tile) => tile.isTarget);

    // Reset previous correct highlights
    gameStateRef.current.allTiles.forEach((tile) => {
      if (tile.isCorrect) {
        tile.isCorrect = false;
        if (tile.group) {
          tile.fillColor = tile.group.color.clone();
        } else {
          tile.fillColor = new paper.Color(0.8, 0.8, 0.8, 1); // Original light grey
        }
      }
    });

    // Check if there's a group that contains exactly all target tiles
    let foundCorrectGroup = false;

    for (let group of gameStateRef.current.groups) {
      const groupTiles = group.tiles;

      const groupTileIndices = groupTiles.map((tile) => tile.index).sort((a, b) => a - b);
      const targetTileIndices = targetTiles.map((tile) => tile.index).sort((a, b) => a - b);

      if (arraysEqual(groupTileIndices, targetTileIndices)) {
        foundCorrectGroup = true;
        break;
      } else {
        // Highlight correct tiles in the group
        groupTiles.forEach((tile) => {
          if (tile.isTarget) {
            tile.isCorrect = true;
            tile.fillColor = correctTileHighlightColor.clone(); // Super light green
          }
        });
      }
    }

    if (foundCorrectGroup) {
      // Highlight the correct tiles in darker green
      targetTiles.forEach((tile) => {
        tile.fillColor = revealColor.clone(); // Slightly darker green
      });

      // Play all correct tile sounds
      playAllCorrectSounds();

      // Display a win indicator
      showWinIndicator();

      // Set gameWon to true to prevent further interactions
      gameStateRef.current.gameWon = true;
    } else {
      // Incorrect selection
      gameStateRef.current.attempts++;
      window.updateAttempts(); // Update the attempts display

      if (gameStateRef.current.attempts >= gameStateRef.current.maxAttempts) {
        // Reveal the correct tiles
        revealCorrectTiles();

        // Play all correct tile sounds
        playAllCorrectSounds();

        // Display a lose indicator
        showLoseIndicator();

        gameStateRef.current.gameWon = true; // End the game
      }
    }
  };

  const revealCorrectTiles = () => {
    const targetTiles = gameStateRef.current.allTiles.filter((tile) => tile.isTarget);
    targetTiles.forEach((tile) => {
      tile.fillColor = revealColor.clone(); // Slightly darker green
    });
  };

  const showWinIndicator = () => {
    const { Path, PointText, Color } = paper;

    // Create a semi-transparent overlay
    const overlay = new Path.Rectangle({
      point: [0, 0],
      size: [paper.view.size.width, paper.view.size.height],
      fillColor: new Color(0, 0, 0, 0.5), // Black with 50% opacity
    });

    // Add text in the center
    const winText = new PointText({
      point: [paper.view.size.width / 2, paper.view.size.height / 2],
      justification: 'center',
      fontSize: 48,
      fillColor: 'white',
      content: 'Congratulations! You Win!\nClick to play again.',
    });

    // Attach the text to the overlay
    overlay.winText = winText;

    // Bring overlay and text to front
    overlay.bringToFront();
    winText.bringToFront();

    // Setup click to restart
    setupRestartOnClick(overlay);
  };

  const showLoseIndicator = () => {
    const { Path, PointText, Color } = paper;

    // Create a semi-transparent overlay
    const overlay = new Path.Rectangle({
      point: [0, 0],
      size: [paper.view.size.width, paper.view.size.height],
      fillColor: new Color(0, 0, 0, 0.5), // Black with 50% opacity
    });

    // Add text in the center
    const loseText = new PointText({
      point: [paper.view.size.width / 2, paper.view.size.height / 2],
      justification: 'center',
      fontSize: 36,
      fillColor: 'white',
      content: 'Out of attempts!\nThe correct tiles have been revealed.\nClick to play again.',
    });

    // Attach the text to the overlay
    overlay.loseText = loseText;

    // Bring overlay and text to front
    overlay.bringToFront();
    loseText.bringToFront();

    // Setup click to restart
    setupRestartOnClick(overlay);
  };

  const setupRestartOnClick = (overlay) => {
    overlay.onMouseDown = function () {
      // Remove overlay and text
      overlay.remove();
      if (overlay.winText) overlay.winText.remove();
      if (overlay.loseText) overlay.loseText.remove();

      // Reset the game
      resetGame();
    };
  };

  const playAllCorrectSounds = () => {
    // Stop all other sounds
    stopAllPreviewSounds();
    stopAllPlaybackSounds();

    // Play sounds of all correct tiles
    const correctTiles = gameStateRef.current.allTiles.filter((tile) => tile.isTarget);
    correctTiles.forEach((tile) => {
      if (tile.sound) {
        const soundId = tile.sound.play();
        playbackSoundsPlayingRef.current.push({ sound: tile.sound, id: soundId });
      }
    });
  };

  // Adjust brightness safely
  const adjustBrightness = (color, factor) => {
    if (!(color instanceof paper.Color)) {
      console.error('Expected paper.Color, got:', color);
      return color; // Return original color if not a paper.Color
    }
    const newColor = color.clone();
    if (typeof newColor.brighten === 'function') {
      newColor.brighten(factor); // Adjust brightness
    } else {
      console.error('brighten is not a function on newColor:', newColor);
    }
    return newColor;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        id="myCanvas"
        width="1200"
        height="400"
        resize="true"
        style={{ width: '100%', height: '100vh' }}
      ></canvas>
      {/* Removed the audio element since we're using Howler.js */}
    </div>
  );
};

export default Home;
