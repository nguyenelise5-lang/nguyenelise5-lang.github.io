// Section toggle for collapsible sections
function toggleSection(id) {
  var el = document.getElementById(id);
  var toggle = document.getElementById(id + 'Toggle');
  if (!el) return;
  if (el.style.display === 'none') {
    el.style.display = 'block';
    if (toggle) toggle.textContent = '▾';
  } else {
    el.style.display = 'none';
    if (toggle) toggle.textContent = '▸';
  }
}

// Ghost Mode (PRD 4.2) — hides from map and nearby partners only
function toggleGhostMode(active) {
  var overlay = document.getElementById('ghostOverlay');
  var toggle = document.getElementById('ghostToggle');
  var desc = document.getElementById('ghostDesc');
  
  // Elements to hide (map + partners only)
  var mapWrap = document.getElementById('mapWrap');
  var partnersLabel = document.getElementById('peopleLabel');
  var partnersShelf = partnersLabel ? partnersLabel.nextElementSibling : null;
  var radiusBtns = document.getElementById('radiusBtns');
  var radiusLabel = document.getElementById('radiusLabel') ? document.getElementById('radiusLabel').closest('.map-float-radius') : null;
  
  if (active) {
    if (mapWrap) mapWrap.style.display = 'none';
    if (partnersLabel) partnersLabel.style.display = 'none';
    if (partnersShelf) partnersShelf.style.display = 'none';
    overlay.style.display = 'block';
    toggle.classList.add('ghost-active');
    desc.textContent = 'You are invisible';
    showToast('👻 Ghost Mode activated — events & teams still visible');
  } else {
    if (mapWrap) mapWrap.style.display = '';
    if (partnersLabel) partnersLabel.style.display = '';
    if (partnersShelf) partnersShelf.style.display = '';
    overlay.style.display = 'none';
    toggle.classList.remove('ghost-active');
    desc.textContent = 'Hidden from radius searches';
    showToast('Ghost Mode deactivated');
  }
}

function switchConnectSection(section, btn) {
  document.querySelectorAll('.cn-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.cn-seg-btn').forEach(b => b.classList.remove('active'));
  var el = document.getElementById('cn-' + section);
  if (el) el.classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('screens').scrollTop = 0;
}

// Connect tab — category filter
var sportCatMap = {
  foot:     ['run','walk','hike','trail','running','hiking'],
  cycle:    ['cycle','mtb','gravel','ebike','cycling','biking'],
  court:    ['tennis','pickle','pickleball','badminton','squash','padel','racquetball'],
  team:     ['soccer','basketball','volleyball','football','lacrosse','cricket'],
  water:    ['swim','surf','kayak','sup','row','windsurf','swimming','surfing'],
  strength: ['lift','crossfit','hiit','yoga','pilates','climb','climbing','gym'],
  winter:   ['ski','snowboard','xcski'],
  other:    ['golf','skate','dance','martial','horse'],
};
var sportCatLabels = {
  foot:['Run','Walk','Hike','Trail Run'],
  cycle:['Cycling','MTB','Gravel','E-Bike'],
  court:['Tennis','Pickleball','Badminton','Squash','Padel','Racquetball'],
  team:['Soccer','Basketball','Volleyball','Football','Lacrosse','Cricket'],
  water:['Swimming','Surfing','Kayak','SUP','Rowing','Windsurf'],
  strength:['Weightlifting','CrossFit','HIIT','Yoga','Pilates','Climbing'],
  winter:['Skiing','Snowboard','XC Ski'],
  other:['Golf','Skating','Dance','Martial Arts','Horse Riding'],
};
// Multi-select connect filters:
// - activeSportCats: array of active top-level category keys. Empty = "All".
// - activeSportSubs: array of active sub-sport labels (lowercased).
// Clicking "All" clears all categories + subs. Clicking any category toggles it.
// Sub-chip row only shows when exactly one category is selected (UI sanity).
var activeSportCats = [];
var activeSportSubs = [];

function filterCat(btn) {
  var cat = btn.dataset.cat;
  var allBtn = document.querySelector('.cnf-cat[data-cat="all"]');

  if (cat === 'all') {
    // Reset to All — clear everything
    activeSportCats = [];
    activeSportSubs = [];
    document.querySelectorAll('.cnf-cat').forEach(function(b){ b.classList.remove('active'); });
    if (allBtn) allBtn.classList.add('active');
  } else {
    // Toggle this category on/off
    var idx = activeSportCats.indexOf(cat);
    if (idx >= 0) {
      activeSportCats.splice(idx, 1);
      btn.classList.remove('active');
    } else {
      activeSportCats.push(cat);
      btn.classList.add('active');
    }
    // Any specific category active → deactivate "All"
    if (allBtn) allBtn.classList.toggle('active', activeSportCats.length === 0);
    // Subs are scoped to a single active category — switching categories wipes them
    activeSportSubs = [];
  }

  // Rebuild sub-chip row: only show when exactly one category is active
  var subWrap = document.getElementById('cnfSub');
  var subChips = document.getElementById('cnfSubChips');
  if (activeSportCats.length === 1) {
    var labels = sportCatLabels[activeSportCats[0]] || [];
    subChips.innerHTML = labels.map(function(l) {
      return '<button class="cnf-chip" onclick="toggleSubSport(this,\'' + l.toLowerCase() + '\')">' + l + '</button>';
    }).join('');
    subWrap.style.display = labels.length ? 'block' : 'none';
  } else {
    subWrap.style.display = 'none';
    subChips.innerHTML = '';
  }

  applyConnectFilter();
}

function toggleSubSport(btn, sport) {
  btn.classList.toggle('active');
  var idx = activeSportSubs.indexOf(sport);
  if (idx >= 0) activeSportSubs.splice(idx, 1);
  else activeSportSubs.push(sport);
  applyConnectFilter();
}

// Build the union of sport tokens across all active categories.
// Used as the match set when filtering people/pins.
function getActiveCatSports() {
  if (activeSportCats.length === 0) return [];
  var out = [];
  activeSportCats.forEach(function(cat){
    (sportCatMap[cat] || []).forEach(function(s){
      if (out.indexOf(s) < 0) out.push(s);
    });
  });
  return out;
}

function applyConnectFilter() {
  var isAll = activeSportCats.length === 0;
  var catSports = getActiveCatSports();

  document.querySelectorAll('.filterable').forEach(function(el) {
    var elSports = (el.dataset.sports || '').toLowerCase().split(',');
    var elDist = parseFloat(el.dataset.dist || 0);
    var distMatch = elDist <= currentRadius;

    var sportMatch;
    if (isAll) {
      sportMatch = true;
    } else if (activeSportSubs.length > 0) {
      // Sub-chip selection takes precedence (only possible with a single active cat)
      sportMatch = elSports.some(function(s) {
        return activeSportSubs.some(function(sub) { return s.includes(sub) || sub.includes(s); });
      });
    } else {
      sportMatch = elSports.some(function(s) {
        return catSports.some(function(c) { return s.includes(c) || c.includes(s); });
      });
    }

    el.classList.toggle('hidden', !(sportMatch && distMatch));
  });

  // Map pins — same match logic
  document.querySelectorAll('.map-pin').forEach(function(pin) {
    var pinSports = (pin.dataset.sports || '').toLowerCase().split(',');
    var pinDist = parseFloat(pin.dataset.dist || 0);
    var distMatch = pinDist <= currentRadius;
    var matchSet = activeSportSubs.length > 0 ? activeSportSubs : catSports;
    var sportMatch = isAll || pinSports.some(function(s) {
      return matchSet.some(function(c){ return s.includes(c) || c.includes(s); });
    });
    pin.style.display = (sportMatch && distMatch) ? '' : 'none';
  });
}

// Activity tab segmented control
function switchActTab(tab, btn) {
  document.querySelectorAll('.act-subtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#s-activity .seg-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('actTab-' + tab).classList.add('active');
  btn.classList.add('active');
}

// You tab segmented control
function switchYouTab(tab, btn) {
  document.querySelectorAll('.you-subtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#youSegControl .seg-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('youTab-' + tab).classList.add('active');
  btn.classList.add('active');
  document.getElementById('screens').scrollTop = 0;
}

// Daily rotating witty messages
const dailyMessages = [
  { icon:'🛋️', subtitle:'The algorithm doesn\'t have a backhand.', text:'Your screen time was <b>4h 37m yesterday.</b> That\'s more time than you\'ve spent moving all week. The doomscroll isn\'t cardio, and the algorithm will never love you back.' },
  { icon:'📱', subtitle:'You\'re the protagonist. Act like it.', text:'Main characters don\'t scroll for 3 hours. They <b>lace up and go.</b> Your origin story won\'t write itself from the couch.' },
  { icon:'🧠', subtitle:'Touch grass. Literally.', text:'Studies show <b>20 min of movement</b> boosts your mood more than 2 hours of scrolling. Reclaim your dopamine from the algorithm.' },
  { icon:'🏓', subtitle:'Pickleball > Doomscroll.', text:'The court doesn\'t need your login. <b>No ads, no algorithm, no toxicity.</b> Just you, a paddle, and someone who actually showed up.' },
  { icon:'🏃', subtitle:'Your run club era is calling.', text:'Everyone you follow is in a run club. You saved <b>14 "Touch Grass" posts</b> this week. Stop manifesting and start moving.' },
  { icon:'🫠', subtitle:'Hot girl walk era or couch goblin era?', text:'You said this was your <b>hot girl walk era.</b> It\'s been 6 days since your last walk. The era is giving couch goblin energy.' },
  { icon:'🌅', subtitle:'Sunlight Session > Slack notification.', text:'Your WFH break doesn\'t have to be another scroll sesh. <b>15 minutes of sunlight</b> resets your brain better than any notification.' },
  { icon:'☕', subtitle:'Coffee is not a personality. Movement is.', text:'You\'ve had <b>3 oat milk lattes</b> and zero movement today. That "aesthetic productivity" requires actually producing something. Go Rally.' },
  { icon:'🎾', subtitle:'The court doesn\'t have a comments section.', text:'No one\'s judging your form out there. <b>The net doesn\'t care about your follower count.</b> It just wants you to show up and swing.' },
  { icon:'🧘', subtitle:'Your spine filed a restraining order.', text:'You\'ve been hunched over your laptop for <b>6 hours straight.</b> Your posture is giving "LinkedIn hustle culture." Go stretch.' },
  { icon:'💀', subtitle:'Your fitness age is older than your rent.', text:'At this rate your fitness age will be <b>45 by next month.</b> You\'re in your 20s. That\'s not the flex you think it is.' },
  { icon:'🎯', subtitle:'Discipline is the real glow-up.', text:'Motivation got you to download this app. <b>Discipline</b> is what gets you off the couch. We believe in you. Barely. But we do.' },
  { icon:'🏙️', subtitle:'New city? Find your tribe.', text:'Being a transplant is lonely. <b>Your coworkers are on Zoom</b> and your college friends are 2,000 miles away. Rally is your Third Place.' },
  { icon:'📊', subtitle:'Your friends are out-rallying you.', text:'Your connections posted <b>12 activities</b> this week. You posted zero. The Halo leaderboard remembers everything.' },
  { icon:'🦥', subtitle:'You and a sloth: same energy rn.', text:'A sloth burns <b>~100 calories a day.</b> Your Apple Watch says you\'re at 120. Congrats on barely outperforming a literal sloth.' },
  { icon:'🏋️', subtitle:'The gym isn\'t scary. Loneliness is.', text:'You keep saying the gym is <b>intimidating.</b> But you know what\'s worse? Another Friday night doom-scrolling alone. Find a partner on Rally.' },
  { icon:'🎧', subtitle:'Your workout playlist deserves better.', text:'You curated a <b>fire gym playlist</b> last month. It\'s been played zero times. Those songs are judging you from the queue.' },
  { icon:'🏓', subtitle:'Pickleball: low barrier, high vibes.', text:'You don\'t need to be an athlete. You need a <b>paddle, a partner, and 30 minutes.</b> Pickleball is the new networking event.' },
  { icon:'🧃', subtitle:'Hydration isn\'t a substitute for movement.', text:'Your Stanley cup is proud of you but it doesn\'t count as <b>exercise.</b> The water bottle aesthetic only works if you sweat sometimes.' },
  { icon:'🌊', subtitle:'The ocean doesn\'t have a notification bell.', text:'Dawn patrol surfers don\'t check their phones until noon. <b>The waves don\'t buffer.</b> Be more like the ocean. Go outside.' },
  { icon:'🪦', subtitle:'RIP to your "new year, new me."', text:'Remember January when you said <b>"this is my year"?</b> Your gym membership has been paying rent alone since February. Go visit.' },
  { icon:'🤝', subtitle:'LinkedIn coffee is dead. Rally instead.', text:'Skip the awkward networking latte. <b>Find a tennis partner</b> and actually bond over something real. That\'s how you build a tribe.' },
  { icon:'⚡', subtitle:'Reclaim your dopamine.', text:'Every notification ping is <b>borrowed dopamine.</b> A rally, a run, a climb — that\'s dopamine you earned. Fight fire with fire.' },
  { icon:'🏓', subtitle:'Your neighbor plays pickleball. Do you?', text:'Pickleball courts are <b>popping up everywhere.</b> It\'s inclusive, it\'s social, and it\'s way better than whatever your For You Page is serving.' },
];

const halfDayIndex = Math.floor(Date.now() / (12 * 60 * 60 * 1000));
const todayMsg = dailyMessages[halfDayIndex % dailyMessages.length];
document.getElementById('subtitleText').textContent = todayMsg.subtitle;
document.getElementById('reminderIcon').textContent = todayMsg.icon;
document.getElementById('reminderText').innerHTML = todayMsg.text;

// Dynamic streak - changes based on consecutive days
// Simulate streak based on a "start date" stored in epoch
(function(){
  var streakStart = localStorage.getItem('rallyStreakStart');
  var lastVisit = localStorage.getItem('rallyLastVisit');
  var todayStr = new Date().toDateString();
  
  if (!streakStart || !lastVisit) {
    // First visit - start streak
    streakStart = Date.now() - (12 * 86400000); // pretend 12 days ago
    localStorage.setItem('rallyStreakStart', streakStart);
    localStorage.setItem('rallyLastVisit', todayStr);
  } else {
    var lastDate = new Date(lastVisit);
    var todayDate = new Date(todayStr);
    var diff = Math.floor((todayDate - lastDate) / 86400000);
    if (diff > 1) {
      // Streak broken - reset
      streakStart = Date.now();
      localStorage.setItem('rallyStreakStart', streakStart);
    }
    localStorage.setItem('rallyLastVisit', todayStr);
  }
  
  var streakDays = Math.floor((Date.now() - parseInt(streakStart)) / 86400000) + 1;
  
  var streakNotes = [
    "your therapist would be proud",
    "consistency is attractive ngl",
    "you're officially not a quitter",
    "the algorithm could never",
    "your couch is filing for divorce",
    "discipline > motivation fr",
    "this is your villain arc (healthy edition)",
    "body by discipline, soul by spite",
    "the gym misses you less now",
    "you're becoming that person",
    "main character energy activated",
    "even your haters are impressed",
    "proof you're not all talk",
    "your future self just high-fived you",
    "the glow up is real",
    "sweat equity is building",
    "this streak is longer than most situationships",
    "you woke up and chose gains",
    "momentum > motivation always",
    "you're built different (literally)",
  ];
  
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  var noteIndex = dayOfYear % streakNotes.length;
  
  document.getElementById('streakNum').textContent = streakDays;
  document.getElementById('streakLbl').textContent = 'Day Streak — ' + streakNotes[noteIndex];
  
  // Update the week dots based on actual day of week
  var dayNames = ['S','M','T','W','T','F','S'];
  var todayDow = new Date().getDay();
  var dotsHTML = '';
  for (var i = 0; i < 7; i++) {
    if (i < todayDow) {
      dotsHTML += '<div class="sdot done">' + dayNames[i] + '</div>';
    } else if (i === todayDow) {
      dotsHTML += '<div class="sdot now">' + dayNames[i] + '</div>';
    } else {
      dotsHTML += '<div class="sdot soon">' + dayNames[i] + '</div>';
    }
  }
  document.getElementById('streakDots').innerHTML = dotsHTML;
})();

let currentRadius = 5;

// === LAZY TAB LOADER ===
var _tabLoaded = {home: true, connect: true, record: false, activity: false, you: false};
var _tabLoading = {};

async function _loadTab(name) {
  if (_tabLoaded[name] || _tabLoading[name]) return;
  _tabLoading[name] = true;
  var el = document.getElementById('s-' + name);
  if (!el || !el.dataset.src) { _tabLoaded[name] = true; _tabLoading[name] = false; return; }
  try {
    var resp = await fetch(el.dataset.src);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var html = await resp.text();
    el.innerHTML = html;
    el.removeAttribute('data-src');
    _tabLoaded[name] = true;
    // Bind DOM events for the newly injected tab
    if (name === 'connect') _initConnect();
    if (name === 'record') _initRecord();
    if (name === 'activity') _initActivity();
    if (name === 'you') _initYou();
  } catch (e) {
    console.warn('Tab load error [' + name + ']:', e.message);
    el.innerHTML = '<div class="tab-error"><div class="tab-error-icon">⚠️</div>' +
      '<div class="tab-error-title">Could not load tab</div>' +
      '<div class="tab-error-detail">Make sure all files are in the same folder and served via HTTP.<br>Run: <b>npx serve</b> or <b>python3 -m http.server</b></div>' +
      '<button class="tab-error-retry" onclick="_tabLoading[\''+name+'\'] = false; _loadTab(\''+name+'\').then(function(){go(\''+name+'\')})">Retry</button></div>';
  }
  _tabLoading[name] = false;
}

var _connectInited = false;
async function go(n){
  // Close XP dropdown if open
  if(typeof xpDropdownOpen !== 'undefined' && xpDropdownOpen){
    xpDropdownOpen = false;
    var dd = document.getElementById('xpDropdown');
    if(dd) dd.style.display = 'none';
  }
  // Lazy-load tab if not yet injected
  if (!_tabLoaded[n]) await _loadTab(n);
  // Switch screens
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-'+n).classList.add('active');
  document.querySelectorAll('.nav-btn,.nav-rec').forEach(b=>b.classList.remove('active'));
  var m={home:0,connect:1,activity:2,you:3};
  if(n==='record'){document.querySelector('.nav-rec').classList.add('active');}
  else if(m[n]!==undefined)document.querySelectorAll('.nav-btn')[m[n]].classList.add('active');
  document.getElementById('screens').scrollTop=0;
  // Init connect on first visit (now inline, not lazy)
  if(n==='connect' && !_connectInited){ _connectInited=true; _initConnect(); }
  // Init camera when entering Record tab
  if(n==='record' && typeof initCamera === 'function') initCamera();
  // Stop camera when leaving Record tab
  if(n!=='record' && typeof cameraStream !== 'undefined' && cameraStream) {
    cameraStream.getTracks().forEach(function(t){t.stop()});
    cameraStream = null;
  }
}

// Sport-specific stats for Record tab (Strava-style)

function _initConnect() {
// Radius buttons
document.querySelectorAll('.rad-btn-float').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.rad-btn-float').forEach(function(b){ b.classList.remove('active-rad-f'); });
    btn.classList.add('active-rad-f');
    currentRadius = parseInt(btn.dataset.radius);
    var lbl = document.getElementById('radiusLabel');
    if (lbl) lbl.textContent = currentRadius + ' mi';
    var sizes = {3:110, 5:155, 10:260};
    var r = document.getElementById('mapRadius');
    if (r) { r.style.width = sizes[currentRadius]+'px'; r.style.height = sizes[currentRadius]+'px'; r.style.transition = 'all .3s ease'; }
    applyConnectFilter();
  });
});

// Ghost mode toggle
var gc = document.getElementById('ghostCheckbox');
if (gc) gc.addEventListener('change', function(){ toggleGhostMode(this.checked); });

// Edge swipe for chat/profile overlays
setupEdgeSwipe('chatView', function() {
  var cv = document.getElementById('chatView');
  var ib = document.getElementById('inbox');
  if (cv) cv.style.display = 'none';
  if (ib) ib.style.display = 'block';
});
setupEdgeSwipe('profileView', function() {
  var pv = document.getElementById('profileView');
  var cm = document.getElementById('connectMain');
  if (pv) pv.style.display = 'none';
  if (cm) cm.style.display = 'block';
  inboxOpen = false;
});
_initFullListSwipe();
} // end _initConnect

function applyFilters() {
  const activeChips = document.querySelectorAll('#sportPills .chip.on');
  const selectedSports = Array.from(activeChips).map(c => c.dataset.sport);
  const isAll = selectedSports.includes('all') || selectedSports.length === 0;
  
  let peoplVisible = 0, evtVisible = 0, teamVisible = 0;
  
  document.querySelectorAll('.filterable').forEach(el => {
    const elSports = (el.dataset.sports || '').split(',');
    const elDist = parseFloat(el.dataset.dist || 0);
    const sportMatch = isAll || elSports.some(s => selectedSports.includes(s));
    const distMatch = elDist <= currentRadius;
    const show = sportMatch && distMatch;
    
    el.classList.toggle('hidden', !show);
    
    if (show) {
      if (el.classList.contains('person')) peoplVisible++;
      else if (el.classList.contains('evt')) evtVisible++;
      else if (el.classList.contains('scoreboard') || el.classList.contains('rt-row')) teamVisible++;
    }
  });
  
  // Always keep See All cards visible — they should never be filtered out
  document.querySelectorAll('.shelf-seeall').forEach(el => {
    el.classList.remove('hidden');
    el.style.display = '';
  });

  document.querySelectorAll('.map-pin').forEach(pin => {
    const pinSports = (pin.dataset.sports || '').split(',');
    const pinDist = parseFloat(pin.dataset.dist || 0);
    const sportMatch = isAll || pinSports.some(s => selectedSports.includes(s));
    const distMatch = pinDist <= currentRadius;
    pin.style.display = (sportMatch && distMatch) ? '' : 'none';
  });
  
}

// Dynamic Calendar
const today = new Date();
let calYear = today.getFullYear();
let calMonth = today.getMonth();
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Generate activity data relative to today
function generateActivities() {
  const acts = {};
  const pastActivities = [
    [{icon:'🎾',name:'Tennis — Singles Practice',time:'9:00 AM · 1h 15m',detail:'Riviera Courts'},{icon:'🏃',name:'Evening Run',time:'6:30 PM · 3.2 mi',detail:'SM Beach Path'}],
    [{icon:'🏋️',name:'Gym — Push Day',time:'7:00 AM · 55m',detail:'Equinox'}],
    [{icon:'🎾',name:'Tennis with Sam',time:'10:00 AM · 1h 30m',detail:'Riviera Courts'}],
    [{icon:'🏄',name:'Morning Surf',time:'6:00 AM · 2h',detail:'El Porto Beach'},{icon:'🧘',name:'Yoga & Stretch',time:'5:00 PM · 45m',detail:'Home'}],
    [{icon:'🏃',name:'Run Club',time:'6:30 AM · 5.1 mi',detail:'Santa Monica Pier'}],
    [{icon:'🏋️',name:'Gym — Leg Day',time:'7:00 AM · 1h',detail:'Equinox'},{icon:'🎾',name:'Tennis Drills',time:'4:00 PM · 1h',detail:'Riviera Courts'}],
    [{icon:'🥾',name:'Runyon Canyon Hike',time:'8:00 AM · 3.8 mi',detail:'Runyon Canyon'}],
    [{icon:'🧗',name:'Bouldering Session',time:'6:00 PM · 1h 30m',detail:'Sender One'}],
    [{icon:'🎾',name:'Tennis with Lexi',time:'9:00 AM · 1h 20m',detail:'Riviera Courts'},{icon:'🏃',name:'Afternoon Jog',time:'5:30 PM · 2.8 mi',detail:'SM Beach Path'}],
  ];
  const futureActivities = [
    [{icon:'🎾',name:'Tennis with Sam',time:'9:00 AM',detail:'Riviera Courts',upcoming:true}],
    [{icon:'🏃',name:'Sunrise Run Club',time:'6:30 AM',detail:'Santa Monica Pier',upcoming:true}],
    [{icon:'🏋️',name:'Gym — Leg Day',time:'7:00 AM',detail:'Equinox',upcoming:true}],
    [{icon:'🎾',name:'Tennis Doubles',time:'10:00 AM',detail:'Riviera Courts',upcoming:true},{icon:'🧘',name:'Yoga & Chill Group',time:'5:30 PM',detail:'The Studio',upcoming:true}],
    [{icon:'🏄',name:'Surf Session w/ Jordan',time:'6:00 AM',detail:'El Porto Beach',upcoming:true}],
    [{icon:'🏃',name:'Run Club',time:'6:30 AM',detail:'Santa Monica Pier',upcoming:true},{icon:'🎾',name:'Tennis Mixer',time:'2:00 PM',detail:'Riviera Courts',upcoming:true}],
    [{icon:'🥾',name:'Griffith Park Hike',time:'7:30 AM',detail:'Griffith Observatory Trail',upcoming:true}],
    [{icon:'🧗',name:'Climbing with Kai',time:'5:00 PM',detail:'Sender One',upcoming:true}],
    [{icon:'🏀',name:'Pickup Basketball',time:'7:00 PM',detail:'Venice Beach Courts',upcoming:true}],
  ];
  // Scatter past activities over last 14 days
  for (let i = 1; i <= 14; i++) {
    if (Math.random() > 0.45) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      acts[key] = pastActivities[i % pastActivities.length];
    }
  }
  // Today
  const todayKey = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
  acts[todayKey] = [{icon:'🎾',name:'Tennis with Lexi',time:'9:00 AM · 1h 20m',detail:'Riviera Courts'},{icon:'🏃',name:'Afternoon Jog',time:'5:30 PM · 2.8 mi',detail:'SM Beach Path'}];
  // Scatter future activities over next 21 days
  for (let i = 1; i <= 21; i++) {
    if (Math.random() > 0.5) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      acts[key] = futureActivities[i % futureActivities.length];
    }
  }
  return acts;
}

const allActivities = generateActivities();

function renderCalendar() {
  const grid = document.getElementById('calGrid');
  const monthLabel = document.getElementById('calMonth');
  if (!grid || !monthLabel) return;
  monthLabel.textContent = monthNames[calMonth] + ' ' + calYear;
  
  // Clear existing day cells (keep headers)
  grid.querySelectorAll('.cal-day').forEach(d => d.remove());
  
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  
  // Previous month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'cal-day other';
    el.textContent = prevDays - i;
    grid.appendChild(el);
  }
  
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    const dateObj = new Date(calYear, calMonth, d);
    const key = calYear + '-' + (calMonth+1) + '-' + d;
    const hasData = allActivities[key];
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (hasData && (isPast || isToday)) cls += ' has-activity';
    if (hasData && !isPast && !isToday) cls += ' has-event';
    el.className = cls;
    el.textContent = d;
    el.dataset.key = key;
    el.dataset.date = monthNames[calMonth] + ' ' + d;
    el.addEventListener('click', () => openDayPopup(el));
    grid.appendChild(el);
  }
  
  // Next month filler
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day other';
    el.textContent = i;
    grid.appendChild(el);
  }
}

function openDayPopup(dayEl) {
  document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
  dayEl.classList.add('selected');
  
  const popup = document.getElementById('dayPopup');
  const dateEl = document.getElementById('popupDate');
  const itemsEl = document.getElementById('popupItems');
  
  dateEl.textContent = dayEl.dataset.date;
  itemsEl.innerHTML = '';
  
  const activities = allActivities[dayEl.dataset.key];
  if (activities) {
    activities.forEach(a => {
      const isUp = a.upcoming ? ' upcoming' : '';
      const badge = a.upcoming ? '<span style="font-size:9px;font-weight:700;color:var(--orange);background:var(--orange-bg);padding:2px 6px;border-radius:10px;margin-left:auto;flex-shrink:0">UPCOMING</span>' : '';
      itemsEl.innerHTML += `<div class="day-popup-item${isUp}"><div class="day-popup-ico">${a.icon}</div><div class="day-popup-info"><div class="day-popup-name">${a.name}</div><div class="day-popup-meta">${a.time} · ${a.detail}</div></div>${badge}</div>`;
    });
  } else {
    itemsEl.innerHTML = '<div class="day-popup-empty">No activities logged. Tap + to add one! 💪</div>';
  }
  popup.style.display = 'block';
}

function closeDayPopup() {
  document.getElementById('dayPopup').style.display = 'none';
  document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
}

// Month navigation — bound in _initActivity
function _initActivity() {
  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  renderCalendar();
  renderUpcoming();
} // end _initActivity

// Render upcoming events list dynamically
function renderUpcoming() {
  const list = document.getElementById('upcomingList');
  if (!list) return;
  const upcoming = [];
  const bgMap = {'🎾':'var(--green-bg)','🏃':'var(--blue-bg)','🏋️':'var(--orange-bg)','🏄':'var(--blue-bg)','🧘':'var(--pink-bg)','🏀':'var(--orange-bg)','⚽':'var(--green-bg)','🥾':'rgba(120,113,108,.1)','🧗':'rgba(249,115,22,.1)','🤸':'rgba(139,92,246,.1)','⛳':'var(--green-bg)','🏊':'rgba(34,211,238,.1)','🏓':'rgba(250,204,21,.1)'};
  
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    if (allActivities[key]) {
      allActivities[key].forEach(a => {
        if (a.upcoming) {
          const dayLabel = i === 1 ? 'Tomorrow' : dayNames[d.getDay()] + ', ' + monthNames[d.getMonth()] + ' ' + d.getDate();
          upcoming.push({...a, dayLabel});
        }
      });
    }
    if (upcoming.length >= 4) break;
  }
  
  list.innerHTML = upcoming.map(u => `
    <div class="upcoming">
      <div class="up-ico" style="background:${bgMap[u.icon]||'var(--surface2)'}">${u.icon}</div>
      <div class="up-info"><div class="up-name">${u.name}</div><div class="up-time">${u.dayLabel} · ${u.time} · ${u.detail}</div></div>
      
    </div>
  `).join('');
  
  if (upcoming.length === 0) {
    list.innerHTML = '<div class="no-results">No upcoming activities. Tap + Add Activity to schedule one!</div>';
  }
}

// === XP LEVEL SYSTEM ===
const levels = [
  {lv:1, name:'Newbie', xp:0, icon:'🌱'},
  {lv:2, name:'Starter', xp:100, icon:'🌿'},
  {lv:3, name:'Mover', xp:250, icon:'🏃'},
  {lv:4, name:'Rookie', xp:500, icon:'⭐'},
  {lv:5, name:'Hustler', xp:800, icon:'💪'},
  {lv:6, name:'Explorer', xp:1200, icon:'🧭'},
  {lv:7, name:'Grinder', xp:1700, icon:'🔥'},
  {lv:8, name:'Trailblazer', xp:2500, icon:'⚡'},
  {lv:9, name:'Titan', xp:3000, icon:'🏆'},
  {lv:10, name:'Legend', xp:4000, icon:'👑'},
  {lv:11, name:'Icon', xp:5500, icon:'💎'},
  {lv:12, name:'Immortal', xp:7500, icon:'🌟'},
];

// Membership tiers: Bronze (0-1699), Silver (1700-3999), Gold (4000+)
const memberTiers = [
  {name:'Bronze', xpMin:0, xpMax:1699, medal:'🥉', color:'#cd7f32', cls:'tier-bronze'},
  {name:'Silver', xpMin:1700, xpMax:3999, medal:'🥈', color:'#c0c0c0', cls:'tier-silver'},
  {name:'Gold', xpMin:4000, xpMax:Infinity, medal:'🥇', color:'#ffd700', cls:'tier-gold'},
];

function getMemberTier(xp) {
  for (let i = memberTiers.length - 1; i >= 0; i--) {
    if (xp >= memberTiers[i].xpMin) return memberTiers[i];
  }
  return memberTiers[0];
}

function renderXPLevel(currentXP) {
  var _el = function(id) { return document.getElementById(id); };
  if (!_el('xpDdBadge')) return; // dropdown not in DOM yet, skip silently
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  for (let i = 0; i < levels.length; i++) {
    if (currentXP >= levels[i].xp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
    }
  }

  const xpInLevel = currentXP - currentLevel.xp;
  const xpNeeded = nextLevel ? (nextLevel.xp - currentLevel.xp) : 1;
  const pct = nextLevel ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;
  const remaining = nextLevel ? (nextLevel.xp - currentXP) : 0;
  const tier = getMemberTier(currentXP);
  const nextTier = memberTiers[memberTiers.indexOf(tier) + 1];

  // Update You tab handle (may not exist if tab not loaded)
  if (_el('youHandle')) _el('youHandle').textContent = '@elisemoves · Level ' + currentLevel.lv + ' ' + currentLevel.name;

  // Update dropdown
  document.getElementById('xpDdBadge').textContent = currentLevel.lv;
  document.getElementById('xpDdName').textContent = currentLevel.icon + ' ' + currentLevel.name;
  document.getElementById('xpDdTier').textContent = tier.medal + ' ' + tier.name + ' Member';
  document.getElementById('xpDdTier').style.color = tier.color;
  document.getElementById('xpDdXP').textContent = currentXP.toLocaleString() + ' XP';
  document.getElementById('xpDdBar').style.width = pct + '%';
  document.getElementById('xpDdLeft').textContent = 'Lv ' + currentLevel.lv + ' · ' + currentLevel.xp.toLocaleString() + ' XP';
  document.getElementById('xpDdNext').textContent = nextLevel ? remaining + ' XP to Lv ' + nextLevel.lv : 'Max Level!';
  document.getElementById('xpDdRight').textContent = nextLevel ? 'Lv ' + nextLevel.lv + ' · ' + nextLevel.xp.toLocaleString() + ' XP' : 'Max';

  // Membership section
  const memEl = document.getElementById('xpDdMembership');
  memEl.className = 'xp-dd-membership ' + tier.cls;
  document.querySelector('.xp-dd-medal').textContent = tier.medal;
  document.getElementById('xpDdMemName').textContent = tier.name + ' Member';
  document.getElementById('xpDdMemNext').textContent = nextTier ? (nextTier.xpMin - currentXP).toLocaleString() + ' XP to ' + nextTier.name : 'Highest tier!';

  // Tier pips
  memberTiers.forEach((t, i) => {
    const pip = document.querySelectorAll('.xp-dd-tier-pip')[i];
    if (!pip) return;
    pip.className = 'xp-dd-tier-pip' + (t === tier ? ' active-tier ' + t.cls : '');
  });
}

let xpDropdownOpen = false;
function toggleXPDropdown() {
  const dd = document.getElementById('xpDropdown');
  xpDropdownOpen = !xpDropdownOpen;
  dd.style.display = xpDropdownOpen ? 'block' : 'none';
}

function _initYou() {
  renderXPLevel(2840);
} // end _initYou

renderXPLevel(2840); // also run if inline (fallback)

// === CREATE GROUP ACTIVITY / REC LEAGUE ===
function openCreateModal(type) {
  const modal = document.getElementById('createModal');
  const title = document.getElementById('createModalTitle');
  const body = document.getElementById('createModalBody');
  modal.style.display = 'block';

  if (type === 'group') {
    title.textContent = '👥 Create Group Activity';
    body.innerHTML = `
      <select class="act-select"><option value="">Select Sport</option>
        <option>🎾 Tennis</option><option>🏀 Basketball</option><option>🏄 Surfing</option>
        <option>🏃 Running</option><option>🏋️ Gym</option><option>⚽ Soccer</option>
        <option>🥾 Hiking</option><option>🧗 Climbing</option><option>🚴 Cycling</option>
        <option>🧘 Yoga</option><option>🤸 Pilates</option><option>⛳ Golf</option><option>🏊 Swim</option><option>🏓 Pickleball</option>
      </select>
      <input class="act-input" placeholder="Activity name (e.g. Sunday Tennis Mixer)">
      <div class="act-row">
        <input class="act-input" type="date" id="grpDate">
        <input class="act-input" type="time" id="grpTime">
      </div>
      <input class="act-input" placeholder="📍 Location">
      <input class="act-input" type="number" placeholder="Max participants (e.g. 8)" min="2" max="50">
      <select class="act-select">
        <option value="">Skill Level</option>
        <option>All Levels Welcome</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Competitive</option>
      </select>
      <textarea class="act-input" placeholder="Description (optional)" rows="2" style="resize:none"></textarea>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn-fill" style="flex:1" onclick="showToast('Group activity created! 👥');document.getElementById('createModal').style.display='none'">Create & Invite</button>
      </div>`;
    const dateInput = document.getElementById('grpDate');
    if (dateInput) dateInput.valueAsDate = new Date();
  } else {
    title.textContent = '🏆 Create Rec League';
    body.innerHTML = `
      <select class="act-select"><option value="">Select Sport</option>
        <option>🏀 Basketball</option><option>⚽ Soccer</option><option>🏐 Volleyball</option>
        <option>🎾 Tennis</option><option>⛳ Golf</option><option>🏊 Swim</option><option>🏓 Pickleball</option>
      </select>
      <input class="act-input" placeholder="League name (e.g. Westside Basketball League)">
      <input class="act-input" placeholder="📍 Home venue / courts">
      <div class="act-row">
        <select class="act-select" style="flex:1"><option>Season Format</option><option>Weekly Matches</option><option>Tournament Bracket</option><option>Round Robin</option><option>Pickup / Casual</option></select>
        <input class="act-input" type="number" placeholder="# Teams" min="2" max="20" style="flex:1">
      </div>
      <div class="act-row">
        <select class="act-select" style="flex:1"><option>Day(s)</option><option>Weekdays</option><option>Weekends</option><option>Mon/Wed</option><option>Tue/Thu</option><option>Sat/Sun</option></select>
        <input class="act-input" type="time" style="flex:1">
      </div>
      <select class="act-select">
        <option value="">Skill Level</option>
        <option>All Levels</option><option>Recreational</option><option>Intermediate</option><option>Competitive</option>
      </select>
      <input class="act-input" type="number" placeholder="Players per team (e.g. 5)" min="1" max="15">
      <textarea class="act-input" placeholder="League description & rules (optional)" rows="2" style="resize:none"></textarea>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn-fill" style="flex:1" onclick="showToast('Rec league created! 🏆 Recruiting players...');document.getElementById('createModal').style.display='none'">Create League</button>
      </div>`;
  }
}

// === INSTAGRAM-STYLE FEED INTERACTIONS ===
var feedLiked = [false, false, false, false, false, false, false];
var feedSaved = [false, false, false, false, false, false, false];
var feedLikeCounts = [24, 41, 37, 52, 19, 33, 68];

function likeFeedPost(i) {
  var svg = document.getElementById('likeSvg-' + i);
  var btn = document.getElementById('likeBtn-' + i);
  var heart = document.getElementById('dblHeart-' + i);
  var likesEl = document.getElementById('feedLikes-' + i);
  
  if (!feedLiked[i]) {
    feedLiked[i] = true;
    feedLikeCounts[i]++;
    btn.classList.add('liked');
    svg.setAttribute('fill', '#ef4444');
    svg.setAttribute('stroke', '#ef4444');
    heart.classList.remove('pop');
    void heart.offsetWidth;
    heart.classList.add('pop');
  } else {
    feedLiked[i] = false;
    feedLikeCounts[i]--;
    btn.classList.remove('liked');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
  }
  likesEl.textContent = feedLikeCounts[i].toLocaleString() + ' rallies';
}

function toggleSave(i) {
  var svg = document.getElementById('saveSvg-' + i);
  feedSaved[i] = !feedSaved[i];
  if (feedSaved[i]) {
    svg.setAttribute('fill', 'var(--ink)');
    showToast('Post saved 🔖');
  } else {
    svg.setAttribute('fill', 'none');
    showToast('Post unsaved');
  }
}

function openComments(i) {
  var drawer = document.getElementById('comments-' + i);
  if (drawer.style.display === 'none') {
    drawer.style.display = 'block';
    document.getElementById('commentInput-' + i).focus();
  } else {
    drawer.style.display = 'none';
  }
}

function postComment(i) {
  var input = document.getElementById('commentInput-' + i);
  var text = input.value.trim();
  if (!text) return;
  var list = document.getElementById('commentList-' + i);
  var item = document.createElement('div');
  item.className = 'comment-item';
  item.innerHTML = '<div class="av" style="width:24px;height:24px;font-size:9px;background:linear-gradient(135deg,var(--green),var(--blue))">E</div><div class="comment-body"><strong>you</strong> ' + text + '</div>';
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
  input.value = '';
}

function openShareSheet(i) {
  var backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.id = 'shareBackdrop';
  document.body.appendChild(backdrop);
  var sheet = document.createElement('div');
  sheet.className = 'share-sheet';
  sheet.id = 'shareSheet';
  
  var contactsHtml = '';
  connectionsList.forEach(function(c) {
    contactsHtml += '<div class="share-conn-item" data-name="' + c.name.toLowerCase() + '" data-handle="' + c.handle + '">' +
      '<div class="av" style="width:40px;height:40px;font-size:14px;background:' + c.bg + ';flex-shrink:0">' + c.initial + '</div>' +
      '<div class="share-conn-info"><div class="share-conn-name">' + c.name + '</div><div class="share-conn-handle">' + c.handle + '</div></div>' +
      '<button class="share-conn-btn" onclick="toggleShareSend(this,\'' + c.name + '\')">Send</button>' +
    '</div>';
  });
  
  sheet.innerHTML = '<div class="share-sheet-title">Share Post</div>' +
    '<div class="invite-search-row" style="margin:0 -20px;padding:8px 20px;border-top:1px solid var(--surface3)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--ink4)" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input class="invite-search" placeholder="Search connections..." oninput="filterShareList(this.value)"></div>' +
    '<div class="share-conn-list" id="shareConnList">' + contactsHtml + '</div>' +
    '<button class="share-sheet-cancel" onclick="closeShare()" style="margin-top:12px">Cancel</button>';
  document.body.appendChild(sheet);
  backdrop.onclick = function() { closeShare(); };
}

function filterShareList(query) {
  var q = query.toLowerCase();
  document.querySelectorAll('.share-conn-item').forEach(function(item) {
    var name = item.dataset.name || '';
    var handle = item.dataset.handle || '';
    item.style.display = (name.indexOf(q) !== -1 || handle.indexOf(q) !== -1) ? 'flex' : 'none';
  });
}

function toggleShareSend(btn, name) {
  if (btn.dataset.sent === 'true') {
    btn.textContent = 'Send';
    btn.style.background = '';
    btn.style.color = '';
    btn.dataset.sent = 'false';
  } else {
    btn.textContent = '✓ Sent';
    btn.style.background = 'var(--green)';
    btn.style.color = '#fff';
    btn.dataset.sent = 'true';
    showToast('Sent to ' + name + '! 💬');
  }
}

function closeShare() {
  document.querySelectorAll('.share-backdrop,.share-sheet').forEach(function(e) { e.remove(); });
}

// Pull to refresh
(function() {
  var screens = document.getElementById('screens');
  var startY = 0;
  var pulling = false;
  screens.addEventListener('touchstart', function(e) {
    if (screens.scrollTop === 0) { startY = e.touches[0].clientY; pulling = true; }
  }, {passive:true});
  screens.addEventListener('touchend', function(e) {
    if (!pulling) return;
    pulling = false;
    var dy = e.changedTouches[0].clientY - startY;
    if (dy > 80) {
      var spinner = document.getElementById('ptrSpinner');
      if (spinner) { spinner.classList.add('active'); spinner.style.display = 'block'; }
      setTimeout(function() {
        if (spinner) { spinner.classList.remove('active'); spinner.style.display = 'none'; }
        showToast('Feed refreshed ✓');
      }, 800);
    }
  }, {passive:true});
})();

// Strava-style push notification banner
function showNotification(name, initial, bg) {
  var notif = document.createElement('div');
  notif.className = 'notif-banner';
  notif.innerHTML = '<div class="av" style="width:36px;height:36px;font-size:13px;background:' + bg + ';flex-shrink:0">' + initial + '</div>' +
    '<div class="notif-banner-body">' +
      '<div class="notif-banner-app">RALLY</div>' +
      '<div class="notif-banner-title">Connection Request Sent</div>' +
      '<div class="notif-banner-sub">' + name + ' will be notified. They can accept or decline your request.</div>' +
    '</div>' +
    '<div class="notif-banner-time">now</div>';
  document.body.appendChild(notif);
  setTimeout(function() { notif.remove(); }, 4000);
}

// Messaging
const chatData = {
  sam: {name:'Sam Rivera',bg:'linear-gradient(135deg,var(--blue),var(--pink))',msgs:[
    {from:'them',text:'Yo are you down for tennis tmrw? 🎾'},
    {from:'them',text:'Riviera Courts at 9am, I already booked it'},
  ]},
  derek: {name:'Derek Osei',bg:'linear-gradient(135deg,var(--green),#4ade80)',msgs:[
    {from:'them',text:'Bro we need one more for our rec basketball team'},
    {from:'them',text:'We play Tuesdays and Thursdays at Venice Beach Courts'},
    {from:'them',text:'We need a SG bad. You in?'},
  ]},
  lexi: {name:'Lexi Tanaka',bg:'linear-gradient(135deg,var(--orange),#fbbf24)',msgs:[
    {from:'them',text:'That yoga class was insane 😮‍💨'},
    {from:'them',text:'My hamstrings are not forgiving me rn'},
    {from:'me',text:'Lmaooo same I can barely walk'},
    {from:'them',text:'We should go again next week tho lol'},
  ]},
  jordan: {name:'Jordan Park',bg:'linear-gradient(135deg,var(--orange),#fbbf24)',msgs:[
    {from:'them',text:'Dawn patrol this weekend? El Porto is supposed to be firing 🌊'},
    {from:'me',text:'Say less. What time?'},
    {from:'them',text:'5:45am. I know I know but trust'},
  ]},
  maya: {name:'Maya Chen',bg:'linear-gradient(135deg,var(--blue),var(--pink))',msgs:[
    {from:'me',text:'Good game yesterday!! That last set was crazy'},
    {from:'them',text:'Omg I thought I was gonna pass out 😂'},
    {from:'them',text:'Good game!! Rematch next week?'},
    {from:'me',text:'100%'},
  ]},
  marcus: {name:'Marcus T.',bg:'linear-gradient(135deg,#c2410c,#ea580c)',msgs:[
    {from:'them',text:'Yo we need 2 more for Westside Buckets 🏀'},
    {from:'them',text:'Tue & Thu at Venice Beach Courts, 7PM. Competitive 5v5'},
  ]},
  alex: {name:'Alex R.',bg:'linear-gradient(135deg,#ca8a04,#facc15)',msgs:[
    {from:'them',text:'Hey! Dink Dynasty is always looking for new players 🏓'},
    {from:'them',text:'Sat & Sun mornings at SM Courts. Super chill vibes'},
  ]}
};
let currentChat = null;

// Messaging
let inboxOpen = false;

function toggleInbox() {
  const inbox = document.getElementById('inbox');
  const main = document.getElementById('connectMain');
  const chat = document.getElementById('chatView');
  chat.style.display = 'none';
  
  if (!inboxOpen) {
    inbox.style.display = 'block';
    main.style.display = 'none';
    inboxOpen = true;
  } else {
    inbox.style.display = 'none';
    main.style.display = 'block';
    inboxOpen = false;
  }
}

function openChat(id) {
  currentChat = id;
  const data = chatData[id];
  const chat = document.getElementById('chatView');
  const inbox = document.getElementById('inbox');
  const main = document.getElementById('connectMain');
  inbox.style.display = 'none';
  main.style.display = 'none';
  chat.style.display = 'flex';
  document.getElementById('chatName').textContent = data.name;
  document.getElementById('chatAvatar').textContent = data.name[0];
  document.getElementById('chatAvatar').style.background = data.bg;
  renderMessages();
}

function renderMessages() {
  const el = document.getElementById('chatMessages');
  const data = chatData[currentChat];
  el.innerHTML = data.msgs.map(m => `<div class="chat-bubble ${m.from}">${m.text}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function closeChat() {
  var el = document.getElementById('chatView');
  el.style.transition = 'transform .22s ease-out, opacity .22s ease-out';
  el.style.transform = 'translateX(100%)';
  el.style.opacity = '0';
  setTimeout(function() {
    el.style.display = 'none';
    el.style.transform = '';
    el.style.opacity = '';
    el.style.transition = '';
    document.getElementById('inbox').style.display = 'block';
  }, 230);
}

function sendMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !currentChat) return;
  chatData[currentChat].msgs.push({from:'me', text});
  input.value = '';
  renderMessages();
}

// Profile data
const gridColors = {
  '🎾':['#dcfce7','#bbf7d0'], '🏀':['#fef3c7','#fde68a'], '🏄':['#e0e7ff','#c7d2fe'],
  '🏃':['#dbeafe','#bfdbfe'], '🏋️':['#fef3c7','#fde68a'], '🧘':['#fce7f3','#fbcfe8'],
  '⚽':['#dcfce7','#a7f3d0'], '🏐':['#e0e7ff','#c7d2fe'], '🚴':['#dbeafe','#bfdbfe'],
  '🥾':['#d6d3d1','#e7e5e4'], '🧗':['#fed7aa','#fdba74'], '🤸':['#ede9fe','#ddd6fe'],
  '⛳':['#d1fae5','#a7f3d0'], '🏊':['#cffafe','#a5f3fc'], '🏓':['#fef9c3','#fef08a']
};

const profileData = {
  sam: {
    name:'Sam Rivera', handle:'@samrivera · Level 6 Explorer', initial:'S',
    bg:'linear-gradient(135deg,var(--blue),var(--pink))',
    bio:'Chasing waves and aces. Life\'s too short to sit on the bench. Tennis 3x/week or I get cranky.',
    xp:'1,920', activities:'98', connections:'64',
    sports:['🎾 Tennis','🏄 Surfing','🏃 Running','🏋️ Gym','🥾 Hiking'],
    badges:[{icon:'🎾',name:'Court King',bg:'var(--green-bg)'},{icon:'🏄',name:'Wave Rider',bg:'var(--blue-bg)'},{icon:'🔥',name:'7-Day',bg:'var(--orange-bg)'},{icon:'⭐',name:'1K XP',bg:'rgba(255,215,0,.12)'}],
    grid:[
      {icon:'🎾',label:'1h 15m'},{icon:'🏄',label:'2h'},{icon:'🏃',label:'4.2 mi'},
      {icon:'🥾',label:'3.8 mi'},{icon:'🏋️',label:'1h'},{icon:'🏄',label:'1h 45m'},
      {icon:'🏃',label:'3.1 mi'},{icon:'🎾',label:'1h 30m'},{icon:'🥾',label:'5.2 mi'}
    ]
  },
  lexi: {
    name:'Lexi Tanaka', handle:'@lexitanaka · Level 5 Mover', initial:'L',
    bg:'linear-gradient(135deg,var(--orange),#fbbf24)',
    bio:'Yoga mat > therapist\'s couch. Also lowkey obsessed with tennis rn. Trying to touch grass daily.',
    xp:'1,340', activities:'72', connections:'51',
    sports:['🎾 Tennis','🧘 Yoga','🏃 Running'],
    badges:[{icon:'🧘',name:'Zen Master',bg:'var(--pink-bg)'},{icon:'🌅',name:'Early Bird',bg:'var(--orange-bg)'},{icon:'🔥',name:'14-Day',bg:'var(--green-bg)'}],
    grid:[
      {icon:'🧘',label:'1h'},{icon:'🎾',label:'55m'},{icon:'🧘',label:'45m'},
      {icon:'🏃',label:'2.8 mi'},{icon:'🎾',label:'1h 10m'},{icon:'🧘',label:'1h'},
      {icon:'🏃',label:'3.5 mi'},{icon:'🧘',label:'50m'},{icon:'🎾',label:'40m'}
    ]
  },
  derek: {
    name:'Derek Osei', handle:'@dereko · Level 7 Grinder', initial:'D',
    bg:'linear-gradient(135deg,var(--green),#4ade80)',
    bio:'Ball is life but also deadlifts are life. Looking for a rec basketball team that actually shows up.',
    xp:'2,180', activities:'115', connections:'78',
    sports:['🏀 Basketball','🏋️ Gym','🏃 Running'],
    badges:[{icon:'🏀',name:'Baller',bg:'var(--orange-bg)'},{icon:'🏋️',name:'Iron Will',bg:'var(--blue-bg)'},{icon:'🔥',name:'21-Day',bg:'var(--green-bg)'},{icon:'👥',name:'Connector',bg:'var(--pink-bg)'}],
    grid:[
      {icon:'🏀',label:'1h 30m'},{icon:'🏋️',label:'1h'},{icon:'🏃',label:'3.5 mi'},
      {icon:'🏀',label:'2h'},{icon:'🏋️',label:'55m'},{icon:'🏀',label:'1h 15m'},
      {icon:'🏃',label:'5.1 mi'},{icon:'🏋️',label:'1h 10m'},{icon:'🏀',label:'1h 45m'}
    ]
  },
  kai: {
    name:'Kai Nakamura', handle:'@kainakamura · Level 4 Rookie', initial:'K',
    bg:'linear-gradient(135deg,var(--pink),var(--orange))',
    bio:'Just moved to LA and trying to find my people. Down for literally any sport. Yes including pickleball.',
    xp:'860', activities:'38', connections:'22',
    sports:['🏀 Basketball','⚽ Soccer','🏃 Running','🏐 Volleyball','🧗 Climbing'],
    badges:[{icon:'⚽',name:'Pitch Pro',bg:'var(--green-bg)'},{icon:'🔥',name:'7-Day',bg:'var(--orange-bg)'},{icon:'🧗',name:'Wall Rat',bg:'rgba(253,186,116,.15)'}],
    grid:[
      {icon:'🏀',label:'45m'},{icon:'⚽',label:'1h 20m'},{icon:'🧗',label:'1h 30m'},
      {icon:'🏐',label:'1h'},{icon:'🏀',label:'1h'},{icon:'🧗',label:'2h'},
      {icon:'🏃',label:'2.1 mi'},{icon:'⚽',label:'55m'},{icon:'🧗',label:'1h 15m'}
    ]
  },
  maya: {
    name:'Maya Chen', handle:'@mayachen · Level 5 Hustler', initial:'M',
    bg:'linear-gradient(135deg,var(--blue),var(--pink))',
    bio:'Tennis obsessed. Gym rat in recovery. Trying to prove that cardio can be fun.',
    xp:'1,520', activities:'86', connections:'47',
    sports:['🎾 Tennis','🏃 Running','🏋️ Gym','🧘 Yoga'],
    badges:[],
    grid:[
      {icon:'🎾',label:'1h 20m'},{icon:'🏃',label:'3.2 mi'},{icon:'🏋️',label:'50m'},
      {icon:'🧘',label:'30m'},{icon:'🎾',label:'1h'},{icon:'🏃',label:'4.1 mi'},
      {icon:'🏋️',label:'1h'},{icon:'🎾',label:'55m'},{icon:'🧘',label:'45m'}
    ]
  },
  jordan: {
    name:'Jordan Park', handle:'@jordanpark · Level 6 Explorer', initial:'J',
    bg:'linear-gradient(135deg,var(--orange),#fbbf24)',
    bio:'Dawn patrol or die. Surfer by morning, coder by day. Looking for hiking buddies.',
    xp:'1,840', activities:'104', connections:'58',
    sports:['🏄 Surfing','🥾 Hiking','🏃 Running','🧗 Climbing'],
    badges:[],
    grid:[
      {icon:'🏄',label:'2h 10m'},{icon:'🥾',label:'4.6 mi'},{icon:'🏃',label:'3.8 mi'},
      {icon:'🧗',label:'1h 30m'},{icon:'🏄',label:'1h 45m'},{icon:'🥾',label:'6.1 mi'},
      {icon:'🏃',label:'5.2 mi'},{icon:'🏄',label:'2h'},{icon:'🧗',label:'2h'}
    ]
  },
  marcus: {
    name:'Marcus T.', handle:'@marcust · Level 7 Grinder', initial:'M',
    bg:'linear-gradient(135deg,#c2410c,#ea580c)',
    bio:'Hoops is life. Captain of Westside Buckets. Always looking for ballers who show up and compete.',
    xp:'2,410', activities:'118', connections:'72',
    sports:['🏀 Basketball','🏋️ Gym','🏃 Running'],
    badges:[],
    grid:[
      {icon:'🏀',label:'1h 30m'},{icon:'🏋️',label:'1h'},{icon:'🏀',label:'2h'},
      {icon:'🏃',label:'3.1 mi'},{icon:'🏀',label:'1h 15m'},{icon:'🏋️',label:'45m'},
      {icon:'🏀',label:'1h 45m'},{icon:'🏃',label:'4.2 mi'},{icon:'🏀',label:'2h'}
    ]
  },
  alex: {
    name:'Alex R.', handle:'@alexr · Level 5 Hustler', initial:'A',
    bg:'linear-gradient(135deg,#ca8a04,#facc15)',
    bio:'Pickleball evangelist. Started Dink Dynasty because this city needs more low-key sports communities. All levels welcome.',
    xp:'1,180', activities:'64', connections:'41',
    sports:['🏓 Pickleball','🎾 Tennis','🧘 Yoga'],
    badges:[],
    grid:[
      {icon:'🏓',label:'1h'},{icon:'🎾',label:'55m'},{icon:'🏓',label:'1h 15m'},
      {icon:'🧘',label:'30m'},{icon:'🏓',label:'45m'},{icon:'🎾',label:'1h 10m'},
      {icon:'🏓',label:'1h 30m'},{icon:'🧘',label:'45m'},{icon:'🏓',label:'1h'}
    ]
  }
};

function openProfile(id) {
  const p = profileData[id];
  if (!p) return;
  
  // Only navigate to Connect tab if not already there
  var connectScreen = document.getElementById('s-connect');
  if (!connectScreen || !connectScreen.classList.contains('active')) {
    go('connect').then ? go('connect').then(function(){ _openProfileUI(id, p); }) : (go('connect'), setTimeout(function(){ _openProfileUI(id, p); }, 80));
    return;
  }
  _openProfileUI(id, p);
}

function _openProfileUI(id, p) {
  const pv = document.getElementById('profileView');
  const main = document.getElementById('connectMain');
  const inbox = document.getElementById('inbox');
  const chat = document.getElementById('chatView');
  main.style.display = 'none';
  inbox.style.display = 'none';
  chat.style.display = 'none';
  pv.style.display = 'block';

  document.getElementById('profileHeaderName').textContent = p.name;
  document.getElementById('pvAvatar').textContent = p.initial;
  document.getElementById('pvAvatar').style.background = p.bg;
  document.getElementById('pvName').textContent = p.name;
  document.getElementById('pvHandle').textContent = p.handle;
  document.getElementById('pvBio').textContent = p.bio;
  document.getElementById('pvXP').textContent = p.xp;
  document.getElementById('pvActivities').textContent = p.activities;
  document.getElementById('pvConnections').textContent = p.connections;
  
  document.getElementById('pvSports').innerHTML = p.sports.map(s => '<div class="pv-sport-tag">' + s + '</div>').join('');
  
  // Render grid feed
  document.getElementById('pvGrid').innerHTML = p.grid.map(function(g) {
    var c = gridColors[g.icon] || ['#f0f0f3','#e4e4ea'];
    return '<div class="grid-item" style="background:linear-gradient(135deg,' + c[0] + ',' + c[1] + ')">' + g.icon + '<div class="g-overlay">' + g.label + '</div></div>';
  }).join('');
  
  document.getElementById('pvMsgBtn').onclick = function() { closeProfile(); openChat(id); };
  
  // Connect button — reads from central state
  var connectBtn = document.getElementById('pvConnectBtn');
  connectBtn.dataset.person = id;
  applyProfileConnStyle(connectBtn, getConnState(id));
  connectBtn.onclick = function() {
    var current = getConnState(id);
    if (current === 'none') {
      setConnState(id, 'pending');
      showToast('Connection request sent to ' + p.name + ' 📩');
      showNotification(p.name, p.initial, p.bg);
    } else if (current === 'pending') {
      setConnState(id, 'none');
      showToast('Request to ' + p.name + ' withdrawn');
    }
  };
  
  // Message button with icon
  var msgBtn = document.getElementById('pvMsgBtn');
  msgBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Message';
  
  document.getElementById('screens').scrollTop = 0;
}

function closeProfile() {
  var el = document.getElementById('profileView');
  el.style.transition = 'transform .22s ease-out, opacity .22s ease-out';
  el.style.transform = 'translateX(100%)';
  el.style.opacity = '0';
  setTimeout(function() {
    el.style.display = 'none';
    el.style.transform = '';
    el.style.opacity = '';
    el.style.transition = '';
    document.getElementById('connectMain').style.display = 'block';
    inboxOpen = false;
  }, 230);
}

// Full List View data
var fullListData = {
  partners: [
    {id:'sam',name:'Sam Rivera',handle:'@samrivera',sports:'Tennis · Surfing · Running · Hiking',dist:'0.8 mi · 4 mutual',bg:'linear-gradient(135deg,var(--blue),var(--pink))',initial:'S',sportTags:['tennis','surfing','running','hiking']},
    {id:'lexi',name:'Lexi Tanaka',handle:'@lexitanaka',sports:'Tennis · Yoga',dist:'1.2 mi · 2 mutual',bg:'linear-gradient(135deg,var(--orange),#fbbf24)',initial:'L',sportTags:['tennis','yoga']},
    {id:'derek',name:'Derek Osei',handle:'@dereko',sports:'Basketball · Gym',dist:'2.1 mi · Rec team',bg:'linear-gradient(135deg,var(--green),#4ade80)',initial:'D',sportTags:['basketball','gym']},
    {id:'kai',name:'Kai Nakamura',handle:'@kainakamura',sports:'Basketball · Soccer · Running · Climbing',dist:'1.5 mi · 3 mutual',bg:'linear-gradient(135deg,var(--pink),var(--orange))',initial:'K',sportTags:['basketball','soccer','running','climbing']},
    {id:'maya',name:'Maya Chen',handle:'@mayachen',sports:'Tennis · Running · Gym · Yoga',dist:'0.6 mi · 5 mutual',bg:'linear-gradient(135deg,var(--blue),var(--pink))',initial:'M',sportTags:['tennis','running','gym','yoga']},
    {id:'jordan',name:'Jordan Park',handle:'@jordanpark',sports:'Surfing · Hiking · Running · Climbing',dist:'1.1 mi · 2 mutual',bg:'linear-gradient(135deg,var(--orange),#fbbf24)',initial:'J',sportTags:['surfing','hiking','running','climbing']},
    {id:'marcus',name:'Marcus T.',handle:'@marcust',sports:'Basketball · Gym · Running',dist:'2.8 mi · 1 mutual',bg:'linear-gradient(135deg,#c2410c,#ea580c)',initial:'M',sportTags:['basketball','gym','running']},
    {id:'alex',name:'Alex R.',handle:'@alexr',sports:'Pickleball · Tennis · Yoga',dist:'1.8 mi · 3 mutual',bg:'linear-gradient(135deg,#ca8a04,#facc15)',initial:'A',sportTags:['pickleball','tennis','yoga']},
  ],
  events: [
    {name:'Sunday Singles Mixer',sport:'🎾 Tennis',detail:'Riviera · Mar 28 · 9AM',going:12,sportTag:'tennis'},
    {name:'Sunrise Run Club',sport:'🏃 Running',detail:'SM Pier · Apr 1 · 6:30AM',going:28,sportTag:'running'},
    {name:'Griffith Group Hike',sport:'🥾 Hiking',detail:'Griffith · Apr 5 · 8AM',going:8,sportTag:'hiking'},
    {name:'Beach Volleyball Jam',sport:'🏐 Volleyball',detail:'SM Beach · Apr 8 · 10AM',going:16,sportTag:'volleyball'},
    {name:'Pickleball Social',sport:'🏓 Pickleball',detail:'SM Courts · Apr 10 · 9AM',going:22,sportTag:'pickleball'},
    {name:'Yoga in the Park',sport:'🧘 Yoga',detail:'Palisades · Apr 12 · 7:30AM',going:18,sportTag:'yoga'},
  ],
  teams: [
    {name:'Westside Buckets',sport:'🏀 Basketball',record:'7-2',loc:'Venice · 1.3 mi',spots:2,idx:0,sportTag:'basketball'},
    {name:'SM United FC',sport:'⚽ Soccer',record:'6-3',loc:'Memorial · 1.8 mi',spots:2,idx:1,sportTag:'soccer'},
    {name:'Beach Vibes VB',sport:'🏐 Volleyball',record:'4-2',loc:'SM Beach · 0.9 mi',spots:4,idx:2,sportTag:'volleyball'},
    {name:'Doubles League',sport:'🎾 Tennis',record:'5-3',loc:'Riviera · 1.0 mi',spots:1,idx:3,sportTag:'tennis'},
    {name:'Dink Dynasty',sport:'🏓 Pickleball',record:'6-1',loc:'SM Courts · 1.8 mi',spots:3,idx:4,sportTag:'pickleball'},
    {name:'SM Run Crew',sport:'🏃 Run Club',record:'Open',loc:'SM Pier · 0.5 mi',spots:99,idx:5,sportTag:'running'},
    {name:'Sender Squad',sport:'🧗 Climbing',record:'V4–V7',loc:'Sender One · 2.2 mi',spots:5,idx:6,sportTag:'climbing'},
    {name:'Yoga & Chill',sport:'🧘 Yoga',record:'12 members',loc:'The Studio · 1.1 mi',spots:3,idx:7,sportTag:'yoga'},
  ]
};

var currentFullListCategory = '';
var currentFullListFilter = 'all';

function openFullListView(category) {
  currentFullListCategory = category;
  currentFullListFilter = 'all';
  var main = document.getElementById('connectMain');
  var fullList = document.getElementById('fullListView');
  var inbox = document.getElementById('inbox');
  var chat = document.getElementById('chatView');
  var profile = document.getElementById('profileView');
  main.style.display = 'none';
  if(inbox) inbox.style.display = 'none';
  if(chat) chat.style.display = 'none';
  if(profile) profile.style.display = 'none';
  
  // Reset and show with fresh animation
  fullList.classList.remove('sliding-out');
  fullList.style.transform = '';
  fullList.style.opacity = '';
  fullList.style.transition = '';
  fullList.style.display = 'block';
  fullList.style.animation = 'none';
  void fullList.offsetWidth; // force reflow
  fullList.style.animation = 'slideInRight .2s ease';

  var titles = {partners:'All Nearby Partners',events:'All Upcoming Events',teams:'All Rec Teams'};
  document.getElementById('fullListTitle').textContent = titles[category] || 'All';
  document.getElementById('fullListSearchInput').value = '';

  // Build filter pills
  var sports = new Set();
  var data = fullListData[category] || [];
  data.forEach(function(item) {
    if (item.sportTags) item.sportTags.forEach(function(s) { sports.add(s); });
    if (item.sportTag) sports.add(item.sportTag);
  });
  var pillsHtml = '<button class="full-list-pill on" onclick="filterFullListBySport(\'all\',this)">All</button>';
  sports.forEach(function(s) {
    pillsHtml += '<button class="full-list-pill" onclick="filterFullListBySport(\'' + s + '\',this)">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>';
  });
  document.getElementById('fullListPills').innerHTML = pillsHtml;

  renderFullList(data, category);
  document.getElementById('screens').scrollTop = 0;
}

function renderFullList(data, category) {
  var container = document.getElementById('fullListItems');
  var html = '';
  data.forEach(function(item) {
    if (category === 'partners') {
      html += '<div class="full-list-item" data-sports="' + item.sportTags.join(',') + '" data-search="' + item.name.toLowerCase() + ' ' + item.handle + ' ' + item.sports.toLowerCase() + '">' +
        '<div class="av" style="width:44px;height:44px;font-size:16px;background:' + item.bg + ';flex-shrink:0">' + item.initial + '</div>' +
        '<div class="full-list-item-info"><div class="full-list-item-name" onclick="closeFullListView();openProfile(\'' + item.id + '\')">' + item.name + '</div><div class="full-list-item-sub">' + item.sports + '</div><div class="full-list-item-meta">📍 ' + item.dist + '</div></div>' +
        '<div class="full-list-item-actions"><button class="shelf-connect" data-person="' + item.id + '" onclick="connectPerson(this,\'' + item.id + '\')">Connect</button><button class="shelf-msg" onclick="closeFullListView();openChat(\'' + item.id + '\')">💬</button></div>' +
      '</div>';
    } else if (category === 'events') {
      html += '<div class="full-list-item" data-sports="' + item.sportTag + '" data-search="' + item.name.toLowerCase() + ' ' + item.sport.toLowerCase() + ' ' + item.detail.toLowerCase() + '">' +
        '<div style="font-size:28px;flex-shrink:0">' + item.sport.split(' ')[0] + '</div>' +
        '<div class="full-list-item-info"><div class="full-list-item-name">' + item.name + '</div><div class="full-list-item-sub">' + item.detail + '</div><div class="full-list-item-meta">+' + item.going + ' going</div></div>' +
        '<button class="btn-sm" style="padding:6px 14px;font-size:10px" onclick="joinEvent(this)">Join</button>' +
      '</div>';
    } else if (category === 'teams') {
      html += '<div class="full-list-item" data-sports="' + item.sportTag + '" data-search="' + item.name.toLowerCase() + ' ' + item.sport.toLowerCase() + ' ' + item.loc.toLowerCase() + '" style="cursor:pointer" onclick="closeFullListView();openTeamPopup(' + item.idx + ')">' +
        '<div style="font-size:28px;flex-shrink:0">' + item.sport.split(' ')[0] + '</div>' +
        '<div class="full-list-item-info"><div class="full-list-item-name">' + item.name + '</div><div class="full-list-item-sub">' + item.sport + ' · ' + item.loc + '</div><div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:16px;font-weight:800;margin-top:2px">' + item.record + '</div></div>' +
        '<div style="text-align:center"><div style="font-size:14px;font-weight:800;color:var(--green)">' + item.spots + '</div><div style="font-size:8px;color:var(--ink3);font-weight:600">spots</div></div>' +
      '</div>';
    }
  });
  container.innerHTML = html;
  // Sync connect button states
  container.querySelectorAll('[data-person]').forEach(function(btn) {
    var pid = btn.dataset.person;
    if (pid && getConnState(pid) === 'pending') {
      applyConnStyle(btn, 'pending');
    }
  });
}

function closeFullListView() {
  var el = document.getElementById('fullListView');
  el.style.animation = 'none';
  el.style.transition = 'transform .22s ease-out, opacity .22s ease-out';
  el.style.transform = 'translateX(100%)';
  el.style.opacity = '0';
  setTimeout(function() {
    el.style.display = 'none';
    el.style.transform = '';
    el.style.opacity = '';
    el.style.transition = '';
    el.style.animation = '';
    document.getElementById('connectMain').style.display = 'block';
  }, 230);
}

// Swipe right to go back from full list view — called from _initConnect after lazy load
function _initFullListSwipe() {
  var startX = 0, startY = 0, swiping = false, tracking = false, mouseDown = false;
  var el = document.getElementById('fullListView');
  if (!el) return;
  
  function getRelX(clientX) {
    var rect = el.getBoundingClientRect();
    return clientX - rect.left;
  }
  
  function dismiss() {
    el.style.transition = 'transform .2s ease-out, opacity .2s ease-out';
    el.style.transform = 'translateX(110%)';
    el.style.opacity = '0';
    setTimeout(function() {
      el.style.display = 'none';
      el.style.transform = '';
      el.style.opacity = '';
      el.style.transition = '';
      document.getElementById('connectMain').style.display = 'block';
    }, 210);
  }
  
  function snapBack() {
    el.style.transition = 'transform .25s cubic-bezier(.2,.9,.3,1), opacity .25s ease';
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
    setTimeout(function() { el.style.transition = ''; }, 260);
  }
  
  function trackMove(dx) {
    if (dx > 0) {
      el.style.transform = 'translateX(' + dx + 'px)';
      el.style.opacity = String(Math.max(0.3, 1 - dx / 350));
    }
  }
  
  function shouldActivate(clientX, target) {
    var relX = getRelX(clientX);
    var handle = document.getElementById('flSwipeEdge');
    var fromHandle = handle && handle.contains(target);
    return relX < 60 || fromHandle;
  }
  
  // Touch events (mobile)
  el.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swiping = shouldActivate(startX, e.target);
    tracking = false;
    if (swiping) el.style.transition = 'none';
  }, {passive:true});
  
  el.addEventListener('touchmove', function(e) {
    if (!swiping) return;
    var dx = e.touches[0].clientX - startX;
    var dy = Math.abs(e.touches[0].clientY - startY);
    if (!tracking && dx > 8 && dx > dy) tracking = true;
    if (tracking) trackMove(dx);
  }, {passive:true});
  
  el.addEventListener('touchend', function(e) {
    if (!swiping) return;
    swiping = false;
    var dx = e.changedTouches[0].clientX - startX;
    if (tracking && dx > 80) { dismiss(); } else { snapBack(); }
    tracking = false;
  }, {passive:true});
  
  // Mouse events (desktop)
  el.addEventListener('mousedown', function(e) {
    if (shouldActivate(e.clientX, e.target)) {
      mouseDown = true; swiping = true; tracking = false;
      startX = e.clientX; startY = e.clientY;
      el.style.transition = 'none';
      e.preventDefault();
    }
  });
  
  window.addEventListener('mousemove', function(e) {
    if (!mouseDown || !swiping) return;
    var dx = e.clientX - startX;
    var dy = Math.abs(e.clientY - startY);
    if (!tracking && dx > 8 && dx > dy) tracking = true;
    if (tracking) trackMove(dx);
  });
  
  window.addEventListener('mouseup', function(e) {
    if (!mouseDown) return;
    mouseDown = false;
    if (!swiping) return;
    swiping = false;
    var dx = e.clientX - startX;
    if (tracking && dx > 80) { dismiss(); } else { snapBack(); }
    tracking = false;
  });
  
  // Click handle as fallback
  var handle = document.getElementById('flSwipeEdge');
  if (handle) {
    handle.addEventListener('click', function() {
      if (!tracking) closeFullListView();
    });
  }
} // end _initFullListSwipe

// Reusable edge-swipe-to-dismiss for overlay views
function setupEdgeSwipe(elId, closeFn) {
  var el = document.getElementById(elId);
  if (!el) return;
  var startX = 0, startY = 0, swiping = false, tracking = false, mouseDown = false;
  function getRelX(cx) { return cx - el.getBoundingClientRect().left; }
  function trackMove(dx) {
    if (dx > 0) { el.style.transform = 'translateX(' + dx + 'px)'; el.style.opacity = String(Math.max(0.3, 1 - dx / 350)); }
  }
  function dismiss() {
    el.style.transition = 'transform .2s ease-out, opacity .2s ease-out';
    el.style.transform = 'translateX(110%)'; el.style.opacity = '0';
    setTimeout(function() { closeFn(); el.style.transform = ''; el.style.opacity = ''; el.style.transition = ''; }, 210);
  }
  function snapBack() {
    el.style.transition = 'transform .25s cubic-bezier(.2,.9,.3,1), opacity .25s ease';
    el.style.transform = 'translateX(0)'; el.style.opacity = '1';
    setTimeout(function() { el.style.transition = ''; }, 260);
  }
  el.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    swiping = getRelX(startX) < 40; tracking = false;
    if (swiping) el.style.transition = 'none';
  }, {passive:true});
  el.addEventListener('touchmove', function(e) {
    if (!swiping) return;
    var dx = e.touches[0].clientX - startX, dy = Math.abs(e.touches[0].clientY - startY);
    if (!tracking && dx > 8 && dx > dy) tracking = true;
    if (tracking) trackMove(dx);
  }, {passive:true});
  el.addEventListener('touchend', function(e) {
    if (!swiping) return; swiping = false;
    if (tracking && (e.changedTouches[0].clientX - startX) > 80) dismiss(); else snapBack();
    tracking = false;
  }, {passive:true});
  el.addEventListener('mousedown', function(e) {
    if (getRelX(e.clientX) < 40) { mouseDown = true; swiping = true; tracking = false; startX = e.clientX; startY = e.clientY; el.style.transition = 'none'; e.preventDefault(); }
  });
  window.addEventListener('mousemove', function(e) {
    if (!mouseDown || !swiping) return;
    var dx = e.clientX - startX, dy = Math.abs(e.clientY - startY);
    if (!tracking && dx > 8 && dx > dy) tracking = true;
    if (tracking) trackMove(dx);
  });
  window.addEventListener('mouseup', function(e) {
    if (!mouseDown) return; mouseDown = false; if (!swiping) return; swiping = false;
    if (tracking && (e.clientX - startX) > 80) dismiss(); else snapBack();
    tracking = false;
  });
}

// Edge swipe bindings moved to _initConnect()

function filterFullList(query) {
  var q = query.toLowerCase();
  document.querySelectorAll('.full-list-item').forEach(function(item) {
    var searchText = item.dataset.search || '';
    var sportMatch = currentFullListFilter === 'all' || (item.dataset.sports || '').indexOf(currentFullListFilter) !== -1;
    var textMatch = !q || searchText.indexOf(q) !== -1;
    item.style.display = (sportMatch && textMatch) ? 'flex' : 'none';
  });
}

function filterFullListBySport(sport, btn) {
  currentFullListFilter = sport;
  document.querySelectorAll('.full-list-pill').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  filterFullList(document.getElementById('fullListSearchInput').value);
}

// Profile picture upload
// Missions expandable drawer
// Recap W/M/Y segmented toggle
var recapData = {
  week: [
    {h:'55%',c:'g',l:'M'},{h:'80%',c:'g',l:'T'},{h:'35%',c:'b',l:'W'},{h:'95%',c:'g',l:'T'},{h:'25%',c:'b',l:'F'},{h:'10%',c:'',l:'S'},{h:'10%',c:'',l:'S'}
  ],
  month: [
    {h:'65%',c:'g',l:'W1'},{h:'85%',c:'g',l:'W2'},{h:'45%',c:'b',l:'W3'},{h:'70%',c:'g',l:'W4'}
  ],
  year: [
    {h:'30%',c:'b',l:'J'},{h:'40%',c:'b',l:'F'},{h:'75%',c:'g',l:'M'},{h:'60%',c:'g',l:'A'},{h:'50%',c:'b',l:'M'},{h:'85%',c:'g',l:'J'},{h:'90%',c:'g',l:'J'},{h:'80%',c:'g',l:'A'},{h:'65%',c:'g',l:'S'},{h:'55%',c:'b',l:'O'},{h:'70%',c:'g',l:'N'},{h:'40%',c:'b',l:'D'}
  ]
};
function switchRecap(period, btn) {
  document.querySelectorAll('.recap .seg-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var bars = document.getElementById('recapBars');
  var data = recapData[period];
  bars.innerHTML = data.map(function(d) {
    var bg = d.c === 'g' ? 'var(--green)' : d.c === 'b' ? 'var(--blue)' : 'var(--surface3)';
    return '<div class="recap-col"><div class="recap-bar" style="height:' + d.h + ';background:' + bg + '"></div><div class="recap-lbl">' + d.l + '</div></div>';
  }).join('');
}

// Rec Team popup with scoreboard stats
var teamData = [
  {name:'Westside Buckets',sport:'🏀 BASKETBALL',gradient:'linear-gradient(135deg,#c2410c,#ea580c)',w:7,l:2,loc:'Venice Beach Courts · 1.3 mi',spots:2,schedule:'Tue & Thu · 7PM',format:'Competitive 5v5',need:'SG, PF',ages:'22-30',vibe:'Competitive · Intense · Win-focused',captain:'Marcus T.',captainId:'marcus'},
  {name:'SM United FC',sport:'⚽ SOCCER',gradient:'linear-gradient(135deg,#15803d,#22c55e)',w:6,l:3,loc:'Memorial Park · 1.8 mi',spots:2,schedule:'Sundays · 4PM',format:'Co-ed 7v7',need:'Midfielder, Striker',ages:'All ages',vibe:'Chill · Inclusive · All levels',captain:'Derek O.',captainId:'derek'},
  {name:'Beach Vibes VB',sport:'🏐 VOLLEYBALL',gradient:'linear-gradient(135deg,#1d4ed8,#3b82f6)',w:4,l:2,loc:'Santa Monica Beach · 0.9 mi',spots:4,schedule:'Saturdays · 11AM',format:'Casual 6v6 beach',need:'Any position',ages:'18+',vibe:'Relaxed · Social · Beginners OK',captain:'Jordan P.',captainId:'jordan'},
  {name:'Doubles League',sport:'🎾 TENNIS',gradient:'linear-gradient(135deg,#be185d,#ec4899)',w:5,l:3,loc:'Riviera Tennis Club · 1.0 mi',spots:1,schedule:'Weeknights · 7PM',format:'Mixed doubles league',need:'1 partner · NTRP 3.5+',ages:'21-35',vibe:'Competitive · Fun · Social post-match',captain:'Lexi T.',captainId:'lexi'},
  {name:'Dink Dynasty',sport:'🏓 PICKLEBALL',gradient:'linear-gradient(135deg,#ca8a04,#facc15)',w:6,l:1,loc:'Santa Monica Courts · 1.8 mi',spots:3,schedule:'Sat & Sun · 10AM',format:'Casual doubles round-robin',need:'Any level · Just show up',ages:'All ages',vibe:'Social · Inclusive · Low-barrier · Post-game smoothies',captain:'Alex R.',captainId:'alex'},
  {name:'SM Run Crew',sport:'🏃 RUN CLUB',gradient:'linear-gradient(135deg,#0369a1,#0ea5e9)',w:31,l:0,loc:'Santa Monica Pier · 0.5 mi',spots:99,schedule:'Tue & Sat · 6:30AM',format:'Open group run · All paces',need:'All paces welcome',ages:'All ages',vibe:'Social · Energetic · Community-first · Post-run coffee',captain:'Jordan P.',captainId:'jordan'},
  {name:'Sender Squad',sport:'🧗 CLIMBING',gradient:'linear-gradient(135deg,#92400e,#f97316)',w:0,l:0,loc:'Sender One · 2.2 mi',spots:5,schedule:'Wed & Fri · 6PM',format:'Bouldering crew · V4–V7',need:'Intermediate climbers',ages:'18-35',vibe:'Hype · Supportive · Serious sends · Post-climb tacos',captain:'Kai N.',captainId:'kai'},
  {name:'Yoga & Chill',sport:'🧘 YOGA',gradient:'linear-gradient(135deg,#7c3aed,#a78bfa)',w:0,l:0,loc:'The Studio · 1.1 mi',spots:3,schedule:'Thursdays · 7PM',format:'Flow yoga · All levels',need:'Any experience level',ages:'All ages',vibe:'Calm · Inclusive · Mindful · Herbal tea after',captain:'Lexi T.',captainId:'lexi'},
];

function openTeamPopup(i) {
  var t = teamData[i];
  if (!t) return;
  var overlay = document.createElement('div');
  overlay.className = 'ig-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = '<div class="team-popup">' +
    '<div class="team-popup-header" style="background:' + t.gradient + '">' + t.sport + '</div>' +
    '<div class="team-popup-body">' +
      '<div class="team-popup-name">' + t.name + '</div>' +
      '<div class="team-popup-record"><span class="sb-w">' + t.w + '</span>-<span class="sb-l">' + t.l + '</span></div>' +
      '<div class="team-stat-grid">' +
        '<div class="team-stat-item"><div class="team-stat-val">' + t.spots + '</div><div class="team-stat-lbl">Spots Left</div></div>' +
        '<div class="team-stat-item"><div class="team-stat-val">' + t.format.split(' ')[0] + '</div><div class="team-stat-lbl">Format</div></div>' +
        '<div class="team-stat-item"><div class="team-stat-val">' + t.ages + '</div><div class="team-stat-lbl">Ages</div></div>' +
        '<div class="team-stat-item" style="cursor:pointer" onclick="this.closest(\'.ig-overlay\').remove();openProfile(\'' + t.captainId + '\')"><div class="team-stat-val" style="text-decoration:underline;color:#4ade80">' + t.captain + '</div><div class="team-stat-lbl">Captain ›</div></div>' +
      '</div>' +
      '<div class="team-popup-detail">📍 ' + t.loc + '</div>' +
      '<div class="team-popup-detail">📅 ' + t.schedule + ' · ' + t.format + '</div>' +
      '<div class="team-popup-detail">🎯 Positions needed: ' + t.need + '</div>' +
      '<div class="team-popup-detail">✨ Team vibe: ' + t.vibe + '</div>' +
      '<div class="team-popup-actions">' +
        '<button class="btn-fill" style="flex:1;font-size:12px;padding:10px" onclick="showToast(\'Request sent! 🏆\');this.closest(\'.ig-overlay\').remove()">Request to Join</button>' +
        '<button class="btn-sm" style="flex:1;text-align:center;font-size:12px;padding:10px;color:#fff;border-color:rgba(255,255,255,.3)" onclick="this.closest(\'.ig-overlay\').remove();openChat(\'' + t.captainId + '\')">Message Captain</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  document.body.appendChild(overlay);
}

// Instagram-style grid popup
const gridActivities = [
  {icon:'🎾',bg:['#dcfce7','#bbf7d0'],label:'1h 20m',sport:'Tennis',loc:'Riviera Courts',date:'Today',caption:'Quick singles sesh. Forehand feeling clean 💫',likes:18,comments:4},
  {icon:'🏃',bg:['#dbeafe','#bfdbfe'],label:'5.2 mi',sport:'Running',loc:'SM Beach Path',date:'Yesterday',caption:'Morning miles > morning meetings',likes:24,comments:6},
  {icon:'🥾',bg:['#d6d3d1','#e7e5e4'],label:'4.6 mi',sport:'Hiking',loc:'Runyon Canyon',date:'2 days ago',caption:'Touch grass? I climbed it. 🏔️',likes:31,comments:8},
  {icon:'🏄',bg:['#e0e7ff','#c7d2fe'],label:'2h 10m',sport:'Surfing',loc:'El Porto Beach',date:'3 days ago',caption:'Dawn patrol. Zero regrets, minor hypothermia.',likes:42,comments:11},
  {icon:'🧗',bg:['#fed7aa','#fdba74'],label:'1h 30m',sport:'Climbing',loc:'Sender One',date:'4 days ago',caption:'Sent a V5 today. Fingers are wrecked but ego is thriving.',likes:27,comments:5},
  {icon:'🎾',bg:['#dcfce7','#bbf7d0'],label:'55 min',sport:'Tennis',loc:'Riviera Courts',date:'5 days ago',caption:'Lost 6-4 but won in spirit (copium)',likes:15,comments:7},
  {icon:'🏋️',bg:['#fef3c7','#fde68a'],label:'45 min',sport:'Gym',loc:'Equinox',date:'6 days ago',caption:'Leg day. Walking is now a privilege not a right.',likes:20,comments:3},
  {icon:'🥾',bg:['#d6d3d1','#e7e5e4'],label:'6.1 mi',sport:'Hiking',loc:'Griffith Observatory Trail',date:'1 week ago',caption:'Made it to the top. Almost passed out. 10/10 would recommend.',likes:38,comments:9},
  {icon:'🧗',bg:['#fed7aa','#fdba74'],label:'2h',sport:'Climbing',loc:'Sender One',date:'1 week ago',caption:'Bouldering with the crew. Kai fell 6 times on the same V3 lmao',likes:33,comments:12},
  {icon:'🏃',bg:['#dbeafe','#bfdbfe'],label:'3.8 mi',sport:'Running',loc:'Venice Boardwalk',date:'8 days ago',caption:'Running at sunset >> therapy',likes:29,comments:5},
  {icon:'🧘',bg:['#fce7f3','#fbcfe8'],label:'30 min',sport:'Yoga',loc:'Home',date:'9 days ago',caption:'Hot yoga. I am now a puddle.',likes:14,comments:2},
  {icon:'🎾',bg:['#dcfce7','#a7f3d0'],label:'1h 05m',sport:'Tennis',loc:'Riviera Courts',date:'10 days ago',caption:'Doubles with Sam & Lexi. We lost but the vibes were immaculate.',likes:22,comments:6},
];

function openGridPost(index) {
  const a = gridActivities[index];
  if (!a) return;
  const overlay = document.createElement('div');
  overlay.className = 'ig-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="ig-popup">
      <div class="ig-popup-img" style="background:linear-gradient(135deg,${a.bg[0]},${a.bg[1]})">
        <span style="font-size:60px">${a.icon}</span>
        <div class="ig-popup-stats">
          <div class="ig-popup-stat"><div class="ig-popup-stat-v">${a.label}</div><div class="ig-popup-stat-l">${a.sport}</div></div>
          <div class="ig-popup-stat"><div class="ig-popup-stat-v">📍</div><div class="ig-popup-stat-l">${a.loc}</div></div>
        </div>
      </div>
      <div class="ig-popup-body">
        <div class="ig-popup-top">
          <div class="av" style="background:linear-gradient(135deg,var(--green),var(--blue));width:28px;height:28px;font-size:11px">E</div>
          <div class="ig-popup-name">Elise Nguyen</div>
          <div class="ig-popup-date">· ${a.date}</div>
        </div>
        <div class="ig-popup-caption">${a.caption}</div>
      </div>
      <div class="ig-popup-actions">
        <button class="ig-popup-act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>${a.likes}</button>
        <button class="ig-popup-act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>${a.comments}</button>
        <button class="ig-popup-act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const imgUrl = e.target.result;
    // Update You tab avatar
    const youAv = document.getElementById('youAvatar');
    youAv.innerHTML = `<img src="${imgUrl}" alt="Profile"><div class="av-cam">📷</div>`;
    // Update Home tab avatar
    const homeAv = document.getElementById('homeAvatar');
    homeAv.innerHTML = `<img src="${imgUrl}" alt="Profile">`;
    homeAv.style.overflow = 'hidden';
  };
  reader.readAsDataURL(file);
}

// === CONNECT FUNCTIONAL BUTTONS (double-click to undo) ===
// Central connection state store
var connectionState = {};

function getConnState(personId) {
  return connectionState[personId] || 'none';
}

function setConnState(personId, state) {
  connectionState[personId] = state;
  // Sync ALL buttons for this person across shelf, full list, profile
  document.querySelectorAll('[data-person="' + personId + '"]').forEach(function(btn) {
    applyConnStyle(btn, state);
  });
  // Sync profile button if viewing this person
  var pvBtn = document.getElementById('pvConnectBtn');
  if (pvBtn && pvBtn.dataset.person === personId) {
    applyProfileConnStyle(pvBtn, state);
  }
}

function applyConnStyle(btn, state) {
  if (state === 'pending') {
    btn.textContent = 'Pending';
    btn.style.background = 'var(--surface2)';
    btn.style.color = 'var(--ink4)';
    btn.style.border = '1.5px solid var(--surface3)';
  } else {
    btn.textContent = 'Connect';
    btn.style.background = 'var(--green)';
    btn.style.color = '#fff';
    btn.style.border = 'none';
  }
}

function applyProfileConnStyle(btn, state) {
  if (state === 'pending') {
    btn.dataset.state = 'pending';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Pending';
    btn.className = 'pv-action-btn pv-pending-btn';
  } else {
    btn.dataset.state = 'none';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Request to Connect';
    btn.className = 'pv-action-btn pv-connect-btn';
  }
}

function connectPerson(btn, personId) {
  var id = personId || btn.dataset.person;
  if (!id) return;
  var current = getConnState(id);
  if (current === 'pending') {
    setConnState(id, 'none');
    showToast('Request withdrawn');
  } else {
    setConnState(id, 'pending');
    showToast('Connection request sent! 📩');
  }
}

function joinEvent(btn) {
  const countEl = btn.parentElement.querySelector('.evt-count');
  if (btn.dataset.joined === 'true') {
    // Undo
    btn.textContent = 'Join';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.dataset.joined = 'false';
    if (countEl) {
      const num = parseInt(countEl.textContent.match(/\d+/)[0]) - 1;
      countEl.textContent = '+' + num + ' going';
    }
    showToast('Left the event');
  } else {
    btn.textContent = '✓ Joined';
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
    btn.dataset.joined = 'true';
    if (countEl) {
      const num = parseInt(countEl.textContent.match(/\d+/)[0]) + 1;
      countEl.textContent = '+' + num + ' going';
    }
    showToast('You\'re in! See you there 🎉');
  }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// === RECORD TAB — Phase-based: Setup → Record → Edit ===

var cameraStream = null, facingMode = 'environment', recMode = 'video', flashOn = false;
var isRecording = false, recRAF = null, recStartTime = 0, recSeconds = 0;
var countdownActive = false;

// Sport themes: color, rgb, stats labels, units, icons
var sportThemes = {
  run:{color:'#22c55e',rgb:'34,197,94',icon:'🏃',label:'Run',cat:'foot',stats:["Distance", "Pace", "Heart Rate"],units:["mi", "/mi", "bpm"],vals:["0.00", "--:--", "--"]},
  walk:{color:'#84cc16',rgb:'132,204,22',icon:'🚶',label:'Walk',cat:'foot',stats:["Distance", "Steps", "Heart Rate"],units:["mi", "k", "bpm"],vals:["0.00", "0", "--"]},
  hike:{color:'#78716c',rgb:'120,113,108',icon:'🥾',label:'Hike',cat:'foot',stats:["Distance", "Elevation", "Heart Rate"],units:["mi", "ft", "bpm"],vals:["0.00", "0", "--"]},
  trail:{color:'#16a34a',rgb:'22,163,74',icon:'🌲',label:'Trail Run',cat:'foot',stats:["Distance", "Elevation", "Heart Rate"],units:["mi", "ft", "bpm"],vals:["0.00", "0", "--"]},
  cycle:{color:'#3b82f6',rgb:'59,130,246',icon:'🚴',label:'Cycle',cat:'cycle',stats:["Distance", "Speed", "Heart Rate"],units:["mi", "mph", "bpm"],vals:["0.00", "0.0", "--"]},
  mtb:{color:'#1d4ed8',rgb:'29,78,216',icon:'🚵',label:'MTB',cat:'cycle',stats:["Distance", "Elevation", "Heart Rate"],units:["mi", "ft", "bpm"],vals:["0.00", "0", "--"]},
  gravel:{color:'#2563eb',rgb:'37,99,235',icon:'🚵',label:'Gravel',cat:'cycle',stats:["Distance", "Speed", "Heart Rate"],units:["mi", "mph", "bpm"],vals:["0.00", "0.0", "--"]},
  ebike:{color:'#0ea5e9',rgb:'14,165,233',icon:'⚡',label:'E-Bike',cat:'cycle',stats:["Distance", "Speed", "Assist"],units:["mi", "mph", "%"],vals:["0.00", "0.0", "0"]},
  swim:{color:'#0ea5e9',rgb:'14,165,233',icon:'🏊',label:'Swim',cat:'water',stats:["Laps", "Distance", "Heart Rate"],units:["", "yd", "bpm"],vals:["0", "0", "--"]},
  surf:{color:'#06b6d4',rgb:'6,182,212',icon:'🏄',label:'Surf',cat:'water',stats:["Waves", "Session", "Heart Rate"],units:["", "min", "bpm"],vals:["0", "0", "--"]},
  kayak:{color:'#0891b2',rgb:'8,145,178',icon:'🛶',label:'Kayak',cat:'water',stats:["Distance", "Pace", "Heart Rate"],units:["mi", "/mi", "bpm"],vals:["0.00", "--:--", "--"]},
  sup:{color:'#22d3ee',rgb:'34,211,238',icon:'🏄',label:'SUP',cat:'water',stats:["Distance", "Speed", "Heart Rate"],units:["mi", "mph", "bpm"],vals:["0.00", "0.0", "--"]},
  row:{color:'#0284c7',rgb:'2,132,199',icon:'🚣',label:'Row',cat:'water',stats:["Distance", "Split", "Strokes"],units:["mi", "/500m", "spm"],vals:["0.00", "--:--", "0"]},
  windsurf:{color:'#0369a1',rgb:'3,105,161',icon:'🏄',label:'Windsurf',cat:'water',stats:["Distance", "Speed", "Heart Rate"],units:["mi", "mph", "bpm"],vals:["0.00", "0.0", "--"]},
  tennis:{color:'#eab308',rgb:'234,179,8',icon:'🎾',label:'Tennis',cat:'court',stats:["Rally", "Aces", "Calories"],units:["", "", "kcal"],vals:["0", "0", "0"]},
  pickle:{color:'#84cc16',rgb:'132,204,22',icon:'🏓',label:'Pickleball',cat:'court',stats:["Rally", "Time", "Calories"],units:["", "min", "kcal"],vals:["0", "0", "0"]},
  badminton:{color:'#ca8a04',rgb:'202,138,4',icon:'🏸',label:'Badminton',cat:'court',stats:["Sets", "Time", "Calories"],units:["", "min", "kcal"],vals:["0", "0", "0"]},
  squash:{color:'#d97706',rgb:'217,119,6',icon:'🎾',label:'Squash',cat:'court',stats:["Games", "Time", "Calories"],units:["", "min", "kcal"],vals:["0", "0", "0"]},
  padel:{color:'#f59e0b',rgb:'245,158,11',icon:'🎾',label:'Padel',cat:'court',stats:["Sets", "Time", "Calories"],units:["", "min", "kcal"],vals:["0", "0", "0"]},
  racquetball:{color:'#fbbf24',rgb:'251,191,36',icon:'🎾',label:'Racquetball',cat:'court',stats:["Games", "Time", "Calories"],units:["", "min", "kcal"],vals:["0", "0", "0"]},
  soccer:{color:'#22c55e',rgb:'34,197,94',icon:'⚽',label:'Soccer',cat:'team',stats:["Distance", "Time", "Heart Rate"],units:["mi", "min", "bpm"],vals:["0.00", "0", "--"]},
  basketball:{color:'#f97316',rgb:'249,115,22',icon:'🏀',label:'Basketball',cat:'team',stats:["Points", "Time", "Heart Rate"],units:["", "min", "bpm"],vals:["0", "0", "--"]},
  volleyball:{color:'#3b82f6',rgb:'59,130,246',icon:'🏐',label:'Volleyball',cat:'team',stats:["Sets", "Time", "Heart Rate"],units:["", "min", "bpm"],vals:["0", "0", "--"]},
  football:{color:'#7c3aed',rgb:'124,58,237',icon:'🏈',label:'Football',cat:'team',stats:["Distance", "Time", "Heart Rate"],units:["mi", "min", "bpm"],vals:["0.00", "0", "--"]},
  lacrosse:{color:'#db2777',rgb:'219,39,119',icon:'🥍',label:'Lacrosse',cat:'team',stats:["Distance", "Time", "Heart Rate"],units:["mi", "min", "bpm"],vals:["0.00", "0", "--"]},
  cricket:{color:'#16a34a',rgb:'22,163,74',icon:'🏏',label:'Cricket',cat:'team',stats:["Runs", "Overs", "Heart Rate"],units:["", "", "bpm"],vals:["0", "0", "--"]},
  lift:{color:'#f97316',rgb:'249,115,22',icon:'🏋️',label:'Lift',cat:'strength',stats:["Reps", "Sets", "Heart Rate"],units:["", "", "bpm"],vals:["0", "0", "--"]},
  crossfit:{color:'#ef4444',rgb:'239,68,68',icon:'💪',label:'CrossFit',cat:'strength',stats:["Rounds", "Reps", "Heart Rate"],units:["", "", "bpm"],vals:["0", "0", "--"]},
  hiit:{color:'#dc2626',rgb:'220,38,38',icon:'⚡',label:'HIIT',cat:'strength',stats:["Rounds", "Time", "Calories"],units:["", "min", "kcal"],vals:["0", "0", "0"]},
  yoga:{color:'#a855f7',rgb:'168,85,247',icon:'🧘',label:'Yoga',cat:'strength',stats:["Duration", "Flow", "Calories"],units:["min", "", "kcal"],vals:["0", "☯", "0"]},
  pilates:{color:'#ec4899',rgb:'236,72,153',icon:'🤸',label:'Pilates',cat:'strength',stats:["Duration", "Reps", "Calories"],units:["min", "", "kcal"],vals:["0", "0", "0"]},
  climb:{color:'#f97316',rgb:'249,115,22',icon:'🧗',label:'Climb',cat:'strength',stats:["Grade", "Time", "Calories"],units:["", "min", "kcal"],vals:["V0", "0", "0"]},
  ski:{color:'#60a5fa',rgb:'96,165,250',icon:'⛷️',label:'Ski',cat:'winter',stats:["Distance", "Speed", "Runs"],units:["mi", "mph", ""],vals:["0.00", "0.0", "0"]},
  snowboard:{color:'#7c3aed',rgb:'124,58,237',icon:'🏂',label:'Snowboard',cat:'winter',stats:["Distance", "Speed", "Runs"],units:["mi", "mph", ""],vals:["0.00", "0.0", "0"]},
  xcski:{color:'#3b82f6',rgb:'59,130,246',icon:'⛷️',label:'XC Ski',cat:'winter',stats:["Distance", "Pace", "Heart Rate"],units:["mi", "/mi", "bpm"],vals:["0.00", "--:--", "--"]},
  golf:{color:'#16a34a',rgb:'22,163,74',icon:'⛳',label:'Golf',cat:'other',stats:["Holes", "Strokes", "Distance"],units:["", "", "mi"],vals:["0", "0", "0.00"]},
  skate:{color:'#60a5fa',rgb:'96,165,250',icon:'⛸️',label:'Skate',cat:'other',stats:["Distance", "Speed", "Heart Rate"],units:["mi", "mph", "bpm"],vals:["0.00", "0.0", "--"]},
  dance:{color:'#ec4899',rgb:'236,72,153',icon:'💃',label:'Dance',cat:'other',stats:["Duration", "Steps", "Calories"],units:["min", "", "kcal"],vals:["0", "0", "0"]},
  martial:{color:'#ef4444',rgb:'239,68,68',icon:'🥊',label:'Martial Arts',cat:'other',stats:["Rounds", "Time", "Heart Rate"],units:["", "min", "bpm"],vals:["0", "0", "--"]},
  horse:{color:'#92400e',rgb:'146,64,14',icon:'🐎',label:'Horse Ride',cat:'other',stats:["Distance", "Time", "Heart Rate"],units:["mi", "min", "bpm"],vals:["0.00", "0", "--"]},
};

var currentSport = 'run';

function selectSport(btn) {
  document.querySelectorAll('.sg-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSport = btn.dataset.sport;
  var t = sportThemes[currentSport];

  // Update CSS variable on rally-rec element
  var rec = document.getElementById('rallyRec');
  if (rec) {
    rec.style.setProperty('--sport-color', t.color);
    rec.style.setProperty('--sport-rgb', t.rgb);
  }
  // Update setup background glow
  var bg = document.getElementById('setupBg');
  if (bg) bg.style.background = 'radial-gradient(circle at 50% 0%, ' + t.color + ', transparent 70%)';

  // Update start button
  var startIcon = document.getElementById('setupStartIcon');
  if (startIcon) startIcon.textContent = t.icon;

  // Update stats preview pills
  var pills = ['ssp0','ssp1','ssp2'];
  var icons = ['📍','⚡','❤️'];
  t.stats.forEach(function(s, i) {
    var el = document.getElementById(pills[i]);
    if (el) el.textContent = icons[i] + ' ' + s;
  });
}

function toggleCat(head) {
  var grid = head.nextElementSibling;
  var arr  = head.querySelector('.scat-arr');
  var open = grid.style.maxHeight && grid.style.maxHeight !== '0px';
  grid.style.maxHeight = open ? '0px' : '400px';
  if (arr) arr.style.transform = open ? '' : 'rotate(90deg)';
}

function goToRecord() {
  document.getElementById('rpSetup').classList.remove('active');
  document.getElementById('rpRecord').classList.add('active');
  document.getElementById('rpEdit').classList.remove('active');

  var t = sportThemes[currentSport];

  // Set sport badge
  var badge = document.getElementById('rrSportBadge');
  if (badge) badge.textContent = t.icon + ' ' + t.label;

  // Update stat cards
  for (var i = 0; i < 3; i++) {
    var lbl = document.getElementById('statLabel' + i);
    var val = document.getElementById('statValue' + i);
    var unit = document.getElementById('statUnit' + i);
    if (lbl) lbl.textContent = t.stats[i];
    if (val) val.textContent = t.values[i];
    if (unit) unit.textContent = t.units[i];
  }

  // Init camera
  initCamera();
}

function goToSetup() {
  stopRec();
  stopCamera();
  document.getElementById('rpSetup').classList.add('active');
  document.getElementById('rpRecord').classList.remove('active');
  document.getElementById('rpEdit').classList.remove('active');
}

function switchTpl(name, btn) {
  document.querySelectorAll('.tpl').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.tp-btn').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById('tpl' + name.charAt(0).toUpperCase() + name.slice(1));
  if (el) el.classList.add('active');
  if (btn) btn.classList.add('active');
}

function finishSession() {
  stopRec();
  stopCamera();
  var t = sportThemes[currentSport];
  var timer = document.getElementById('recTimer');
  var elapsed = timer ? timer.textContent : '00:00';
  var s0 = document.getElementById('statValue0');
  var s1 = document.getElementById('statValue1');
  var s2 = document.getElementById('statValue2');
  var dist = s0 ? s0.textContent : '0.00';
  var pace = s1 ? s1.textContent : '--:--';
  var bpm  = s2 ? s2.textContent : '--';

  // Sport bg on clip preview
  var clipBg = document.getElementById('clipBg');
  if (clipBg) clipBg.style.background = 'linear-gradient(160deg,color-mix(in srgb,' + t.color + ' 15%,#000),#0a0a0a 70%)';

  // RAW template
  var rawSport = document.getElementById('rawSport'); if (rawSport) rawSport.textContent = t.label;
  var rawDate  = document.getElementById('rawDate');  if (rawDate)  rawDate.textContent  = new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}).toUpperCase();
  var rawHero  = document.getElementById('rawHero');
  if (rawHero) rawHero.innerHTML = dist + '<span class="tpl-raw-unit" id="rawUnit">' + t.units[0] + '</span>';
  var rawS1 = document.getElementById('rawS1'); if (rawS1) rawS1.textContent = elapsed;
  var rawS2 = document.getElementById('rawS2'); if (rawS2) rawS2.textContent = pace;
  var rawS3 = document.getElementById('rawS3'); if (rawS3) rawS3.textContent = bpm;
  var rawL1 = document.getElementById('rawL1'); if (rawL1) rawL1.textContent = 'TIME';
  var rawL2 = document.getElementById('rawL2'); if (rawL2) rawL2.textContent = t.stats[1];
  var rawL3 = document.getElementById('rawL3'); if (rawL3) rawL3.textContent = t.stats[2];

  // LOUD template
  var loudTag  = document.getElementById('loudTag');  if (loudTag)  loudTag.textContent  = t.label;
  var loudHero = document.getElementById('loudHero'); if (loudHero) loudHero.textContent = dist;
  var loudUnit = document.getElementById('loudUnit'); if (loudUnit) loudUnit.textContent = t.units[0].toUpperCase();
  var loudS1   = document.getElementById('loudS1');   if (loudS1)   loudS1.textContent   = elapsed;
  var loudS2   = document.getElementById('loudS2');   if (loudS2)   loudS2.textContent   = pace + ' /' + t.units[0];
  var loudS3   = document.getElementById('loudS3');   if (loudS3)   loudS3.textContent   = bpm + ' bpm';

  // CLEAN template
  var cleanSport = document.getElementById('cleanSport'); if (cleanSport) cleanSport.textContent = t.label;
  var cleanBig   = document.getElementById('cleanBig');
  if (cleanBig) cleanBig.innerHTML = dist + ' <span id="cleanUnit">' + t.units[0] + '</span>';
  var cleanS1 = document.getElementById('cleanS1'); if (cleanS1) cleanS1.textContent = elapsed;
  var cleanS2 = document.getElementById('cleanS2'); if (cleanS2) cleanS2.textContent = pace;
  var cleanS3 = document.getElementById('cleanS3'); if (cleanS3) cleanS3.textContent = bpm;
  var cleanL1 = document.getElementById('cleanL1'); if (cleanL1) cleanL1.textContent = 'time';
  var cleanL2 = document.getElementById('cleanL2'); if (cleanL2) cleanL2.textContent = t.stats[1].toLowerCase();
  var cleanL3 = document.getElementById('cleanL3'); if (cleanL3) cleanL3.textContent = t.stats[2].toLowerCase();
  var cleanXP = document.getElementById('cleanXP'); if (cleanXP) cleanXP.textContent = '+' + Math.max(10, Math.floor(recSeconds/6)) + ' XP';

  // XP badge
  var xpEl = document.getElementById('editXP'); if (xpEl) xpEl.textContent = Math.max(10, Math.floor(recSeconds/6));

  // Post button color
  var postBtn = document.getElementById('editPostBtn');
  if (postBtn) postBtn.style.background = t.color;

  // Reset to Raw template
  switchTpl('raw', document.querySelector('.tp-btn'));

  document.getElementById('rpSetup').classList.remove('active');
  document.getElementById('rpRecord').classList.remove('active');
  document.getElementById('rpEdit').classList.add('active');
}

function postSession() {
  var caption = document.getElementById('editCaption');
  var txt = caption ? caption.value.trim() : '';
  showToast('🚀 Posted to Rally!' + (txt ? ' "' + txt.substring(0,20) + (txt.length>20?'…':'') + '"' : ''));
  goToSetup();
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(function(t) { t.stop(); });
    cameraStream = null;
  }
  var v = document.getElementById('cameraFeed');
  if (v) v.srcObject = null;
}

function recTapInit() {
  try { if (!cameraStream) initCamera(); } catch(e) {}
}

async function initCamera() {
  try {
    var v = document.getElementById('cameraFeed');
    var c = document.getElementById('recCenter');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('📹 Camera preview limited'); return;
    }
    if (cameraStream) cameraStream.getTracks().forEach(function(t){t.stop();});
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:facingMode, width:{ideal:1280}, height:{ideal:720}}, audio:true
    });
    v.srcObject = cameraStream;
    if (c) c.style.display = 'none';
  } catch(e) {
    showToast('📹 Tap to record');
  }
}

async function switchCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  await initCamera();
  showToast('🔄 Camera flipped');
}

function toggleFlash() {
  flashOn = !flashOn;
  var btn = document.getElementById('flashBtn');
  if (btn) btn.textContent = flashOn ? '🔦' : '⚡';
  if (cameraStream) {
    var track = cameraStream.getVideoTracks()[0];
    if (track && track.getCapabilities && track.getCapabilities().torch) {
      track.applyConstraints({advanced:[{torch:flashOn}]});
    }
  }
  showToast(flashOn ? '⚡ Flash on' : '🔦 Flash off');
}

function setMode(mode, btn) {
  recMode = mode;
  document.querySelectorAll('.rrm').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
}

function recDown() {
  holdTimer = setTimeout(function(){ if (!isRecording) startRec(); }, 300);
}
function recUp() {
  clearTimeout(holdTimer);
  if (!isRecording) {
    if (recMode === 'photo') snapPhoto(); else toggleRec();
  }
}
var holdTimer = null;

function toggleRec() { if (isRecording) stopRec(); else startRec(); }

function startRec() {
  isRecording = true;
  recSeconds = 0;
  recStartTime = performance.now();
  var btn = document.getElementById('recMain');
  var badge = document.getElementById('recBadge');
  var timerEl = document.getElementById('recTimer');
  if (btn) btn.classList.add('recording');
  if (badge) badge.style.display = 'flex';
  if (timerEl) timerEl.style.opacity = '1';

  function tick(now) {
    if (!isRecording) return;
    recSeconds = Math.floor((now - recStartTime) / 1000);
    var mn = String(Math.floor(recSeconds / 60)).padStart(2,'0');
    var sc = String(recSeconds % 60).padStart(2,'0');
    if (timerEl) timerEl.textContent = mn + ':' + sc;

    // Animate HR ring
    var zone = Math.min(recSeconds / 120, 1);
    var ring = document.getElementById('hrRing');
    if (ring) {
      ring.style.strokeDashoffset = String(204 - (204 * zone));
    }

    // Simulate stats
    var t = sportThemes[currentSport];
    var dist = (recSeconds / 600).toFixed(2);
    var bpm = Math.floor(95 + zone * 70 + Math.random() * 5);

    var v0 = document.getElementById('statValue0');
    var v1 = document.getElementById('statValue1');
    var v2 = document.getElementById('statValue2');
    if (currentSport === 'run' || currentSport === 'cycle' || currentSport === 'hike') {
      if (v0) v0.textContent = dist;
      if (v1 && recSeconds > 5) {
        var pace = recSeconds / (parseFloat(dist)||0.001);
        v1.textContent = Math.floor(pace/60) + ':' + String(Math.floor(pace%60)).padStart(2,'0');
      }
    }
    if (v2) v2.textContent = bpm;

    recRAF = requestAnimationFrame(tick);
  }
  recRAF = requestAnimationFrame(tick);
  showToast('🔴 Recording');
}

function stopRec() {
  if (!isRecording) return;
  isRecording = false;
  cancelAnimationFrame(recRAF);
  var btn = document.getElementById('recMain');
  var badge = document.getElementById('recBadge');
  if (btn) btn.classList.remove('recording');
  if (badge) badge.style.display = 'none';
}

function snapPhoto() {
  var el = document.querySelector('.rp-record');
  if (el) { el.style.filter = 'brightness(3)'; setTimeout(function(){ el.style.filter=''; }, 120); }
  showToast('📸 Captured!');
}

function handleUpload(e) {
  try { var f = e.target.files[0]; if(f) showToast((f.type.startsWith('video')?'🎬':'📸')+' Imported'); } catch(e2){}
}

function openRecPanel(type) {
  try {
    var panel = document.getElementById('recPanel');
    var title = document.getElementById('recPanelTitle');
    var body  = document.getElementById('recPanelBody');
    var titles = {music:'🎵 Music',filter:'🎨 Style',stats:'📊 Stats',trim:'✂️ Trim'};
    title.textContent = titles[type] || type;

    var trackList = [
      {title:'Blinding Lights',artist:'The Weeknd',dur:'3:22',bg:'linear-gradient(135deg,#e03131,#c92a2a)'},
      {title:'HUMBLE.',artist:'Kendrick Lamar',dur:'2:57',bg:'linear-gradient(135deg,#d9480f,#e8590c)'},
      {title:'Unstoppable',artist:'Sia',dur:'3:37',bg:'linear-gradient(135deg,#5f3dc4,#7048e8)'},
      {title:'Lose Yourself',artist:'Eminem',dur:'5:26',bg:'linear-gradient(135deg,#495057,#868e96)'},
      {title:'Levitating',artist:'Dua Lipa',dur:'3:23',bg:'linear-gradient(135deg,#0b7285,#15aabf)'},
      {title:'Industry Baby',artist:'Lil Nas X',dur:'3:32',bg:'linear-gradient(135deg,#d6336c,#f06595)'},
      {title:'Kiss Me More',artist:'Doja Cat ft. SZA',dur:'3:28',bg:'linear-gradient(135deg,#c2255c,#e64980)'},
      {title:'Redbone',artist:'Childish Gambino',dur:'5:26',bg:'linear-gradient(135deg,#1864ab,#1c7ed6)'},
    ];

    if (type === 'music') {
      body.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">' +
        trackList.map(function(s,i) {
          return '<div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;background:rgba(255,255,255,.04);cursor:pointer" onclick="selectTrack(' + i + ')">' +
            '<div style="width:38px;height:38px;border-radius:8px;background:' + s.bg + ';flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff">' + s.title[0] + '</div>' +
            '<div style="flex:1"><div style="font-size:12px;font-weight:700;color:#fff">' + s.title + '</div><div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:1px">' + s.artist + '</div></div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,.2)">' + s.dur + '</div>' +
          '</div>';
        }).join('') + '</div>';
    } else if (type === 'filter') {
      var styles = [{n:'None',c:'transparent'},{n:'Warm',c:'rgba(255,160,60,.1)'},{n:'Cool',c:'rgba(60,130,255,.1)'},{n:'Fade',c:'rgba(200,200,200,.08)'},{n:'Vivid',c:'rgba(255,50,100,.06)'},{n:'B&W',c:'rgba(0,0,0,.2)'}];
      body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
        styles.map(function(f) {
          return '<button style="padding:10px 4px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer;font-family:inherit" onclick="document.getElementById(\'vfFilterOverlay\').style.background=\'' + f.c + '\';showToast(\'' + f.n + '\');closeRecPanel()">' +
            '<div style="width:40px;height:28px;border-radius:6px;background:' + f.c + ';margin:0 auto 5px;border:1px solid rgba(255,255,255,.08)"></div>' +
            '<div style="font-size:9px;color:rgba(255,255,255,.4);font-weight:700">' + f.n + '</div></button>';
        }).join('') + '</div>';
    } else if (type === 'stats') {
      var t = sportThemes[currentSport];
      body.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">' +
        t.stats.map(function(s) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.04)">' +
            '<span style="font-size:12px;color:#fff;font-weight:600">' + s + '</span>' +
            '<div style="width:34px;height:20px;border-radius:10px;background:' + t.color + ';position:relative;cursor:pointer" onclick="showToast(\'Toggled\')"><div style="width:16px;height:16px;border-radius:50%;background:#0a0a0a;position:absolute;top:2px;right:2px"></div></div>' +
          '</div>';
        }).join('') + '</div>';
    } else if (type === 'trim') {
      body.innerHTML = '<div style="text-align:center;padding:12px;color:rgba(255,255,255,.3);font-size:11px;margin-bottom:10px">Drag handles to trim your clip</div>' +
        '<div style="width:100%;height:44px;background:rgba(255,255,255,.04);border-radius:8px;position:relative;overflow:hidden">' +
        '<div style="position:absolute;top:0;bottom:0;left:10%;right:15%;background:rgba(var(--sport-rgb,34,197,94),.1);border-left:3px solid var(--sport-color,#22c55e);border-right:3px solid var(--sport-color,#22c55e)"></div></div>';
    }
    panel.style.display = 'block';
  } catch(e) { console.warn('openRecPanel:', e); }
}

function selectTrack(i) {
  var tracks = ['Blinding Lights','HUMBLE.','Unstoppable','Lose Yourself','Levitating','Industry Baby','Kiss Me More','Redbone'];
  var smLabel = document.getElementById('smLabel');
  var smSub = document.getElementById('smSub');
  if (smLabel) smLabel.textContent = tracks[i] || 'Track selected';
  if (smSub) smSub.textContent = 'Now playing';
  showToast('🎵 ' + (tracks[i] || 'Track selected'));
  closeRecPanel();
}

function closeRecPanel() {
  try { document.getElementById('recPanel').style.display = 'none'; } catch(e) {}
}

// Draggable stat cards in Record phase
function _initRecord() {
  document.querySelectorAll('.rr-stat-card.draggable').forEach(function(card) {
    var ox = 0, oy = 0, dragging = false;
    function startDrag(cx, cy) {
      dragging = true;
      var r = card.getBoundingClientRect();
      var pr = card.parentElement.getBoundingClientRect();
      ox = cx - r.left; oy = cy - r.top;
      card.style.cursor = 'grabbing';
    }
    function moveDrag(cx, cy) {
      if (!dragging) return;
      var pr = card.parentElement.getBoundingClientRect();
      var x = Math.max(0, Math.min(cx - pr.left - ox, pr.width - card.offsetWidth));
      var y = Math.max(0, Math.min(cy - pr.top - oy, pr.height - card.offsetHeight));
      card.style.left = x + 'px'; card.style.top = y + 'px';
      card.style.right = 'auto'; card.style.bottom = 'auto';
    }
    function endDrag() { dragging = false; card.style.cursor = 'grab'; }
    card.addEventListener('touchstart', function(e){ e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
    card.addEventListener('touchmove', function(e){ e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
    card.addEventListener('touchend', endDrag);
    card.addEventListener('mousedown', function(e){ e.preventDefault(); startDrag(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function(e){ moveDrag(e.clientX, e.clientY); });
    window.addEventListener('mouseup', endDrag);
  });

  // Init sport selection colors on load
  var activeBtn = document.querySelector('.sg-item.active');
  if (activeBtn) selectSport(activeBtn);
}


// === ACTIVITY TAB FUNCTIONAL BUTTONS ===
function openActivityModal(type) {
  const modal = document.getElementById('actModal');
  const title = document.getElementById('actModalTitle');
  const body = document.getElementById('actModalBody');
  modal.style.display = 'block';

  if (type === 'add') {
    title.textContent = '+ Add Activity';
    body.innerHTML = `
      <select class="act-select" id="addSport">
        <option value="">Select Sport</option>
        <option>🎾 Tennis</option><option>🏀 Basketball</option><option>🏄 Surfing</option>
        <option>🏃 Running</option><option>🏋️ Gym</option><option>⚽ Soccer</option>
        <option>🥾 Hiking</option><option>🧗 Climbing</option><option>🚴 Cycling</option><option>🧘 Yoga</option><option>🤸 Pilates</option><option>⛳ Golf</option><option>🏊 Swim</option><option>🏓 Pickleball</option>
      </select>
      <input class="act-input" type="text" id="addTitle" placeholder="Activity name (e.g. Tennis with Sam)">
      <div class="act-row">
        <input class="act-input" type="date" id="addDate">
        <input class="act-input" type="time" id="addTime">
      </div>
      <input class="act-input" type="text" id="addLocation" placeholder="📍 Location">
      <button class="btn-fill" style="width:100%;margin-top:4px" onclick="submitActivity()">Add to Calendar</button>`;
    document.getElementById('addDate').valueAsDate = new Date();
  } else {
    title.textContent = '🔔 Set Reminder';
    body.innerHTML = `
      <input class="act-input" type="text" id="remTitle" placeholder="What to remind you? (e.g. Go to the gym!)">
      <div class="act-row">
        <input class="act-input" type="date" id="remDate">
        <input class="act-input" type="time" id="remTime" value="09:00">
      </div>
      <select class="act-select" id="remRepeat">
        <option value="once">One-time</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="mwf">Mon / Wed / Fri</option>
        <option value="tth">Tue / Thu</option>
      </select>
      <button class="btn-fill" style="width:100%;margin-top:4px" onclick="submitReminder()">Set Reminder</button>`;
    document.getElementById('remDate').valueAsDate = new Date();
  }
}

function closeActivityModal() {
  document.getElementById('actModal').style.display = 'none';
}

function submitActivity() {
  const sport = document.getElementById('addSport').value;
  const title = document.getElementById('addTitle').value;
  const date = document.getElementById('addDate').value;
  const time = document.getElementById('addTime').value;
  const loc = document.getElementById('addLocation').value;
  if (!sport || !title) { showToast('Please fill in sport and name'); return; }
  const icon = sport.split(' ')[0];
  showToast(icon + ' ' + title + ' added to calendar!');
  closeActivityModal();
  // Add to upcoming list dynamically
  const list = document.getElementById('upcomingList');
  const bgMap = {'🎾':'var(--green-bg)','🏃':'var(--blue-bg)','🏋️':'var(--orange-bg)','🏄':'var(--blue-bg)','🧘':'var(--pink-bg)','🏀':'var(--orange-bg)','⚽':'var(--green-bg)','🥾':'rgba(120,113,108,.1)','🧗':'rgba(249,115,22,.1)','🚴':'var(--blue-bg)'};
  const html = `<div class="upcoming"><div class="up-ico" style="background:${bgMap[icon]||'var(--surface2)'}">${icon}</div><div class="up-info"><div class="up-name">${title}</div><div class="up-time">${date} · ${time || 'TBD'} · ${loc || 'TBD'}</div></div></div>`;
  list.insertAdjacentHTML('afterbegin', html);
}

function submitReminder() {
  const title = document.getElementById('remTitle').value;
  if (!title) { showToast('Please enter a reminder'); return; }
  showToast('🔔 Reminder set: ' + title);
  closeActivityModal();
}

// Connections list for invite picker
var connectionsList = [
  {id:'sam', name:'Sam Rivera', handle:'@samrivera', sports:'Tennis · Surfing · Running', bg:'linear-gradient(135deg,var(--blue),var(--pink))', initial:'S'},
  {id:'lexi', name:'Lexi Tanaka', handle:'@lexitanaka', sports:'Tennis · Yoga', bg:'linear-gradient(135deg,var(--orange),#fbbf24)', initial:'L'},
  {id:'derek', name:'Derek Osei', handle:'@dereko', sports:'Basketball · Gym', bg:'linear-gradient(135deg,var(--green),#4ade80)', initial:'D'},
  {id:'kai', name:'Kai Nakamura', handle:'@kainakamura', sports:'Basketball · Soccer · Running', bg:'linear-gradient(135deg,var(--pink),var(--orange))', initial:'K'},
  {id:'maya', name:'Maya Chen', handle:'@mayachen', sports:'Tennis · Running · Gym', bg:'linear-gradient(135deg,var(--blue),var(--pink))', initial:'M'},
  {id:'jordan', name:'Jordan Park', handle:'@jordanpark', sports:'Surfing · Hiking · Running', bg:'linear-gradient(135deg,var(--orange),#fbbf24)', initial:'J'},
  {id:'marcus', name:'Marcus T.', handle:'@marcust', sports:'Basketball · Gym · Running', bg:'linear-gradient(135deg,#c2410c,#ea580c)', initial:'M'},
  {id:'alex', name:'Alex R.', handle:'@alexr', sports:'Pickleball · Tennis · Yoga', bg:'linear-gradient(135deg,#ca8a04,#facc15)', initial:'A'},
];

var currentInviteGroup = '';

function inviteToGroup(btn, groupName) {
  currentInviteGroup = groupName;
  var overlay = document.createElement('div');
  overlay.className = 'ig-overlay';
  overlay.id = 'inviteOverlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  
  var invitedIds = {};
  
  var html = '<div class="invite-picker">' +
    '<div class="invite-picker-header">' +
      '<button class="day-popup-close" onclick="document.getElementById(\'inviteOverlay\').remove()" style="color:var(--ink3)">✕</button>' +
      '<div class="invite-picker-title">Invite to ' + groupName + '</div>' +
      '<div style="width:28px"></div>' +
    '</div>' +
    '<div class="invite-search-row"><svg viewBox="0 0 24 24" fill="none" stroke="var(--ink4)" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input class="invite-search" placeholder="Search connections..." oninput="filterInviteList(this.value)"></div>' +
    '<div class="invite-list" id="inviteList">';
  
  connectionsList.forEach(function(c) {
    html += '<div class="invite-item" data-name="' + c.name.toLowerCase() + '" data-handle="' + c.handle + '" data-sports="' + c.sports.toLowerCase() + '">' +
      '<div class="av" style="width:38px;height:38px;font-size:14px;background:' + c.bg + ';flex-shrink:0">' + c.initial + '</div>' +
      '<div class="invite-item-info">' +
        '<div class="invite-item-name">' + c.name + '</div>' +
        '<div class="invite-item-sub">' + c.sports + '</div>' +
      '</div>' +
      '<button class="invite-item-btn" onclick="toggleInviteItem(this,\'' + c.name + '\',\'' + groupName + '\')">Invite</button>' +
    '</div>';
  });
  
  html += '</div>' +
    '<button class="btn-fill" style="width:100%;margin-top:12px;padding:12px" onclick="sendAllInvites();document.getElementById(\'inviteOverlay\').remove()">Done</button>' +
  '</div>';
  
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function filterInviteList(query) {
  var q = query.toLowerCase();
  document.querySelectorAll('.invite-item').forEach(function(item) {
    var name = item.dataset.name || '';
    var handle = item.dataset.handle || '';
    var sports = item.dataset.sports || '';
    var match = name.indexOf(q) !== -1 || handle.indexOf(q) !== -1 || sports.indexOf(q) !== -1;
    item.style.display = match ? 'flex' : 'none';
  });
}

function toggleInviteItem(btn, name, group) {
  if (btn.dataset.invited === 'true') {
    btn.textContent = 'Invite';
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
    btn.dataset.invited = 'false';
  } else {
    btn.textContent = '✓ Invited';
    btn.style.background = 'var(--green)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--green)';
    btn.dataset.invited = 'true';
  }
}

function sendAllInvites() {
  var count = document.querySelectorAll('.invite-item-btn[data-invited="true"]').length;
  if (count > 0) {
    showToast(count + ' invite' + (count > 1 ? 's' : '') + ' sent to ' + currentInviteGroup + '! 📨');
  }
}