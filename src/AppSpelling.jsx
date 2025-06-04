import React, { useEffect, useRef, useState } from "react";

const words = [
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
];

function shuffleArray(array) {
  return array
    .map(val => ({ val, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ val }) => val);
}

export default function AppSpelling({ goHome }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [slots, setSlots] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [result, setResult] = useState("");
  const [resultColor, setResultColor] = useState("black");
  const [disableNext, setDisableNext] = useState(true);

  const [selectedTileIdx, setSelectedTileIdx] = useState(null);
  const samanthaVoice = useRef(null);

  useEffect(() => {
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
  }, [currentWordIndex]);

  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      samanthaVoice.current = voices.find(v => v.name === "Samantha");
    };
    window.speechSynthesis.onvoiceschanged = setVoice;
    setVoice();
  }, []);

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
    } else {
      setResult("❌ Try again!");
      setResultColor("red");
    }
  };

  const resetWord = () => setCurrentWordIndex(idx => idx);
  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(idx => idx + 1);
    } else {
      setResult("🎉 You've completed all words!");
      setResultColor("blue");
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
    wordDisplay: {
      display: 'flex',
      gap: 6,
      marginBottom: 18,
      flexWrap: "wrap",
      justifyContent: "center",
      minHeight: 48
    },
    letterBox: {
      width: 36,
      height: 46,
      border: "2px solid #888",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 28,
      background: "#fafbfc",
      margin: 1,
      cursor: "pointer",
      userSelect: "none",
      transition: "background .2s"
    },
    letterBoxFilled: {
      background: "#e0f7fa"
    },
    tileBank: {
      display: 'flex',
      gap: 10,
      marginBottom: 16,
      flexWrap: "wrap",
      justifyContent: "center",
      minHeight: 48
    },
    tile: {
      width: 36,
      height: 46,
      border: "2px solid #1565c0",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 28,
      background: "#fff",
      color: "#1565c0",
      fontWeight: "bold",
      cursor: "pointer",
      userSelect: "none",
      margin: 1,
      boxShadow: "0 2px 4px #0001"
    },
    tileSelected: {
      background: "#b3e5fc",
      borderColor: "#0288d1"
    },
    result: {
      color: resultColor,
      fontWeight: "bold",
      minHeight: 32,
      fontSize: 20,
      textAlign: "center",
      marginBottom: 12
    },
    buttonBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      marginBottom: 14
    },
    button: {
      padding: "0.7em 1.3em",
      fontSize: "1.03em",
      borderRadius: 8,
      border: "none",
      background: "#1976d2",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      marginBottom: 4,
      boxShadow: "0 2px 4px #0001",
      minWidth: 90
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed"
    },
    homeButton: {
      background: "#e91e63",
      marginTop: 12
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{textAlign: "center", color: "#1565c0", marginBottom: 18}}>เกมสะกดคำ</h2>
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
