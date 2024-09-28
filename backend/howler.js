var sound = new Audio("sound.mp3");  

function ding() {
    sound.play();
}

document.getElementsByTagName("button")[0].addEventListener("click", ding);

function stop() {
    sound.pause();
}

document.getElementsByTagName("button")[1].addEventListener("click", stop);