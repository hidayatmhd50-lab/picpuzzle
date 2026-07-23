/* ================= DATA ================= */
const LEVELS = {
  1:{
    id:1, name:"Hewan", icon:"🦁", desc:"2 tahap tebak gambar hewan", diff:"Mudah", unlockScore:20, duration:30,
    words:[
      {e:"🐱", a:"KUCING", c:"Suka bilang 'meong'"},
      {e:"🐘", a:"GAJAH", c:"Punya belalai panjang"},
      {e:"🦒", a:"JERAPAH", c:"Lehernya sangat panjang"},
      {e:"🐼", a:"PANDA", c:"Warnanya hitam putih, suka makan bambu"},
      {e:"🐸", a:"KATAK", c:"Suka melompat-lompat di air"},
      {e:"🦁", a:"SINGA", c:"Rajanya hutan, suaranya 'auum'"},
      {e:"🐧", a:"PINGUIN", c:"Burung yang tidak bisa terbang"},
      {e:"🐰", a:"KELINCI", c:"Telinganya panjang, suka melompat"}
    ]
  },
  2:{
    id:2, name:"Buah & Sayur", icon:"🍎", desc:"2 tahap tebak gambar buah & sayur", diff:"Sedang", unlockScore:20, duration:25,
    words:[
      {e:"🍎", a:"APEL", c:"Buah bulat warna merah"},
      {e:"🍌", a:"PISANG", c:"Buah panjang warna kuning"},
      {e:"🍇", a:"ANGGUR", c:"Buah kecil-kecil, tumbuh berkelompok"},
      {e:"🍓", a:"STROBERI", c:"Buah merah, bentuknya seperti hati"},
      {e:"🍍", a:"NANAS", c:"Buah berduri, rasanya manis asam"},
      {e:"🥕", a:"WORTEL", c:"Sayur oranye, disukai kelinci"},
      {e:"🌽", a:"JAGUNG", c:"Bijinya kuning, bisa jadi popcorn"},
      {e:"🥔", a:"KENTANG", c:"Umbi bulat, bisa jadi keripik"}
    ]
  },
  3:{
    id:3, name:"Benda", icon:"🪑", desc:"2 tahap tebak gambar benda sehari-hari", diff:"Menantang", unlockScore:20, duration:20,
    words:[
      {e:"🪑", a:"KURSI", c:"Tempat duduk kita"},
      {e:"📚", a:"BUKU", c:"Untuk membaca dan belajar"},
      {e:"⏰", a:"JAM", c:"Menunjukkan waktu sekarang"},
      {e:"🎒", a:"TAS", c:"Untuk membawa buku ke sekolah"},
      {e:"🔑", a:"KUNCI", c:"Untuk membuka pintu"},
      {e:"☂️", a:"PAYUNG", c:"Dipakai saat hujan"},
      {e:"👟", a:"SEPATU", c:"Dipakai di kaki"},
      {e:"✂️", a:"GUNTING", c:"Untuk memotong kertas"}
    ]
  },
  4:{
    id:4, name:"Campuran", icon:"🔀", desc:"2 tahap campuran Hewan, Buah & Sayur, Benda", diff:"Sulit", unlockScore:20, duration:15,
    words:[
      {e:"🦒", a:"JERAPAH", c:"Lehernya sangat panjang"},
      {e:"🐧", a:"PINGUIN", c:"Burung yang tidak bisa terbang"},
      {e:"🦁", a:"SINGA", c:"Rajanya hutan, suaranya 'auum'"},
      {e:"🍇", a:"ANGGUR", c:"Buah kecil-kecil, tumbuh berkelompok"},
      {e:"🍍", a:"NANAS", c:"Buah berduri, rasanya manis asam"},
      {e:"🥔", a:"KENTANG", c:"Umbi bulat, bisa jadi keripik"},
      {e:"⏰", a:"JAM", c:"Menunjukkan waktu sekarang"},
      {e:"☂️", a:"PAYUNG", c:"Dipakai saat hujan"},
      {e:"✂️", a:"GUNTING", c:"Untuk memotong kertas"}
    ]
  }
};
// Level lulus/lanjut ke level berikutnya begitu pemain berhasil menjawab
// CORRECT_TO_WIN soal dengan BENAR (jawaban salah/waktu habis tidak dihitung,
// cuma mengurangi nyawa & memunculkan soal acak lain). Level gagal kalau
// nyawa habis (0) sebelum mencapai CORRECT_TO_WIN jawaban benar.
const CORRECT_TO_WIN = 2;

// ===== Skor & Bintang =====
// BASE_SCORE: poin dasar tiap jawaban benar.
// SPEED_BONUS: poin tambahan kalau dijawab cepat (masih >=70% dari waktu tersisa).
// PENALTY_SCORE: poin dikurangi tiap kali nyawa berkurang (waktu habis).
const BASE_SCORE = 40;
const SPEED_BONUS = 10;
const PENALTY_SCORE = 15;
const MAX_SCORE_PER_LEVEL = CORRECT_TO_WIN * (BASE_SCORE + SPEED_BONUS); // skor sempurna = 100

// Ambang batas bintang, dihitung dari persentase skor terhadap skor maksimum.
// Ini membuat bintang benar-benar mencerminkan performa (akurasi + kecepatan),
// bukan cuma sisa nyawa -- jadi pemain yang lambat/banyak salah ketik tapi tidak
// pernah kehabisan waktu tidak otomatis dapat 3 bintang.
const STAR_THRESHOLDS = { three: 0.8, two: 0.5 }; // >=80% -> 3 bintang, >=50% -> 2 bintang, sisanya 1 bintang (kalau lulus)

function calcStars(passed, score){
  if(!passed) return 0;
  const pct = score / MAX_SCORE_PER_LEVEL;
  if(pct >= STAR_THRESHOLDS.three) return 3;
  if(pct >= STAR_THRESHOLDS.two) return 2;
  return 1; // menang selalu dapat minimal 1 bintang
}

/* ================= STATE ================= */
const HIDDEN_PCT = 60;  // 60% gambar tersembunyi & tetap konstan selama waktu berjalan (tantangan utama, dipersulit dari 50%)
const HIDE_SIDES = ['right','left','top','bottom'];
const HINT_CHARGES_PER_LEVEL = 1; // jumlah "kesempatan" petunjuk per level
const REVEALED_LETTERS = 2; // jumlah huruf yang sudah dibuka duluan di kolom jawaban

let state = {
  level:null, queue:[], qIndex:0, score:0, hearts:3, correctCount:0, totalAnswered:0,
  answer:'', revealed:new Set(), typed:'', hintCharges:HINT_CHARGES_PER_LEVEL, timeLeft:45, maxTime:45, timerId:null,
  soundOn:true, sfxVolume:0.7, musicOn:true, musicVolume:0.3,
  levelPassed:{}, unlockedLevels:{1:true}, musicNodes:null, locked:false
};

/* ================= NAV ================= */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id === 'screen-levels') renderLevelList();
  if(id !== 'screen-game'){ stopTick(); } else if(state.musicOn) startMusic();
}
function goMenu(){ beep(520,.12,'triangle'); if(state.musicOn) startMusic(); showScreen('screen-menu'); }
function openPause(){
  clearInterval(state.timerId);
  pauseTick();
  document.getElementById('pauseOverlay').classList.add('show');
  beep(450,.1,'triangle');
}
function resumeGame(){
  document.getElementById('pauseOverlay').classList.remove('show');
  beep(600,.1,'triangle');
  if(state.qIndex < state.queue.length && state.hearts>0) runTimer(true);
}
function pauseGoHome(){
  document.getElementById('pauseOverlay').classList.remove('show');
  clearInterval(state.timerId);
  stopTick();
  showScreen('screen-menu');
}
function pauseExitGame(){
  document.getElementById('pauseOverlay').classList.remove('show');
  clearInterval(state.timerId);
  stopTick();
  showScreen('screen-levels');
  showToast('Keluar dari permainan 👋');
}
function exitGame(){
  showToast("Sampai jumpa lagi di Pic Puzzle Show! 👋");
}

/* ================= AUDIO (nonaktif sementara - aset suara dihapus) ================= */
// Semua fungsi di bawah sengaja dibuat no-op (tidak melakukan apa-apa) supaya
// seluruh pemanggilan suara di kode lain tetap aman dijalankan tanpa error,
// walau tidak ada file audio di assets/audio. Tinggal isi lagi isi fungsi ini
// kalau aset suara sudah ditambahkan kembali.
const AUDIO_PATH = 'assets/audio/';
let musicEl = null;
let tickAudio = null;

function playSfx(file){
  if(!state.soundOn) return;
  try{
    const a = getSfxAudio(file);
    clearTimeout(a._capTimer); // batalkan rencana stop dari pemutaran sebelumnya (kalau ada)
    a.loop = false;        // pastikan tidak pernah looping
    a.pause();             // hentikan dulu kalau masih sedang berbunyi dari trigger sebelumnya
    a.currentTime = 0;     // mulai dari awal, supaya selalu 1x putaran penuh & bersih
    a.volume = 1;
    a.play().catch(()=>{});
  }catch(e){}
}
// Sebagian file sfx ternyata durasinya panjang (mis. berhasil.mp3 = 24 detik,
// nyawa.mp3 = 5 detik) padahal yang diinginkan cuma "ding" singkat sebagai
// notifikasi 1 kejadian. Kalau dibiarkan main penuh, suaranya masih terdengar
// nyambung/berulang sampai ke soal atau layar berikutnya. playSfxCapped()
// memutar sfx seperti biasa, lalu memaksa berhenti setelah durasi singkat.
function playSfxCapped(file, capSeconds){
  playSfx(file);
  if(!state.soundOn) return;
  try{
    const a = getSfxAudio(file);
    a._capTimer = setTimeout(()=>{ try{ a.pause(); }catch(e){} }, capSeconds*1000);
  }catch(e){}
}
// Hentikan paksa sebuah sfx (dipakai saat pindah soal/layar, supaya sisa
// suara dari kejadian sebelumnya tidak nyambung ke soal/layar baru).
function stopSfx(file){
  const a = sfxCache[file];
  if(a){ clearTimeout(a._capTimer); try{ a.pause(); a.currentTime = 0; }catch(e){} }
}
const sfxCache = {};
function getSfxAudio(file){
  if(!sfxCache[file]){
    const a = new Audio(AUDIO_PATH + file);
    a.preload = 'auto';
    sfxCache[file] = a;
  }
  return sfxCache[file];
}
function preloadSfx(files){
  files.forEach(f=>{ try{ getSfxAudio(f).load(); }catch(e){} });
}
function beep(freq=440, dur=.15, type='sine'){ /* suara dinonaktifkan */ }
function startMusic(){
  try{
    if(!musicEl){
      musicEl = new Audio(AUDIO_PATH + 'bgm.mp3');
      musicEl.loop = true;
    }
    musicEl.volume = state.musicVolume;
    musicEl.play().catch(()=>{});
  }catch(e){}
}
function stopMusic(){
  if(musicEl){
    try{ musicEl.pause(); musicEl.currentTime = 0; }catch(e){}
  }
}
function onSfxToggle(){
  state.soundOn = document.getElementById('sfxToggle').checked;
  if(!state.soundOn) pauseTick();
  else if(document.getElementById('screen-game').classList.contains('active') && state.timerId) resumeTick();
}
function onSfxSlider(v){
  state.sfxVolume=v/100; document.getElementById('sfxVal').textContent=v+'%';
}
// Suara detak waktu (sfx_timer_tick.mp3): mulai dari 0 detik setiap soal baru,
// dijeda/dilanjutkan mengikuti pause-resume, dan dihentikan begitu
// timer berhenti (jawaban benar/salah/waktu habis/level selesai).
function startTick(){
  if(!state.soundOn) return;
  try{
    if(!tickAudio) tickAudio = new Audio(AUDIO_PATH + 'sfx_timer_tick.mp3');
    tickAudio.currentTime = 0;
    tickAudio.volume = 1;
    tickAudio.play().catch(()=>{});
  }catch(e){}
}
function resumeTick(){
  if(!state.soundOn) return;
  try{
    if(tickAudio){ tickAudio.volume = 1; tickAudio.play().catch(()=>{}); }
    else startTick();
  }catch(e){}
}
function pauseTick(){
  if(tickAudio){ try{ tickAudio.pause(); }catch(e){} }
}
function stopTick(){
  if(tickAudio){ try{ tickAudio.pause(); tickAudio.currentTime = 0; }catch(e){} }
}
function onMusicToggle(){
  state.musicOn = document.getElementById('musicToggle').checked;
  if(state.musicOn) startMusic(); else stopMusic();
  syncMusicUI();
}
function toggleMusicBtn(){
  state.musicOn = !state.musicOn;
  if(state.musicOn) startMusic(); else stopMusic();
  syncMusicUI();
}
function syncMusicUI(){
  const btn = document.getElementById('musicBtn');
  if(btn){ btn.textContent = state.musicOn ? '🔊' : '🔇'; }
  const toggle = document.getElementById('musicToggle');
  if(toggle) toggle.checked = state.musicOn;
}
function onMusicSlider(v){
  state.musicVolume=v/100; document.getElementById('musicVal').textContent=v+'%';
  if(musicEl) musicEl.volume = state.musicVolume;
}

/* ================= LEVEL SELECT RENDER ================= */
function renderLevelList(){
  const wrap = document.getElementById('levelList');
  wrap.innerHTML='';
  Object.values(LEVELS).forEach(lv=>{
    const unlocked = lv.id===1 || !!state.unlockedLevels[lv.id];
    const card = document.createElement('div');
    card.className = 'level-card ' + (unlocked?'unlocked':'locked');
    card.innerHTML = `
      <div class="level-icon">${unlocked ? lv.icon : '🔒'}</div>
      <div class="level-info">
        <div class="name">Level ${lv.id}</div>
      </div>`;
    if(unlocked) card.onclick=()=>startLevel(lv.id);
    wrap.appendChild(card);
  });
}

/* ================= GAME FLOW ================= */
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function startLevel(id){
  document.getElementById('pauseOverlay').classList.remove('show');
  state.level = LEVELS[id];
  state.unlockedLevels[id] = true;
  state.queue = shuffle(state.level.words); // semua kata di level, diacak; akan diacak ulang lagi kalau habis
  state.qIndex = 0;
  state.score = 0;
  state.hearts = 3;
  state.correctCount = 0;
  state.totalAnswered = 0;
  state.hintCharges = HINT_CHARGES_PER_LEVEL;
  document.getElementById('levelTag').textContent = state.level.name;
  syncMusicUI();
  showScreen('screen-game');
  loadQuestion();
}
function retryLevel(){ startLevel(state.level.id); }
function goNextLevel(){
  const nextId = state.level.id+1;
  if(LEVELS[nextId]) startLevel(nextId); else showScreen('screen-menu');
}

function clipInset(side, hiddenPct){
  switch(side){
    case 'right': return `inset(0 ${hiddenPct}% 0 0)`;
    case 'left': return `inset(0 0 0 ${hiddenPct}%)`;
    case 'top': return `inset(${hiddenPct}% 0 0 0)`;
    default: return `inset(0 0 ${hiddenPct}% 0)`;
  }
}

function loadQuestion(){
  // Kalau semua kata di level ini sudah pernah tampil, acak ulang dari awal
  // dan lanjut terus. Level berakhir di checkAnswer() (menang, cukup 2 jawaban
  // benar) atau di handleHeartLoss() (kalah, nyawa habis) -- bukan di sini.
  if(state.qIndex >= state.queue.length){
    state.queue = shuffle(state.level.words);
    state.qIndex = 0;
  }
  stopSfx('berhasil.mp3'); stopSfx('nyawa.mp3'); stopSfx('salah.mp3'); // pastikan tidak ada sisa suara dari soal sebelumnya
  const q = state.queue[state.qIndex];
  state.timeLeft = state.level.duration; state.maxTime = state.level.duration;
  state.hideSide = HIDE_SIDES[Math.floor(Math.random()*HIDE_SIDES.length)];
  state.locked = false;

  const pic = document.getElementById('pictureEmoji');
  // langkah 1: sembunyikan total TANPA animasi sebelum gambar baru dipasang,
  // supaya gambar jawaban tidak pernah sempat terlihat penuh saat berpindah soal
  pic.style.transition = 'none';
  pic.style.clipPath = clipInset(state.hideSide, 100);
  pic.src = 'assets/images/' + q.a.toLowerCase() + '.svg';
  void pic.offsetWidth; // paksa reflow agar state "tersembunyi total" benar-benar diterapkan dulu
  // langkah 2: baru animasikan terbuka ke posisi separuh tersembunyi (efek tirai terbuka)
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      pic.style.transition = '';
      pic.style.clipPath = clipInset(state.hideSide, HIDDEN_PCT);
    });
  });

  updateHintBtn();
  clearFeedback();
  document.getElementById('clueText').textContent = q.c;

  // Bukakan 2 huruf acak di kolom jawaban; sisanya harus diketik sendiri oleh pemain
  // lewat keyboard perangkatnya.
  state.answer = q.a;
  state.typed = '';
  state.revealed = new Set();
  const positions = shuffle([...state.answer].map((_,i)=>i));
  const revealCount = Math.min(REVEALED_LETTERS, Math.max(0, state.answer.length-1));
  positions.slice(0, revealCount).forEach(i=>state.revealed.add(i));

  const input = document.getElementById('typedInput');
  input.value = '';
  input.maxLength = state.answer.length;
  input.disabled = false;

  renderSlots(); updateHud();
  runTimer();
  setTimeout(()=>input.focus(), 50);
}

function focusTypedInput(){
  const input = document.getElementById('typedInput');
  if(input && !input.disabled) input.focus();
}

function runTimer(resume){
  clearInterval(state.timerId);
  if(resume) resumeTick(); else startTick();
  state.timerId = setInterval(()=>{
    state.timeLeft -= 0.1;
    if(state.timeLeft <= 0){
      state.timeLeft = 0;
      clearInterval(state.timerId);
      stopTick();
      handleTimeout();
      return;
    }
    const pct = state.timeLeft/state.maxTime;
    document.getElementById('timerFill').style.width = (pct*100)+'%';
    document.getElementById('timerFill').classList.toggle('warn', pct<0.35);
    // gambar sengaja tetap separuh tersembunyi sepanjang waktu (tantangan konstan, bukan makin mudah)
  }, 100);
}

// Susun tampilan kolom jawaban: posisi yang sudah diketik pemain ditampilkan
// sesuai ketikannya; posisi yang belum diketik tapi termasuk 2 huruf "bocoran"
// ditampilkan sebagai preview supaya pemain tahu huruf itu duluan.
function renderSlots(){
  const wrap = document.getElementById('answerSlots');
  wrap.innerHTML='';
  for(let i=0;i<state.answer.length;i++){
    const d=document.createElement('div');
    let ch='', cls='slot';
    if(i < state.typed.length){
      ch = state.typed[i];
      cls += ' filled';
    } else if(state.revealed.has(i)){
      ch = state.answer[i];
      cls += ' filled revealed';
    }
    d.className = cls;
    d.textContent = ch;
    wrap.appendChild(d);
  }
}

// Pemain mengetik jawaban LENGKAP (semua huruf, termasuk 2 huruf yang sudah
// dibocorkan di awal) — supaya jawaban yang dicek selalu sama persis dengan
// kata jawabannya, tanpa celah/bug pencocokan huruf ganda.
function onTypedInput(el){
  const max = state.answer.length;
  let clean = el.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0, max);
  el.value = clean;
  state.typed = clean;
  renderSlots();
  if(clean.length === max && !state.locked){
    state.locked = true;
    checkAnswer();
  }
}

function hapusHuruf(){
  if(state.typed.length===0) return;
  state.typed = state.typed.slice(0,-1);
  document.getElementById('typedInput').value = state.typed;
  beep(300,.08,'square');
  renderSlots();
}

function pakaiHint(){
  if(state.hintCharges<=0) return;
  if(state.typed.length >= state.answer.length) return;
  const nextChar = state.answer[state.typed.length];
  state.typed += nextChar;
  document.getElementById('typedInput').value = state.typed;
  state.hintCharges--;
  beep(700,.1,'sine');
  updateHud(); updateHintBtn(); renderSlots();
  if(state.typed.length === state.answer.length && !state.locked){
    state.locked = true;
    checkAnswer();
  }
}
function updateHintBtn(){
  const btn = document.getElementById('hintBtn');
  btn.disabled = state.hintCharges<=0;
  btn.textContent = state.hintCharges>0
    ? '💡 Petunjuk (1 kesempatan)'
    : '💡 Petunjuk (habis)';
}

function checkAnswer(){
  const answer = state.answer;
  const guess = state.typed;

  if(guess === answer){
    clearInterval(state.timerId);
    stopTick();
    document.getElementById('typedInput').disabled = true;
    const speedBonus = state.timeLeft >= state.maxTime*0.7 ? SPEED_BONUS : 0;
    state.score += BASE_SCORE + speedBonus;
    state.correctCount++;
    state.totalAnswered++;
    beep(880,.18,'sine');
    playSfxCapped('berhasil.mp3', 1.2); // 1x, dipotong ±1.2 detik saja (file aslinya 24 detik)
    showFeedback(true, speedBonus>0 ? '🎉 Benar! +'+(BASE_SCORE+speedBonus)+' (bonus kecepatan!)' : '🎉 Benar! +'+BASE_SCORE);
    document.getElementById('pictureEmoji').style.clipPath='inset(0 0 0 0)';
    updateHud();
    if(state.correctCount >= CORRECT_TO_WIN){
      setTimeout(()=>finishLevel(true), 1100); // sudah cukup 2 jawaban benar -> level lulus
    } else {
      setTimeout(()=>{ state.qIndex++; loadQuestion(); }, 1100);
    }
  } else {
    handleWrongAnswer();
  }
}
function handleTimeout(){ handleHeartLoss(); }

// Jawaban salah: TIDAK mengurangi nyawa. Cuma kasih feedback, lalu bersihkan
// kolom jawaban supaya pemain bisa coba mengetik ulang selagi waktu masih ada.
function handleWrongAnswer(){
  const pic = document.getElementById('pictureEmoji');
  pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
  beep(180,.25,'sawtooth');
  playSfxCapped('salah.mp3', 1.0); // 1x, dipotong ±1 detik saja (file aslinya 5 detik)
  showFeedback(false, 'Belum tepat, coba lagi!');
  setTimeout(()=>{
    stopSfx('salah.mp3'); // pastikan sisa suara tidak nyambung ke percobaan berikutnya
    state.typed = '';
    state.locked = false;
    const input = document.getElementById('typedInput');
    input.value = '';
    input.maxLength = state.answer.length;
    renderSlots(); clearFeedback();
    input.focus();
  }, 900);
}

// Nyawa HANYA berkurang di sini: dipanggil ketika waktu habis dan pemain
// belum berhasil menjawab dengan benar.
function handleHeartLoss(){
  state.hearts--;
  state.totalAnswered++;
  state.score = Math.max(0, state.score - PENALTY_SCORE); // skor tidak boleh minus
  updateHud();
  playSfxCapped('nyawa.mp3', 1.0); // 1x, dipotong ±1 detik saja (file aslinya 5 detik)
  const pic = document.getElementById('pictureEmoji');
  pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
  beep(180,.25,'sawtooth');

  if(state.hearts <= 0){
    const answer = state.answer;
    pic.style.clipPath = 'inset(0 0 0 0)';
    document.getElementById('typedInput').disabled = true;
    showFeedback(false, 'Yah, kehabisan nyawa! Jawabannya: '+answer+' (-'+PENALTY_SCORE+' skor)');
    clearInterval(state.timerId);
    stopTick();
    setTimeout(()=>finishLevel(false), 1600);
    return;
  }

  const answer = state.answer;
  pic.style.clipPath = 'inset(0 0 0 0)';
  document.getElementById('typedInput').disabled = true;
  showFeedback(false, '⏱️ Waktu habis! Jawabannya: '+answer+' (-'+PENALTY_SCORE+' skor)');
  setTimeout(()=>{ state.qIndex++; loadQuestion(); }, 1600);
}


function updateHud(){
  document.getElementById('heartsDisplay').textContent = '❤️'.repeat(Math.max(state.hearts,0)) + '🖤'.repeat(3-Math.max(state.hearts,0));
  document.getElementById('scoreDisplay').textContent = 'Skor: '+state.score;
}
function showFeedback(good, text){
  const el = document.getElementById('feedbackBanner');
  el.textContent = text;
  el.className = 'feedback-banner show ' + (good?'good':'bad');
}
function clearFeedback(){
  const el = document.getElementById('feedbackBanner');
  el.className = 'feedback-banner';
  el.textContent='';
}

function finishLevel(passed){
  clearInterval(state.timerId);
  stopTick();
  const correct = state.correctCount;

  // Menang = berhasil kumpulkan CORRECT_TO_WIN jawaban benar sebelum nyawa habis.
  // Bintang dihitung dari persentase skor terhadap skor maksimum level (lihat
  // calcStars & MAX_SCORE_PER_LEVEL di atas) supaya benar-benar mencerminkan
  // akurasi + kecepatan pemain, bukan cuma sisa nyawa.
  const stars = calcStars(passed, state.score);

  if(passed){
    state.levelPassed[state.level.id] = true;
  }
  document.getElementById('resultsEyebrow').textContent = passed ? 'Level Selesai' : 'Nyawa Habis';
  document.getElementById('resultsTitle').textContent = passed ? 'Hebat, Juara Kuis! 🏆' : 'Yah, Coba Lagi Yuk!';
  document.getElementById('resultsStars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
  document.getElementById('statScore').textContent = state.score;
  document.getElementById('statCorrect').textContent = correct+'/'+CORRECT_TO_WIN;

  const nextBtn = document.getElementById('btnNextLevel');
  const hasNext = !!LEVELS[state.level.id+1];
  const unlockedNext = passed && hasNext;
  nextBtn.style.display = unlockedNext ? 'flex' : 'none';

  if(passed) playSfx('winner.mp3'); else beep(250, .3, 'sawtooth');
  showScreen('screen-results');
}

/* ================= TOAST ================= */
let toastTimer=null;
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ================= MARQUEE LIGHTS ================= */
function buildLights(){
  const cfg=[['lightsTop',9],['lightsBottom',9],['lightsLeft',5],['lightsRight',5]];
  let d=0;
  cfg.forEach(([id,n])=>{
    const el=document.getElementById(id);
    for(let i=0;i<n;i++){
      const b=document.createElement('span');
      b.className='bulb';
      b.style.animationDelay=(d*0.12)+'s';
      el.appendChild(b);
      d++;
    }
  });
}

/* ================= INIT ================= */
buildLights();
renderLevelList();
syncMusicUI();
preloadSfx(['winner.mp3','nyawa.mp3','berhasil.mp3','salah.mp3','sfx_timer_tick.mp3']);
setTimeout(()=>{ if(document.getElementById('screen-splash').classList.contains('active')) goMenu(); }, 4000);

// Browser mengharuskan minimal 1 sentuhan/klik asli dari pengguna sebelum audio
// boleh diputar otomatis. Tombol "Ketuk untuk mulai" biasanya jadi sentuhan
// pertama itu, tapi kalau splash sempat auto-lanjut lewat timeout di atas,
// jaga-jaga backsound tetap dimulai begitu ada tap/klik pertama di mana saja.
function startMusicOnFirstGesture(){
  if(state.musicOn) startMusic();
}
document.addEventListener('click', startMusicOnFirstGesture, {once:true});
document.addEventListener('touchstart', startMusicOnFirstGesture, {once:true});
