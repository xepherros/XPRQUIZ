import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import words from './weekly_vocab_list.json';

function speak(text) {
  const exceptions = {
    IATA: "I A T A", ETA: "E T A", AWB: "A W B",
    FCL: "F C L", LCL: "L C L"
  };
  const spoken = exceptions[text.toUpperCase()] || text;
  const utter = new window.SpeechSynthesisUtterance(spoken);
  utter.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ฟังก์ชันเล่นเสียง
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

export default function Game({ week, nickname, goHome }) {
  const [terms, setTerms] = useState([]);
  const [defs, setDefs] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongPair, setWrongPair] = useState(null); // { termId, defId }
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(week);

  function generateTermDef(vocab) {
    return {
      terms: vocab.map((v, i) => ({ id: i, text: v.term, pair: v.definition })),
      defs: vocab.map((v, i) => ({ id: i, text: v.definition, pair: v.term })),
    };
  }

  useEffect(() => {
    const vocab = words[currentWeek] || [];
    const { terms, defs } = generateTermDef(vocab);
    setTerms(shuffle(terms));
    setDefs(shuffle(defs));
    setStartTime(Date.now());
    setElapsed(0);
    setMatchedIds([]);
    setSelectedTerm(null);
    setFinished(false);
    setWrongPair(null);
  }, [currentWeek]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, startTime]);

  useEffect(() => {
    if (terms.length > 0 && matchedIds.length === terms.length) {
      setFinished(true);
      playSound(winSound);
      saveScore();
    }
  }, [matchedIds, terms.length]); // เพิ่ม playSound(winSound) เมื่อจบเกม

  const handleMatch = (def) => {
    if (!selectedTerm) return;
    if (selectedTerm.id === def.id) {
      playSound(correctSound); // เสียงถูก
      setMatchedIds([...matchedIds, selectedTerm.id]);
      setSelectedTerm(null);
      setWrongPair(null);
    } else {
      playSound(wrongSound); // เสียงผิด
      setWrongPair({ termId: selectedTerm.id, defId: def.id });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
      }, 700);
    }
  };

  const saveScore = () => {
    const key = `ranking_${currentWeek}`;
    const old = JSON.parse(localStorage.getItem(key) || "[]");
    const score = { name: nickname, time: elapsed };
    const updated = [...old, score].sort((a, b) => a.time - b.time).slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const restart = () => {
    const vocab = words[currentWeek] || [];
    const { terms, defs } = generateTermDef(vocab);
    setTerms(shuffle(terms));
    setDefs(shuffle(defs));
    setMatchedIds([]);
    setSelectedTerm(null);
    setFinished(false);
    setElapsed(0);
    setStartTime(Date.now());
    setWrongPair(null);
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
      setSelectedTerm(null);
      setFinished(false);
      setElapsed(0);
      setStartTime(Date.now());
      setWrongPair(null);
    } else {
      alert("ไม่มีสัปดาห์ถัดไปแล้ว");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-pastel font-sans text-center">
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
            }
            return (
              <motion.div
                key={term.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl cursor-pointer shadow border text-sm transition-colors duration-200 ${colorClass}`}
                onClick={() => {
                  if (!matchedIds.includes(term.id) && !wrongPair) {
                    speak(term.text);
                    setSelectedTerm(term);
                  }
                }}
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
            }
            return (
              <motion.div
                key={def.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl cursor-pointer shadow border text-sm transition-colors duration-200 ${colorClass}`}
                onClick={() => {
                  if (selectedTerm && !matchedIds.includes(def.id) && !wrongPair) {
                    handleMatch(def);
                  }
                }}
              >
                {def.text}
              </motion.div>
            );
          })}
        </div>
      </div>
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
          onClick={goNextWeek}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          ⏭️ สัปดาห์ถัดไป
        </button>
        <button
          onClick={() => alert("กำลังพัฒนา  :  ตาราง อันดับ")}
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
