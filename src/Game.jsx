import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import words from './weekly_vocab_list.json';

function speak(text) {
  const exceptions = {
    IATA: "I A T A", ETA: "E T A", AWB: "A W B",
    FCL: "F C L", LCL: "L C L"
  };
  const spoken = exceptions[text.toUpperCase()] || text;
  const utter = new SpeechSynthesisUtterance(spoken);
  utter.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Game({ week, nickname, goHome }) {
  const [terms, setTerms] = useState([]);
  const [defs, setDefs] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const vocab = words[week] || [];
    setTerms(shuffle(vocab.map((v, i) => ({ id: i, text: v.term, pair: v.definition }))));
    setDefs(shuffle(vocab.map((v, i) => ({ id: i, text: v.definition, pair: v.term }))));
    setStartTime(Date.now());
  }, [week]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, startTime]);

  useEffect(() => {
    if (matchedPairs.length === 10) {
      setFinished(true);
      saveScore();
    }
  }, [matchedPairs]);

  const handleMatch = (def) => {
    if (!selectedTerm) return;
    const isMatch = selectedTerm.pair === def.text;
    if (isMatch) {
      setMatchedPairs([...matchedPairs, selectedTerm.text]);
    }
    setSelectedTerm(null);
  };


  const saveScore = () => {
    const key = `ranking_${week}`;
    const old = JSON.parse(localStorage.getItem(key) || "[]");
    const score = { name: nickname, time: elapsed };
    const updated = [...old, score].sort((a, b) => a.time - b.time).slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen p-6 bg-pastel font-sans text-center">
      <h1 className="text-xl font-bold mb-2">จับคู่คำศัพท์ - {week.toUpperCase()}</h1>
      <p className="mb-4">ชื่อ: {nickname} | เวลา: {elapsed}s</p>
      <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* ฝั่งซ้าย: คำศัพท์ */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">คำศัพท์</h2>
          {terms.map((term) => (
            <motion.div
              key={term.text}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl cursor-pointer shadow border text-sm bg-white
                ${selectedTerm?.text === term.text ? 'bg-yellow-200' :
                  matchedPairs.includes(term.text) ? 'bg-green-200 text-green-900' : ''}
              `}
              onClick={() => {
                speak(term.text);
                setSelectedTerm(term);
              }}
            >
              {term.text}
            </motion.div>
          ))}
        </div>

        {/* ฝั่งขวา: คำแปล */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">คำแปล</h2>
          {defs.map((def) => (
            <motion.div
              key={def.text}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl cursor-pointer shadow border text-sm bg-white
                ${selectedTerm && selectedTerm.pair === def.text ? 'bg-blue-100' : ''}
                ${matchedPairs.includes(def.pair) ? 'bg-green-200 text-green-900' : ''}
              `}
              onClick={() => handleMatch(def)}
            >
              {def.text}
            </motion.div>
          ))}
        </div>
      </div>

      {finished && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-green-600">🎉 จบเกมแล้ว!</h2>
          <p className="text-md">คุณใช้เวลา <strong>{elapsed} วินาที</strong></p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button
              onClick={() => {
                setTerms([]);
                setDefs([]);
                setMatchedPairs([]);
                setSelectedTerm(null);
                setFinished(false);
                setElapsed(0);
                setStartTime(Date.now());

                const vocab = words[week] || [];
                setTerms(shuffle(vocab.map((v) => ({ text: v.term, pair: v.definition }))));
                setDefs(shuffle(vocab.map((v) => ({ text: v.definition, pair: v.term }))));
              }}

              className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl"
            >
              🔄 เริ่มใหม่
            </button>

            <button
              onClick={() => {
                const next = parseInt(week.split("_")[1]) + 1;
                if (next <= 7) {
                  window.location.href = `/?autoStart=true&week=week_${next}&name=${nickname}`;
                } else {
                  alert("ไม่มีสัปดาห์ถัดไปแล้ว");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
              ⏭️ สัปดาห์ถัดไป
            </button>

            <button
              onClick={() => alert("กำลังพัฒนา: ตารางอันดับ")}
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
      )}
    </div>
  );
}
