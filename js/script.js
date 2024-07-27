console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;
let currentPlayingSong = null;
let isDragging = false;
const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let response = await fetch(`/${folder}/`).then(res => res.text());
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    console.log("Songs array:", songs);

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        console.log("Current song:", song);
        if (song) {
            songUL.innerHTML += `<li data-song="${song}">
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert playIcon" src="img/play.svg" alt="">
                </div>
            </li>`;
        } else {
            console.error("Encountered undefined song:", song);
        }
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            togglePlayPause(e.dataset.song);
        });
    });

    return songs;
}

const playMusic = (track) => {
    if (currentPlayingSong !== track) {
        currentSong.src = `/${currFolder}/` + track;
        currentSong.currentTime = 0;  // Reset to start if new song
    }
    currentSong.play();
    playButton.src = "img/pause.svg";
    currentPlayingSong = track;

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

    // Update play icons
    Array.from(document.querySelectorAll(".playIcon")).forEach(icon => {
        if (icon.closest("li").dataset.song === track) {
            icon.src = "img/pause.svg";
        } else {
            icon.src = "img/play.svg";
        }
    });
}

const pauseMusic = () => {
    currentSong.pause();
    playButton.src = "img/play.svg";

    // Update play icons
    Array.from(document.querySelectorAll(".playIcon")).forEach(icon => {
        if (icon.closest("li").dataset.song === currentPlayingSong) {
            icon.src = "img/play.svg";
        }
    });
}

const togglePlayPause = (track) => {
    if (currentPlayingSong === track) {
        if (currentSong.paused) {
            playMusic(track);
        } else {
            pauseMusic();
        }
    } else {
        playMusic(track);
    }
}

async function displayAlbums() {
    console.log("displaying albums");
    let response = await fetch(`/songs/`).then(res => res.text());
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];
            // Get the metadata of the folder
            let metadata = await fetch(`/songs/${folder}/info.json`).then(res => res.json());
            cardContainer.innerHTML += ` <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="">
                <h2>${metadata.title}</h2>
                <p>${metadata.description}</p>
            </div>`;
        }
    }

    // Load the playlist whenever a card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            console.log("Fetching Songs");
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    // Get the list of all the songs
    await getSongs("songs/ncs");

    // Set play button to initial state
    if (currentSong.src) {
        playMusic(songs[0]);
    } else {
        playButton.src = "img/play.svg";
    }

    // Display all the albums on the page
    await displayAlbums();

    // Attach an event listener to play, next and previous
    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playButton.src = "img/pause.svg";
            // Update play icon for the current playing song
            Array.from(document.querySelectorAll(".playIcon")).forEach(icon => {
                if (icon.closest("li").dataset.song === currentPlayingSong) {
                    icon.src = "img/pause.svg";
                }
            });
        } else {
            currentSong.pause();
            playButton.src = "img/play.svg";
            // Update play icon for the current playing song
            Array.from(document.querySelectorAll(".playIcon")).forEach(icon => {
                if (icon.closest("li").dataset.song === currentPlayingSong) {
                    icon.src = "img/play.svg";
                }
            });
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        if (!isDragging) {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Add event listeners for dragging the seekbar
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

    const onDrag = (e) => {
        const rect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(offsetX / rect.width, 1)) * 100;
        circle.style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    };

    seekbar.addEventListener("mousedown", (e) => {
        isDragging = true;
        onDrag(e);
        document.addEventListener("mousemove", onDrag);
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            document.removeEventListener("mousemove", onDrag);
        }
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous
    previousButton.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Add an event listener to next
    nextButton.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });
}

main();
