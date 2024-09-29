const fs = require('fs');
const path = require('path');

// The directory containing the songs
const soundsDir = path.join(__dirname, 'sounds');

// Function to generate the songs data structure
function generateSongsData() {
    const songs = [];

    // Read the contents of the sounds directory
    const songDirs = fs.readdirSync(soundsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // For each song directory
    songDirs.forEach(songDir => {
        const songPath = path.join(soundsDir, songDir);

        // Read the parts (MP3 files) in the song directory
        const parts = fs.readdirSync(songPath)
            .filter(file => file.endsWith('.mp3'))
            .map(file => `${songDir}/${file}`); // Relative path

        // Only include songs with at least one part
        if (parts.length > 0) {
            songs.push({
                name: songDir,
                parts: parts,
            });
        }
    });

    return songs;
}

// Generate the songs data
const songsData = generateSongsData();

// Write the songs data to a JavaScript file
const outputFilePath = path.join(__dirname, 'songs.js');
const fileContent = `const songs = ${JSON.stringify(songsData, null, 4)};\n`;

fs.writeFileSync(outputFilePath, fileContent);

console.log(`Generated songs data in ${outputFilePath}`);
