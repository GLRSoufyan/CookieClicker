/* =============================================
   COOKIE CLICKER ∞ — main.js
   Door: [jouw naam]

   Dit is de logica van het spel. Hier gebeurt alles:
   klikken, upgrades kopen, rebirthen, en opslaan/laden
   via de MongoDB database.
============================================= */


// ─────────────────────────────────────────────
// SPEL DATA  — vaste info over tiers en upgrades
// ─────────────────────────────────────────────

// Elke rebirth-tier heeft een naam, emoji, multiplier en kosten.
// bgColor is de achtergrond van het grote koekje (leeg = gebruik CSS-klasse).
const REBIRTH_TIERS = [
  { id: 0, name: 'Normaal Koekje',   emoji: '🍪', mult: 1,  cost: 0,       cssClass: 'cookie-normal', bgColor: '' },
  { id: 1, name: 'Regenboog Koekje', emoji: '🌈', mult: 2,  cost: 1000,    cssClass: 'cookie-lgbtq',  bgColor: 'linear-gradient(135deg,#ff69b4,#ff8c00,#ffff00,#00c800,#0000ff,#8b00ff)' },
  { id: 2, name: 'Dubai Chocolade',  emoji: '🍫', mult: 5,  cost: 50000,   cssClass: 'cookie-dubai',  bgColor: 'linear-gradient(135deg,#5c3317,#c8860a,#8B6914)' },
  { id: 3, name: 'Labubu Koekje',    emoji: '🎀', mult: 12, cost: 500000,  cssClass: 'cookie-labubu', bgColor: 'linear-gradient(135deg,#f8c8d4,#e75480,#c71585)' },
  { id: 4, name: 'King Koekje',      emoji: '👑', mult: 30, cost: 5000000, cssClass: 'cookie-king',   bgColor: 'linear-gradient(135deg,#3d2200,#b8860b,#ffd700,#ffec8b,#ffd700,#b8860b)' },
];

// Alle upgrades die je in de shop kunt kopen.
// baseCps = koekjes per seconde per stuk dat je hebt
// baseCpc = extra koekjes per klik per stuk
// costMult = elke aankoop maakt de volgende duurder (1.15 = +15% per koop)
const UPGRADES = [
  { id: 'cursor',   name: 'Auto-Cursor',      icon: '🖱️', desc: 'Klikt automatisch voor je.',          baseCps: 0.1,  baseCpc: 0,   baseCost: 10,     costMult: 1.15 },
  { id: 'grandma',  name: 'Oma',               icon: '👵', desc: 'Bakt koekjes met liefde.',             baseCps: 0.5,  baseCpc: 0,   baseCost: 80,     costMult: 1.15 },
  { id: 'farm',     name: 'Koekjes Boerderij', icon: '🌾', desc: 'Verbouwt koekjes op schaal.',          baseCps: 2,    baseCpc: 0,   baseCost: 500,    costMult: 1.15 },
  { id: 'factory',  name: 'Fabriek',           icon: '🏭', desc: 'Massaproductie van koekjes.',          baseCps: 8,    baseCpc: 0,   baseCost: 3000,   costMult: 1.15 },
  { id: 'bank',     name: 'Koekjes Bank',      icon: '🏦', desc: 'Koekjes groeien over tijd.',           baseCps: 25,   baseCpc: 0,   baseCost: 15000,  costMult: 1.15 },
  { id: 'temple',   name: 'Koekjes Tempel',    icon: '🛕', desc: 'Heilige koekjes ceremonies.',          baseCps: 80,   baseCpc: 0,   baseCost: 75000,  costMult: 1.15 },
  { id: 'lab',      name: 'Wetenschaps Lab',   icon: '🔬', desc: 'Onderzoek naar mega-koekjes.',         baseCps: 250,  baseCpc: 0,   baseCost: 400000, costMult: 1.15 },
  { id: 'portal',   name: 'Koekjes Portaal',   icon: '🌀', desc: 'Haalt koekjes uit andere dimensies.',  baseCps: 800,  baseCpc: 0,   baseCost: 2e6,    costMult: 1.15 },
  { id: 'clicker1', name: 'Sterke Vingers',    icon: '💪', desc: '+1 koekje per klik.',                  baseCps: 0,    baseCpc: 1,   baseCost: 200,    costMult: 1.2  },
  { id: 'clicker2', name: 'Turbo Klik',        icon: '⚡', desc: '+5 koekjes per klik.',                 baseCps: 0,    baseCpc: 5,   baseCost: 5000,   costMult: 1.2  },
  { id: 'clicker3', name: 'Mega Punch',        icon: '🥊', desc: '+25 koekjes per klik.',                baseCps: 0,    baseCpc: 25,  baseCost: 50000,  costMult: 1.2  },
  { id: 'clicker4', name: 'Ultra Slaan',       icon: '🌩️', desc: '+200 koekjes per klik.',               baseCps: 0,    baseCpc: 200, baseCost: 1e6,    costMult: 1.2  },
];


// ─────────────────────────────────────────────
// SPELSTATUS  — variabelen die veranderen tijdens het spelen
// ─────────────────────────────────────────────

let cookies      = 0;    // huidige koekjes (drijvend getal, bijv. 1337.5)
let totalEarned  = 0;    // alle koekjes ooit verdiend (voor statistieken)
let rebirthCount = 0;    // hoe vaak je gerebirthd hebt
let rebirthTier  = 0;    // welke tier je nu zit (index in REBIRTH_TIERS)
let buyQty       = 1;    // hoeveel je tegelijk koopt: 1, 10, 100, of 'max'
let playerId     = null; // MongoDB _id van jouw save-document

// Hoeveel je van elke upgrade hebt — start allemaal op 0
const owned = {};
UPGRADES.forEach(u => owned[u.id] = 0);


// ─────────────────────────────────────────────
// DOM-ELEMENTEN  — verwijzingen naar HTML-elementen
// We slaan ze op zodat we niet telkens getElementById hoeven te roepen
// ─────────────────────────────────────────────

const el = {
  cookieBtn:    document.getElementById('cookie'),
  cookieCount:  document.getElementById('cookie-count'),
  cpsCount:     document.getElementById('cps-count'),
  cpcCount:     document.getElementById('cpc-count'),
  totalCount:   document.getElementById('total-count'),
  rebirthCount: document.getElementById('rebirth-count'),
  rebirthName:  document.getElementById('rebirth-tier-name'),
  rebirthMult:  document.getElementById('rebirth-multiplier'),
  rebirthBtn:   document.getElementById('rebirth-btn'),
  rebirthSub:   document.getElementById('rebirth-btn-sub'),
  shop:         document.getElementById('shop-container'),
  saveBtn:      document.getElementById('save-btn'),
  saveStatus:   document.getElementById('save-status'),
  modal:        document.getElementById('rebirth-modal'),
  modalTitle:   document.getElementById('modal-title'),
  modalPreview: document.getElementById('modal-cookie-preview'),
  modalDesc:    document.getElementById('modal-desc'),
  modalReward:  document.getElementById('modal-reward'),
  modalConfirm: document.getElementById('modal-confirm'),
  modalCancel:  document.getElementById('modal-cancel'),
  particles:    document.getElementById('particles-container'),
};


// ─────────────────────────────────────────────
// BEREKENINGEN  — rekenen maar niets op het scherm zetten
// ─────────────────────────────────────────────

// Geeft de huidige multiplier terug (op basis van rebirth-tier)
function getMultiplier() {
  return REBIRTH_TIERS[rebirthTier].mult;
}

// Prijs van de n-de aankoop van een upgrade
// Elke aankoop is duurder (exponentiële groei, zoals in echte idle games)
function getUpgradePrijs(upg, aantalGekocht) {
  return Math.ceil(upg.baseCost * Math.pow(upg.costMult, aantalGekocht));
}

// Totale koekjes per seconde van alle upgrades samen × multiplier
function getCps() {
  let totaal = 0;
  UPGRADES.forEach(u => { totaal += u.baseCps * owned[u.id]; });
  return totaal * getMultiplier();
}

// Koekjes per klik (begint op 1, upgrades tellen erbij) × multiplier
function getCpc() {
  let totaal = 1;
  UPGRADES.forEach(u => { totaal += u.baseCpc * owned[u.id]; });
  return totaal * getMultiplier();
}

// Volgende tier, of null als je al op de hoogste zit
function getVolgendeTier() {
  return rebirthTier < REBIRTH_TIERS.length - 1
    ? REBIRTH_TIERS[rebirthTier + 1]
    : null;
}

// Hoeveel stuks je kunt kopen op basis van de geselecteerde buyQty
function calcKoopAantal(upg) {
  if (buyQty === 'max') {
    let n = 0, resterend = cookies;
    while (n < 10000) {
      const prijs = getUpgradePrijs(upg, owned[upg.id] + n);
      if (resterend >= prijs) { resterend -= prijs; n++; }
      else break;
    }
    return Math.max(n, 1);
  }
  return buyQty;
}

// Totale prijs voor meerdere aankopen achter elkaar
function calcTotaalPrijs(upg, aantal) {
  let totaal = 0;
  for (let i = 0; i < aantal; i++) {
    totaal += getUpgradePrijs(upg, owned[upg.id] + i);
  }
  return totaal;
}

// Grote getallen mooi weergeven: 1500 → "1.5K", 2500000 → "2.50M" etc.
function formatGetal(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
  return Math.floor(n).toLocaleString('nl');
}


// ─────────────────────────────────────────────
// SCHERM BIJWERKEN
// ─────────────────────────────────────────────

// Werkt de statistieken en rebirth-knop bij
// Wordt 1× per seconde aangeroepen via de game loop
function updateStats() {
  el.cookieCount.textContent  = formatGetal(cookies);
  el.cpsCount.textContent     = getCps().toFixed(1);
  el.cpcCount.textContent     = formatGetal(getCpc());
  el.totalCount.textContent   = formatGetal(totalEarned);
  el.rebirthCount.textContent = rebirthCount;
  el.rebirthName.textContent  = REBIRTH_TIERS[rebirthTier].name;
  el.rebirthMult.textContent  = '×' + getMultiplier();

  const volgende = getVolgendeTier();
  if (volgende) {
    const kanRebirthen = cookies >= volgende.cost;
    el.rebirthBtn.disabled = !kanRebirthen;
    el.rebirthSub.textContent = kanRebirthen
      ? `Volgende: ${volgende.emoji} ${volgende.name}`
      : `Vereist: ${formatGetal(volgende.cost)} koekjes`;
    el.rebirthBtn.classList.toggle('ready', kanRebirthen);
  } else {
    el.rebirthBtn.disabled = true;
    el.rebirthSub.textContent = 'MAX TIER BEREIKT 👑';
    el.rebirthBtn.classList.remove('ready');
  }
}

// Bouwt de shop één keer op (skelet zonder prijzen).
// Zo hoeven we de DOM niet elke seconde opnieuw te maken — dat is traag!
function buildShop() {
  el.shop.innerHTML = '';
  UPGRADES.forEach(upg => {
    const kaart = document.createElement('div');
    kaart.className = 'upgrade-card disabled';
    kaart.id = 'upg-' + upg.id;
    kaart.innerHTML = `
      <div class="upg-header">
        <span class="upg-icon">${upg.icon}</span>
        <span class="upg-name">${upg.name}</span>
        <span class="upg-owned" id="owned-${upg.id}">0</span>
      </div>
      <div class="upg-desc">${upg.desc}</div>
      <div class="upg-footer">
        <span class="upg-price cant-afford" id="price-${upg.id}">🍪 …</span>
        <span class="upg-dps" id="dps-${upg.id}"></span>
      </div>
    `;
    el.shop.appendChild(kaart);
  });
}

// Werkt alleen de tekst en betaalbaarheid in de shop bij.
// Wordt 1× per 2 seconden aangeroepen — geen hele rebuild nodig.
function updateShop() {
  UPGRADES.forEach(upg => {
    const aantal      = calcKoopAantal(upg);
    const totaalPrijs = calcTotaalPrijs(upg, Math.max(aantal, 1));
    const kanKopen    = cookies >= totaalPrijs;

    const kaart = document.getElementById('upg-' + upg.id);
    if (!kaart) return;

    // Klassen alleen wisselen als het nodig is (voorkomt onnodige repaints)
    const wasKoopbaar = kaart.classList.contains('affordable');
    if (kanKopen !== wasKoopbaar) {
      kaart.classList.toggle('affordable', kanKopen);
      kaart.classList.toggle('disabled',  !kanKopen);
    }

    // Klik-handler bijwerken (zodat hij de juiste prijs/aantal gebruikt)
    kaart.onclick = kanKopen ? () => koopUpgrade(upg, aantal, totaalPrijs) : null;

    // Teksten bijwerken
    document.getElementById('owned-' + upg.id).textContent = owned[upg.id];

    const prijsEl = document.getElementById('price-' + upg.id);
    prijsEl.textContent = `🍪 ${formatGetal(totaalPrijs)}${aantal > 1 ? ` (×${aantal})` : ''}`;
    prijsEl.className   = 'upg-price ' + (kanKopen ? 'can-afford' : 'cant-afford');

    const cpsBonus = upg.baseCps * aantal * getMultiplier();
    const cpcBonus = upg.baseCpc * aantal * getMultiplier();
    document.getElementById('dps-' + upg.id).textContent =
      cpsBonus > 0 ? `+${cpsBonus.toFixed(1)}/s`
    : cpcBonus > 0 ? `+${formatGetal(cpcBonus)}/klik`
    : '';
  });
}

// Past de tier-lijst links bij (unlocked/actief markeren)
function updateTierLijst() {
  document.querySelectorAll('.tier-item').forEach(item => {
    const t = parseInt(item.dataset.tier);
    item.classList.toggle('unlocked',    t < rebirthTier);
    item.classList.toggle('active-tier', t === rebirthTier);
  });
}

// Past het grote koekje aan op basis van de huidige tier
function updateKoekjeVisueel() {
  const tier = REBIRTH_TIERS[rebirthTier];
  el.cookieBtn.className = '';
  if (tier.bgColor) {
    el.cookieBtn.style.backgroundImage = tier.bgColor;
  } else {
    el.cookieBtn.style.backgroundImage = '';
    el.cookieBtn.classList.add(tier.cssClass);
  }
}

// Volledige refresh: gebruikt bij laden en na een rebirth
function volledigeRefresh() {
  updateStats();
  updateKoekjeVisueel();
  updateTierLijst();
  buildShop();
  updateShop();
}


// ─────────────────────────────────────────────
// KLIKKEN OP HET KOEKJE
// ─────────────────────────────────────────────

el.cookieBtn.addEventListener('click', (e) => {
  const winst = getCpc();
  cookies     += winst;
  totalEarned += winst;

  // Toon een "+getal" animatie op de klikpositie
  toonDrijvendGetal(`+${formatGetal(winst)}`, e.clientX, e.clientY);
  spawnPartikels(e.clientX, e.clientY);

  // Stats meteen bijwerken zodat het getal direct klopt
  updateStats();
});


// ─────────────────────────────────────────────
// DRIJVEND GETAL ANIMATIE
// Max 5 tegelijk — anders raken er te veel in de DOM (= traag)
// ─────────────────────────────────────────────

let aantalDrijvend = 0;

function toonDrijvendGetal(tekst, x, y) {
  if (aantalDrijvend >= 5) return; // skip als er al genoeg zijn
  aantalDrijvend++;

  const div = document.createElement('div');
  div.className   = 'float-num';
  div.textContent = tekst;
  div.style.cssText = `left:${x}px; top:${y - 20}px; position:fixed; z-index:999; pointer-events:none`;
  document.body.appendChild(div);

  // Na animatie netjes verwijderen — anders blijven ze in het geheugen (memory leak!)
  setTimeout(() => {
    div.remove();
    aantalDrijvend--;
  }, 1200);
}


// ─────────────────────────────────────────────
// KLIKPARTIKELS
// Max 20 tegelijk — hard limiet voorkomt DOM-bloat bij snel klikken
// ─────────────────────────────────────────────

const PARTIKEL_KLEUREN = ['#3b82f6', '#a855f7', '#22d3ee', '#f59e0b'];
let aantalPartikels = 0;
const MAX_PARTIKELS = 20;

function spawnPartikels(x, y) {
  for (let i = 0; i < 4; i++) {
    if (aantalPartikels >= MAX_PARTIKELS) break; // stop als limiet bereikt
    aantalPartikels++;

    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      width:  ${3 + Math.random() * 4}px;
      height: ${3 + Math.random() * 4}px;
      left:   ${x + (Math.random() - 0.5) * 50}px;
      top:    ${y + (Math.random() - 0.5) * 50}px;
      background: ${PARTIKEL_KLEUREN[Math.floor(Math.random() * PARTIKEL_KLEUREN.length)]};
      animation-duration: ${0.8 + Math.random()}s;
    `;
    el.particles.appendChild(p);

    // Opruimen na animatie — altijd doen om memory leaks te vermijden!
    setTimeout(() => {
      p.remove();
      aantalPartikels--;
    }, 2000);
  }
}


// ─────────────────────────────────────────────
// UPGRADES KOPEN
// ─────────────────────────────────────────────

function koopUpgrade(upg, aantal, totaalPrijs) {
  if (cookies < totaalPrijs) return; // dubbele check voor de zekerheid
  cookies -= totaalPrijs;
  owned[upg.id] += aantal;

  // Direct bijwerken voor een snelle reactie
  updateStats();
  updateShop();
}

// Hoeveelheid-knoppen: ×1, ×10, ×100, MAX
document.querySelectorAll('.qty-btn').forEach(knop => {
  knop.addEventListener('click', () => {
    document.querySelectorAll('.qty-btn').forEach(k => k.classList.remove('active'));
    knop.classList.add('active');
    buyQty = knop.dataset.qty === 'max' ? 'max' : parseInt(knop.dataset.qty);
    updateShop(); // herbereken alle prijzen met nieuw aantal
  });
});


// ─────────────────────────────────────────────
// REBIRTH  — reset alles maar ga naar hogere tier
// ─────────────────────────────────────────────

el.rebirthBtn.addEventListener('click', () => {
  const volgende = getVolgendeTier();
  if (!volgende || cookies < volgende.cost) return;

  // Vul de bevestigingsmodal in voordat we 'm tonen
  el.modalTitle.textContent   = `REBIRTH → ${volgende.name}`;
  el.modalPreview.textContent = volgende.emoji;
  el.modalDesc.textContent    = `Je reset alles, maar jouw koekje evolueert naar een ${volgende.name}!`;
  el.modalReward.textContent  = `Nieuwe multiplier: ×${volgende.mult}`;
  el.modal.classList.remove('hidden');
});

el.modalCancel.addEventListener('click',  () => el.modal.classList.add('hidden'));
el.modalConfirm.addEventListener('click', () => {
  el.modal.classList.add('hidden');
  doRebirth();
});

function doRebirth() {
  rebirthTier++;
  rebirthCount++;
  cookies     = 0;
  totalEarned = 0;
  UPGRADES.forEach(u => owned[u.id] = 0);

  // Flash-effect: maak een div aan, CSS doet de animatie, dan verwijderen
  const flash = document.createElement('div');
  flash.className = 'rebirth-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1000); // netjes opruimen!

  volledigeRefresh();
}


// ─────────────────────────────────────────────
// GAME LOOP  — één timer die alles bijhoudt
//
// Eén setInterval is overzichtelijker dan drie aparte timers.
//
// Elke 250ms  → koekjes optellen (voelt vloeiend aan)
// Elke 1000ms → statistieken op scherm bijwerken (tikTeller % 4)
// Elke 2000ms → shop bijwerken (tikTeller % 8, dan reset)
// ─────────────────────────────────────────────

let tikTeller = 0;

const gameLoop = setInterval(() => {
  tikTeller++;

  // Koekjes optellen (4× per seconde zodat CPS vloeiend aanvoelt)
  const winst = getCps() / 4;
  if (winst > 0) {
    cookies     += winst;
    totalEarned += winst;
  }

  // Elke seconde: statistieken bijwerken
  if (tikTeller % 4 === 0) {
    updateStats();
  }

  // Elke 2 seconden: shop bijwerken + teller resetten
  if (tikTeller % 8 === 0) {
    updateShop();
    tikTeller = 0; // reset zodat de teller niet oneindig groot wordt
  }

}, 250);


// ─────────────────────────────────────────────
// OPSLAAN & LADEN  — communicatie met MongoDB
//
// We slaan de speldata op als één document in de database.
//
// CRUD in dit spel:
//   CREATE → POST /api/recipes      (eerste keer openen)
//   READ   → GET  /api/recipes      (spel laden bij opstarten)
//   UPDATE → PUT  /api/recipes/:id  (automatisch opslaan)
//   DELETE → niet nodig (je verwijdert je save niet)
// ─────────────────────────────────────────────

async function laadSpel() {
  try {
    // READ: vraag alle saves op uit de database
    const response = await fetch('/api/recipes');
    const data     = await response.json();

    if (data.length > 0) {
      // Er is al een save-document: laad die in
      const save  = data[0];
      playerId    = save._id; // onthoud het MongoDB-id voor later opslaan
      cookies     = save.prepTimeInMinutes || 0;
      totalEarned = cookies;

      if (save.ingredients && save.ingredients.length > 0) {
        try {
          // De speldata zit als base64-gecodeerde JSON in het eerste ingredient
          const decoded = JSON.parse(atob(save.ingredients[0]));
          if (decoded.owned)                      Object.assign(owned, decoded.owned);
          if (decoded.rebirthTier  !== undefined)  rebirthTier  = decoded.rebirthTier;
          if (decoded.rebirthCount !== undefined)  rebirthCount = decoded.rebirthCount;
          if (decoded.totalEarned  !== undefined)  totalEarned  = decoded.totalEarned;
        } catch {
          // Oude save: gebruik alleen het aantal cursors als fallback
          owned['cursor'] = save.ingredients.length;
        }
      }
    } else {
      // CREATE: geen save gevonden → maak een nieuw document aan in MongoDB
      const res        = await fetch('/api/recipes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: 'Player1', ingredients: [], prepTimeInMinutes: 0 }),
      });
      const nieuweSave = await res.json();
      playerId = nieuweSave._id; // onthoud het id voor volgende keer opslaan
    }
  } catch (fout) {
    console.warn('Kon het spel niet laden:', fout);
  }

  volledigeRefresh(); // toon alles op het scherm na het laden
}

async function slaSpelOp() {
  if (!playerId) return; // nog geen save-document → niets doen

  // Zet speldata om naar base64-gecodeerde string (compact formaat)
  const gecodeerd = btoa(JSON.stringify({ owned, rebirthTier, rebirthCount, totalEarned }));

  try {
    // UPDATE: werk het bestaande document bij in MongoDB
    await fetch(`/api/recipes/${playerId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:              'Player1',
        prepTimeInMinutes: Math.floor(cookies), // huidige koekjes opslaan
        ingredients:       [gecodeerd],          // rest als base64
      }),
    });
    toonOpslaanStatus('✓ OPGESLAGEN');
  } catch {
    toonOpslaanStatus('✗ OPSLAAN MISLUKT');
  }
}

function toonOpslaanStatus(bericht) {
  el.saveStatus.textContent = bericht;
  setTimeout(() => { el.saveStatus.textContent = ''; }, 2000);
}

// Automatisch opslaan elke 10 seconden
const autoSave = setInterval(slaSpelOp, 10000);

// Handmatig opslaan via de knop
el.saveBtn.addEventListener('click', slaSpelOp);


// ─────────────────────────────────────────────
// OPRUIMEN  — stop timers als de pagina sluit
// Zonder dit blijven setIntervals draaien op de achtergrond (memory leak!)
// ─────────────────────────────────────────────

window.addEventListener('beforeunload', () => {
  clearInterval(gameLoop);
  clearInterval(autoSave);
});


// ─────────────────────────────────────────────
// START  — laad het spel zodra de pagina opent
// ─────────────────────────────────────────────

laadSpel();