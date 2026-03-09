// Firebase Configuration
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
const db = firebase.database().ref('royal_oasis_v2/live');

const cv = document.getElementById('mainCanvas'), ctx = cv.getContext('2d');
const tooltip = document.getElementById('legacy-tooltip');

// --- নতুন সেটিংস ---
const blockSize = 60; // আপনার চাহিদা অনুযায়ী ডাবল সাইজ
const cols = 6;       // প্রতি সারিতে ৬টি প্লট (৬x৬ = ৩৬টি প্লট এক একটি সেকশনে)
let pixels = {};
const imgCache = {};
let highlightedID = null;

// গ্রিড সাইজ ডাইনামিক করা (৩৬ এর গুণিতক হিসেবে বাড়বে)
function updateCanvasSize() {
    const totalOccupied = Object.keys(pixels).length;
    // কমপক্ষে ৩৬টি প্লট থাকবে, ফিলাপ হয়ে গেলে আরও ৩৬টি বাড়বে
    const totalPlotsNeeded = Math.ceil((totalOccupied + 1) / 36) * 36;
    const currentRows = totalPlotsNeeded / cols;
    
    cv.width = cols * blockSize;
    cv.height = currentRows * blockSize;
    document.getElementById('total-plots').innerText = totalPlotsNeeded;
}

// ম্যাপ রেন্ডার করার ফাংশন
function render() {
    updateCanvasSize();
    ctx.clearRect(0, 0, cv.width, cv.height);
    
    // সাদা ব্যাকগ্রাউন্ড
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cv.width, cv.height);

    // গ্রিড ড্রয়িং
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath(); ctx.moveTo(i * blockSize, 0); ctx.lineTo(i * blockSize, cv.height); ctx.stroke();
    }
    for (let j = 0; j <= (cv.height / blockSize); j++) {
        ctx.beginPath(); ctx.moveTo(0, j * blockSize); ctx.lineTo(cv.width, j * blockSize); ctx.stroke();
    }

    // পিক্সেল রেন্ডারিং লজিক
    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const x = (id % cols) * blockSize;
        const y = Math.floor(id / cols) * blockSize;

        // যদি সার্চ করা থাকে এবং এটি সেই প্লট না হয়, তবে ব্লার আমেজ দেওয়া (opacity কমানো)
        if (highlightedID && p.plotID != highlightedID) {
            ctx.globalAlpha = 0.1; 
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (p.imageUrl) {
            if (imgCache[p.imageUrl]) {
                ctx.drawImage(imgCache[p.imageUrl], x, y, blockSize, blockSize);
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous"; // ডাউনলোড করার সুবিধার জন্য
                img.src = p.imageUrl;
                img.onload = () => {
                    imgCache[p.imageUrl] = img;
                    render();
                };
            }
        }
    });
    ctx.globalAlpha = 1.0; // রিসেট
}

// ডাটাবেস লিসেনার
db.on('value', s => {
    pixels = s.val() || {};
    document.getElementById('sold-count').innerText = Object.keys(pixels).length;
    render();
});

// --- স্পেশাল ফিচার: সার্চ ও হাইলাইট ---
window.highlightPlot = function(id) {
    highlightedID = id;
    render();
    
    // সার্চ করা প্লটটি স্ক্রিনের মাঝখানে নিয়ে আসা
    const plotIndex = parseInt(id) - 1;
    const targetY = Math.floor(plotIndex / cols) * blockSize;
    document.getElementById('mover').style.transform = `translateY(${-targetY + 100}px)`;
    
    // ১০ সেকেন্ড পর হাইলাইট অটো চলে যাবে (অপশনাল)
    setTimeout(() => {
        // highlightedID = null; // চাইলে এটি অফ রাখতে পারেন কাস্টমার নিজে রিসেট না করা পর্যন্ত
        // render();
    }, 10000);
};

// টুলটিপ ও মাউস ইভেন্ট
cv.addEventListener('mousemove', (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / cv.width);
    const y = (e.clientY - rect.top) / (rect.height / cv.height);
    let found = false;

    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize;
        const py = Math.floor(id / cols) * blockSize;
        
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
            tooltip.innerHTML = `<strong>${p.name}</strong><br>Legacy Plot #${p.plotID}`;
            cv.style.cursor = 'pointer';
            found = true;
        }
    });
    if (!found) { tooltip.style.display = 'none'; cv.style.cursor = 'default'; }
});

// ক্লিক ইভেন্ট
cv.addEventListener('click', (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / cv.width);
    const y = (e.clientY - rect.top) / (rect.height / cv.height);

    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize;
        const py = Math.floor(id / cols) * blockSize;
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            if (p.link && p.link !== "#") window.open(p.link, '_blank');
        }
    });
});

// টেক্সট কপি ফাংশন
function copyVal(txt) {
    navigator.clipboard.writeText(txt).then(() => alert("Copied: " + txt));
}
