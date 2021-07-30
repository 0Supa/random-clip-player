const loading = document.getElementById("loading")
const params = new URLSearchParams(window.location.search);
const channel = params.get('channel')

if (params.get('details') === '1') document.getElementById("details").style.display = "block";

let clips = [];
let shuffledClips = [];

const clip = document.getElementById('clip');
const by = document.getElementById('by');

clip.addEventListener('ended', random, false);

getClips()
async function getClips() {
    if (!channel) return error('you need to specify the channel name')
    loading.style.display = "flex";
    const res = await fetch(`${window.location.origin}/rcp/api/clips/${channel}`)
    const data = await res.json()
    loading.style.display = "none";
    if (data.error) return error(data.error)
    clips = data
    clip.volume = 1
    random()
}

function error(text) {
    const error = document.getElementById("error")
    error.textContent = `Error: ${text}`
}

function play(source) {
    clip.setAttribute('src', source);
}

function random() {
    by.innerHTML = ''
    if (!shuffledClips.length) shuffledClips = Array.from(clips).sort(() => 0.5 - Math.random())
    const clipData = shuffledClips.pop()

    if (!clipData.kata) {
        by.innerHTML = `Clipped by <span style="color: #9146ff">${clipData.by.length > 15 ? `${clipData.by.substring(0, 15)}..` : clipData.by || '(unknown)'}</span>`
        play(`https://clips-media-assets2.twitch.tv/${clipData.id}.mp4`);
    } else {
        by.innerHTML = `<span style="color: #008c33">kata's old clips archive</span>`
        play(`${window.location.origin}/rcp/chimiclips/${clipData.id}`);
    }
}
