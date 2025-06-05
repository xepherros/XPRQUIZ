import React, { useEffect, useRef, useState } from "react";

const correctSound = '/sounds/Correct.mp3';
const wrongSound = '/sounds/Wrong.wav';
const winSound = '/sounds/Win.wav';

const wordBank = {
  1: [
    "Agent IATA code", "Air waybill", "Airport of departure", "Airport of destination",
    "Arrival notice", "Berth", "Bill of lading", "Bulk cargo", "Bulk carrier", "Carrier"
  ],
  2: [
    "Consignee","Container","Customs broker","Dangerous goods","Delivery order",
    "Demurrage","ETA","ETD","Export license","Freight forwarder"
  ],
  3: [
    "Freight prepaid","Gross weight","Handling","Import license","Incoterms",
    "Manifest","Notify party","Pallet","Port of discharge","Shipper"
  ],
  4: [
    "Shipping instructions","Shipping marks","Stevedore","Stuffing","Tare weight",
    "Terminal","Transshipment","Unstuffing","Warehouse","Waybill"
  ],
  5: [
    "Cargo insurance","Certificate of origin","Clean bill of lading","Commercial invoice",
    "Consignment","Container yard","Customs clearance","Delivery","Documentary credit","Export declaration"
  ],
  6: [
    "Freight collect","Freight forwarders certificate","Import declaration","Letter of credit",
    "Packing list","Port of loading","Proforma invoice","Quarantine","Shipping order","Through bill of lading"
  ],
  7: [
    "Tramp vessel","Vessel","Warehouse receipt","Wharfage","Air cargo","Booking",
    "Charter party","Customs duty","Export permit","Transshipment port"
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

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardWeek, setLeaderboardWeek] = useState("1");

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [slots, setSlots] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [result, setResult] = useState("");
  const [resultColor, setResultColor] = useState("black");
  const [selectedTileIdx, setSelectedTileIdx] = useState(null);

  // answered = [{status: "correct"|"wrong"|"notyet", answer: string}]
  const [answered, setAnswered] = useState([]);
  const [score, setScore] = useState(0); // correct only
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

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
    setAnswered([]);
    setFinished(false);
    setShowConfirmFinish(false);
  }

  // --- เตรียมคำแต่ละข้อ ---
  useEffect(() => {
    if (!started) return;
    if (!words.length) return;
    // ถ้าเคยตอบถูก ให้เติมช่องสะกดตามที่ตอบไว้
    const word = words[currentWordIndex].toUpperCase();
    const letters = word.replace(/ /g, '').split('');
    let prevAns = answered[currentWordIndex];
    let slotArr;
    if (prevAns?.status === "correct" && prevAns.answer) {
      // เติมช่องสะกดจากคำตอบเดิม
      let ansArr = prevAns.answer.split('');
      slotArr = word.split("").map((char, idx) =>
        char === " " ? { letter: " ", filled: true, tile: null }
        : { letter: char, filled: true, tile: { letter: ansArr.shift(), id: `answered-${idx}` } }
      );
      setTiles([]); // ไม่มี tile ให้ลากแล้ว
    } else {
      slotArr = word.split("").map(char =>
        char === " " ? { letter: " ", filled: true, tile: null } : { letter: char, filled: false, tile: null }
      );
      setTiles(shuffleArray(letters).map((l, i) => ({ letter: l, id: `${l}-${i}` })));
    }
    setSlots(slotArr);
    setResult("");
    setResultColor("black");
    setSelectedTileIdx(null);
    // eslint-disable-next-line
  }, [currentWordIndex, started, week, answered]);

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

  // === logic เกม ===
  const isAnsweredCorrect = answered[currentWordIndex]?.status === "correct";

  // แบ่งแต่ละคำเป็นบรรทัด (fix ปัญหา "ช่องว่าง" ทำให้กล่องแปลก)
  function renderWordLines() {
    const lines = [];
    let currentLine = [];
    slots.forEach((slot, idx) => {
      if (slot.letter === " ") {
        if (currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [];
        }
      } else {
        currentLine.push({ slot, idx });
        if (idx === slots.length - 1) {
          lines.push(currentLine);
        }
      }
    });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {lines.map((line, lineIdx) => (
          <div key={lineIdx} style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", minHeight: 48 }}>
            {line.map(({ slot, idx }) =>
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
                  background: isAnsweredCorrect
                    ? "#a5e1a2"
                    : slot.tile ? "#e0f7fa" : "#fafbfc",
                  margin: 1,
                  cursor: isAnsweredCorrect ? "not-allowed" : "pointer",
                  userSelect: "none",
                  transition: "background .2s"
                }}
                onClick={() =>
                  isAnsweredCorrect
                    ? undefined
                    : (slot.tile
                      ? handleSlotClick(idx)
                      : (selectedTileIdx !== null && handleSlotTap(idx)))
                }
              >
                {slot.tile && (
                  <span>{slot.tile.letter}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const handleTileTap = (idx) => {
    if (isAnsweredCorrect) return;
    setSelectedTileIdx(idx);
  };
  const handleSlotTap = (slotIdx) => {
    if (selectedTileIdx == null || isAnsweredCorrect) return;
    handleSlotDrop(slotIdx);
  };
  const handleSlotDrop = (slotIdx) => {
    if (isAnsweredCorrect) return;
    setSlots(slots => slots.map((slot, i) => {
      if (i !== slotIdx || slot.letter === " ") return slot;
      if (slot.tile) return slot;
      return { ...slot, filled: true, tile: tiles[selectedTileIdx] };
    }));
    setTiles(tiles => tiles.filter((_, i) => i !== selectedTileIdx));
    setSelectedTileIdx(null);
  };
  const handleSlotClick = (slotIdx) => {
    if (isAnsweredCorrect) return;
    setSlots(slots => {
      const slot = slots[slotIdx];
      if (slot.letter === " " || !slot.tile) return slots;
      setTiles(tiles => [...tiles, slot.tile]);
      return slots.map((s, i) => i === slotIdx ? { ...s, filled: false, tile: null } : s);
    });
  };

  // ======= ปุ่ม Reset =======
  const resetWord = () => {
    if (!words.length || isAnsweredCorrect) return;
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
    setSelectedTileIdx(null);
  };

  // ======= ตรวจคำตอบ =======
  const checkAnswer = () => {
    if (isAnsweredCorrect) return;
    let built = "";
    slots.forEach(slot => {
      if (slot.letter === " ") built += " ";
      else if (slot.tile) built += slot.tile.letter;
      else built += "_";
    });
    const solution = words[currentWordIndex].toUpperCase();
    if (built === solution) {
      playSound(correctSound);
      setAnswered(ansList => {
        const next = [...ansList];
        next[currentWordIndex] = { status: "correct", answer: built };
        setScore(next.filter(ans => ans?.status === "correct").length);
        return next;
      });
      setResult("✅ ถูกต้อง!");
      setResultColor("green");
    } else {
      setResult("❌ ลองใหม่!");
      setResultColor("red");
      playSound(wrongSound);
    }
  };

  function goNextQuestionOrFinish() {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(idx => idx + 1);
      setResult("");
      setResultColor("black");
      setSelectedTileIdx(null);
    } else {
      setShowConfirmFinish(true);
    }
  }
  function goPrevQuestion() {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(idx => idx - 1);
      setResult("");
      setResultColor("black");
      setSelectedTileIdx(null);
    }
  }

  function confirmFinishQuiz() {
    setShowConfirmFinish(false);
    setFinished(true);
    let lb = getLeaderboard(week);
    lb.push({ name: playerName, score });
    saveLeaderboard(week, lb);
    setLeaderboard(
      lb.sort((a, b) => b.score - a.score).slice(0, 10)
    );
    playSound(winSound);
  }

  const speak = () => {
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

  function restart() {
    setScore(0);
    setCurrentWordIndex(0);
    setAnswered([]);
    setFinished(false);
    setStarted(true);
  }
  function goPrevWeek() {
    setWeek(w => {
      let prev = Number(w) > 1 ? Number(w) - 1 : 7;
      return prev.toString();
    });
    setScore(0);
    setCurrentWordIndex(0);
    setAnswered([]);
    setFinished(false);
    setStarted(true);
  }
  function goNextWeek() {
    setWeek(w => {
      let next = Number(w) < 7 ? Number(w) + 1 : 1;
      return next.toString();
    });
    setScore(0);
    setCurrentWordIndex(0);
    setAnswered([]);
    setFinished(false);
    setStarted(true);
  }
  function handleShowLeaderboard() {
    setLeaderboardWeek(week);
    setShowLeaderboard(true);
  }

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

  if (showLeaderboard) {
    return (
      <Leaderboard
        week={leaderboardWeek}
        onBack={() => setShowLeaderboard(false)}
      />
    );
  }

  function ConfirmFinishModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-xs">
          <div className="text-xl mb-4 font-bold">คุณแน่ใจหรือไม่ที่จะสรุปคะแนน?</div>
          <div className="mb-4 text-sm text-gray-600">เมื่อยืนยันแล้วจะไม่สามารถกลับมาแก้ไขได้</div>
          <button
            onClick={confirmFinishQuiz}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl mr-2"
          >
            สรุปคะแนน
          </button>
          <button
            onClick={() => setShowConfirmFinish(false)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-xl"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    );
  }

  function FinishModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-md w-full">
          <h2 className="text-2xl text-blue-800 font-bold mb-2">สรุปคะแนน</h2>
          <div className="mb-2">คุณได้ {score} / {words.length} คะแนน</div>
          <div className="mb-3 text-left">
            <div className="font-bold mb-1">ผลลัพธ์:</div>
            <ol className="list-decimal ml-6">
              {words.map((w, idx) => (
                <li key={idx}>
                  {w} — {answered[idx]?.status === "correct" ? <span className="text-green-700 font-bold">ถูก</span> : <span className="text-orange-700 font-bold">ยังไม่ถูก</span>}
                </li>
              ))}
            </ol>
          </div>
          <div className="font-bold text-blue-800 mb-2">อันดับสูงสุด (Week {week})</div>
          <ol className="mb-3">
            {leaderboard.length === 0 ? <li>ยังไม่มีข้อมูล</li> : leaderboard.map((entry, idx) =>
              <li key={idx}>{entry.name} — {entry.score} คะแนน</li>
            )}
          </ol>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
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
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 font-sans bg-white rounded-xl shadow-lg relative">
      <h2 className="text-center text-blue-800 text-2xl font-bold mb-3">เกมสะกดคำ (Week {week})</h2>
      <div className="mb-2 text-center text-base text-gray-600">ชื่อ: {playerName} | คะแนน: {score}</div>
      {renderWordLines()}
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
              cursor: isAnsweredCorrect ? "not-allowed" : "pointer",
              userSelect: "none",
              margin: 1,
              boxShadow: "0 2px 4px #0001"
            }}
            onClick={() => isAnsweredCorrect ? undefined : handleTileTap(idx)}
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
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
          onClick={checkAnswer}
          disabled={isAnsweredCorrect}
        >ตรวจคำตอบ</button>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl"
          onClick={resetWord}
          disabled={isAnsweredCorrect}
        >🔄 รีเซ็ต</button>
        <button
          className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-xl"
          onClick={goPrevQuestion}
          disabled={currentWordIndex === 0}
        >⬅️ คำก่อนหน้า</button>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl"
          onClick={goNextQuestionOrFinish}
          disabled={currentWordIndex === words.length - 1 && !isAnsweredCorrect}
        >คำถัดไป</button>
        <button
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-xl"
          onClick={speak}
        >🔊 ฟังเสียง</button>
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
      {showConfirmFinish && <ConfirmFinishModal />}
      {finished && <FinishModal />}
    </div>
  );
}
