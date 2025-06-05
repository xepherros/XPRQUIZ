import React, { useEffect, useRef, useState } from "react";

// === เพิ่มเสียง ===
const correctSound = '/sounds/Correct.mp3';
const wrongSound = '/sounds/Wrong.wav';
const winSound = '/sounds/Win.wav';

// --- 1. Word list 7 week ---
const wordBank = {
  1: [
    "Agent IATA code",
    "Air waybill",
    "Airport of departure",
    "Airport of destination",
    "Arrival notice",
    "Berth",
    "Bill of lading",
    "Bulk cargo",
    "Bulk carrier",
    "Carrier"
  ],
  2: [
    "Consignee",
    "Container",
    "Customs broker",
    "Dangerous goods",
    "Delivery order",
    "Demurrage",
    "ETA",
    "ETD",
    "Export license",
    "Freight forwarder"
  ],
  3: [
    "Freight prepaid",
    "Gross weight",
    "Handling",
    "Import license",
    "Incoterms",
    "Manifest",
    "Notify party",
    "Pallet",
    "Port of discharge",
    "Shipper"
  ],
  4: [
    "Shipping instructions",
    "Shipping marks",
    "Stevedore",
    "Stuffing",
    "Tare weight",
    "Terminal",
    "Transshipment",
    "Unstuffing",
    "Warehouse",
    "Waybill"
  ],
  5: [
    "Cargo insurance",
    "Certificate of origin",
    "Clean bill of lading",
    "Commercial invoice",
    "Consignment",
    "Container yard",
    "Customs clearance",
    "Delivery",
    "Documentary credit",
    "Export declaration"
  ],
  6: [
    "Freight collect",
    "Freight forwarders certificate",
    "Import declaration",
    "Letter of credit",
    "Packing list",
    "Port of loading",
    "Proforma invoice",
    "Quarantine",
    "Shipping order",
    "Through bill of lading"
  ],
  7: [
    "Tramp vessel",
    "Vessel",
    "Warehouse receipt",
    "Wharfage",
    "Air cargo",
    "Booking",
    "Charter party",
    "Customs duty",
    "Export permit",
    "Transshipment port"
  ]
};

function playSound(src) {
  const audio = new window.Audio(src);
  audio.currentTime = 0;
  audio.play();
}

function shuffleArray(array) {
  return array
    .map(val => ({ val, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ val }) => val);
}

// --- 2. Leaderboard Utility ---
function getLeaderboard(week) {
  return JSON.parse(localStorage.getItem('spelling-leaderboard-week-' + week) || "[]");
}

function saveLeaderboard(week, leaderboard) {
  localStorage.setItem('spelling-leaderboard-week-' + week, JSON.stringify(leaderboard));
}

// --- 3. Main App ---
export default function AppSpelling({ goHome }) {
  // ฟอร์มเริ่มต้น
  const [playerName, setPlayerName] = useState("");
  const [week, setWeek] = useState("");
  const [formError, setFormError] = useState("");
  const [started, setStarted] = useState(false);

  // เกม
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [slots, setSlots] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [result, setResult] = useState("");
  const [resultColor, setResultColor] = useState("black");
  const [disableNext, setDisableNext] = useState(true);
  const [selectedTileIdx, setSelectedTileIdx] = useState(null);
  const [score, setScore] = useState(0);

  // จบเกม
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const samanthaVoice = useRef(null);

  const words = week ? wordBank[week] : [];

  // --- เริ่มเกม ---
  function handleStart(e) {
    e.preventDefault();
    if (!playerName.trim()) {
      setFormError("กรุณากรอกชื่อ");
      return;
    }
    if (!week) {
      setFormError("กรุณาเลือกสัปดาห์");
      return;
    }
    setStarted(true);
    setScore(0);
    setCurrentWordIndex(0);
    setFinished(false);
  }

  // --- เตรียมคำแต่ละข้อ ---
  useEffect(() => {
    if (!started) return;
    if (!words.length) return;
    const word = words[currentWordIndex].toUpperCase();
    const letters = word.replace(/ /g, '').split('');
    setSlots(
      word.split("").map(char =>
        char === " " ? { letter: " ", filled: true, tile: null } : { letter: char, filled: false, tile: null }
      )
    );
    setTiles(shuffleArray(letters).map((l, i) => ({ letter: l, id: `${l}-${i}` })));
    setResult("");
    setResultColor("black");
    setDisableNext(true);
    setSelectedTileIdx(null);
  }, [currentWordIndex, started, week]);

  // --- เตรียมเสียงพูด ---
  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      samanthaVoice.current = voices.find(v => v.name === "Samantha");
    };
    window.speechSynthesis.onvoiceschanged = setVoice;
    setVoice();
  }, []);

  // --- ดึง leaderboard หลังจบเกม ---
  useEffect(() => {
    if (!finished) return;
    if (!week) return;
    setLeaderboard(
      getLeaderboard(week).sort((a, b) => b.score - a.score).slice(0, 10)
    );
  }, [finished, week]);

  // === logic เกมเดิม ===
  const handleTileDragStart = (idx) => setSelectedTileIdx(idx);

  const handleSlotDrop = (slotIdx) => {
    if (selectedTileIdx == null) return;
    setSlots(slots => slots.map((slot, i) => {
      if (i !== slotIdx || slot.letter === " ") return slot;
      if (slot.tile) return slot;
      return { ...slot, filled: true, tile: tiles[selectedTileIdx] };
    }));
    setTiles(tiles => tiles.filter((_, i) => i !== selectedTileIdx));
    setSelectedTileIdx(null);
  };

  const handleTileTap = (idx) => setSelectedTileIdx(idx);
  const handleSlotTap = (slotIdx) => {
    if (selectedTileIdx == null) return;
    handleSlotDrop(slotIdx);
  };

  const handleSlotClick = (slotIdx) => {
    setSlots(slots => {
      const slot = slots[slotIdx];
      if (slot.letter === " " || !slot.tile) return slots;
      setTiles(tiles => [...tiles, slot.tile]);
      return slots.map((s, i) => i === slotIdx ? { ...s, filled: false, tile: null } : s);
    });
  };

  const checkAnswer = () => {
    let built = "";
    slots.forEach(slot => {
      if (slot.letter === " ") built += " ";
      else if (slot.tile) built += slot.tile.letter;
      else built += "_";
    });
    const solution = words[currentWordIndex].toUpperCase();
    if (built === solution) {
      setResult("✅ Correct!");
      setResultColor("green");
      setDisableNext(false);
      setScore(s => s + 1);
      playSound(correctSound);
    } else {
      setResult("❌ Try again!");
      setResultColor("red");
      playSound(wrongSound);
    }
  };

  const resetWord = () => setCurrentWordIndex(idx => idx);
  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(idx => idx + 1);
    } else {
      // --- จบเกม ---
      setResult("🎉 You've completed all words!");
      setResultColor("blue");
      playSound(winSound);
      setFinished(true);

      // --- Save to leaderboard ---
      let lb = getLeaderboard(week);
      lb.push({ name: playerName, score });
      saveLeaderboard(week, lb);
      setLeaderboard(
        lb.sort((a, b) => b.score - a.score).slice(0, 10)
      );
    }
  };

  const speak = () => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis not supported.");
      return;
    }
    let textToSpeak = words[currentWordIndex];
    if (textToSpeak.toLowerCase() === "agent iata code") {
      textToSpeak = "Agent I A T A code";
    }
    const utterance = new window.SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    if (samanthaVoice.current) utterance.voice = samanthaVoice.current;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // --- UI Styles (เหมือนเดิม) ---
  const styles = {
    container: {
      maxWidth: 480,
      margin: "1rem auto",
      padding: "1rem",
      fontFamily: "sans-serif",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 8px 0 #0002"
    },
    wordDisplay: { display: 'flex', gap: 6, marginBottom: 18, flexWrap: "wrap", justifyContent: "center", minHeight: 48 },
    letterBox: { width: 36, height: 46, border: "2px solid #888", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "#fafbfc", margin: 1, cursor: "pointer", userSelect: "none", transition: "background .2s" },
    letterBoxFilled: { background: "#e0f7fa" },
    tileBank: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "center", minHeight: 48 },
    tile: { width: 36, height: 46, border: "2px solid #1565c0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "#fff", color: "#1565c0", fontWeight: "bold", cursor: "pointer", userSelect: "none", margin: 1, boxShadow: "0 2px 4px #0001" },
    tileSelected: { background: "#b3e5fc", borderColor: "#0288d1" },
    result: { color: resultColor, fontWeight: "bold", minHeight: 32, fontSize: 20, textAlign: "center", marginBottom: 12 },
    buttonBar: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 14 },
    button: { padding: "0.7em 1.3em", fontSize: "1.03em", borderRadius: 8, border: "none", background: "#1976d2", color: "#fff", fontWeight: "bold", cursor: "pointer", marginBottom: 4, boxShadow: "0 2px 4px #0001", minWidth: 90 },
    buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
    homeButton: { background: "#e91e63", marginTop: 12 },
    leaderboard: { marginTop: 16, padding: 8, background: "#f3f3f7", borderRadius: 10 },
    leaderboardTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 6, color: "#1565c0" }
  };

  // --- 4. Render ---
  if (!started) {
    return (
      <div style={styles.container}>
        <h2 style={{textAlign: "center", color: "#1565c0", marginBottom: 18}}>เริ่มเกมสะกดคำ</h2>
        <form onSubmit={handleStart}>
          <div style={{marginBottom: 14}}>
            <label>
              ชื่อผู้เล่น:<br/>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} style={{fontSize:18, padding:6, borderRadius:6, border:"1px solid #888", width:"100%"}} />
            </label>
          </div>
          <div style={{marginBottom: 14}}>
            <label>
              เลือกสัปดาห์:<br/>
              <select value={week} onChange={e => setWeek(e.target.value)} style={{fontSize:18, padding:6, borderRadius:6, border:"1px solid #888", width:"100%"}}>
                <option value="">-- เลือก week --</option>
                {[1,2,3,4,5,6,7].map(w=>(
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </label>
          </div>
          {formError && <div style={{color:"red", marginBottom:10}}>{formError}</div>}
          <button type="submit" style={styles.button}>เริ่มเกม</button>
        </form>
        <button style={{...styles.button, ...styles.homeButton, width: "100%"}} onClick={goHome}>กลับหน้าหลัก</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div style={styles.container}>
        <h2 style={{textAlign: "center", color: "#1565c0"}}>จบเกม!</h2>
        <div style={{fontSize:20, marginBottom:12}}>คุณได้คะแนน {score} / {words.length} </div>
        <div style={styles.leaderboard}>
          <div style={styles.leaderboardTitle}>อันดับสูงสุด (Week {week})</div>
          <ol>
            {leaderboard.length === 0 ? <li>ยังไม่มีข้อมูล</li> : leaderboard.map((entry, idx) =>
              <li key={idx}>{entry.name} — {entry.score} คะแนน</li>
            )}
          </ol>
        </div>
        <button style={styles.button} onClick={() => {
          setStarted(false);
          setPlayerName("");
          setWeek("");
          setScore(0);
        }}>เล่นใหม่</button>
        <button style={{...styles.button, ...styles.homeButton, width: "100%"}} onClick={goHome}>กลับหน้าหลัก</button>
      </div>
    );
  }

  // --- main game ---
  return (
    <div style={styles.container}>
      <h2 style={{textAlign: "center", color: "#1565c0", marginBottom: 18}}>เกมสะกดคำ (Week {week})</h2>
      <div style={{marginBottom:8, textAlign:"center", color:"#666"}}>ชื่อ: {playerName} | คะแนน: {score}</div>
      <div style={styles.wordDisplay}>
        {slots.map((slot, idx) => slot.letter === " " ?
          <div key={idx} style={{ width: 14 }} /> :
          <div
            key={idx}
            style={{
              ...styles.letterBox,
              ...(slot.tile && styles.letterBoxFilled)
            }}
            onClick={() => slot.tile ? handleSlotClick(idx) : (selectedTileIdx !== null && handleSlotTap(idx))}
          >
            {slot.tile && (
              <span>{slot.tile.letter}</span>
            )}
          </div>
        )}
      </div>
      <div style={styles.tileBank}>
        {tiles.map((tile, idx) => (
          <div
            key={tile.id}
            style={{
              ...styles.tile,
              ...(selectedTileIdx === idx ? styles.tileSelected : {})
            }}
            onClick={() => handleTileTap(idx)}
          >
            {tile.letter}
          </div>
        ))}
      </div>
      <div style={styles.result}>{result}</div>
      <div style={styles.buttonBar}>
        <button style={styles.button} onClick={checkAnswer}>ตรวจคำตอบ</button>
        <button style={styles.button} onClick={resetWord}>รีเซ็ต</button>
        <button
          style={{...styles.button, ...(disableNext ? styles.buttonDisabled : {})}}
          onClick={nextWord}
          disabled={disableNext}
        >
          ถัดไป
        </button>
        <button style={styles.button} onClick={speak}>🔊 ฟังเสียง</button>
      </div>
      <button style={{...styles.button, ...styles.homeButton, width: "100%"}} onClick={goHome}>กลับหน้าหลัก</button>
    </div>
  );
}
