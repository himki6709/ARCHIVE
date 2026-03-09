const firebaseConfig = {
    apiKey: "AIzaSyCAdnfu2R82xbC7H85n_9mvQBE58X3TjbA",
    authDomain: "the-5k-elite-legacy.firebaseapp.com",
    databaseURL: "https://the-5k-elite-legacy-default-rtdb.firebaseio.com",
    projectId: "the-5k-elite-legacy",
    storageBucket: "the-5k-elite-legacy.firebasestorage.app",
    messagingSenderId: "440824313752",
    appId: "1:440824313752:web:2c93344dcfe2ba0a4c5ded"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref('royal_oasis_v2/live');

const cv = document.getElementById('mainCanvas'), ctx = cv.getContext('2d');
const tooltip = document.getElementById('legacy-tooltip');

const blockSize = 60; 
const cols = 6; // ৬ কলামে লম্বালম্বি হবে
let pixels = {};
let highlightedID = null;

function render() {
    const totalOccupied = Object.keys(pixels).length;
    const totalPlots = Math.ceil((totalOccupied + 1) / 36) * 36;
    const rows = totalPlots / cols;

    cv.width = cols * blockSize;
    cv.height = rows * blockSize;
    document.getElementById('total-plots').innerText = totalPlots;

    // ক্লিয়ার এবং গ্রিড ড্রয়িং
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cv.width, cv.height);

    // ঘরগুলো দৃশ্যমান করা
    ctx.strokeStyle = "#CCCCCC"; 
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath(); ctx.moveTo(i * blockSize, 0); ctx.lineTo(i * blockSize, cv.height); ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * blockSize); ctx.lineTo(cv.width, j * blockSize); ctx.stroke();
    }

    // ইমেজ রেন্ডারিং
    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const x = (id % cols) * blockSize;
        const y = Math.floor(id / cols) * blockSize;

        if (highlightedID && p.plotID != highlightedID) ctx.globalAlpha = 0.1;
        else ctx.globalAlpha = 1.0;

        if (p.imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = p.imageUrl;
            img.onload = () => ctx.drawImage(img, x, y, blockSize, blockSize);
        }
    });
    ctx.globalAlpha = 1.0;
}

db.on('value', s => {
    pixels = s.val() || {};
    document.getElementById('sold-count').innerText = Object.keys(pixels).length;
    render();
});

window.highlightPlot = function(id) {
    highlightedID = id;
    render();
    alert("Plot #" + id + " Focused. Others Blurred.");
};

cv.addEventListener('mousemove', (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / cv.width) * cv.width;
    const y = (e.clientY - rect.top) / (rect.height / cv.height) * cv.height;
    let found = false;

    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize, py = Math.floor(id / cols) * blockSize;
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            tooltip.style.display = 'block';
            tooltip.style.left = e.pageX + 'px'; tooltip.style.top = e.pageY + 'px';
            tooltip.innerHTML = `<strong>${p.name}</strong><br>Plot #${p.plotID}`;
            found = true;
        }
    });
    if (!found) tooltip.style.display = 'none';
});
