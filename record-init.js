// Rally Record tab — Pro Kit init logic.
// Loaded in index.html AFTER app.js so it overrides _initRecord().
// All state/functions namespaced under window.RR2 and window.rr2* globals
// for inline onclick handlers in record.html.

(function(){
  var RR2 = window.RR2 = {
    capTimer: null,
    capSec: 0,
    currentSport: 'run',
    currentCat: 'recent'
  };

  // Category definitions drive the horizontal tab row in the setup phase.
  // "recent" is synthesized from RR2.recentSports (default curated list).
  RR2.cats = [
    {key:'recent',   label:'Recent'},
    {key:'foot',     label:'Run'},
    {key:'cycle',    label:'Cycle'},
    {key:'water',    label:'Water'},
    {key:'court',    label:'Court'},
    {key:'team',     label:'Team'},
    {key:'strength', label:'Strength'},
    {key:'winter',   label:'Winter'},
    {key:'other',    label:'Other'}
  ];
  // Which category each sport belongs to. Mirrors sportCatMap in app.js.
  RR2.sportCats = {
    run:'foot', walk:'foot', hike:'foot', trail:'foot',
    cycle:'cycle', mtb:'cycle', gravel:'cycle', ebike:'cycle',
    swim:'water', surf:'water', kayak:'water', sup:'water', row:'water', windsurf:'water',
    tennis:'court', pickle:'court', badminton:'court', squash:'court', padel:'court', racquetball:'court',
    soccer:'team', basketball:'team', volleyball:'team', football:'team', lacrosse:'team', cricket:'team',
    lift:'strength', crossfit:'strength', hiit:'strength', yoga:'strength', pilates:'strength', climb:'strength',
    ski:'winter', snowboard:'winter', xcski:'winter',
    golf:'other', skate:'other', dance:'other', martial:'other', horse:'other'
  };
  // Curated "recent" list — shows the 6 most-common sports on first load.
  // Swap this out for real recency data later.
  RR2.recentSports = ['run','cycle','lift','swim','tennis','yoga'];

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

  // Build the category tab row (Recent / Run / Cycle / ... / Other).
  RR2.buildCatRow = function(){
    var row = document.getElementById('rr2Cats');
    if(!row) return;
    row.innerHTML = RR2.cats.map(function(c){
      var sel = c.key === RR2.currentCat ? ' sel' : '';
      return '<button class="rr2-cat'+sel+'" data-cat="'+c.key+'" onclick="rr2SelectCat(this)">'+c.label+'</button>';
    }).join('');
  };

  // Build the sport pill grid, filtered by the active category.
  // Called from _initRecord and from rr2SelectCat.
  RR2.buildSportGrid = function(){
    var grid = document.getElementById('rr2Sports');
    if(!grid) return;
    var list;
    if(RR2.currentCat === 'recent'){
      list = RR2.recentSports.slice();
    } else {
      list = RR2.sportList.filter(function(k){ return RR2.sportCats[k] === RR2.currentCat; });
    }
    if(!list.length){
      grid.innerHTML = '<div class="rr2-sport-empty">No sports in this category.</div>';
      return;
    }
    grid.innerHTML = list.map(function(k){
      var s = RR2.sports[k];
      if(!s) return '';
      return '<button class="rr2-pill" data-sport="'+k+'" data-color="'+s.color+'" data-rgb="'+s.rgb+'" onclick="rr2SelectSport(this)">'+
               '<span class="rr2-pill-name">'+s.label+'</span>'+
               '<span class="rr2-pill-sub">'+s.stats+'</span>'+
             '</button>';
    }).join('');
    // Reapply the current sport's selected state if it's visible in this filter
    var active = grid.querySelector('.rr2-pill[data-sport="'+RR2.currentSport+'"]');
    if(active) active.classList.add('sel');
  };

  // Category tab click — switch filter, rebuild grid.
  // If the currently-selected sport isn't in the new category, auto-pick
  // the first sport in the filtered grid so the capture phase stays themed.
  window.rr2SelectCat = function(el){
    RR2.currentCat = el.dataset.cat;
    document.querySelectorAll('.rr2-cat').forEach(function(c){ c.classList.remove('sel'); });
    el.classList.add('sel');
    RR2.buildSportGrid();
    var grid = document.getElementById('rr2Sports');
    if(!grid) return;
    var stillVisible = grid.querySelector('.rr2-pill[data-sport="'+RR2.currentSport+'"]');
    if(!stillVisible){
      var first = grid.querySelector('.rr2-pill');
      if(first) window.rr2SelectSport(first);
    }
  };

  // Phase switcher (scoped to the rr2 partial)
  window.rr2Go = function(phase){
    var root = document.getElementById('rr2Root');
    if(!root) return;
    root.querySelectorAll('.rr2-phase').forEach(function(p){ p.classList.remove('active'); });
    var target = root.querySelector('[data-phase="'+phase+'"]');
    if(target) target.classList.add('active');
    if(phase === 'cap'){
      RR2.startCap();
      // Clear gallery + moments for fresh session
      RR2.moments = [];
      var gallery = document.getElementById('rr2Gallery');
      if(gallery) gallery.innerHTML = '';
    } else {
      RR2.stopCap();
    }
    // Reset playback when returning to setup
    if(phase === 'setup'){
      RR2.editPlaying = false;
      if(RR2.editPlayTimer) clearInterval(RR2.editPlayTimer);
      RR2.editPlayPos = 0;
      // Hide route sticker
      var routeWrap = document.getElementById('rr2RouteStkWrap');
      if(routeWrap) routeWrap.style.display = 'none';
    }
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

  // ===== CAPTURE SIMULATION =====
  // Realistic live-updating clock + per-sport hero/sub stat ticking.
  // Groups sports by stat type so each one gets a believable sim.
  RR2.simCfg = {
    // pace sports — hero is M:SS, jitters around base
    run:  {type:'pace', base:462, amp:6},  // 7:42 → seconds base
    trail:{type:'pace', base:554, amp:8},
    walk: {type:'pace', base:900, amp:10},
    hike: {type:'pace', base:1080, amp:12},
    kayak:{type:'pace', base:520, amp:7},
    xcski:{type:'pace', base:500, amp:6},
    row:  {type:'split',base:118, amp:4}, // 1:58 /500m
    // speed sports — hero is XX.X MPH/KPH, jitters
    cycle: {type:'speed', base:18.4, amp:1.2},
    mtb:   {type:'speed', base:14.2, amp:2.0},
    gravel:{type:'speed', base:16.1, amp:1.0},
    ebike: {type:'speed', base:22.3, amp:0.8},
    sup:   {type:'speed', base:4.2,  amp:0.5},
    windsurf:{type:'speed', base:18.6, amp:2.5},
    ski:   {type:'speed', base:32.4, amp:4.0},
    snowboard:{type:'speed', base:28.6, amp:3.5},
    skate: {type:'speed', base:12.8, amp:1.5},
    horse: {type:'speed', base:6.2,  amp:0.8},
    // count sports — hero ticks up periodically
    swim:      {type:'count', base:0,  rate:0.08, label:'LAPS',  unit:'POOL'},
    surf:      {type:'count', base:0,  rate:0.03, label:'WAVES', unit:'RIDDEN'},
    tennis:    {type:'count', base:0,  rate:0.04, label:'LONGEST RALLY', unit:'SHOTS'},
    pickle:    {type:'count', base:0,  rate:0.05, label:'LONGEST RALLY', unit:'SHOTS'},
    badminton: {type:'count', base:0,  rate:0.03, label:'SETS',  unit:'PLAYED'},
    squash:    {type:'count', base:0,  rate:0.04, label:'GAMES', unit:'WON'},
    padel:     {type:'count', base:0,  rate:0.03, label:'SETS',  unit:'PLAYED'},
    racquetball:{type:'count',base:0,  rate:0.04, label:'GAMES', unit:'WON'},
    soccer:    {type:'dist',  base:0,  rate:0.002},
    basketball:{type:'count', base:0,  rate:0.06, label:'POINTS',unit:'SCORED'},
    volleyball:{type:'count', base:0,  rate:0.03, label:'SETS',  unit:'WON'},
    football:  {type:'dist',  base:0,  rate:0.002},
    lacrosse:  {type:'dist',  base:0,  rate:0.0025},
    cricket:   {type:'count', base:0,  rate:0.05, label:'RUNS',  unit:'SCORED'},
    lift:      {type:'reps',  base:0,  rate:0.12},
    crossfit:  {type:'count', base:0,  rate:0.025, label:'ROUNDS',unit:'DONE'},
    hiit:      {type:'count', base:0,  rate:0.03,  label:'ROUNDS',unit:'DONE'},
    yoga:      {type:'dur'},
    pilates:   {type:'dur'},
    dance:     {type:'dur'},
    climb:     {type:'count', base:0, rate:0.02, label:'ROUTES', unit:'DONE'},
    martial:   {type:'count', base:0, rate:0.025, label:'ROUNDS',unit:'DONE'},
    golf:      {type:'count', base:0, rate:0.015, label:'HOLES', unit:'PLAYED'}
  };

  RR2.startCap = function(){
    RR2.stopCap();
    RR2.capSec = 0;
    RR2.capCount = 0;
    RR2.capDist = 0;
    var sim = RR2.simCfg[RR2.currentSport] || {type:'dur'};

    RR2.capTimer = setInterval(function(){
      RR2.capSec++;
      var h = Math.floor(RR2.capSec/3600),
          m = Math.floor((RR2.capSec%3600)/60),
          s = RR2.capSec%60;
      var pad = function(n){ return String(n).padStart(2,'0'); };
      var $ = function(id){ return document.getElementById(id); };
      var heroEl = document.querySelector('.rr2-hero-num');
      if($('rr2CapTime')) $('rr2CapTime').textContent = pad(h)+':'+pad(m)+':'+pad(s);

      // Per-sport hero number simulation
      if(sim.type === 'pace' || sim.type === 'split'){
        var sec = sim.base + Math.round(Math.sin(RR2.capSec/5)*sim.amp);
        var pm = Math.floor(sec/60), ps = sec%60;
        if(heroEl) heroEl.innerHTML = pm+':'+pad(ps);
      }
      else if(sim.type === 'speed'){
        var spd = sim.base + Math.sin(RR2.capSec/4)*sim.amp;
        if(heroEl) heroEl.innerHTML = spd.toFixed(1);
      }
      else if(sim.type === 'count'){
        if(Math.random() < sim.rate) RR2.capCount++;
        if(heroEl) heroEl.innerHTML = String(RR2.capCount);
      }
      else if(sim.type === 'dist'){
        RR2.capDist += (sim.rate || 0.002) + Math.random()*0.001;
        if(heroEl) heroEl.innerHTML = RR2.capDist.toFixed(1);
      }
      else if(sim.type === 'reps'){
        if(Math.random() < (sim.rate || 0.1)) RR2.capCount++;
        if(heroEl) heroEl.innerHTML = String(RR2.capCount);
      }
      else if(sim.type === 'dur'){
        // Duration sports — hero shows the live clock itself
        if(heroEl) heroEl.innerHTML = pad(m)+':'+pad(s);
      }

      // Sub-stat 1: slow tick (distance, reps, laps, etc.)
      if($('rr2Sub1Val')){
        var cfg = RR2.sports[RR2.currentSport];
        if(cfg){
          var baseVal = parseFloat(cfg.sub1[1].replace(/,/g,''));
          if(!isNaN(baseVal) && baseVal > 0){
            var drift = baseVal * (1 + RR2.capSec * 0.0004 + Math.sin(RR2.capSec/8)*0.003);
            $('rr2Sub1Val').textContent = drift > 100 ? Math.round(drift).toLocaleString() : drift.toFixed(drift<10?2:1);
          }
        }
      }
      // Sub-stat 2: jitter (HR, calories, etc.)
      if($('rr2Sub2Val')){
        var cfg2 = RR2.sports[RR2.currentSport];
        if(cfg2){
          var baseVal2 = parseFloat(cfg2.sub2[1].replace(/,/g,''));
          if(!isNaN(baseVal2) && baseVal2 > 0){
            var jit = baseVal2 + Math.round(Math.sin(RR2.capSec/3)*3 + Math.random()*2);
            $('rr2Sub2Val').textContent = jit > 100 ? Math.round(jit).toLocaleString() : String(jit);
          }
        }
      }
    }, 250);
  };
  RR2.stopCap = function(){
    if(RR2.capTimer){ clearInterval(RR2.capTimer); RR2.capTimer = null; }
  };

  // Finish → transition → edit.
  // Snapshots the capture phase stats and writes them into the edit stickers + header.
  window.rr2TriggerTransition = function(){
    var t = document.getElementById('rr2Trans');
    if(!t) return;
    // Snapshot captured values before stopping
    var heroEl = document.querySelector('.rr2-hero-num');
    var $ = function(id){ return document.getElementById(id); };
    var pad = function(n){ return String(n).padStart(2,'0'); };
    var h = Math.floor(RR2.capSec/3600),
        m = Math.floor((RR2.capSec%3600)/60),
        s = RR2.capSec%60;
    var timeStr = (h>0 ? h+':' : '') + pad(m) + ':' + pad(s);
    var heroVal = heroEl ? heroEl.textContent.trim() : '--';
    var sub1Val = $('rr2Sub1Val') ? $('rr2Sub1Val').textContent.trim() : '--';
    var sub1Unit= $('rr2Sub1Unit')? $('rr2Sub1Unit').textContent.trim() : '';
    var sub2Val = $('rr2Sub2Val') ? $('rr2Sub2Val').textContent.trim() : '--';
    var sub2Unit= $('rr2Sub2Unit')? $('rr2Sub2Unit').textContent.trim() : '';
    var cfg = RR2.sports[RR2.currentSport] || {};

    // Update transition text with real captured stats
    var transTxt = t.querySelector('.rr2-trans-txt');
    if(transTxt){
      var moments = 8 + Math.floor(Math.random()*40);
      var highlights = 2 + Math.floor(Math.random()*8);
      transTxt.innerHTML = 'ASSEMBLING<br><span style="font-size:18px;letter-spacing:.08em">' +
        timeStr + ' · ' + moments + ' moments · ' + highlights + ' highlights</span>';
    }

    t.classList.add('active');
    RR2.stopCap();

    setTimeout(function(){
      // Populate edit stickers with captured sport data
      var stickers = document.querySelectorAll('.rr2-stk');
      var stkData = [
        {lbl: cfg.hero ? cfg.hero[0] : 'STAT', val: heroVal, unit: cfg.hero ? cfg.hero[2].replace(/\s/g,'').toLowerCase() : ''},
        {lbl: 'TIME', val: timeStr, unit: ''},
        {lbl: cfg.sub2 ? cfg.sub2[0].toUpperCase() : 'STAT', val: sub2Val, unit: sub2Unit.toLowerCase()},
        {lbl: '◆ SESSION ' + (cfg.label||'').toUpperCase(), val: sub1Val + (sub1Unit ? ' ' + sub1Unit.toLowerCase() : ''), unit: ''}
      ];
      stickers.forEach(function(stk, i){
        var d = stkData[i] || stkData[0];
        var lblEl = stk.querySelector('.rr2-stk-lbl');
        var valEl = stk.querySelector('.rr2-stk-val');
        if(lblEl) lblEl.textContent = d.lbl;
        if(valEl) valEl.innerHTML = d.val + (d.unit ? '<small>' + d.unit + '</small>' : '');
      });

      // Update edit header context line
      if($('rr2EditCtx')){
        var loc = cfg.loc || 'SESSION';
        $('rr2EditCtx').textContent = loc + ' · ' + timeStr;
      }
      // Update timeline label
      var tlLbl = document.querySelector('.rr2-tl-head-lbl');
      if(tlLbl) tlLbl.textContent = '◆ TIMELINE · ' + timeStr;
      // Update scrubber time
      var editTime = document.querySelector('.rr2-edit-time');
      if(editTime) editTime.textContent = '00:00 / ' + timeStr;

      // Store for play simulation
      RR2.editTotalSec = RR2.capSec;

      window.rr2Go('edit');
      t.classList.remove('active');
      RR2.buildStatWave();
      RR2.buildRoute();
      RR2.buildMomentClips();
      RR2.bindStickers(); // rebind after DOM updates (includes route sticker)
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

  // ===== EDIT PLAYBACK SIMULATION =====
  // Play button toggles a playhead animation across the timeline + updates scrub time.
  RR2.editPlaying = false;
  RR2.editPlayTimer = null;
  RR2.editPlayPos = 0; // 0–1

  window.rr2TogglePlay = function(){
    var playBtn = document.querySelector('.rr2-play-btn');
    var playhead = document.querySelector('.rr2-tl-playhead');
    var scrubBar = document.querySelector('.rr2-scrub');
    var timeEl = document.querySelector('.rr2-edit-time');
    var pad = function(n){ return String(n).padStart(2,'0'); };
    var totalSec = RR2.editTotalSec || 60;

    if(RR2.editPlaying){
      // Pause
      RR2.editPlaying = false;
      if(RR2.editPlayTimer) clearInterval(RR2.editPlayTimer);
      if(playBtn) playBtn.textContent = '▶';
      return;
    }
    // Play
    RR2.editPlaying = true;
    if(playBtn) playBtn.textContent = '❚❚';
    if(RR2.editPlayPos >= 1) RR2.editPlayPos = 0;

    RR2.editPlayTimer = setInterval(function(){
      RR2.editPlayPos += 0.005; // advance ~0.5% per tick
      if(RR2.editPlayPos >= 1){
        RR2.editPlayPos = 1;
        RR2.editPlaying = false;
        clearInterval(RR2.editPlayTimer);
        if(playBtn) playBtn.textContent = '▶';
      }
      var pct = (RR2.editPlayPos * 100).toFixed(1) + '%';
      if(playhead) playhead.style.left = pct;
      if(scrubBar) scrubBar.style.setProperty('--pos', RR2.editPlayPos.toFixed(3));
      if(timeEl){
        var cur = Math.round(RR2.editPlayPos * totalSec);
        var cm = Math.floor(cur/60), cs = cur%60;
        var tm = Math.floor(totalSec/60), ts = totalSec%60;
        timeEl.textContent = pad(cm)+':'+pad(cs)+' / '+pad(tm)+':'+pad(ts);
      }
    }, 80);
  };

  // ===== CAMERA SNAP + GALLERY =====
  // Captures simulated "moments" during the workout with a shutter flash.
  // Moments appear as thumbnails in a gallery tray and become clips in the edit timeline.
  RR2.moments = [];
  RR2.snapIcons = ['📸','🏃','🔥','💪','🎯','⚡','🌊','🏔️','🎾','⛳'];

  window.rr2Snap = function(type){
    type = type || 'photo';
    var pad = function(n){ return String(n).padStart(2,'0'); };
    var m = Math.floor((RR2.capSec%3600)/60), s = RR2.capSec%60;
    var timeStr = pad(m) + ':' + pad(s);
    var icon = RR2.snapIcons[Math.floor(Math.random()*RR2.snapIcons.length)];

    // Record moment
    RR2.moments.push({type:type, time:timeStr, sec:RR2.capSec, icon:icon});

    // Flash animation
    var flash = document.getElementById('rr2Flash');
    if(flash){
      flash.classList.remove('active');
      void flash.offsetWidth; // reflow
      flash.classList.add('active');
    }

    // Add thumbnail to gallery tray
    var gallery = document.getElementById('rr2Gallery');
    if(gallery){
      var thumb = document.createElement('div');
      thumb.className = 'rr2-gallery-thumb' + (type==='video' ? ' video' : '');
      thumb.innerHTML = '<div class="rr2-gallery-thumb-inner">' + icon + '</div>' +
                        '<span class="rr2-gallery-thumb-time">' + timeStr + '</span>';
      gallery.appendChild(thumb);
      // Auto-scroll to latest
      gallery.scrollLeft = gallery.scrollWidth;
    }
  };

  // ===== GPS ROUTE GENERATOR =====
  // Builds a fake but plausible Strava-style route SVG per sport type.
  // Loop for run/walk/hike, out-and-back for cycle/kayak, court shape for racket sports, etc.
  RR2.routeShapes = {
    loop:  'M10,45 C10,20 25,5 40,10 C55,15 70,10 68,28 C66,42 55,50 40,48 C25,46 12,50 10,45 Z',
    outback:'M8,28 C15,15 30,10 45,18 C55,24 65,20 72,28 M72,28 C65,36 55,32 45,38 C30,46 15,41 8,28',
    figure8:'M15,28 C15,10 35,10 35,28 C35,46 55,46 55,28 C55,10 75,10 75,28 C75,46 55,46 55,28 C55,10 35,10 35,28 C35,46 15,46 15,28',
    court: 'M20,10 L60,10 L60,46 L20,46 Z M40,10 L40,46 M20,28 L60,28',
    field: 'M10,10 L70,10 L70,46 L10,46 Z M40,10 C40,28 40,28 40,46 M10,28 C25,28 55,28 70,28',
    wave:  'M5,28 C15,8 25,48 35,28 C45,8 55,48 65,28 C72,14 75,28 75,28',
    point: 'M40,48 L15,30 L25,8 L55,8 L65,30 Z'
  };
  RR2.sportRouteMap = {
    run:'loop',walk:'loop',hike:'loop',trail:'loop',
    cycle:'outback',mtb:'outback',gravel:'outback',ebike:'outback',
    swim:'outback',surf:'wave',kayak:'outback',sup:'outback',row:'outback',windsurf:'wave',
    tennis:'court',pickle:'court',badminton:'court',squash:'court',padel:'court',racquetball:'court',
    soccer:'field',basketball:'court',volleyball:'court',football:'field',lacrosse:'field',cricket:'field',
    lift:'point',crossfit:'point',hiit:'point',yoga:'point',pilates:'point',climb:'point',
    ski:'outback',snowboard:'outback',xcski:'outback',
    golf:'loop',skate:'loop',dance:'point',martial:'point',horse:'outback'
  };

  RR2.buildRoute = function(){
    var wrap = document.getElementById('rr2RouteStkWrap');
    if(!wrap) return;
    var cfg = RR2.sports[RR2.currentSport];
    var shapeKey = RR2.sportRouteMap[RR2.currentSport] || 'loop';
    var path = RR2.routeShapes[shapeKey] || RR2.routeShapes.loop;
    var pathEl = document.getElementById('rr2RoutePath');
    var startEl = document.getElementById('rr2RouteStart');
    var endEl = document.getElementById('rr2RouteEnd');
    var lblEl = document.getElementById('rr2RouteLbl');
    var distEl = document.getElementById('rr2RouteDist');

    if(pathEl) pathEl.setAttribute('d', path);
    // Start dot at first point of path
    if(startEl){ startEl.setAttribute('cx','10'); startEl.setAttribute('cy','45'); }
    if(endEl){
      var isLoop = (shapeKey === 'loop' || shapeKey === 'point');
      endEl.setAttribute('cx', isLoop ? '10' : '72');
      endEl.setAttribute('cy', isLoop ? '45' : '28');
    }
    if(lblEl) lblEl.textContent = (cfg ? cfg.loc : 'ROUTE');
    if(distEl){
      var dist = cfg ? cfg.sub1[1] + ' ' + cfg.sub1[2] : '2.5 MI';
      distEl.textContent = dist;
    }
    wrap.style.display = '';
  };

  // ===== POPULATE EDIT TIMELINE WITH MOMENTS =====
  // Called during the transition — inserts captured moments as extra clip blocks.
  RR2.buildMomentClips = function(){
    var momTrack = document.getElementById('rr2MomTrack');
    if(!momTrack || !RR2.moments.length) return;
    // Show the moment track row
    momTrack.style.display = 'flex';
    var clips = momTrack.querySelectorAll('.rr2-clip.moment');
    clips.forEach(function(c){ c.remove(); });
    RR2.moments.forEach(function(mo){
      var clip = document.createElement('div');
      clip.className = 'rr2-clip moment';
      var w = 8 + Math.random()*10;
      clip.style.width = w + '%';
      clip.innerHTML = '<span style="position:absolute;left:3px;top:2px;font-size:8px">' + mo.icon + '</span>';
      momTrack.appendChild(clip);
    });
  };

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
    RR2.buildCatRow();
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
    RR2.buildCatRow();
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