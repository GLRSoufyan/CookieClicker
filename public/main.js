/* =============================================
   COOKIE CLICKER ∞ — main.js
   ============================================= */

// ──────────────────────────────────────────────
// GAME DATA
// ──────────────────────────────────────────────

const REBIRTH_TIERS = [
  { id: 0, name: 'Normaal Koekje',  emoji: '🍪', mult: 1,  cost: 0,      cssClass: 'cookie-normal', bgColor: '' },
  { id: 1, name: 'Regenboog Koekje', emoji: '🌈', mult: 2,  cost: 1000,   cssClass: 'cookie-regenboog',  bgColor: 'linear-gradient(135deg,#ff69b4,#ff8c00,#ffff00,#00c800,#0000ff,#8b00ff)' },
  { id: 2, name: 'Dubai Chocolade', emoji: '🍫', mult: 5,  cost: 50000,  cssClass: 'cookie-dubai',  bgColor: 'linear-gradient(135deg,#5c3317,#c8860a,#8B6914)' },
  { id: 3, name: 'Labubu Koekje',  emoji: '🎀', mult: 12, cost: 500000, cssClass: 'cookie-labubu', bgColor: 'linear-gradient(135deg,#f8c8d4,#e75480,#c71585)' },
  { id: 4, name: 'King Koekje',    emoji: '👑', mult: 30, cost: 5000000,cssClass: 'cookie-king',   bgColor: 'linear-gradient(135deg,#3d2200,#b8860b,#ffd700,#ffec8b,#ffd700,#b8860b)' },
];

const UPGRADES = [
  { id: 'cursor',   name: 'Auto-Cursor',      icon: '🖱️', desc: 'Klikt automatisch voor je.',         baseCps: 0.1,  baseCpc: 0,   baseCost: 10,    costMult: 1.15 },
  { id: 'grandma',  name: 'Oma',               icon: '👵', desc: 'Bakt koekjes met liefde.',            baseCps: 0.5,  baseCpc: 0,   baseCost: 80,    costMult: 1.15 },
  { id: 'farm',     name: 'Koekjes Boerderij', icon: '🌾', desc: 'Verbouwt koekjes op schaal.',         baseCps: 2,    baseCpc: 0,   baseCost: 500,   costMult: 1.15 },
  { id: 'factory',  name: 'Fabriek',           icon: '🏭', desc: 'Massaproductie van koekjes.',         baseCps: 8,    baseCpc: 0,   baseCost: 3000,  costMult: 1.15 },
  { id: 'bank',     name: 'Koekjes Bank',      icon: '🏦', desc: 'Koekjes groeien over tijd.',          baseCps: 25,   baseCpc: 0,   baseCost: 15000, costMult: 1.15 },
  { id: 'temple',   name: 'Koekjes Tempel',    icon: '🛕', desc: 'Heilige koekjes ceremonies.',         baseCps: 80,   baseCpc: 0,   baseCost: 75000, costMult: 1.15 },
  { id: 'lab',      name: 'Wetenschaps Lab',   icon: '🔬', desc: 'Onderzoek naar mega-koekjes.',        baseCps: 250,  baseCpc: 0,   baseCost: 400000,costMult: 1.15 },
  { id: 'portal',   name: 'Koekjes Portaal',   icon: '🌀', desc: 'Haalt koekjes uit andere dimensies.', baseCps: 800,  baseCpc: 0,   baseCost: 2e6,   costMult: 1.15 },
  { id: 'clicker1', name: 'Sterke Vingers',    icon: '💪', desc: '+1 koekje per klik.',                 baseCps: 0,    baseCpc: 1,   baseCost: 200,   costMult: 1.2  },
  { id: 'clicker2', name: 'Turbo Klik',        icon: '⚡', desc: '+5 koekjes per klik.',                baseCps: 0,    baseCpc: 5,   baseCost: 5000,  costMult: 1.2  },
  { id: 'clicker3', name: 'Mega Punch',        icon: '🥊', desc: '+25 koekjes per klik.',               baseCps: 0,    baseCpc: 25,  baseCost: 50000, costMult: 1.2  },
  { id: 'clicker4', name: 'Ultra Slaan',       icon: '🌩️', desc: '+200 koekjes per klik.',              baseCps: 0,    baseCpc: 200, baseCost: 1e6,   costMult: 1.2  },
];

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
let cookies      = 0;
let totalEarned  = 0;
let rebirthCount = 0;
let rebirthTier  = 0;
let owned        = {};
let playerId     = null;
let buyQty       = 1;

UPGRADES.forEach(u => owned[u.id] = 0);

// ──────────────────────────────────────────────
// DOM REFS
// ──────────────────────────────────────────────
const cookieBtn        = document.getElementById('cookie');
const cookieDisplay    = document.getElementById('cookie-count');
const cpsDisplay       = document.getElementById('cps-count');
const cpcDisplay       = document.getElementById('cpc-count');
const totalDisplay     = document.getElementById('total-count');
const rebirthCountDisp = document.getElementById('rebirth-count');
const rebirthTierName  = document.getElementById('rebirth-tier-name');
const rebirthMult      = document.getElementById('rebirth-multiplier');
const rebirthBtn       = document.getElementById('rebirth-btn');
const rebirthBtnSub    = document.getElementById('rebirth-btn-sub');
const shopContainer    = document.getElementById('shop-container');
const saveBtn          = document.getElementById('save-btn');
const saveStatus       = document.getElementById('save-status');
const modal            = document.getElementById('rebirth-modal');
const modalTitle       = document.getElementById('modal-title');
const modalPreview     = document.getElementById('modal-cookie-preview');
const modalDesc        = document.getElementById('modal-desc');
const modalReward      = document.getElementById('modal-reward');
const modalConfirm     = document.getElementById('modal-confirm');
const modalCancel      = document.getElementById('modal-cancel');

// ──────────────────────────────────────────────
// COMPUTED
// ──────────────────────────────────────────────
function getMultiplier()      { return REBIRTH_TIERS[rebirthTier].mult; }
function getUpgradeCost(u, n) { return Math.ceil(u.baseCost * Math.pow(u.costMult, n)); }

function getCps() {
  let t = 0;
  UPGRADES.forEach(u => { t += u.baseCps * owned[u.id]; });
  return t * getMultiplier();
}

function getCpc() {
  let t = 1;
  UPGRADES.forEach(u => { t += u.baseCpc * owned[u.id]; });
  return t * getMultiplier();
}

function getNextRebirthTier() {
  return rebirthTier < REBIRTH_TIERS.length - 1 ? REBIRTH_TIERS[rebirthTier + 1] : null;
}

function calcBuyQty(upg) {
  if (buyQty === 'max') {
    let n = 0, c = cookies;
    while (true) {
      const cost = getUpgradeCost(upg, owned[upg.id] + n);
      if (c >= cost) { c -= cost; n++; } else break;
      if (n > 10000) break;
    }
    return Math.max(n, 1);
  }
  return buyQty;
}

function calcTotalCost(upg, qty) {
  let total = 0;
  for (let i = 0; i < qty; i++) total += getUpgradeCost(upg, owned[upg.id] + i);
  return total;
}

function formatNum(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
  return Math.floor(n).toLocaleString('nl');
}

// ──────────────────────────────────────────────
// STATS UPDATE (fast — called every 100ms)
// Only updates text nodes, no DOM rebuild
// ──────────────────────────────────────────────
function updateStats() {
  cookieDisplay.textContent    = formatNum(cookies);
  cpsDisplay.textContent       = getCps().toFixed(1);
  cpcDisplay.textContent       = formatNum(getCpc());
  totalDisplay.textContent     = formatNum(totalEarned);
  rebirthCountDisp.textContent = rebirthCount;
  rebirthTierName.textContent  = REBIRTH_TIERS[rebirthTier].name;
  rebirthMult.textContent      = '×' + getMultiplier();

  const nextTier = getNextRebirthTier();
  if (nextTier) {
    const canRebirth = cookies >= nextTier.cost;
    rebirthBtn.disabled = !canRebirth;
    rebirthBtnSub.textContent = canRebirth
      ? `Volgende: ${nextTier.emoji} ${nextTier.name}`
      : `Vereist: ${formatNum(nextTier.cost)} koekjes`;
    rebirthBtn.classList.toggle('ready', canRebirth);
  } else {
    rebirthBtn.disabled = true;
    rebirthBtnSub.textContent = 'MAX TIER BEREIKT 👑';
    rebirthBtn.classList.remove('ready');
  }
}

// ──────────────────────────────────────────────
// SHOP — build once, then patch affordability
// ──────────────────────────────────────────────
function buildShop() {
  shopContainer.innerHTML = '';
  UPGRADES.forEach(upg => {
    const card = document.createElement('div');
    card.className = 'upgrade-card disabled';
    card.id = 'upg-' + upg.id;
    card.innerHTML = `
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
    shopContainer.appendChild(card);
  });
}

function updateShop() {
  UPGRADES.forEach(upg => {
    const qty        = calcBuyQty(upg);
    const totalCost  = calcTotalCost(upg, Math.max(qty, 1));
    const canAfford  = cookies >= totalCost;

    const card  = document.getElementById('upg-' + upg.id);
    const owned_ = document.getElementById('owned-' + upg.id);
    const price  = document.getElementById('price-' + upg.id);
    const dps    = document.getElementById('dps-' + upg.id);

    if (!card) return;

    // Toggle card classes (cheap toggling, no innerHTML)
    const wasAffordable = card.classList.contains('affordable');
    if (canAfford !== wasAffordable) {
      card.classList.toggle('affordable', canAfford);
      card.classList.toggle('disabled',  !canAfford);

      // Re-attach click handler only when affordability flips
      card.onclick = canAfford ? () => buyUpgrade(upg, qty, totalCost) : null;
    } else if (canAfford) {
      // Update handler in case qty changed
      card.onclick = () => buyUpgrade(upg, qty, totalCost);
    }

    owned_.textContent = owned[upg.id];

    const qtyLabel = qty > 1 ? ` (×${qty})` : '';
    price.textContent = `🍪 ${formatNum(totalCost)}${qtyLabel}`;
    price.className   = 'upg-price ' + (canAfford ? 'can-afford' : 'cant-afford');

    const cpsBonus = upg.baseCps * qty * getMultiplier();
    const cpcBonus = upg.baseCpc * qty * getMultiplier();
    dps.textContent = cpsBonus > 0 ? `+${cpsBonus.toFixed(1)}/s`
                    : cpcBonus > 0 ? `+${formatNum(cpcBonus)}/klik` : '';
  });
}

// Full UI rebuild (only called on rebirth / qty change / init)
function updateCookieVisual() {
  const tier = REBIRTH_TIERS[rebirthTier];
  cookieBtn.className = '';
  if (tier.bgColor) {
    cookieBtn.style.backgroundImage = tier.bgColor;
  } else {
    cookieBtn.style.backgroundImage = '';
    cookieBtn.classList.add(tier.cssClass);
  }
}

function updateTierList() {
  document.querySelectorAll('.tier-item').forEach(el => {
    const t = parseInt(el.dataset.tier);
    el.classList.remove('active-tier', 'unlocked');
    if (t < rebirthTier)  el.classList.add('unlocked');
    if (t === rebirthTier) el.classList.add('active-tier');
  });
}

function fullRefresh() {
  updateStats();
  updateCookieVisual();
  updateTierList();
  buildShop();
  updateShop();
}

// ──────────────────────────────────────────────
// CLICK
// ──────────────────────────────────────────────
cookieBtn.addEventListener('click', (e) => {
  const gain = getCpc();
  cookies     += gain;
  totalEarned += gain;

  spawnFloat(`+${formatNum(gain)}`, e.clientX, e.clientY);

  const r = document.createElement('div');
  r.className = 'ripple-anim';
  cookieBtn.parentElement.appendChild(r);
  setTimeout(() => r.remove(), 700);

  spawnParticles(e.clientX, e.clientY, 5);
  updateStats();
});

function spawnFloat(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-num';
  el.textContent = text;
  el.style.cssText = `left:${x}px;top:${y - 20}px;position:fixed;z-index:999`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

// ──────────────────────────────────────────────
// PARTICLES  (pool-limited to avoid DOM bloat)
// ──────────────────────────────────────────────
const particleContainer = document.getElementById('particles-container');
let   activeParticles   = 0;
const MAX_PARTICLES     = 60;

function spawnParticles(x, y, count = 8) {
  if (activeParticles >= MAX_PARTICLES) return;
  const colors = ['#3b82f6','#a855f7','#22d3ee','#f59e0b'];
  const spawn  = Math.min(count, MAX_PARTICLES - activeParticles);
  for (let i = 0; i < spawn; i++) {
    const p    = document.createElement('div');
    const size = 3 + Math.random() * 5;
    p.className = 'particle';
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${x + (Math.random() - 0.5) * 60}px;
      top:${y  + (Math.random() - 0.5) * 60}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${1 + Math.random() * 1.5}s;
    `;
    activeParticles++;
    particleContainer.appendChild(p);
    setTimeout(() => { p.remove(); activeParticles--; }, 2500);
  }
}

// Ambient particles — reduced frequency & count
setInterval(() => {
  if (activeParticles >= MAX_PARTICLES) return;
  const p    = document.createElement('div');
  const size = 1 + Math.random() * 3;
  const colors = ['#3b82f6','#a855f7','#22d3ee'];
  p.className = 'particle';
  p.style.cssText = `
    width:${size}px;height:${size}px;
    left:${Math.random() * 100}vw;top:100vh;
    background:${colors[Math.floor(Math.random() * colors.length)]};
    animation-duration:${6 + Math.random() * 8}s;
    opacity:0.3;
  `;
  activeParticles++;
  particleContainer.appendChild(p);
  setTimeout(() => { p.remove(); activeParticles--; }, 15000);
}, 1200); // was 400ms — 3× less frequent

// ──────────────────────────────────────────────
// BUY UPGRADE
// ──────────────────────────────────────────────
function buyUpgrade(upg, qty, totalCost) {
  if (cookies < totalCost) return;
  cookies -= totalCost;
  owned[upg.id] += qty;
  spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 12);
  updateStats();
  updateShop();
}

// ──────────────────────────────────────────────
// QTY SELECTOR
// ──────────────────────────────────────────────
document.querySelectorAll('.qty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const v = btn.dataset.qty;
    buyQty = v === 'max' ? 'max' : parseInt(v);
    updateShop();
  });
});

// ──────────────────────────────────────────────
// REBIRTH
// ──────────────────────────────────────────────
rebirthBtn.addEventListener('click', () => {
  const next = getNextRebirthTier();
  if (!next || cookies < next.cost) return;
  modalTitle.textContent   = `REBIRTH → ${next.name}`;
  modalPreview.textContent = next.emoji;
  modalDesc.textContent    = `Je reset al je koekjes en upgrades, maar jouw koekje evolueert naar een ${next.name}!`;
  modalReward.textContent  = `Nieuwe multiplier: ×${next.mult}`;
  modal.classList.remove('hidden');
});

modalCancel.addEventListener('click',  () => modal.classList.add('hidden'));
modalConfirm.addEventListener('click', () => { modal.classList.add('hidden'); doRebirth(); });

function doRebirth() {
  rebirthTier++;
  rebirthCount++;
  cookies     = 0;
  totalEarned = 0;
  UPGRADES.forEach(u => owned[u.id] = 0);

  const flash = document.createElement('div');
  flash.className = 'rebirth-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1000);

  spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 60);
  fullRefresh();
}

// ──────────────────────────────────────────────
// GAME LOOP — two separate timers
// ──────────────────────────────────────────────

// Accumulate every 100ms (keeps CPS smooth), redraw stats once per second
let _accumTick = 0;
setInterval(() => {
  const gain = getCps() / 10;
  if (gain > 0) {
    cookies     += gain;
    totalEarned += gain;
  }
  if (++_accumTick >= 10) {
    _accumTick = 0;
    updateStats();
  }
}, 100);

// Shop affordability — every 2 seconds
setInterval(updateShop, 2000);

// ──────────────────────────────────────────────
// SAVE / LOAD (MongoDB)
// ──────────────────────────────────────────────
async function loadGame() {
  try {
    const response = await fetch('/api/recipes');
    const data     = await response.json();

    if (data.length > 0) {
      const save = data[0];
      playerId   = save._id;
      cookies    = save.prepTimeInMinutes || 0;
      totalEarned = cookies;

      if (save.ingredients && save.ingredients.length > 0) {
        try {
          const decoded = JSON.parse(atob(save.ingredients[0]));
          if (decoded.owned)                    Object.assign(owned, decoded.owned);
          if (decoded.rebirthTier  !== undefined) rebirthTier  = decoded.rebirthTier;
          if (decoded.rebirthCount !== undefined) rebirthCount = decoded.rebirthCount;
          if (decoded.totalEarned  !== undefined) totalEarned  = decoded.totalEarned;
        } catch {
          owned['cursor'] = save.ingredients.length;
        }
      }
    } else {
      const res    = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Player1', ingredients: [], prepTimeInMinutes: 0 })
      });
      const newSave = await res.json();
      playerId = newSave._id;
    }
  } catch (e) {
    console.warn('Kon niet laden:', e);
  }
  fullRefresh();
}

async function saveGame() {
  if (!playerId) return;
  const encoded = btoa(JSON.stringify({ owned, rebirthTier, rebirthCount, totalEarned }));
  try {
    await fetch(`/api/recipes/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Player1',
        prepTimeInMinutes: Math.floor(cookies),
        ingredients: [encoded]
      })
    });
    showSaveStatus('✓ OPGESLAGEN');
  } catch {
    showSaveStatus('✗ OPSLAAN MISLUKT');
  }
}

function showSaveStatus(msg) {
  saveStatus.textContent = msg;
  setTimeout(() => saveStatus.textContent = '', 2000);
}

setInterval(saveGame, 10000);
saveBtn.addEventListener('click', () => { saveGame(); spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 15); });

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
loadGame();