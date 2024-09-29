window.onload = function() {
    // Setup Paper.js
    paper.setup('myCanvas');

    let groupedColors = [];

    // Define the tile colors and layout
    const originalColor = new paper.Color(0.8, 0.8, 0.8, 1); // Light grey, fully opaque
    const clickAnimationColor = new paper.Color(0.5, 0.5, 0.5, 1); // Darker grey for animation
    const playButtonColor = new paper.Color(0.2, 0.7, 0.5, 1); // Green color for play button
    const playButtonBorderColor = new paper.Color(0.1, 0.6, 0.4, 1); // Darker green for button border
    const stopButtonColor = new paper.Color(0.8, 0.2, 0.2, 1); // Red color for stop button
    const submitButtonColor = new paper.Color(0.2, 0.4, 0.8, 1); // Blue color for submit button
    const stopButtonBorderColor = new paper.Color(0.7, 0.1, 0.1, 1); // Darker red for border
    const submitButtonBorderColor = new paper.Color(0.1, 0.3, 0.7, 1); // Darker blue for border
    const groupButtonColor =  new paper.Color(1, 0.65, 0, 1);
    const groupButtonBorderColor = new paper.Color(0.85, 0.55, 0, 1);
    const refreshButtonColor = new paper.Color(0.56, 0, 1, 1);
    const refreshButtonBorderColor = new paper.Color(0.4, 0, 0.8, 1);
    const successColor = new paper.Color(0.2, 0.8, 0.2, 1); // Bright green for correct tiles
    const revealColor = new paper.Color(0.8, 0.8, 0.2, 1); // Yellow color for revealing correct tiles
    const rows = 3;
    const columns = 6;
    const tileMargin = 10; // Margin between tiles
    const fadeDuration = 5; // Duration to fade to resting color in seconds
    let clickOrder = 1; // Counter for click order
    const clickedTiles = []; // Stack to track the order of clicked tiles
    const doubleClickThreshold = 300; // Threshold in milliseconds to detect double click
    let gameWon = false; // Flag to prevent interactions after winning
    let attempts = 0; // Number of attempts made by the user
    const maxAttempts = 3; // Maximum number of attempts before revealing correct tiles

    // Ensure that the 'songs' array is available (included via songs.js)
    if (typeof songs === 'undefined') {
        alert('Songs data not found. Please include songs.js before this script.');
        return;
    }

    // Arrays to track sounds currently playing
    let previewSoundsPlaying = [];
    let playbackSoundsPlaying = [];

    // Total number of tiles
    const totalTiles = rows * columns;

    // Randomly select a target song
    const targetSongIndex = Math.floor(Math.random() * songs.length);
    const targetSong = songs[targetSongIndex];

    // Load sounds for the target song
    const targetSongSounds = targetSong.parts.map(file => new Howl({ src: ['sounds/' + file] }));

    // Collect snippets from other songs
    let otherSongs = songs.slice();
    otherSongs.splice(targetSongIndex, 1); // Remove the target song from otherSongs

    // Flatten the parts of other songs into one array
    let otherSongParts = otherSongs.flatMap(song => song.parts);

    // Load sounds for other song parts
    const otherSongSounds = otherSongParts.map(file => new Howl({ src: ['sounds/' + file] }));

    // Combine target song sounds and other song sounds
    let allSounds = targetSongSounds.concat(otherSongSounds);

    // Shuffle the tiles
    let tileIndices = [...Array(totalTiles).keys()]; // Create an array [0, 1, ..., totalTiles - 1]
    shuffleArray(tileIndices); // Shuffle the tile indices

    // Map to store tile index to sound
    const tileSoundMap = {};

    // Assign target song sounds to random tiles
    for (let i = 0; i < targetSongSounds.length; i++) {
        tileSoundMap[tileIndices[i]] = { sound: targetSongSounds[i], isTarget: true };
    }

    // Assign other song sounds to the remaining tiles
    for (let i = targetSongSounds.length; i < totalTiles; i++) {
        const randomIndex = Math.floor(Math.random() * otherSongSounds.length);
        tileSoundMap[tileIndices[i]] = { sound: otherSongSounds[randomIndex], isTarget: false };
    }

    // Keep track of correct tiles (tiles with target song sounds)
    const correctTiles = tileIndices.slice(0, targetSongSounds.length).sort((a, b) => a - b);

    // Get the size of the canvas view
    const viewWidth = paper.view.size.width;
    const viewHeight = paper.view.size.height;

    // Calculate tile size based on canvas dimensions and margins
    const tileWidth = (viewWidth - (columns + 1) * tileMargin) / columns;
    const tileHeight = (viewHeight * 0.7 - (rows + 1) * tileMargin) / rows; // 70% of view height for grid

    // Function to generate a random light color
    function getRandomRestingColor() {
        const r = Math.random() * 0.4 + 0.6; // Random value between 0.6 and 1
        const g = Math.random() * 0.4 + 0.6;
        const b = Math.random() * 0.4 + 0.6;
        return new paper.Color(r, g, b, 1);
    }

    // Function to shuffle an array in place (Fisher-Yates algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Array to hold all tiles
    const allTiles = [];

    // Function to create a single tile
    function createTile(x, y, index) {
        // Each tile gets a unique resting color
        const tileRestingColor = getRandomRestingColor();

        // Create a rectangle path with initial fill color
        const tile = new paper.Path.Rectangle({
            point: [x, y],
            size: [tileWidth, tileHeight],
            fillColor: originalColor.clone(), // Initially light grey
            radius: 5 // Rounded corners
        });

        // Add per-tile state properties
        tile.isAnimating = false;
        tile.isSelected = false;
        tile.index = index; // Keep track of tile index

        // Assign a sound to the tile if it's in the tileSoundMap
        if (tileSoundMap[index]) {
            tile.sound = tileSoundMap[index].sound;
            tile.isTarget = tileSoundMap[index].isTarget; // Indicates if the tile has a target song sound
        } else {
            tile.sound = null; // No sound assigned
            tile.isTarget = false;
        }

        // Create a text item to show click order
        const text = new paper.PointText({
            point: [x + tileWidth / 2, y + tileHeight / 2 + 5], // Adjust the y position for centering
            justification: 'center',
            fontSize: 20,
            fillColor: 'black', // Text color
            content: '',
            opacity: 0 // Start as invisible
        });

        // Small circle around the order number
        let circle = null;

        let lastClickTime = 0;
        let clickTimeout;

        // On press, animate the tile color, update text, and play sound
        tile.onMouseDown = function() {
            if (gameWon) return; // Prevent interaction if game is won

            const currentTime = new Date().getTime();
            const timeSinceLastClick = currentTime - lastClickTime;
            lastClickTime = currentTime;

            // Clear any existing timeout for double-click detection
            clearTimeout(clickTimeout);

            // Stop playback sounds when a tile is clicked
            stopAllPlaybackSounds();

            // Handle reset if tile is already double-clicked and selected
            if (tile.isSelected) {
                resetTile(tile);
                return;
            }

            // Handle single click or double click logic
            if (timeSinceLastClick > doubleClickThreshold) {
                // Single click behavior (without selection)
                clickTimeout = setTimeout(() => {
                    // Stop all preview sounds before playing a new one
                    stopAllPreviewSounds();

                    if (tile.sound) {
                        // Play the sound and keep track of it
                        const soundId = tile.sound.play();
                        previewSoundsPlaying.push({ sound: tile.sound, id: soundId });
                    }
                    if (tile.isAnimating) {
                        resetTile(tile);
                    } else {
                        animatePressEffect(tile, originalColor, text); // Single click resets to original color
                        tile.isAnimating = true; // Mark this tile as animating
                    }
                }, doubleClickThreshold);
            } else {
                // Double-click behavior (select the tile and animate to resting color)
                // Stop all preview sounds before playing
                stopAllPreviewSounds();

                if (tile.sound) {
                    // Play the sound and keep track of it
                    const soundId = tile.sound.play();
                    previewSoundsPlaying.push({ sound: tile.sound, id: soundId });
                }
                if (!tile.isSelected) {
                    selectTile();
                }
            }
        };

        // Function to select and animate tile to resting state
        function selectTile() {
            text.content = clickOrder.toString(); // Set the text to the order of the click
            // Draw a small circle around the order number
            circle = new paper.Path.Circle({
                center: [x + tileWidth / 2, y + tileHeight / 2],
                radius: 15,
                fillColor: originalColor.clone()
            });

            text.bringToFront(); // Bring text to front to ensure visibility
            tile.clicked = true; // Mark as clicked
            tile.isSelected = true; // Mark as selected
            clickedTiles.push({ tile, text, tileRestingColor, circle }); // Add to stack for tracking
            clickOrder++;
            animatePressEffect(tile, tileRestingColor, text);
        }

        // Function to reset the tile
        function resetTile(tileToReset) {
            tileToReset.onFrame = null; // Stop any ongoing animation
            tileToReset.fillColor = originalColor.clone(); // Reset to original color
            tileToReset.clicked = false; // Mark as not clicked
            tileToReset.isAnimating = false; // Mark as not animating
            tileToReset.isSelected = false; // Mark as not selected

            // Find and reset the associated text and circle
            const tileDataIndex = clickedTiles.findIndex(item => item.tile === tileToReset);
            if (tileDataIndex !== -1) {
                const tileData = clickedTiles[tileDataIndex];
                tileData.text.content = ''; // Remove the text
                tileData.text.opacity = 0; // Make text invisible again
                if (tileData.circle) tileData.circle.remove(); // Remove the circle
                clickedTiles.splice(tileDataIndex, 1); // Remove from clickedTiles

                // Adjust click orders and update text
                for (let i = tileDataIndex; i < clickedTiles.length; i++) {
                    const currentTileData = clickedTiles[i];
                    const newOrder = i + 1;
                    currentTileData.text.content = newOrder.toString();
                }

                clickOrder = clickedTiles.length + 1; // Update clickOrder
            }
        }

        // Function to animate the press effect
        function animatePressEffect(tile, targetColor, text) {
            // Set the tile color to the click animation color (fully opaque)
            tile.fillColor = clickAnimationColor.clone();

            // Create a quick animation effect
            const quickFadeDuration = 0.3; // duration in seconds for the quick fade-in animation
            const startTime = new Date().getTime(); // Get current time in milliseconds

            tile.onFrame = function(event) {
                const elapsed = (new Date().getTime() - startTime) / 1000; // Calculate elapsed time in seconds
                const progress = elapsed / quickFadeDuration;

                if (progress < 1) {
                    // Interpolate the alpha for the quick animation effect
                    tile.fillColor.alpha = 1 - (progress * 0.5); // Slight darken on click
                    text.opacity = progress; // Fade in the text with the animation
                } else {
                    // Start the slow fade to the target color (resting or original)
                    tile.fillColor = clickAnimationColor.clone(); // Reset to correct color before fading
                    tile.onFrame = null; // Stop the quick animation
                    fadeToColor(tile, targetColor, text); // Start the fade to the unique target color
                }
            };
        }

        // Function to fade tile to the given target color over a set duration
        function fadeToColor(tile, targetColor, text) {
            const fadeStartTime = new Date().getTime(); // Get current time in milliseconds
            const startColor = tile.fillColor.clone(); // Clone the current color

            tile.onFrame = function(event) {
                const elapsed = (new Date().getTime() - fadeStartTime) / 1000; // Calculate elapsed time in seconds
                const progress = Math.min(elapsed / fadeDuration, 1); // Cap progress at 1

                // Interpolate RGB values manually from clickAnimationColor to targetColor
                const r = startColor.red + (targetColor.red - startColor.red) * progress;
                const g = startColor.green + (targetColor.green - startColor.green) * progress;
                const b = startColor.blue + (targetColor.blue - startColor.blue) * progress;

                tile.fillColor = new paper.Color(r, g, b);
                text.opacity = progress; // Continue fading in text during the animation

                if (progress >= 1) {
                    // Ensure tile is at the target color and stop the animation
                    tile.fillColor = targetColor.clone();
                    tile.onFrame = null; // Stop the fade animation
                    tile.isAnimating = false; // Mark as not animating
                }
            };
        }

        // Add tile to allTiles array
        allTiles.push(tile);
    }

    function createButtons() {
        const buttonWidth = 120;
        const buttonHeight = 70;
        const buttonY = viewHeight * 0.15; // Position the buttons at 15% of the view height

        // Calculate total width for three buttons including margins
        const totalButtonsWidth = buttonWidth * 5 + 100; // 20px margin between buttons

        // Calculate starting X position to center buttons
        const startX = (viewWidth - totalButtonsWidth) / 2;

        // Create Play Button
        const playButtonGroup = createButton({
            x: startX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            color: playButtonColor,
            borderColor: playButtonBorderColor,
            textContent: 'Play',
            onClick: function() {
                if (gameWon) return; // Prevent playing after winning

                // Stop all sounds
                stopAllPreviewSounds();
                stopAllPlaybackSounds();

                // Play sounds of selected tiles
                playSelectedTileSounds();
            }
        });

        // Create Stop Button
        const stopButtonGroup = createButton({
            x: startX + buttonWidth + 20, // 20px margin
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            color: stopButtonColor,
            borderColor: stopButtonBorderColor,
            textContent: 'Stop',
            onClick: function() {
                // Stop all sounds
                stopAllPreviewSounds();
                stopAllPlaybackSounds();
            }
        });

        //Create Group Button
        const groupButtonGroup = createButton({
            x: startX  + (buttonWidth + 20) * 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            color: groupButtonColor, // need color
            borderColor:groupButtonBorderColor,
            textContent: 'Group',
            onClick: function() {
                groupSelectedTiles(); // doesnt work 
            }
        }); 

        // Create Submit Button
        const submitButtonGroup = createButton({
            x: startX + (buttonWidth + 20) * 3, // 20px margin
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            color: submitButtonColor,
            borderColor: submitButtonBorderColor,
            textContent: 'Submit',
            onClick: function() {
                if (gameWon) return; // Prevent submitting after winning

                // Stop all sounds
                stopAllPreviewSounds();
                stopAllPlaybackSounds();

                // Check if the selected tiles are correct
                checkUserSelection();
            }
        });

        // Create Refresh Button
        const refreshButtonGroup = createButton({
            x: startX + (buttonWidth + 20) * 4, // 20px margin
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            color: refreshButtonColor,
            borderColor: refreshButtonBorderColor,
            textContent: 'Refresh',
            onClick: function() {
                refreshGame();
            }
        });
    }

    // Function to create a button
    function createButton({ x, y, width, height, color, borderColor, textContent, onClick }) {
        // Create the button border (larger rectangle for border effect)
        const buttonBorder = new paper.Path.Rectangle({
            point: [x - 5, y - 5],
            size: [width + 10, height + 10],
            fillColor: borderColor,
            radius: 15 // Rounded corners for border
        });

        // Create the button rectangle (inner button)
        const buttonRect = new paper.Path.Rectangle({
            point: [x, y],
            size: [width, height],
            fillColor: color,
            radius: 15 // Rounded corners
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
            content: textContent
        });

        // Group the button elements
        const buttonGroup = new paper.Group([buttonBorder, buttonRect, buttonText]);

        // Function to adjust brightness
        function adjustBrightness(color, factor) {
            return new paper.Color(
                Math.min(color.red + factor, 1),
                Math.min(color.green + factor, 1),
                Math.min(color.blue + factor, 1)
            );
        }

        // On mouse enter, manually adjust the color for hover effect
        buttonGroup.onMouseEnter = function() {
            buttonRect.fillColor = adjustBrightness(color, 0.2); // Lighten the color
        };

        // On mouse leave, return to original color
        buttonGroup.onMouseLeave = function() {
            buttonRect.fillColor = color;
        };

        // On click, animate with both scaling and color change
        buttonGroup.onMouseDown = function() {
            // Scale up the button and text for a pressing effect
            buttonGroup.scale(1.1);

            // Briefly darken the button
            buttonRect.fillColor = adjustBrightness(color, -0.2); // Darken the color

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
    }

    // Function to add a prompt and attempts indicator above the buttons
    function createPrompt() {
        const promptText = new paper.PointText({
            point: [viewWidth / 2, viewHeight * 0.08],
            justification: 'center',
            fontSize: 28,
            fillColor: 'black',
            content: 'Mix the right song!'
        });

        // Attempts indicator
        const attemptsText = new paper.PointText({
            point: [viewWidth / 2, viewHeight * 0.13],
            justification: 'center',
            fontSize: 20,
            fillColor: 'black',
            content: `Attempts: ${attempts} / ${maxAttempts}`
        });

        // Function to update attempts text
        function updateAttempts() {
            attemptsText.content = `Attempts: ${attempts} / ${maxAttempts}`;
        }

        // Expose the updateAttempts function
        window.updateAttempts = updateAttempts;
    }

    // Function to stop all preview sounds
    function stopAllPreviewSounds() {
        // Stop all sounds in the previewSoundsPlaying array
        previewSoundsPlaying.forEach(soundObj => {
            soundObj.sound.stop(soundObj.id);
        });
        // Clear the array
        previewSoundsPlaying = [];
    }

    // Function to stop all playback sounds
    function stopAllPlaybackSounds() {
        // Stop all sounds in the playbackSoundsPlaying array
        playbackSoundsPlaying.forEach(soundObj => {
            soundObj.sound.stop(soundObj.id);
        });
        // Clear the array
        playbackSoundsPlaying = [];
    }

    // Function to play sounds of selected tiles
    function playSelectedTileSounds() {
        // For all selected tiles, play their sounds simultaneously
        clickedTiles.forEach(tileData => {
            if (tileData.tile.sound) {
                const soundId = tileData.tile.sound.play();
                playbackSoundsPlaying.push({ sound: tileData.tile.sound, id: soundId });
            }
        });
    }

    //Removable
    function groupSelectedTiles() {
        if (clickedTiles.length > 0) {
            const newColor = new paper.Color(Math.random(), Math.random(), Math.random());
            clickedTiles.forEach(tile => {
                tile.fillColor = newColor; // Group color
            });
            groupedColors.push(newColor); // Track the color for future groups  
        }
    }

    // Another removable
    function refreshGame() {
        if (attempts === 3) {
            attempts = 0; // Reset attempts
        }
        clickedTiles.forEach(tile => tile.fillColor = 'lightgray'); // Reset colors
        clickedTiles = []; // Clear selections
    }

    // Function to check user's selection against the correct tiles
    function checkUserSelection() {
        // Get indices of selected tiles
        const selectedTileIndices = clickedTiles.map(tileData => tileData.tile.index).sort((a, b) => a - b);

        // Compare with correct tiles
        const isCorrect = arraysEqual(selectedTileIndices, correctTiles);

        if (isCorrect) {
            // Highlight the correct tiles in green
            clickedTiles.forEach(tileData => {
                tileData.tile.fillColor = successColor.clone();
            });

            // Display a win indicator
            showWinIndicator();

            // Set gameWon to true to prevent further interactions
            gameWon = true;
        } else {
            // Incorrect selection
            attempts++;
            window.updateAttempts(); // Update the attempts display

            if (attempts >= maxAttempts) {
                // Reveal the correct tiles
                revealCorrectTiles();
                alert('Out of attempts! The correct tiles have been revealed.');
                gameWon = true; // End the game
            } else {
                alert('Incorrect selection. Please try again.');
                // Optionally, you can reset the selection or provide additional feedback
            }
        }
    }

    // Function to reveal the correct tiles
    function revealCorrectTiles() {
        allTiles.forEach(tile => {
            if (tile.isTarget) {
                tile.fillColor = revealColor.clone(); // Highlight correct tiles
            }
        });
    }

    // Function to display a win indicator
    function showWinIndicator() {
        // Create a semi-transparent overlay
        const overlay = new paper.Path.Rectangle({
            point: [0, 0],
            size: [viewWidth, viewHeight],
            fillColor: new paper.Color(0, 0, 0, 0.5), // Black with 50% opacity
        });

        // Add text in the center
        const winText = new paper.PointText({
            point: [viewWidth / 2, viewHeight / 2],
            justification: 'center',
            fontSize: 48,
            fillColor: 'white',
            content: 'Congratulations! You Win!',
        });

        // Bring overlay and text to front
        overlay.bringToFront();
        winText.bringToFront();
    }

    // Helper function to compare two arrays
    function arraysEqual(a1, a2) {
        return JSON.stringify(a1) === JSON.stringify(a2);
    }

    // Create the prompt and attempts indicator
    createPrompt();

    // Create the buttons
    createButtons();

    // Create the grid of tiles (occupies 70% of view height)
    let tileIndex = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = tileMargin + col * (tileWidth + tileMargin);
            const y = viewHeight * 0.3 + tileMargin + row * (tileHeight + tileMargin); // Start at 30% of view height
            createTile(x, y, tileIndex);
            tileIndex++;
        }
    }
};

<<<<<<< HEAD

=======
>>>>>>> 25c60f1b75a7b3c0a571c50b827655be08771035
