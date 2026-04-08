// Rally Record tab — Pro Kit init logic.
// Loaded in index.html AFTER app.js so it overrides _initRecord().
// All state/functions namespaced under window.RR2 and window.rr2* globals
// for inline onclick handlers in record.html.

(function(){
  var RR2 = window.RR2 = {
    capTimer: null,
    capSec: 0,
    currentSport: 'run'
  };

  // ===== SPORT CATALOG =====
  // Single source of truth for the Record tab's sport picker.
  // Order in sportList = display order in the grid.
  // Each sport entry drives: pill display, capture phase hero stat,
  // two supporting stats, location chip, and meta header.
  // Format: hero=[label,value,unit]  sub1/sub2=[label,value,unit]
  RR2.sportList = [
    'run','walk','hike','trail',
    'cycle','mtb','gravel','ebike',
    'swim','surf','kayak','sup','row','windsurf',
    'tennis','pickle','badminton','squash','padel','racquetball',
    'soccer','basketball','volleyball','football','lacrosse','cricket',
    'lift','crossfit','hiit','yoga','pilates','climb',
    'ski','snowboard','xcski',
    'golf','skate','dance','martial','horse'
  ];
  RR2.sports = {
    run:        {label:'Run',          color:'#22c55e', rgb:'34,197,94',   stats:'PACE · DIST · HR',     hero:['CURRENT PACE','7:42','MIN / MI'],   sub1:['Distance','2.47','MI'],  sub2:['Heart rate','162','BPM'], loc:'CENTRAL PK · LOOP 2',  meta:'RUN · OUTDOOR'},
    walk:       {label:'Walk',         color:'#84cc16', rgb:'132,204,22',  stats:'STEPS · DIST · HR',    hero:['STEPS','4,820','TODAY'],            sub1:['Distance','2.10','MI'],  sub2:['Heart rate','108','BPM'], loc:'PROSPECT PK',          meta:'WALK · OUTDOOR'},
    hike:       {label:'Hike',         color:'#78716c', rgb:'120,113,108', stats:'ELEV · DIST · HR',     hero:['ELEVATION','1,240','FT'],           sub1:['Distance','4.8','MI'],   sub2:['Heart rate','134','BPM'], loc:'BREAKNECK RIDGE',      meta:'HIKE · OUTDOOR'},
    trail:      {label:'Trail Run',    color:'#16a34a', rgb:'22,163,74',   stats:'PACE · ELEV · HR',     hero:['CURRENT PACE','9:14','MIN / MI'],   sub1:['Elevation','720','FT'],  sub2:['Heart rate','156','BPM'], loc:'BEAR MTN TRAIL',       meta:'TRAIL · OUTDOOR'},
    cycle:      {label:'Cycle',        color:'#3b82f6', rgb:'59,130,246',  stats:'SPEED · DIST · POWER', hero:['CURRENT SPEED','18.4','MPH'],       sub1:['Distance','12.6','MI'],  sub2:['Power','241','W'],        loc:'WEST SIDE HWY · N',    meta:'CYCLE · OUTDOOR'},
    mtb:        {label:'MTB',          color:'#1d4ed8', rgb:'29,78,216',   stats:'SPEED · ELEV · HR',    hero:['CURRENT SPEED','14.2','MPH'],       sub1:['Elevation','980','FT'],  sub2:['Heart rate','158','BPM'], loc:'GOVERNORS ISLAND',     meta:'MTB · TRAIL'},
    gravel:     {label:'Gravel',       color:'#2563eb', rgb:'37,99,235',   stats:'SPEED · DIST · HR',    hero:['CURRENT SPEED','16.1','MPH'],       sub1:['Distance','22.4','MI'], sub2:['Heart rate','152','BPM'], loc:'OLD CROTON AQ',        meta:'GRAVEL · OUTDOOR'},
    ebike:      {label:'E-Bike',       color:'#0ea5e9', rgb:'14,165,233',  stats:'SPEED · DIST · ASSIST',hero:['CURRENT SPEED','22.3','MPH'],       sub1:['Distance','14.0','MI'], sub2:['Assist','60','%'],         loc:'BKLYN GREENWAY',       meta:'E-BIKE · OUTDOOR'},
    swim:       {label:'Swim',         color:'#0ea5e9', rgb:'14,165,233',  stats:'LAPS · DIST · HR',     hero:['LAPS','24','POOL'],                 sub1:['Distance','600','YD'],   sub2:['Heart rate','142','BPM'], loc:'ASPHALT GREEN',        meta:'SWIM · POOL'},
    surf:       {label:'Surf',         color:'#06b6d4', rgb:'6,182,212',   stats:'WAVES · TIME · HR',    hero:['WAVES','12','RIDDEN'],              sub1:['Session','86','MIN'],    sub2:['Heart rate','138','BPM'], loc:'ROCKAWAY · 90TH',      meta:'SURF · OCEAN'},
    kayak:      {label:'Kayak',        color:'#0891b2', rgb:'8,145,178',   stats:'PACE · DIST · STROKES',hero:['CURRENT PACE','8:40','MIN / MI'],   sub1:['Distance','3.2','MI'],  sub2:['Strokes','1,840','TOTAL'], loc:'HUDSON · PIER 26',     meta:'KAYAK · RIVER'},
    sup:        {label:'SUP',          color:'#22d3ee', rgb:'34,211,238',  stats:'SPEED · DIST · HR',    hero:['CURRENT SPEED','4.2','MPH'],        sub1:['Distance','2.8','MI'],   sub2:['Heart rate','118','BPM'], loc:'SHEEPSHEAD BAY',       meta:'SUP · BAY'},
    row:        {label:'Row',          color:'#0284c7', rgb:'2,132,199',   stats:'SPLIT · DIST · STROKE',hero:['SPLIT','1:58','/500M'],             sub1:['Distance','5,000','M'], sub2:['Stroke rate','28','SPM'],  loc:'HARLEM RIVER',         meta:'ROW · WATER'},
    windsurf:   {label:'Windsurf',     color:'#0369a1', rgb:'3,105,161',   stats:'SPEED · DIST · HR',    hero:['CURRENT SPEED','18.6','MPH'],       sub1:['Distance','6.4','MI'],   sub2:['Heart rate','144','BPM'], loc:'KITE BEACH',           meta:'WINDSURF · BAY'},
    tennis:     {label:'Tennis',       color:'#eab308', rgb:'234,179,8',   stats:'RALLY · ACES · CAL',   hero:['LONGEST RALLY','14','SHOTS'],       sub1:['Aces','6','SERVED'],     sub2:['Calories','320','KCAL'],   loc:'RIVIERA COURTS',       meta:'TENNIS · OUTDOOR'},
    pickle:     {label:'Pickleball',   color:'#84cc16', rgb:'132,204,22',  stats:'RALLY · TIME · CAL',   hero:['LONGEST RALLY','18','SHOTS'],       sub1:['Time','64','MIN'],       sub2:['Calories','280','KCAL'],   loc:'CITY PARK · CT 4',     meta:'PICKLEBALL · OUTDOOR'},
    badminton:  {label:'Badminton',    color:'#ca8a04', rgb:'202,138,4',   stats:'SETS · TIME · CAL',    hero:['SETS','3','PLAYED'],                sub1:['Time','52','MIN'],       sub2:['Calories','240','KCAL'],   loc:'CHELSEA REC CTR',      meta:'BADMINTON · INDOOR'},
    squash:     {label:'Squash',       color:'#d97706', rgb:'217,119,6',   stats:'GAMES · TIME · CAL',   hero:['GAMES','4','WON'],                  sub1:['Time','48','MIN'],       sub2:['Calories','360','KCAL'],   loc:'NYAC CLUB',            meta:'SQUASH · INDOOR'},
    padel:      {label:'Padel',        color:'#f59e0b', rgb:'245,158,11',  stats:'SETS · TIME · CAL',    hero:['SETS','2','PLAYED'],                sub1:['Time','76','MIN'],       sub2:['Calories','290','KCAL'],   loc:'PADEL HAUS BK',        meta:'PADEL · OUTDOOR'},
    racquetball:{label:'Racquetball',  color:'#fbbf24', rgb:'251,191,36',  stats:'GAMES · TIME · CAL',   hero:['GAMES','3','WON'],                  sub1:['Time','42','MIN'],       sub2:['Calories','310','KCAL'],   loc:'CHELSEA PIERS',        meta:'RACQUETBALL · INDOOR'},
    soccer:     {label:'Soccer',       color:'#22c55e', rgb:'34,197,94',   stats:'DIST · TIME · HR',     hero:['DISTANCE','4.8','MI'],              sub1:['Time','86','MIN'],       sub2:['Heart rate','162','BPM'],  loc:'MCCARREN PK',          meta:'SOCCER · TURF'},
    basketball: {label:'Basketball',   color:'#f97316', rgb:'249,115,22',  stats:'PTS · TIME · HR',      hero:['POINTS','14','SCORED'],             sub1:['Time','38','MIN'],       sub2:['Heart rate','168','BPM'],  loc:'RUCKER PARK · CT 3',   meta:'BASKETBALL · OUTDOOR'},
    volleyball: {label:'Volleyball',   color:'#3b82f6', rgb:'59,130,246',  stats:'SETS · TIME · HR',     hero:['SETS','3','WON'],                   sub1:['Time','64','MIN'],       sub2:['Heart rate','152','BPM'],  loc:'BROOKLYN BRIDGE PK',   meta:'VOLLEYBALL · BEACH'},
    football:   {label:'Football',     color:'#7c3aed', rgb:'124,58,237',  stats:'DIST · TIME · HR',     hero:['DISTANCE','3.6','MI'],              sub1:['Time','72','MIN'],       sub2:['Heart rate','164','BPM'],  loc:'RANDALLS ISLAND',      meta:'FOOTBALL · TURF'},
    lacrosse:   {label:'Lacrosse',     color:'#db2777', rgb:'219,39,119',  stats:'DIST · TIME · HR',     hero:['DISTANCE','4.2','MI'],              sub1:['Time','60','MIN'],       sub2:['Heart rate','158','BPM'],  loc:'PIER 40',              meta:'LACROSSE · TURF'},
    cricket:    {label:'Cricket',      color:'#16a34a', rgb:'22,163,74',   stats:'RUNS · OVERS · HR',    hero:['RUNS','42','SCORED'],               sub1:['Overs','8','BOWLED'],    sub2:['Heart rate','132','BPM'],  loc:'VAN CORTLANDT PK',     meta:'CRICKET · OUTDOOR'},
    lift:       {label:'Lift',         color:'#f97316', rgb:'249,115,22',  stats:'SET · VOL · REPS',     hero:['WORKING SET','225','LBS'],          sub1:['Volume','12,840','LBS'], sub2:['Reps','86','TOTAL'],       loc:'EQUINOX · BRYANT PK',  meta:'LIFT · GYM'},
    crossfit:   {label:'CrossFit',     color:'#ef4444', rgb:'239,68,68',   stats:'ROUNDS · REPS · HR',   hero:['ROUNDS','5','DONE'],                sub1:['Reps','142','TOTAL'],    sub2:['Heart rate','172','BPM'],  loc:'NYC CROSSFIT',         meta:'CROSSFIT · BOX'},
    hiit:       {label:'HIIT',         color:'#dc2626', rgb:'220,38,38',   stats:'ROUNDS · TIME · CAL',  hero:['ROUNDS','8','DONE'],                sub1:['Time','24','MIN'],       sub2:['Calories','380','KCAL'],   loc:'BARRY\'S TRIBECA',     meta:'HIIT · STUDIO'},
    yoga:       {label:'Yoga',         color:'#a855f7', rgb:'168,85,247',  stats:'TIME · FLOW · CAL',    hero:['DURATION','60','MIN'],              sub1:['Flow','Vinyasa',''],     sub2:['Calories','220','KCAL'],   loc:'Y7 STUDIO',            meta:'YOGA · STUDIO'},
    pilates:    {label:'Pilates',      color:'#ec4899', rgb:'236,72,153',  stats:'TIME · REPS · CAL',    hero:['DURATION','50','MIN'],              sub1:['Reps','240','TOTAL'],    sub2:['Calories','260','KCAL'],   loc:'SOLIDCORE',            meta:'PILATES · STUDIO'},
    climb:      {label:'Climb',        color:'#f97316', rgb:'249,115,22',  stats:'GRADE · ROUTES · ATT', hero:['TOP GRADE','V6','SENT'],            sub1:['Routes','7','DONE'],     sub2:['Attempts','14','TOTAL'],   loc:'BKLYN BOULDERS',       meta:'CLIMB · GYM'},
    ski:        {label:'Ski',          color:'#60a5fa', rgb:'96,165,250',  stats:'SPEED · DIST · RUNS',  hero:['CURRENT SPEED','32.4','MPH'],       sub1:['Distance','8.4','MI'],   sub2:['Runs','6','TAKEN'],        loc:'HUNTER MTN',           meta:'SKI · ALPINE'},
    snowboard:  {label:'Snowboard',    color:'#7c3aed', rgb:'124,58,237',  stats:'SPEED · DIST · RUNS',  hero:['CURRENT SPEED','28.6','MPH'],       sub1:['Distance','6.2','MI'],   sub2:['Runs','5','TAKEN'],        loc:'STRATTON',             meta:'SNOWBOARD · ALPINE'},
    xcski:      {label:'XC Ski',       color:'#3b82f6', rgb:'59,130,246',  stats:'PACE · DIST · HR',     hero:['CURRENT PACE','8:20','MIN / MI'],   sub1:['Distance','4.6','MI'],   sub2:['Heart rate','156','BPM'],  loc:'MINNEWASKA',           meta:'XC SKI · NORDIC'},
    golf:       {label:'Golf',         color:'#16a34a', rgb:'22,163,74',   stats:'HOLES · STROKE · DIST',hero:['HOLES','9','PLAYED'],               sub1:['Strokes','38','TAKEN'], sub2:['Distance','2.4','MI'],     loc:'BETHPAGE BLACK',       meta:'GOLF · COURSE'},
    skate:      {label:'Skate',        color:'#60a5fa', rgb:'96,165,250',  stats:'SPEED · DIST · HR',    hero:['CURRENT SPEED','12.8','MPH'],       sub1:['Distance','4.2','MI'],   sub2:['Heart rate','138','BPM'],  loc:'LES SKATEPARK',        meta:'SKATE · STREET'},
    dance:      {label:'Dance',        color:'#ec4899', rgb:'236,72,153',  stats:'TIME · STEPS · CAL',   hero:['DURATION','45','MIN'],              sub1:['Steps','3,840','TAKEN'], sub2:['Calories','320','KCAL'],   loc:'AILEY STUDIOS',        meta:'DANCE · STUDIO'},
    martial:    {label:'Martial Arts', color:'#ef4444', rgb:'239,68,68',   stats:'ROUNDS · TIME · HR',   hero:['ROUNDS','6','DONE'],                sub1:['Time','42','MIN'],       sub2:['Heart rate','168','BPM'],  loc:'RENZO GRACIE',         meta:'MARTIAL ARTS · GYM'},
    horse:      {label:'Horse Ride',   color:'#92400e', rgb:'146,64,14',   stats:'DIST · TIME · HR',     hero:['DISTANCE','3.8','MI'],              sub1:['Time','68','MIN'],       sub2:['Heart rate','124','BPM'],  loc:'KENSINGTON STABLES',   meta:'HORSE RIDE · TRAIL'}
  };

  // Per-sport default goal strings shown in the Setup phase goal row.
  // Editable by user via contenteditable; updated when sport changes.
  RR2.goals = {
    run:'5K · sub 24:00',     walk:'10,000 steps',       hike:'2,000 ft gain',    trail:'10K trail',
    cycle:'20 mi · z2',       mtb:'Full loop clean',     gravel:'30 mi · sub 2h', ebike:'15 mi commute',
    swim:'40 laps · 1 mi',    surf:'20 waves',           kayak:'4 mi out-and-back',sup:'3 mi paddle',
    row:'5,000 m · sub 20',   windsurf:'1 hr session',
    tennis:'2 sets won',      pickle:'Play to 21',       badminton:'Best of 5',   squash:'3 games',
    padel:'2 sets',           racquetball:'3 games',
    soccer:'Full 90 min',     basketball:'Game to 21',   volleyball:'Best of 5',  football:'Full game',
    lacrosse:'Full 60 min',   cricket:'10 overs',
    lift:'Bench 225 × 5',     crossfit:'Rx WOD',         hiit:'8 rounds tabata',  yoga:'60 min flow',
    pilates:'50 min reformer',climb:'V6 · flash',
    ski:'10 runs',            snowboard:'Park + tree',   xcski:'10K course',
    golf:'18 holes · sub 85', skate:'4 mi cruise',       dance:'Full class',      martial:'5 × 3 min rounds',
    horse:'1 hr trail ride'
  };

  // Build the sport pill grid from RR2.sportList. Called from _initRecord.
  RR2.buildSportGrid = function(){
    var grid = document.getElementById('rr2Sports');
    if(!grid) return;
    grid.innerHTML = RR2.sportList.map(function(k){
      var s = RR2.sports[k];
      if(!s) return '';
      return '<button class="rr2-pill" data-sport="'+k+'" data-color="'+s.color+'" data-rgb="'+s.rgb+'" onclick="rr2SelectSport(this)">'+
               '<span class="rr2-pill-name">'+s.label+'</span>'+
               '<span class="rr2-pill-sub">'+s.stats+'</span>'+
             '</button>';
    }).join('');
  };

  // Phase switcher (scoped to the rr2 partial)
  window.rr2Go = function(phase){
    var root = document.getElementById('rr2Root');
    if(!root) return;
    root.querySelectorAll('.rr2-phase').forEach(function(p){ p.classList.remove('active'); });
    var target = root.querySelector('[data-phase="'+phase+'"]');
    if(target) target.classList.add('active');
    if(phase === 'cap') RR2.startCap();
    else RR2.stopCap();
  };

  // Sport select — updates theme + capture hero labels to match sport
  window.rr2SelectSport = function(el){
    document.querySelectorAll('.rr2-pill').forEach(function(p){ p.classList.remove('sel'); });
    el.classList.add('sel');
    var root = document.getElementById('rr2Root');
    var color = el.dataset.color, rgb = el.dataset.rgb;
    root.style.setProperty('--rr2-sport', color);
    root.style.setProperty('--rr2-sport-rgb', rgb);
    var key = el.dataset.sport;
    RR2.currentSport = key;
    var cfg = RR2.sports[key];
    if(!cfg) return;
    var $ = function(id){ return document.getElementById(id); };
    // Hero stat block (left-aligned giant number)
    if($('rr2HeroLbl'))  $('rr2HeroLbl').textContent  = cfg.hero[0];
    if($('rr2HeroUnit')) $('rr2HeroUnit').textContent = cfg.hero[2];
    // Hero number — use a single span and replace innerHTML so colon-style values like "7:42" work
    var heroNumEl = document.querySelector('.rr2-hero-num');
    if(heroNumEl){ heroNumEl.innerHTML = cfg.hero[1]; }
    // Two supporting stats below
    if($('rr2Sub1Lbl'))  $('rr2Sub1Lbl').textContent  = cfg.sub1[0];
    if($('rr2Sub1Val'))  $('rr2Sub1Val').textContent  = cfg.sub1[1];
    if($('rr2Sub1Unit')) $('rr2Sub1Unit').textContent = cfg.sub1[2];
    if($('rr2Sub2Lbl'))  $('rr2Sub2Lbl').textContent  = cfg.sub2[0];
    if($('rr2Sub2Val'))  $('rr2Sub2Val').textContent  = cfg.sub2[1];
    if($('rr2Sub2Unit')) $('rr2Sub2Unit').textContent = cfg.sub2[2];
    // Top meta strip
    if($('rr2CapLoc'))   $('rr2CapLoc').textContent   = cfg.loc;
    if($('rr2CapSport')) $('rr2CapSport').textContent = cfg.meta;
    if($('rr2EditSport'))$('rr2EditSport').textContent= cfg.label.toUpperCase();
    // Goal row — per-sport default (user can edit via contenteditable)
    var goalEl = $('rr2GoalVal');
    if(goalEl && RR2.goals[key]) goalEl.textContent = RR2.goals[key];
  };

  // Capture simulation — live-updating clock (and pace ticking for Run)
  RR2.startCap = function(){
    RR2.stopCap();
    RR2.capSec = 0;
    RR2.capTimer = setInterval(function(){
      RR2.capSec++;
      var h = Math.floor(RR2.capSec/3600),
          m = Math.floor((RR2.capSec%3600)/60),
          s = RR2.capSec%60;
      var pad = function(n){ return String(n).padStart(2,'0'); };
      var $ = function(id){ return document.getElementById(id); };
      if($('rr2CapTime')) $('rr2CapTime').textContent = pad(h)+':'+pad(m)+':'+pad(s);
      // Run-specific live pace jitter on the hero number
      if(RR2.currentSport === 'run'){
        var ps = 38 + Math.round(Math.sin(RR2.capSec/5)*6);
        var heroNum = document.querySelector('.rr2-hero-num');
        if(heroNum) heroNum.innerHTML = '7:'+pad(ps);
      }
    }, 250);
  };
  RR2.stopCap = function(){
    if(RR2.capTimer){ clearInterval(RR2.capTimer); RR2.capTimer = null; }
  };

  // Finish → transition → edit
  window.rr2TriggerTransition = function(){
    var t = document.getElementById('rr2Trans');
    if(!t) return;
    t.classList.add('active');
    RR2.stopCap();
    setTimeout(function(){
      window.rr2Go('edit');
      t.classList.remove('active');
      RR2.buildStatWave();
    }, 950);
  };

  // Build the stat waveform in the edit timeline
  RR2.buildStatWave = function(){
    var el = document.getElementById('rr2StatWave');
    if(!el) return;
    el.innerHTML = '';
    for(var i = 0; i < 60; i++){
      var h = 20 + Math.sin(i/6)*30 + Math.sin(i/2)*15 + Math.random()*10;
      var bar = document.createElement('i');
      bar.style.height = Math.max(10, Math.min(100, h)) + '%';
      el.appendChild(bar);
    }
  };

  // Tool rail + effect chips interaction
  window.rr2PickRail = function(el){
    document.querySelectorAll('.rr2-rail-btn').forEach(function(b){ b.classList.remove('active'); });
    el.classList.add('active');
  };
  window.rr2ToggleChip = function(el){ el.classList.toggle('active'); };

  // Draggable stat stickers on the edit canvas
  RR2.bindStickers = function(){
    document.querySelectorAll('.rr2-stk').forEach(function(s){
      var dragging = false, ox = 0, oy = 0;
      function start(cx, cy){
        dragging = true;
        var r = s.getBoundingClientRect();
        ox = cx - r.left; oy = cy - r.top;
        s.style.cursor = 'grabbing';
      }
      function move(cx, cy){
        if(!dragging) return;
        var parent = s.offsetParent.getBoundingClientRect();
        var x = cx - parent.left - ox;
        var y = cy - parent.top - oy;
        x = Math.max(0, Math.min(x, parent.width - s.offsetWidth));
        y = Math.max(0, Math.min(y, parent.height - s.offsetHeight));
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.right = 'auto';
        s.style.bottom = 'auto';
      }
      function end(){ dragging = false; s.style.cursor = 'grab'; }
      s.addEventListener('mousedown', function(e){ e.preventDefault(); start(e.clientX, e.clientY); });
      window.addEventListener('mousemove', function(e){ move(e.clientX, e.clientY); });
      window.addEventListener('mouseup', end);
      s.addEventListener('touchstart', function(e){ e.preventDefault(); var t = e.touches[0]; start(t.clientX, t.clientY); }, {passive:false});
      s.addEventListener('touchmove',  function(e){ e.preventDefault(); var t = e.touches[0]; move(t.clientX, t.clientY); }, {passive:false});
      s.addEventListener('touchend', end);
    });
  };

  // ===== OVERRIDE _initRecord in app.js =====
  // This runs once, after the Record tab HTML has been fetched and injected.
  window._initRecord = function(){
    RR2.buildSportGrid();
    var first = document.querySelector('.rr2-pill[data-sport="run"]') || document.querySelector('.rr2-pill');
    if(first){ first.classList.add('sel'); window.rr2SelectSport(first); }
    RR2.bindStickers();
    RR2.buildStatWave();
  };

  // If the record tab is already loaded when this script runs (e.g. hot reload), init immediately
  if(document.getElementById('rr2Root')){
    window._initRecord();
  }

  // ===== ROBUST FALLBACK =====
  // app.js declares _initRecord as a function declaration, so _loadTab may
  // capture the original via scope chain even though we reassigned window._initRecord.
  // MutationObserver watches for #rr2Root / #rr2Sports appearing in the DOM
  // and runs our init independently of the override.
  function rr2TryInit(){
    var root = document.getElementById('rr2Root');
    var grid = document.getElementById('rr2Sports');
    if(!root || !grid) return false;
    if(grid.dataset.rr2Ready === '1') return true;
    RR2.buildSportGrid();
    var first = root.querySelector('.rr2-pill[data-sport="run"]') || root.querySelector('.rr2-pill');
    if(first){
      first.classList.add('sel');
      window.rr2SelectSport(first);
    }
    RR2.bindStickers();
    RR2.buildStatWave();
    grid.dataset.rr2Ready = '1';
    return true;
  }
  // Try immediately in case the tab is already injected
  rr2TryInit();
  // Watch for future injections
  if(window.MutationObserver){
    var mo = new MutationObserver(function(){ rr2TryInit(); });
    mo.observe(document.body, {childList:true, subtree:true});
  }
  // Also re-try on tab clicks as a belt-and-braces measure
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-tab="record"], .tab-record, #tab-record');
    if(t) setTimeout(rr2TryInit, 60);
  }, true);
})();
