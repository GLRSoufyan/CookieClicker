let cookies = 0;
let autoClickers = 0;
let playerId = null; // Wordt gevuld vanuit de DB

const cookieDisplay = document.getElementById('cookie-count');
const cpsDisplay = document.getElementById('cps-count');
const cookieBtn = document.getElementById('cookie');
const upgradeBtn = document.getElementById('buy-auto');

// 1. Initialiseer: Haal data op uit de database
async function loadGame() {
    const response = await fetch('/api/recipes'); // We misbruiken de 'recipes' route voor onze save-game
    const data = await response.json();

    if (data.length > 0) {
        // Bestaande speler gevonden
        const save = data[0];
        playerId = save._id;
        cookies = save.prepTimeInMinutes; // We gebruiken dit veld even als 'cookies'
        autoClickers = save.ingredients.length; // En ingredients als aantal upgrades
    } else {
        // Nieuwe speler aanmaken
        const res = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Player1', ingredients: [], prepTimeInMinutes: 0 })
        });
        const newSave = await res.json();
        playerId = newSave._id;
    }
    updateUI();
}

// 2. Klik logica
cookieBtn.addEventListener('click', () => {
    cookies++;
    updateUI();
});

// 3. Upgrade kopen
upgradeBtn.addEventListener('click', () => {
    const cost = 10 + (autoClickers * 5);
    if (cookies >= cost) {
        cookies -= cost;
        autoClickers++;
        updateUI();
    }
});

// 4. UI Bijwerken
function updateUI() {
    cookieDisplay.innerText = Math.floor(cookies);
    cpsDisplay.innerText = autoClickers;
    const cost = 10 + (autoClickers * 5);
    upgradeBtn.innerText = `Koop Auto-Clicker (Prijs: ${cost})`;
    upgradeBtn.disabled = cookies < cost;
}

// 5. Game Loop (Auto-clickers)
setInterval(() => {
    if (autoClickers > 0) {
        cookies += (autoClickers / 10); // 0.1 cookie per seconde per clicker
        updateUI();
    }
}, 100);

// 6. Automatisch opslaan naar MongoDB elke 5 seconden
setInterval(async () => {
    if (playerId) {
        await fetch(`/api/recipes/${playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Player1',
                prepTimeInMinutes: Math.floor(cookies),
                ingredients: new Array(autoClickers).fill('clicker') 
            })
        });
        console.log('Game Saved');
    }
}, 5000);

loadGame();