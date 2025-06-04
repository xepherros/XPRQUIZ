import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import words from './weekly_vocab_list.json';

function speak(text) {
  const exceptions = { IATA: "I A T A", AWB: "A W B", ETA: "E T A" };
  const spoken = exceptions[text.toUpperCase()] || text;
  const utter = new SpeechSynthesisUtterance(spoken);
  utter.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Game({ week, nickname }) {
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
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (matchedPairs.length === 10) {
      setFinished(true);
      saveScore();
    }
  }, [matchedPairs]);

  const saveScore = () => {
    const key = `ranking_${week}`;
    const old = JSON.parse(localStorage.getItem(key) || "[]");
    const score = { name: nickname, time: elapsed };
    const updated = [...old, score].sort((a, b) => a.time - b.time).slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleMatch = (def) => {
    if (!selectedTerm) return;
    speak(selectedTerm.text);
    const isMatch = selectedTerm.pair === def.text;
    if (isMatch) {
      setMatchedPairs([...matchedPairs, selectedTerm.id]);
    }
    setSelectedTerm(null);
  };

  return (
    <div className="min-h-screen p-6 bg-pastel font-sans text-center">
      <h1 className="text-xl font-bold mb-2">จับคู่คำศัพท์ - {week.toUpperCase()}</h1>
      <p className="mb-4">ชื่อ: {nickname} | เวลา: {elapsed}s</p>
      <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* คำศัพท์ฝั่งซ้าย */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">คำศัพท์</h2>
          {terms.map((term) => (
            <motion.div
              key={term.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl cursor-pointer shadow border text-sm bg-white
                ${selectedTerm?.id === term.id ? 'bg-yellow-200' :
                  matchedPairs.includes(term.id) ? 'bg-green-200 text-green-900' : ''}
              `}
              onClick={() => setSelectedTerm(term)}
            >
              {term.text}
            </motion.div>
          ))}
        </div>

        {/* คำแปลฝั่งขวา */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">คำแปล</h2>
          {defs.map((def) => {
            const isMatched = matchedPairs.includes(def.id);
            return (
              <motion.div
                key={def.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl cursor-pointer shadow border text-sm bg-white
                  ${selectedTerm && selectedTerm.pair === def.text ? 'bg-blue-100' : ''}
                  ${matchedPairs.includes(def.id) ? 'bg-green-200 text-green-900' : ''}
                `}
                onClick={() => handleMatch(def)}
              >
                {def.text}
              </motion.div>
            );
          })}
        </div>
      </div>

      {finished && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-green-600">🎉 จบเกม!</h2>
          <p>คุณจับคู่คำศัพท์ครบใน {elapsed} วินาที</p>
        </div>
      )}
    </div>
  );
}
