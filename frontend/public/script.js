window.onload = function() {
    // Setup Paper.js
    paper.setup('myCanvas');

    // Function to initialize the game
    function initializeGame() {
        // Clear the project to remove previous elements
        paper.project.clear();

        // Define variables
        const originalColor = new paper.Color(0.8, 0.8, 0.8, 1); // Light grey
        const clickAnimationColor = new paper.Color(0.5, 0.5, 0.5, 1); // Darker grey for selection
        const playButtonColor = new paper.Color(0.2, 0.7, 0.5, 1); // Green
        const playButtonBorderColor = new paper.Color(0.1, 0.6, 0.4, 1); // Darker green
        const stopButtonColor = new paper.Color(0.8, 0.2, 0.2, 1); // Red
        const submitButtonColor = new paper.Color(0.2, 0.4, 0.8, 1); // Blue
        const stopButtonBorderColor = new paper.Color(0.7, 0.1, 0.1, 1); // Darker red
        const submitButtonBorderColor = new paper.Color(0.1, 0.3, 0.7, 1); // Darker blue
        const groupButtonColor =  new paper.Color(1, 0.65, 0, 1); // Orange
        const groupButtonBorderColor = new paper.Color(0.85, 0.55, 0, 1); // Darker orange
        const refreshButtonColor = new paper.Color(0.56, 0, 1, 1); // Purple
        const refreshButtonBorderColor = new paper.Color(0.4, 0, 0.8, 1); // Darker purple
        const successColor = new paper.Color(0.2, 0.8, 0.2, 1); // Bright green for winning
        const revealColor = new paper.Color(0.4, 0.9, 0.4, 1); // Slightly darker green for reveal
        const correctTileHighlightColor = new paper.Color(0.8, 1, 0.8, 1); // Super light green for correct tiles on each attempt
        const rows = 3;
        const columns = 6;
        const tileMargin = 10; // Margin between tiles
        const fadeDuration = 5; // Duration to fade to resting color in seconds
        let gameWon = false; // Flag to prevent interactions after winning
        let attempts = 0; // Number of attempts made by the user
        const maxAttempts = 3; // Maximum number of attempts before revealing correct tiles

        let groups = []; // Array to hold groups
        let selectedTiles = []; // Tiles currently selected (not yet grouped)

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

        // Load the full song
        const fullSong = new Howl({ src: ['sounds/' + targetSong.name + '/full.mp3'] });

        // Collect snippets from other songs
        let otherSongs = songs.slice();
        otherSongs.splice(targetSongIndex, 1); // Remove the target song from otherSongs

        // Flatten the parts of other songs into one array
        let otherSongParts = otherSongs.flatMap(song => song.parts);

        // Load sounds for other song parts
        const otherSongSounds = otherSongParts.map(file => new Howl({ src: ['sounds/' + file] }));

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
            tile.group = null; // Keep track of group
            tile.isCorrect = false; // Flag for correct tiles in user's attempt

            // Assign a sound to the tile if it's in the tileSoundMap
            if (tileSoundMap[index]) {
                tile.sound = tileSoundMap[index].sound;
                tile.isTarget = tileSoundMap[index].isTarget; // Indicates if the tile has a target song sound
            } else {
                tile.sound = null; // No sound assigned
                tile.isTarget = false;
            }

            // On hover, play the sound
            tile.onMouseEnter = function() {
                if (tile.sound) {
                    // Stop all preview sounds before playing a new one
                    stopAllPreviewSounds();
                    // Play the sound and keep track of it
                    const soundId = tile.sound.play();
                    previewSoundsPlaying.push({ sound: tile.sound, id: soundId });
                }
            };

            tile.onMouseLeave = function() {
                // Stop preview sounds when mouse leaves
                stopAllPreviewSounds();
            };

            // On click, toggle selection or remove from group
            tile.onMouseDown = function() {
                if (gameWon) return; // Prevent interaction if game is won

                // Stop playback sounds when a tile is clicked
                stopAllPlaybackSounds();

                if (tile.group) {
                    // Tile is in a group, remove it from the group
                    removeTileFromGroup(tile);
                } else {
                    // Toggle selection
                    if (tile.isSelected) {
                        deselectTile(tile);
                    } else {
                        selectTile(tile);
                    }
                }
            };

            // Function to select a tile
            function selectTile(tile) {
                // **Limit the number of selected tiles**
                if (selectedTiles.length >= targetSongSounds.length) {
                    return; // Do not allow more selections
                }
                tile.isSelected = true;
                tile.fillColor = clickAnimationColor.clone(); // Change color to indicate selection
                selectedTiles.push(tile);
            }

            // Function to deselect a tile
            function deselectTile(tile) {
                tile.isSelected = false;
                tile.fillColor = originalColor.clone();
                const index = selectedTiles.indexOf(tile);
                if (index > -1) {
                    selectedTiles.splice(index, 1);
                }
            }

            // Add tile to allTiles array
            allTiles.push(tile);
        }

        function createButtons() {
            const buttonWidth = 120;
            const buttonHeight = 70;
            const buttonY = viewHeight * 0.15; // Position the buttons at 15% of the view height

            // Calculate total width for five buttons including margins
            const totalButtonsWidth = buttonWidth * 5 + 80; // 20px margin between buttons

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

                    // Play sounds of all tiles
                    playAllTileSounds();
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

            // Create Group Button
            const groupButtonGroup = createButton({
                x: startX + (buttonWidth + 20) * 2,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                color: groupButtonColor,
                borderColor: groupButtonBorderColor,
                textContent: 'Group',
                onClick: function() {
                    groupSelectedTiles();
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

                    // Check if the selected groups are correct
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
                    // Reset the game state and initialize a new game
                    resetGame();
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
                content: 'Group the right song!'
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

        // Function to play sounds of all tiles
        function playAllTileSounds() {
            // Stop all previous sounds
            stopAllPreviewSounds();
            stopAllPlaybackSounds();

            // Play sounds of all tiles
            allTiles.forEach(tile => {
                if (tile.sound) {
                    const soundId = tile.sound.play();
                    playbackSoundsPlaying.push({ sound: tile.sound, id: soundId });
                }
            });
        }

        // Function to group selected tiles
        function groupSelectedTiles() {
            if (selectedTiles.length > 0) {
                // Generate a new random color for the group
                const newColor = new paper.Color(Math.random(), Math.random(), Math.random());

                // Create a new group
                const group = {
                    color: newColor,
                    tiles: selectedTiles.slice() // Copy of selectedTiles array
                };

                // Assign group to tiles and change their color
                group.tiles.forEach(tile => {
                    tile.group = group;
                    tile.isSelected = false; // Deselect tile
                    tile.fillColor = newColor; // Change color to group color
                });

                // Add group to groups array
                groups.push(group);

                // Clear selectedTiles array
                selectedTiles.length = 0;

                // Play the sounds of the newly grouped tiles
                playGroupSounds(group.tiles);
            }
        }

        // Function to play sounds of a specific group of tiles
        function playGroupSounds(tiles) {
            // Stop all previous sounds
            stopAllPreviewSounds();
            stopAllPlaybackSounds();

            // Play sounds of provided tiles
            tiles.forEach(tile => {
                if (tile.sound) {
                    const soundId = tile.sound.play();
                    playbackSoundsPlaying.push({ sound: tile.sound, id: soundId });
                }
            });
        }

        // Function to remove a tile from its group
        function removeTileFromGroup(tile) {
            const group = tile.group;
            if (group) {
                // Remove tile from group
                const index = group.tiles.indexOf(tile);
                if (index > -1) {
                    group.tiles.splice(index, 1);
                }

                // If group is empty, remove it from groups array
                if (group.tiles.length === 0) {
                    const groupIndex = groups.indexOf(group);
                    if (groupIndex > -1) {
                        groups.splice(groupIndex, 1);
                    }
                }

                // Clear tile's group property
                tile.group = null;

                // Reset tile color
                tile.fillColor = originalColor.clone();
            }
        }

        // Function to reset the game state
        function resetGame() {
            // Stop all sounds
            stopAllPreviewSounds();
            stopAllPlaybackSounds();

            // Reset the full song
            if (fullSong) {
                fullSong.stop();
            }

            // Re-initialize the game
            initializeGame();
        }

        // Function to check user's selection against the correct grouping
        function checkUserSelection() {
            // Get target tiles
            const targetTiles = allTiles.filter(tile => tile.isTarget);

            // Reset previous correct highlights
            allTiles.forEach(tile => {
                if (tile.isCorrect) {
                    tile.isCorrect = false;
                    if (tile.group) {
                        tile.fillColor = tile.group.color;
                    } else {
                        tile.fillColor = originalColor.clone();
                    }
                }
            });

            // Check if there's a group that contains exactly all target tiles
            let foundCorrectGroup = false;

            for (let group of groups) {
                const groupTiles = group.tiles;

                const groupTileIndices = groupTiles.map(tile => tile.index).sort((a, b) => a - b);
                const targetTileIndices = targetTiles.map(tile => tile.index).sort((a, b) => a - b);

                if (arraysEqual(groupTileIndices, targetTileIndices)) {
                    foundCorrectGroup = true;
                    break;
                } else {
                    // Highlight correct tiles in the group
                    groupTiles.forEach(tile => {
                        if (tile.isTarget) {
                            tile.isCorrect = true;
                            tile.fillColor = correctTileHighlightColor.clone(); // Super light green
                        }
                    });
                }
            }

            if (foundCorrectGroup) {
                // Highlight the correct tiles in darker green
                targetTiles.forEach(tile => {
                    tile.fillColor = revealColor.clone(); // Slightly darker green
                });

                // Play the full song
                playFullSong();

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

                    // Play the full song
                    playFullSong();

                    // Display a lose indicator
                    showLoseIndicator();

                    gameWon = true; // End the game
                }
            }
        }

        // Function to reveal the correct tiles
        function revealCorrectTiles() {
            const targetTiles = allTiles.filter(tile => tile.isTarget);
            targetTiles.forEach(tile => {
                tile.fillColor = revealColor.clone(); // Slightly darker green
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
                content: 'Congratulations! You Win!\nClick to play again.',
            });

            // Attach the text to the overlay
            overlay.winText = winText;

            // Bring overlay and text to front
            overlay.bringToFront();
            winText.bringToFront();

            // Setup click to restart
            setupRestartOnClick(overlay);
        }

        // Function to display a lose indicator
        function showLoseIndicator() {
            // Create a semi-transparent overlay
            const overlay = new paper.Path.Rectangle({
                point: [0, 0],
                size: [viewWidth, viewHeight],
                fillColor: new paper.Color(0, 0, 0, 0.5), // Black with 50% opacity
            });

            // Add text in the center
            const loseText = new paper.PointText({
                point: [viewWidth / 2, viewHeight / 2],
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
        }

        // Function to setup click to restart the game
        function setupRestartOnClick(overlay) {
            overlay.onMouseDown = function() {
                // Remove overlay and text
                overlay.remove();
                if (overlay.winText) overlay.winText.remove();
                if (overlay.loseText) overlay.loseText.remove();

                // Reset the game
                resetGame();
            };
        }

        // Function to play the full song
        function playFullSong() {
            // Stop all other sounds
            stopAllPreviewSounds();
            stopAllPlaybackSounds();

            // Play the full song
            fullSong.play();
        }

        // Helper function to compare two arrays
        function arraysEqual(a1, a2) {
            return JSON.stringify(a1) === JSON.stringify(a2);
        }

        // Function to create tiles
        function createTiles() {
            let tileIndex = 0;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    const x = tileMargin + col * (tileWidth + tileMargin);
                    const y = viewHeight * 0.3 + tileMargin + row * (tileHeight + tileMargin); // Start at 30% of view height
                    createTile(x, y, tileIndex);
                    tileIndex++;
                }
            }
        }

        // Create the prompt and attempts indicator
        createPrompt();

        // Create the buttons
        createButtons();

        // Create the tiles
        createTiles();
    }

    // Initialize the game for the first time
    initializeGame();
};
