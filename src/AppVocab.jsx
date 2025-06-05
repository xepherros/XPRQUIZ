import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import words from './weekly_vocab_list.json';
import VocabLeaderboard from './VocabLeaderboard';

// ========== Proxy API URL ==========
const SHEET_API_URL = "/api/gas-proxy";
// ===================================

function speak(text, lang = 'auto') {
  let detectLang = lang;
  if (lang === 'auto') {
    const enCount = (text.match(/[a-zA-Z]/g) || []).length;
    const thCount = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
    detectLang = enCount > thCount ? 'en-US' : 'th-TH';
  }
  const exceptions = {
    IATA: "I A T A",
    ETA: "E T A",
    AWB: "A W B",
    FCL: "F C L",
    LCL: "L C L"
  };
  let spoken = text;
  Object.keys(exceptions).forEach(key => {
    const reg = new RegExp(`\\b${key}\\b`, "g");
    spoken = spoken.replace(reg, exceptions[key]);
  });
  const utter = new window.SpeechSynthesisUtterance(spoken);
  utter.lang = detectLang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function playSound(src) {
  const audio = new window.Audio(src);
  audio.currentTime = 0;
  audio.play();
}

const correctSound = '/sounds/Correct.mp3';
const wrongSound = '/sounds/Wrong.wav';
const winSound = '/sounds/Win.wav';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function AppVocab({ goHome }) {
  // State ของหน้าเริ่มต้น
  const [nickname, setNickname] = useState('');
  const [week, setWeek] = useState('');
  const [start, setStart] = useState(false);
  const [formError, setFormError] = useState("");

  // State ของเกม
  const [terms, setTerms] = useState([]);
  const [defs, setDefs] = useState([]);
  const [selection, setSelection] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const [currentWeek, setCurrentWeek] = useState('');

  // Leaderboard modal state
  const [showLB, setShowLB] = useState(false);

  // reset state และแจ้ง parent กลับเมนูหลัก
  const handleGoHome = () => {
    setNickname('');
    setWeek('');
    setStart(false);
    setFormError("");
    setTerms([]);
    setDefs([]);
    setSelection(null);
    setMatchedIds([]);
    setWrongPair(null);
    setElapsed(0);
    setStartTime(Date.now());
    setFinished(false);
    setCurrentWeek('');
    setShowLB(false);
    if (goHome) goHome();
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setFormError("กรุณากรอกชื่อผู้เล่น");
      return;
    }
    if (!week) {
      setFormError("กรุณาเลือกสัปดาห์");
      return;
    }
    setStart(true);
    setFormError("");
    setCurrentWeek(week);
  };

  // --- GAME LOGIC ---
  function generateTermDef(vocab) {
    return {
      terms: vocab.map((v, i) => ({ id: i, text: v.term, pair: v.definition })),
      defs: vocab.map((v, i) => ({ id: i, text: v.definition, pair: v.term })),
    };
  }

  useEffect(() => {
    if (!start || !currentWeek) return;
    const vocab = words[currentWeek] || [];
    const { terms, defs } = generateTermDef(vocab);
    setTerms(shuffle(terms));
    setDefs(shuffle(defs));
    setStartTime(Date.now());
    setElapsed(0);
    setMatchedIds([]);
    setSelection(null);
    setFinished(false);
    setWrongPair(null);
  }, [currentWeek, start]);

  useEffect(() => {
    if (!start || finished) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, start, startTime]);

  useEffect(() => {
    if (terms.length > 0 && matchedIds.length === terms.length && !finished) {
      setFinished(true);
      playSound(winSound);
      saveScore();
    }
    // eslint-disable-next-line
  }, [matchedIds, terms.length, finished]);

  const handleSelect = (type, item) => {
    if (matchedIds.includes(item.id) || (wrongPair && ((type === 'term' && wrongPair.termId === item.id) || (type === 'def' && wrongPair.defId === item.id)))) {
      return;
    }
    if (!selection) {
      speak(item.text, 'auto');
      setSelection({ type, item });
      return;
    }
    if (selection.type === type) {
      speak(item.text, 'auto');
      setSelection({ type, item });
      return;
    }
    const term = type === 'term' ? item : selection.item;
    const def = type === 'def' ? item : selection.item;
    if (term.id === def.id) {
      playSound(correctSound);
      setMatchedIds([...matchedIds, term.id]);
      setSelection(null);
      setWrongPair(null);
    } else {
      playSound(wrongSound);
      setWrongPair({ termId: term.id, defId: def.id });
      setTimeout(() => {
        setWrongPair(null);
        setSelection(null);
      }, 700);
    }
  };

  // === ฟังก์ชันบันทึกคะแนนขึ้น Google Sheet ===
  async function saveScoreOnline({ name, time, week }) {
    try {
      await fetch(`${SHEET_API_URL}?path=vocab`, {
        method: "POST",
        body: JSON.stringify({ name, time, week }),
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      // อาจแจ้งเตือนหรือ log error
    }
  }

  // === ฟังก์ชันบันทึกคะแนน ===
  const saveScore = () => {
    if (!nickname || !elapsed || !currentWeek) return;
    saveScoreOnline({ name: nickname, time: elapsed, week: currentWeek });
  };

  const restart = () => {
    if (!currentWeek) return;
    const vocab = words[currentWeek] || [];
    const { terms, defs } = generateTermDef(vocab);
    setTerms(shuffle(terms));
    setDefs(shuffle(defs));
    setMatchedIds([]);
    setSelection(null);
    setFinished(false);
    setElapsed(0);
    setStartTime(Date.now());
    setWrongPair(null);
    setShowLB(false);
  };

  const goPrevWeek = () => {
    const prev = parseInt(currentWeek.split("_")[1]) - 1;
    if (prev >= 1) {
      const newWeek = `week_${prev}`;
      const vocab = words[newWeek] || [];
      setCurrentWeek(newWeek);
      const { terms, defs } = generateTermDef(vocab);
      setTerms(shuffle(terms));
      setDefs(shuffle(defs));
      setMatchedIds([]);
      setSelection(null);
      setFinished(false);
      setElapsed(0);
      setStartTime(Date.now());
      setWrongPair(null);
      setShowLB(false);
    } else {
      alert("ไม่มีสัปดาห์ก่อนหน้าแล้ว");
    }
  };

  const goNextWeek = () => {
    const next = parseInt(currentWeek.split("_")[1]) + 1;
    if (next <= 7) {
      const newWeek = `week_${next}`;
      const vocab = words[newWeek] || [];
      setCurrentWeek(newWeek);
      const { terms, defs } = generateTermDef(vocab);
      setTerms(shuffle(terms));
      setDefs(shuffle(defs));
      setMatchedIds([]);
      setSelection(null);
      setFinished(false);
      setElapsed(0);
      setStartTime(Date.now());
      setWrongPair(null);
      setShowLB(false);
    } else {
      alert("ไม่มีสัปดาห์ถัดไปแล้ว");
    }
  };

  // --- RENDER ---
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
        overflowY: "auto"
      }}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center z-10">
        {!start ? (
          <div className="bg-pastel max-w-lg mx-auto p-4 font-sans rounded-xl shadow-xl">
            <h2 className="text-center text-blue-800 text-2xl font-bold mb-4">เกมจับคู่คำศัพท์</h2>
            <form onSubmit={handleStart}>
              <div className="mb-4 text-left">
                <label className="font-semibold">
                  ชื่อผู้เล่น:<br />
                  <input
                    className="text-lg px-2 py-1 rounded border border-gray-400 w-full mt-1"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                  />
                </label>
              </div>
              <div className="mb-4 text-left">
                <label className="font-semibold">
                  เลือกสัปดาห์:<br />
                  <select
                    className="text-lg px-2 py-1 rounded border border-gray-400 w-full mt-1"
                    value={week}
                    onChange={e => setWeek(e.target.value)}
                  >
                    <option value="">-- เลือก week --</option>
                    {[...Array(7)].map((_, i) => (
                      <option key={i} value={`week_${i + 1}`}>Week {i + 1}</option>
                    ))}
                  </select>
                </label>
              </div>
              {formError && <div className="text-red-600 mb-3">{formError}</div>}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mr-2"
              >
                เริ่มเกม
              </button>
            </form>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <button
                type="button"
                onClick={() => setShowLB(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <span role="img" aria-label="trophy">🏆</span> ดูอันดับ
              </button>
              <button
                type="button"
                onClick={handleGoHome}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <span role="img" aria-label="home">🏠</span> กลับหน้าหลัก
              </button>
            </div>
            {showLB && (
              <VocabLeaderboard
                onBack={() => setShowLB(false)}
                goHome={handleGoHome}
                initialWeek={week || "week_1"}
                SHEET_API_URL={SHEET_API_URL}
          
              />
            )}
          </div>
        ) : (
          <div className="w-full">
            <div className="min-h-screen p-6 font-sans text-center">
              <h1 className="text-xl font-bold mb-2">จับคู่คำศัพท์ - {currentWeek.toUpperCase()}</h1>
              <p className="mb-4">ชื่อ: {nickname} | เวลา: {elapsed}s</p>
              <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* ฝั่งซ้าย: คำศัพท์ */}
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold mb-2">คำศัพท์</h2>
                  {terms.map((term) => {
                    let colorClass = "bg-white";
                    if (matchedIds.includes(term.id)) {
                      colorClass = "bg-green-500 text-white font-bold";
                    } else if (wrongPair && wrongPair.termId === term.id) {
                      colorClass = "bg-red-400 text-white";
                    } else if (selection && selection.type === 'term' && selection.item.id === term.id) {
                      colorClass = "bg-yellow-300 text-black font-bold";
                    }
                    return (
                      <motion.div
                        key={term.id}
                        whileHover={{ scale: matchedIds.includes(term.id) ? 1 : 1.05 }}
                        whileTap={{ scale: matchedIds.includes(term.id) ? 1 : 0.95 }}
                        className={`p-3 rounded-xl cursor-pointer shadow border text-sm transition-colors duration-200 ${colorClass}`}
                        onClick={() => handleSelect('term', term)}
                      >
                        {term.text}
                      </motion.div>
                    );
                  })}
                </div>
                {/* ฝั่งขวา: คำแปล */}
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold mb-2">คำแปล</h2>
                  {defs.map((def) => {
                    let colorClass = "bg-white";
                    if (matchedIds.includes(def.id)) {
                      colorClass = "bg-green-500 text-white font-bold";
                    } else if (wrongPair && wrongPair.defId === def.id) {
                      colorClass = "bg-red-400 text-white";
                    } else if (selection && selection.type === 'def' && selection.item.id === def.id) {
                      colorClass = "bg-blue-300 text-black font-bold";
                    }
                    return (
                      <motion.div
                        key={def.id}
                        whileHover={{ scale: matchedIds.includes(def.id) ? 1 : 1.05 }}
                        whileTap={{ scale: matchedIds.includes(def.id) ? 1 : 0.95 }}
                        className={`p-3 rounded-xl cursor-pointer shadow border text-sm transition-colors duration-200 ${colorClass}`}
                        onClick={() => handleSelect('def', def)}
                      >
                        {def.text}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {showLB && (
                <VocabLeaderboard
                  onBack={() => setShowLB(false)}
                  goHome={handleGoHome}
                  initialWeek={currentWeek || week}
                  SHEET_API_URL={SHEET_API_URL}
          
                />
              )}

              {finished && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-xl font-bold text-green-600">🎉 จบเกมแล้ว!</h2>
                  <p className="text-md">คุณใช้เวลา <strong>{elapsed} วินาที</strong></p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <button
                  onClick={restart}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl"
                >
                  🔄 เริ่มใหม่
                </button>
                <button
                  onClick={goPrevWeek}
                  className="bg-blue-500 hover:bg-blue-500 text-white px-4 py-2 rounded-xl"
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
                  onClick={() => setShowLB(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl"
                >
                  🏆 ดูอันดับ
                </button>
                <button
                  onClick={handleGoHome}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
                >
                  🏠 กลับหน้าหลัก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
