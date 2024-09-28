window.onload = function() { 
    paper.setup('myCanvas');

    // Define the tile colors and layout
    const tileColor = new paper.Color(0.8, 0.8, 0.8, 0); // Initially transparent (RGBA)
    const tileClickColor = new paper.Color(0.5, 0.5, 0.5, 1); // Darker grey for click effect
    const rows = 3;
    const columns = 11;
    const tileMargin = 10; // Margin between tiles

    // Initialize Howler sound with your one sound file
    const sound = new Howl({
        src: ['sounds/PinkPanther30.wav']
    });

    // Get the size of the canvas view
    const viewWidth = paper.view.size.width;
    const viewHeight = paper.view.size.height;

    // Calculate tile size based on canvas dimensions and margins
    const tileWidth = (viewWidth - (columns + 1) * tileMargin) / columns;
    const tileHeight = (viewHeight - (rows + 1) * tileMargin) / rows;

    // Function to create a single tile
    function createTile(x, y) {
        // Create a rectangle path with initial fill color as fully transparent
        const tile = new paper.Path.Rectangle({
            point: [x, y],
            size: [tileWidth, tileHeight],
            fillColor: tileColor.clone(), // Use a clone to avoid reference issues
            radius: 5 // Rounded corners
        });

        // On press, animate the tile color and play sound
        tile.onMouseDown = function() {
            sound.play(); // Play sound on press
            animatePressEffect(tile);
        };
    }

    // Function to animate the press effect
    function animatePressEffect(tile) {
        // Set the tile color to the click color (fully opaque)
        tile.fillColor = tileClickColor.clone();

        // Create an animation to gradually fade back to transparency
        const fadeDuration = 0.5; // duration in seconds
        const startTime = paper.view.getFrameTime();

        tile.onFrame = function(event) {
            const elapsed = event.time - startTime;
            const progress = elapsed / fadeDuration;

            if (progress < 1) {
                // Interpolate from the click color to transparent
                tile.fillColor.alpha = 1 - progress;
            } else {
                // Ensure tile is fully transparent and stop the animation
                tile.fillColor.alpha = 0;
                tile.onFrame = null; // Stop the onFrame animation
            }
        };
    }

    // Create the grid of tiles
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = tileMargin + col * (tileWidth + tileMargin);
            const y = tileMargin + row * (tileHeight + tileMargin);
            createTile(x, y);
        }
    }

};
