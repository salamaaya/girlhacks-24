window.onload = function() {
    // Setup Paper.js
    paper.setup('myCanvas');

    // Define the tile colors and layout
    const originalColor = new paper.Color(0.8, 0.8, 0.8, 1); // Light grey, fully opaque
    const clickAnimationColor = new paper.Color(0.5, 0.5, 0.5, 1); // Darker grey for animation
    const playButtonColor = new paper.Color(0.2, 0.7, 0.5, 1); // Green color for play button
    const playButtonBorderColor = new paper.Color(0.1, 0.6, 0.4, 1); // Darker green for button border
    const rows = 3;
    const columns = 11;
    const tileMargin = 10; // Margin between tiles
    const fadeDuration = 5; // Duration to fade to resting color in seconds
    let clickOrder = 1; // Counter for click order
    const clickedTiles = []; // Stack to track the order of clicked tiles
    const doubleClickThreshold = 300; // Threshold in milliseconds to detect double click

    // List of sound files (update this array with your actual sound file names)
    const soundFiles = [
        'RPReplay_Final1727577039.mp3',
        'RPReplay_Final1727577295.mp3',
        'RPReplay_Final1727577533.mp3',
        'RPReplay_Final1727577670.mp3',
        'RPReplay_Final1727576820.mp3',
        'RPReplay_Final1727576935.mp3',
        // ... add more sound files as needed
    ];

    // Load sounds into Howler.js
    const sounds = soundFiles.map(file => new Howl({ src: ['sounds/' + file] }));

    // Total number of tiles
    const totalTiles = rows * columns;

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

        // Assign a sound to the tile if available
        if (index < sounds.length) {
            tile.sound = sounds[index];
        } else {
            tile.sound = null; // No sound assigned
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
            const currentTime = new Date().getTime();
            const timeSinceLastClick = currentTime - lastClickTime;
            lastClickTime = currentTime;

            // Clear any existing timeout for double-click detection
            clearTimeout(clickTimeout);

            // Handle reset if tile is already double-clicked and selected
            if (tile.isSelected) {
                resetTile(tile);
                return;
            }

            // Handle single click or double click logic
            if (timeSinceLastClick > doubleClickThreshold) {
                // Single click behavior (without selection)
                clickTimeout = setTimeout(() => {
                    if (tile.sound) {
                        tile.sound.play();
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
                if (tile.sound) {
                    tile.sound.play();
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

    function createPlayButton() {
        const buttonWidth = 200;
        const buttonHeight = 70;
        const buttonY = viewHeight * 0.15; // Position the button at 15% of the view height

        // Center the button horizontally
        const buttonX = (viewWidth - buttonWidth) / 2;

        // Create the play button border (larger rectangle for border effect)
        const playButtonBorder = new paper.Path.Rectangle({
            point: [buttonX - 5, buttonY - 5],
            size: [buttonWidth + 10, buttonHeight + 10],
            fillColor: playButtonBorderColor,
            radius: 15 // Rounded corners for border
        });

        // Create the play button rectangle (inner button)
        const playButtonRect = new paper.Path.Rectangle({
            point: [buttonX, buttonY],
            size: [buttonWidth, buttonHeight],
            fillColor: playButtonColor,
            radius: 15 // Rounded corners
        });

        // Add shadow to the play button
        playButtonRect.shadowColor = new paper.Color(0, 0, 0, 0.5); // Black shadow with 50% opacity
        playButtonRect.shadowBlur = 10;
        playButtonRect.shadowOffset = new paper.Point(5, 5);

        // Add text to the play button
        const playText = new paper.PointText({
            point: [buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 10],
            justification: 'center',
            fontSize: 24,
            fillColor: 'white',
            content: 'Play'
        });

        // Group the button elements
        const playButtonGroup = new paper.Group([playButtonBorder, playButtonRect, playText]);

        // Function to adjust brightness
        function adjustBrightness(color, factor) {
            return new paper.Color(
                Math.min(color.red + factor, 1),
                Math.min(color.green + factor, 1),
                Math.min(color.blue + factor, 1)
            );
        }

        // On mouse enter, manually adjust the color for hover effect
        playButtonGroup.onMouseEnter = function() {
            playButtonRect.fillColor = adjustBrightness(playButtonColor, 0.2); // Lighten the color
        };

        // On mouse leave, return to original color
        playButtonGroup.onMouseLeave = function() {
            playButtonRect.fillColor = playButtonColor;
        };

        // On click, animate with both scaling and color change
        playButtonGroup.onMouseDown = function() {
            // Scale up the button and text for a pressing effect
            playButtonGroup.scale(1.1);

            // Briefly darken the button
            playButtonRect.fillColor = adjustBrightness(playButtonColor, -0.2); // Darken the color

            // Return to original size and color after animation
            setTimeout(() => {
                playButtonGroup.scale(1 / 1.1);
                playButtonRect.fillColor = playButtonColor;
            }, 100); // Return after 100ms

            // Play sounds of selected tiles
            playSelectedTileSounds();
        };

        // Bring the play button group to the front
        playButtonGroup.bringToFront();
    }

    // Function to add a prompt above the play button
    function createPrompt() {
        const promptText = new paper.PointText({
            point: [viewWidth / 2, viewHeight * 0.1],
            justification: 'center',
            fontSize: 28,
            fillColor: 'black',
            content: 'Mix the right song!'
        });
    }

    // Function to play sounds of selected tiles
    function playSelectedTileSounds() {
        // For all selected tiles, play their sounds simultaneously
        clickedTiles.forEach(tileData => {
            if (tileData.tile.sound) {
                tileData.tile.sound.play();
            }
        });
    }

    // Create the prompt above the play button
    createPrompt();

    // Create the play button above the grid
    createPlayButton();

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
