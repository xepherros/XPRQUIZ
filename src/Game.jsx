import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import words from './weekly_vocab_list.json';

const synth = window.speechSynthesis;

function speak(text) {
  const exceptions = {
    "IATA": "I A T A",
    "ETA": "E T A",
    "AWB": "A W B"
  };
  const spokenText = exceptions[text.toUpperCase()] || text;
  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.lang = 'en-US';
  synth.cancel();
  synth.speak(utterance);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function Game({ week = "week_1", nickname = "Player" }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const selected = words[week] || [];
    const prepared = shuffle([
      ...selected.map((item, i) => ({ id: i + "T", text: item.term, pair: item.definition })),
      ...selected.map((item, i) => ({ id: i + "D", text: item.definition, pair: item.term }))
    ]);
    setCards(prepared);
    setStartTime(Date.now());
  }, [week]);

  useEffect(() => {
    let timer;
    if (!finished) {
      timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [finished, startTime]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setFinished(true);
      saveScore();
    }
  }, [matched]);

  const handleFlip = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    speak(cards[index].text);
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (cards[a].pair === cards[b].text) {
        setTimeout(() => {
          setMatched([...matched, a, b]);
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const saveScore = () => {
    const key = `ranking_${week}`;
    const old = JSON.parse(localStorage.getItem(key) || "[]");
    const newScore = { name: nickname, time: elapsed };
    const updated = [...old, newScore].sort((a, b) => a.time - b.time).slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  return (
    <div className="p-4 text-center font-sans">
      <h1 className="text-xl font-bold mb-2">จับคู่คำศัพท์ - {week.toUpperCase()}</h1>
      <p className="mb-4">ชื่อ: {nickname} | เวลา: {elapsed}s</p>

      <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(index);

          return (
            <motion.div
              key={index}
              layout
              className={`rounded-xl p-4 h-24 flex items-center justify-center text-sm md:text-base font-medium border cursor-pointer perspective`}
              onClick={() => handleFlip(index)}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              style={{
                backgroundColor: matched.includes(index)
                  ? '#bbf7d0'
                  : isFlipped
                  ? '#ffffff'
                  : '#cce4f6'
              }}
            >
              {isFlipped ? card.text : "❓"}
            </motion.div>
          );
        })}
      </div>

      {finished && (
        <AnimatePresence>
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-lg font-semibold">🎉 จับคู่ครบแล้ว!</h2>
            <p>ใช้เวลา: {elapsed} วินาที</p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default Game;
