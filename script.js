// সম্পূর্ণ Firebase Config যুক্ত করা হয়েছে সিকিউরিটি সমস্যার সমাধানের জন্য
const firebaseConfig = {
    apiKey: "AIzaSyCAdnfu2R82xbC7H85n_9mvQBE58X3TjbA",
    authDomain: "the-5k-elite-legacy.firebaseapp.com",
    databaseURL: "https://the-5k-elite-legacy-default-rtdb.firebaseio.com",
    projectId: "the-5k-elite-legacy",
    storageBucket: "the-5k-elite-legacy.firebasestorage.app",
    messagingSenderId: "440824313752",
    appId: "1:440824313752:web:2c93344dcfe2ba0a4c5ded"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const cv = document.getElementById('mainCanvas'), ctx = cv.getContext('2d');
const tooltip = document.getElementById('legacy-tooltip');
const blockSize = 30; const cols = 100; const rows = 200; 
cv.width = cols * blockSize; cv.height = rows * blockSize;

let pixels = {};
const imgCache = {};

// ম্যাপ রেন্ডার করার ফাংশন
function render() {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#e0e0e0"; ctx.lineWidth = 0.5;
    
    // গ্রিড ড্রয়িং
    for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i * blockSize, 0); ctx.lineTo(i * blockSize, cv.height); ctx.stroke(); }
    for (let j = 0; j <= rows; j++) { ctx.beginPath(); ctx.moveTo(0, j * blockSize); ctx.lineTo(cv.width, j * blockSize); ctx.stroke(); }
    
    // পিক্সেল ইমেজ ড্রয়িং
    Object.values(pixels).forEach(p => {
        if (p.imageUrl) {
            const id = parseInt(p.plotID) - 1;
            const targetX = (id % cols) * blockSize;
            const targetY = Math.floor(id / cols) * blockSize;
            
            if (imgCache[p.imageUrl]) {
                ctx.drawImage(imgCache[p.imageUrl], targetX, targetY, blockSize, blockSize);
            } else {
                const img = new Image();
                img.src = p.imageUrl;
                img.onload = () => {
                    imgCache[p.imageUrl] = img;
                    ctx.drawImage(img, targetX, targetY, blockSize, blockSize);
                };
            }
        }
    });
}

// ডাটাবেস থেকে তথ্য আনা
db.ref('pixels').on('value', s => {
    pixels = s.val() || {};
    render();
    document.getElementById('sold-count').innerText = Object.keys(pixels).length;
    document.getElementById('rem-count').innerText = 20000 - Object.keys(pixels).length;
});

// টুলটিপ লজিক (মাউস মুভমেন্ট)
cv.addEventListener('mousemove', (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / cv.width);
    const y = (e.clientY - rect.top) / (rect.height / cv.height);
    let found = false;
    
    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize; const py = Math.floor(id / cols) * blockSize;
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.pageX + 15) + 'px'; tooltip.style.top = (e.pageY + 15) + 'px';
            tooltip.innerHTML = `<strong>${p.name}</strong><br>Plot #${p.plotID}`;
            cv.style.cursor = 'pointer'; found = true;
        }
    });
    if (!found) { tooltip.style.display = 'none'; cv.style.cursor = 'default'; }
});

// ক্লিক করলে ওয়েবসাইট ওপেন হওয়া
cv.addEventListener('click', (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / cv.width);
    const y = (e.clientY - rect.top) / (rect.height / cv.height);
    
    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize; const py = Math.floor(id / cols) * blockSize;
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            if (p.link && p.link !== "#") window.open(p.link, '_blank');
        }
    });
});
