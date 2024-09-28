window.onload = function() {
    // Setup Paper.js
    paper.setup('myCanvas');

    // Create a basic circle to test
    let circle = new paper.Path.Circle({
        center: [100, 100],
        radius: 50,
        fillColor: 'red'
    });

    // Animate the circle
    paper.view.onFrame = function(event) {
        // Circle grows and shrinks over time
        circle.scale(1 + Math.sin(event.time) * 0.005);
    };

    // Render the view
    paper.view.draw();

    // Create a button
    let button = new paper.Path.Rectangle({
        point: [200, 100],
        size: [100, 50],
        fillColor: 'blue'
    });

    // Add a click event to play sound
    button.onClick = function(event) {
        let sound = document.getElementById('sound1');
        sound.play();
    };

    // Add an animation on click
    button.onMouseDown = function(event) {
        button.fillColor = 'green';
    };

    button.onMouseUp = function(event) {
        button.fillColor = 'blue';
    };
};
