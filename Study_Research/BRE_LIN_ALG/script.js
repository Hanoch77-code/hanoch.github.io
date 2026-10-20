const overlay = document.getElementById("imageOverlay");
const popped = document.getElementById("poppedImage");
const closeBtn = document.getElementById("closeBtn");

let scale = 1, tx = 0, ty = 0;
const MIN = 1, MAX = 8;
const pointers = new Map();
let lastDist = 0, moved = false;

function apply() {
    popped.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function reset() {
    scale = 1; tx = 0; ty = 0;
    apply();
}

// Zoom by factor k, keeping the point (px, py) fixed on screen
function zoomAt(k, px, py) {
    const newScale = Math.min(MAX, Math.max(MIN, scale * k));
    k = newScale / scale;
    const r = popped.getBoundingClientRect();
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height / 2);
    tx += dx * (1 - k);
    ty += dy * (1 - k);
    scale = newScale;
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
}

function openOverlay(src) {
    popped.src = src;
    overlay.classList.add("active");
}

function closeOverlay() {
    overlay.classList.remove("active");
}

document.querySelectorAll(".thumbnail").forEach(img =>
    img.addEventListener("click", () => openOverlay(img.src))
);

// Mouse wheel / trackpad zoom
overlay.addEventListener("wheel", e => {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
}, { passive: false });

// Double-click toggles zoom
popped.addEventListener("dblclick", e => {
    if (scale > 1) reset();
    else zoomAt(2.5, e.clientX, e.clientY);
});

let downTarget = null;

// Drag to pan, two fingers to pinch
overlay.addEventListener("pointerdown", e => {

    moved = false;
    downTarget = e.target; 

    if(!e.target.closest("img")) return;

    overlay.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) lastDist = pinchDistance();
});

overlay.addEventListener("pointermove", e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;

    if (pointers.size === 1 && scale > 1) {
        tx += e.clientX - p.x;
        ty += e.clientY - p.y;
        apply();
    }
    if (Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y) > 2) moved = true;

    p.x = e.clientX;
    p.y = e.clientY;

    if (pointers.size === 2) {
        const dist = pinchDistance();
        const [a, b] = [...pointers.values()];
        if (lastDist) zoomAt(dist / lastDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
        lastDist = dist;
        moved = true;
    }
});

function endPointer(e) {
    pointers.delete(e.pointerId);
    lastDist = 0;
}
overlay.addEventListener("pointerup", endPointer);
overlay.addEventListener("pointercancel", endPointer);

function pinchDistance() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// Closing: button, Esc, or clicking the dark background (not after a drag)


overlay.addEventListener("click", e => {
    if (downTarget === overlay && !moved){ reset(); closeOverlay();}
});
closeBtn.addEventListener("click", closeOverlay);
document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeOverlay();
});