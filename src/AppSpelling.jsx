import React, { useEffect, useRef, useState } from "react";

const correctSound = '/sounds/Correct.mp3';
const wrongSound = '/sounds/Wrong.wav';
const winSound = '/sounds/Win.wav';

const SHEET_API_URL = "/api/gas-proxy"; // Proxy API

const wordBank = {
  1: [
    "Agent IATA code", "Air waybill", "Airport of departure", "Airport of destination",
    "Arrival notice", "Berth", "Bill of lading", "Bulk cargo", "Bulk carrier", "Carrier"
  ],
  2: [
    "CARRIER'S AGENT","CONSIGNEE","CONSOLIDATION","CHARGEABLE WEIGHT","CONTAINER CARRIER",
    "CONVENTIONAL VESSEL","CHARGEABLE WEIGHT","CONTAINER YARD","CY/CY","CFS/CFS"
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

// ----------- preload และ reuse เสียง -----------
function usePreloadedSounds() {
  const correctRef = useRef();
  const wrongRef = useRef();
  const winRef = useRef();

  useEffect(() => {
    correctRef.current = new window.Audio(correctSound);
    wrongRef.current = new window.Audio(wrongSound);
    winRef.current = new window.Audio(winSound);
  }, []);

  const playCorrect = () => {
    if (correctRef.current) {
      correctRef.current.currentTime = 0;
      correctRef.current.play();
    }
  };
  const playWrong = () => {
    if (wrongRef.current) {
      wrongRef.current.currentTime = 0;
      wrongRef.current.play();
    }
  };
  const playWin = () => {
    if (winRef.current) {
      winRef.current.currentTime = 0;
      winRef.current.play();
    }
  };
  return { playCorrect, playWrong, playWin };
}

function shuffleArray(array) {
  return array
    .map(val => ({ val, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ val }) => val);
}

// === ฟังก์ชันบันทึกคะแนนและดึง leaderboard (ออนไลน์) ===
async function saveScoreOnline({ name, score, week }) {
  try {
    await fetch(`${SHEET_API_URL}?path=spelling`, {
      method: "POST",
      body: JSON.stringify({ name, score, week: `week_${week}` }),
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    // อาจแจ้งเตือนหรือ log error
  }
}
async function fetchLeaderboardOnline(week) {
  try {
    const res = await fetch(`${SHEET_API_URL}?path=spelling&week=week_${week}`);
    let data = await res.json();
    // เหลือชื่อเดียว คะแนนสูงสุด
    const unique = {};
    data.forEach(item => {
      if (!unique[item.name] || Number(item.score) > Number(unique[item.name].score)) {
        unique[item.name] = item;
      }
    });
    return Object.values(unique).sort((a, b) => b.score - a.score).slice(0, 10);
  } catch (e) {
    return [];
  }
}

// ======= ฟังก์ชันพูด (เลือก Samantha อัตโนมัติ) =======
const speak = (text) => {
  const synth = window.speechSynthesis;
  let voices = synth.getVoices();
  let voice = voices.find(v => v.name === "Samantha" && v.lang === "en-US");
  if (!voice) voice = voices.find(v => v.lang === "en-US");
  if (!voice) voice = voices[0];
  let spoken = text.replace(/\bIATA\b/g, "I A T A")
    .replace(/\bETA\b/g, "E T A")
    .replace(/\bAWB\b/g, "A W B")
    .replace(/\bFCL\b/g, "F C L")
    .replace(/\bLCL\b/g, "L C L");
  const utter = new window.SpeechSynthesisUtterance(spoken);
  utter.voice = voice;
  utter.lang = "en-US";
  synth.cancel();
  synth.speak(utter);
};

export default function AppSpelling({ goHome }) {
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

  const [answered, setAnswered] = useState([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const { playCorrect, playWrong, playWin } = usePreloadedSounds();

  const words = week ? wordBank[week] : [];

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

  // เตรียม slots (เฉพาะตัวอักษร, ไม่รวมช่องว่าง) และ tiles
  useEffect(() => {
    if (!started) return;
    if (!words.length) return;
    const word = words[currentWordIndex].toUpperCase();
    const letters = word.replace(/ /g, '').split('');
    let prevAns = answered[currentWordIndex];

    let slotArr;
    if (prevAns?.status === "correct" && prevAns.answer) {
      let ansArr = prevAns.answer.replace(/ /g, '').split('');
      slotArr = [];
      let ansIndex = 0;
      for (let i = 0; i < word.length; ++i) {
        if (word[i] !== " ") {
          slotArr.push({
            letter: word[i],
            filled: true,
            tile: ansArr[ansIndex]
              ? { letter: ansArr[ansIndex], id: `answered-${currentWordIndex}-${i}` }
              : null
          });
          ansIndex++;
        }
      }
      setTiles([]);
    } else {
      slotArr = [];
      for (let i = 0; i < word.length; ++i) {
        if (word[i] !== " ") {
          slotArr.push({
            letter: word[i],
            filled: false,
            tile: null
          });
        }
      }
      setTiles(shuffleArray(letters).map((l, i) => ({ letter: l, id: `${l}-${i}` })));
    }
    setSlots(slotArr);
    setResult("");
    setResultColor("black");
    setSelectedTileIdx(null);
    // eslint-disable-next-line
  }, [currentWordIndex, started, week, answered]);

  // โหลด leaderboard หลังจบเกม
  useEffect(() => {
    if (!finished) return;
    if (!week) return;
    (async () => {
      setLeaderboard(await fetchLeaderboardOnline(week));
    })();
  }, [finished, week]);

  const isAnsweredCorrect = answered[currentWordIndex]?.status === "correct";

  // --- เช็คคำตอบอัตโนมัติเมื่อ slots เปลี่ยน ---
  useEffect(() => {
    if (!started || isAnsweredCorrect) return;
    const word = words[currentWordIndex]?.toUpperCase();
    if (!word) return;

    let built = "";
    let slotIdx = 0;
    for (let i = 0; i < word.length; ++i) {
      if (word[i] === " ") {
        built += " ";
      } else {
        if (slots[slotIdx] && slots[slotIdx].tile) {
          built += slots[slotIdx].tile.letter;
        } else {
          built += "_";
        }
        slotIdx++;
      }
    }
    if (built.indexOf("_") === -1) {
      const solution = word.replace(/ +/g, " ");
      if (built === solution) {
        playCorrect();
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
        playWrong();
      }
    } else {
      setResult("");
      setResultColor("black");
    }
    // eslint-disable-next-line
  }, [slots]);

  // ===== Responsive renderWordLines =====
  function renderWordLines() {
    const word = words[currentWordIndex].toUpperCase();
    const ans = answered[currentWordIndex]?.answer;
    const isCorrect = answered[currentWordIndex]?.status === "correct";

    let slotIndex = 0;
    let ansIndex = 0;
    let lines = [];
    let currentLine = [];
    for (let i = 0; i < word.length; ++i) {
      if (word[i] === " ") {
        if (currentLine.length) lines.push(currentLine);
        currentLine = [];
      } else {
        if (isCorrect && ans) {
          let char = ans.replace(/ /g, '')[ansIndex];
          let slotObj = {
            letter: word[i],
            tile: char ? { letter: char } : null
          };
          currentLine.push({ slot: slotObj, slotIndex: ansIndex });
          ansIndex++;
        } else {
          const slot = slots[slotIndex] || { letter: word[i], tile: null };
          currentLine.push({ slot, slotIndex });
          slotIndex++;
        }
      }
    }
    if (currentLine.length) lines.push(currentLine);

    const maxLen = Math.max(...lines.map(line => line.length));
    // Responsive: ช่องยืดหยุ่นตามความยาว
    const boxBase = maxLen > 12 ? 22 : maxLen > 9 ? 26 : 32;
    const boxFont = maxLen > 12 ? 14 : maxLen > 9 ? 17 : 21;

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 18,
        alignItems: "center",
        width: "100%"
      }}>
        {lines.map((line, lineIdx) => {
          const rightPad = maxLen - line.length;
          return (
            <div
              key={lineIdx}
              style={{
                display: "flex",
                gap: 3,
                flexWrap: "nowrap",
                minHeight: `${boxBase + 14}px`,
                overflowX: "auto",
                maxWidth: "100vw",
                width: "100%",
                justifyContent: "center"
              }}
            >
              {line.map(({ slot, slotIndex }) =>
                <div
                  key={slotIndex}
                  style={{
                    width: `${boxBase + 6}px`,
                    height: `${boxBase + 14}px`,
                    minWidth: "0",
                    border: "2px solid #888",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${boxFont}px`,
                    background: isCorrect
                      ? "#a5e1a2"
                      : slot.tile ? "#e0f7fa" : "#fafbfc",
                    margin: 1,
                    cursor: isCorrect ? "not-allowed" : "pointer",
                    userSelect: "none",
                    transition: "background .2s",
                    boxSizing: "border-box",
                    flex: `1 1 ${boxBase + 6}px`,
                    maxWidth: `${100 / maxLen}%`,
                    overflow: "hidden"
                  }}
                  onClick={() =>
                    isCorrect
                      ? undefined
                      : (slot.tile
                        ? handleSlotClick(slotIndex)
                        : (selectedTileIdx !== null && handleSlotTap(slotIndex)))
                  }
                >
                  {slot.tile && (
                    <span style={{ overflowWrap: "break-word" }}>{slot.tile.letter}</span>
                  )}
                </div>
              )}
              {[...Array(rightPad)].map((_, i) =>
                <div key={"rpad" + i} style={{
                  width: `${boxBase + 6}px`,
                  height: `${boxBase + 14}px`,
                  minWidth: "0",
                  margin: 1,
                  background: "none",
                  boxSizing: "border-box",
                  flex: `1 1 ${boxBase + 6}px`,
                  maxWidth: `${100 / maxLen}%`
                }} />
              )}
            </div>
          );
        })}
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
      if (i !== slotIdx) return slot;
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
      if (!slot.tile) return slots;
      setTiles(tiles => [...tiles, slot.tile]);
      return slots.map((s, i) => i === slotIdx ? { ...s, filled: false, tile: null } : s);
    });
  };

  const resetWord = () => {
    if (!words.length || isAnsweredCorrect) return;
    const word = words[currentWordIndex].toUpperCase();
    const letters = word.replace(/ /g, '').split('');
    let slotArr = [];
    for (let i = 0; i < word.length; ++i) {
      if (word[i] !== " ") {
        slotArr.push({
          letter: word[i],
          filled: false,
          tile: null
        });
      }
    }
    setSlots(slotArr);
    setTiles(shuffleArray(letters).map((l, i) => ({ letter: l, id: `${l}-${i}` })));
    setResult("");
    setResultColor("black");
    setSelectedTileIdx(null);
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

  // === จบเกมแล้ว บันทึกคะแนนขึ้น sheet
  async function confirmFinishQuiz() {
    setShowConfirmFinish(false);
    setFinished(true);
    await saveScoreOnline({ name: playerName, score, week });
    setLeaderboard(await fetchLeaderboardOnline(week));
    playWin();
  }

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

  function ConfirmFinishModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-pastel p-6 rounded-2xl shadow-lg text-center max-w-xs">
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
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
        <div className="bg-pastel p-6 rounded-2xl shadow-lg text-center max-w-md w-full">
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

  function Leaderboard({ week, onBack }) {
    const [selWeek, setSelWeek] = useState(week);
    const [lb, setLb] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      fetchLeaderboardOnline(selWeek).then(list => {
        setLb(list);
        setLoading(false);
      });
    }, [selWeek]);

    return (
      <div className="max-w-lg mx-auto p-4 font-sans bg-pastel rounded-xl shadow-lg">
        <h2 className="text-center text-blue-800 text-2xl font-bold mb-3">อันดับ (Week {selWeek})</h2>
        <select value={selWeek} onChange={e => setSelWeek(e.target.value)} className="text-base mb-2 border border-gray-400 rounded px-2 py-1">
          {[1,2,3,4,5,6,7].map(w=>(
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
        <ol className="mb-4">
          {loading ? <li>กำลังโหลด...</li> :
            lb.length === 0 ? <li>ยังไม่มีข้อมูล</li> : lb.map((entry, idx) =>
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
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          minHeight: "100vh",
          minWidth: "100vw",
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 0,
          background: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
        }}
      >
        <div className="max-w-lg mx-auto p-4 font-sans bg-pastel rounded-xl shadow-lg">
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
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          minHeight: "100vh",
          minWidth: "100vw",
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 0,
          background: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
        }}
      >
        <Leaderboard
          week={leaderboardWeek}
          onBack={() => setShowLeaderboard(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        background: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
      }}
    >
      <div className="max-w-lg mx-auto p-4 font-sans bg-pastel rounded-xl shadow-lg relative">
        <h2 className="text-center text-blue-800 text-2xl font-bold mb-3">เกมสะกดคำ (Week {week})</h2>
        <div className="mb-2 text-center text-base text-gray-600">ชื่อ: {playerName} | คะแนน: {score}</div>
        {renderWordLines()}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: "100vw"
        }}>
          {tiles.map((tile, idx) => (
            <div
              key={tile.id}
              style={{
                width: "clamp(22px, 7vw, 36px)",
                height: "clamp(36px, 9vw, 46px)",
                border: "2px solid #1565c0",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(14px, 4vw, 28px)",
                background: selectedTileIdx === idx ? "#b3e5fc" : "#fff",
                color: "#1565c0",
                fontWeight: "bold",
                cursor: isAnsweredCorrect ? "not-allowed" : "pointer",
                userSelect: "none",
                margin: 1,
                boxSizing: "border-box"
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
            className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl"
            onClick={resetWord}
            disabled={isAnsweredCorrect}
          >🔄 รีเซ็ต</button>
          <button
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-xl"
            onClick={() => speak(words[currentWordIndex])}
          >🔊 ฟังเสียง</button>
          <button
            className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-xl"
            onClick={goPrevQuestion}
            disabled={currentWordIndex === 0}
          >⬅️ คำก่อนหน้า</button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            onClick={goNextQuestionOrFinish}
          >
            {currentWordIndex === words.length - 1
              ? <><span>สรุปคะแนน</span> <span role="img" aria-label="score">🏁</span></>
              : <><span>คำถัดไป</span> <span role="img" aria-label="next">➡️</span></>
            }
          </button>
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
    </div>
  );
}
