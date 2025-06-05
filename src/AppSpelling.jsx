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

function getLeaderboard(week) {
  return JSON.parse(localStorage.getItem('spelling-leaderboard-week-' + week) || "[]");
}

function saveLeaderboard(week, leaderboard) {
  localStorage.setItem('spelling-leaderboard-week-' + week, JSON.stringify(leaderboard));
}

export default function AppSpelling({ goHome }) {
  // ฟอร์มเริ่มต้น
  const [playerName, setPlayerName] = useState("");
  const [week, setWeek] = useState("");
  const [formError, setFormError] = useState("");
  const [started, setStarted] = useState(false);

  // สำหรับแสดง leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardWeek, setLeaderboardWeek] = useState("1"); // default week 1

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

  // ฟังก์ชันเสริมสำหรับปุ่มจบเกม
  function restart() {
    setFinished(false);
    setScore(0);
    setCurrentWordIndex(0);
    setDisableNext(true);
    setResult("");
    setResultColor("black");
    setSlots([]);
    setTiles([]);
    setSelectedTileIdx(null);
    setStarted(true);
  }

  function goPrevWeek() {
    setWeek(w => {
      let prev = Number(w) > 1 ? Number(w) - 1 : 7;
      return prev.toString();
    });
    setFinished(false);
    setScore(0);
    setCurrentWordIndex(0);
    setDisableNext(true);
    setResult("");
    setResultColor("black");
    setSlots([]);
    setTiles([]);
    setSelectedTileIdx(null);
    setStarted(true);
  }

  function goNextWeek() {
    setWeek(w => {
      let next = Number(w) < 7 ? Number(w) + 1 : 1;
      return next.toString();
    });
    setFinished(false);
    setScore(0);
    setCurrentWordIndex(0);
    setDisableNext(true);
    setResult("");
    setResultColor("black");
    setSlots([]);
    setTiles([]);
    setSelectedTileIdx(null);
    setStarted(true);
  }

  function handleShowLeaderboard() {
    setLeaderboardWeek(week);
    setShowLeaderboard(true);
  }

  // --- Leaderboard UI ---
  function Leaderboard({ week, onBack }) {
    const [selWeek, setSelWeek] = useState(week);
    const lb = getLeaderboard(selWeek).sort((a, b) => b.score - a.score).slice(0, 10);
    return (
      <div className="max-w-lg mx-auto p-4 font-sans bg-white rounded-xl shadow-lg">
        <h2 className="text-center text-blue-800 text-2xl font-bold mb-3">อันดับ (Week {selWeek})</h2>
        <select value={selWeek} onChange={e => setSelWeek(e.target.value)} className="text-base mb-2 border border-gray-400 rounded px-2 py-1">
          {[1,2,3,4,5,6,7].map(w=>(
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
        <ol className="mb-4">
          {lb.length === 0 ? <li>ยังไม่มีข้อมูล</li> : lb.map((entry, idx) =>
            <li key={idx}>{entry.name} — {entry.score} คะแนน</li>
          )}
        </ol>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            ← กลับ
          </button>
          <button
            onClick={goHome}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // --- หน้าแรก ---
  if (!started && !showLeaderboard) {
    return (
      <div className="max-w-lg mx-auto p-4 font-sans bg-white rounded-xl shadow-lg">
        <h2 className="text-center text-blue-800 text-2xl font-bold mb-4">เกมสะกดคำ</h2>
        <form onSubmit={handleStart}>
          <div className="mb-4">
            <label>
              ชื่อผู้เล่น:<br/>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} className="text-lg px-2 py-1 rounded border border-gray-400 w-full" />
            </label>
          </div>
          <div className="mb-4">
            <label>
              เลือกสัปดาห์:<br/>
              <select value={week} onChange={e => setWeek(e.target.value)} className="text-lg px-2 py-1 rounded border border-gray-400 w-full">
                <option value="">-- เลือก week --</option>
                {[1,2,3,4,5,6,7].map(w=>(
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </label>
          </div>
          {formError && <div className="text-red-600 mb-3">{formError}</div>}
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mr-2">เริ่มเกม</button>
        </form>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <button
            onClick={() => {
              setLeaderboardWeek(week || "1");
              setShowLeaderboard(true);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl"
          >
            🏆 ดูอันดับ
          </button>
          <button
            onClick={goHome}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // --- Leaderboard เฉพาะหน้า leaderboard ---
  if (showLeaderboard) {
    return (
      <Leaderboard
        week={leaderboardWeek}
        onBack={() => setShowLeaderboard(false)}
      />
    );
  }

  // --- หน้าจบเกม (มีปุ่มเริ่มใหม่/เปลี่ยน week/ดูอันดับ/กลับหน้าหลัก) ---
  if (finished) {
    return (
      <div className="max-w-lg mx-auto p-4 font-sans bg-white rounded-xl shadow-lg">
        <h2 className="text-center text-blue-800 text-2xl font-bold mb-3">จบเกม!</h2>
        <div className="text-xl mb-3">คุณได้คะแนน {score} / {words.length} </div>
        <div className="mb-3 p-2 bg-gray-100 rounded-xl">
          <div className="font-bold text-blue-800 mb-1">อันดับสูงสุด (Week {week})</div>
          <ol>
            {leaderboard.length === 0 ? <li>ยังไม่มีข้อมูล</li> : leaderboard.map((entry, idx) =>
              <li key={idx}>{entry.name} — {entry.score} คะแนน</li>
            )}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <button
            onClick={restart}
            className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl"
          >
            🔄 เริ่มใหม่
          </button>
          <button
            onClick={goPrevWeek}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            ⏮️ สัปดาห์ก่อนหน้า
          </button>
          <button
            onClick={goNextWeek}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            ⏭️ สัปดาห์ถัดไป
          </button>
          <button
            onClick={handleShowLeaderboard}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl"
          >
            🏆 ดูอันดับ
          </button>
          <button
            onClick={goHome}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // --- main game ---
  return (
    <div className="max-w-lg mx-auto p-4 font-sans bg-white rounded-xl shadow-lg">
      <h2 className="text-center text-blue-800 text-2xl font-bold mb-3">เกมสะกดคำ (Week {week})</h2>
      <div className="mb-2 text-center text-base text-gray-600">ชื่อ: {playerName} | คะแนน: {score}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: "wrap", justifyContent: "center", minHeight: 48 }}>
        {slots.map((slot, idx) => slot.letter === " " ?
          <div key={idx} style={{ width: 14 }} /> :
          <div
            key={idx}
            style={{
              width: 36,
              height: 46,
              border: "2px solid #888",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              background: slot.tile ? "#e0f7fa" : "#fafbfc",
              margin: 1,
              cursor: "pointer",
              userSelect: "none",
              transition: "background .2s"
            }}
            onClick={() => slot.tile ? handleSlotClick(idx) : (selectedTileIdx !== null && handleSlotTap(idx))}
          >
            {slot.tile && (
              <span>{slot.tile.letter}</span>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "center", minHeight: 48 }}>
        {tiles.map((tile, idx) => (
          <div
            key={tile.id}
            style={{
              width: 36,
              height: 46,
              border: "2px solid #1565c0",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              background: selectedTileIdx === idx ? "#b3e5fc" : "#fff",
              color: "#1565c0",
              fontWeight: "bold",
              cursor: "pointer",
              userSelect: "none",
              margin: 1,
              boxShadow: "0 2px 4px #0001"
            }}
            onClick={() => handleTileTap(idx)}
          >
            {tile.letter}
          </div>
        ))}
      </div>
      <div style={{
        color: resultColor,
        fontWeight: "bold",
        minHeight: 32,
        fontSize: 20,
        textAlign: "center",
        marginBottom: 12
      }}>{result}</div>
      <div className="flex flex-wrap gap-3 justify-center mt-2 mb-2">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl" onClick={checkAnswer}>ตรวจคำตอบ</button>
        <button className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-xl" onClick={resetWord}>รีเซ็ต</button>
        <button
          className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl${disableNext ? " opacity-50 cursor-not-allowed" : ""}`}
          onClick={nextWord}
          disabled={disableNext}
        >
          ถัดไป
        </button>
        <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-xl" onClick={speak}>🔊 ฟังเสียง</button>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <button
          onClick={handleShowLeaderboard}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl"
        >
          🏆 ดูอันดับ
        </button>
        <button
          onClick={goHome}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
        >
          🏠 กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
