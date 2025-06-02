
const dataByWeek = {
  1: [
    { term: "AGENT IATA CODE", meaning: "รหัสตัวแทน IATA" },
    { term: "AIR WAYBILL", meaning: "ใบตราส่งสินค้าทางอากาศ" },
    { term: "AIRPORT OF DEPARTURE", meaning: "สนามบินต้นทาง" },
    { term: "AIRPORT OF DESTINATION", meaning: "สนามบินปลายทาง" },
    { term: "ARRIVAL NOTICE", meaning: "ใบแจ้งว่าเรือได้มาถึง" },
    { term: "BERTH", meaning: "ท่าเทียบเรือ" },
    { term: "BILL OF LADING", meaning: "ใบตราส่งสินค้าทางเรือ" },
    { term: "BULK CARGO", meaning: "สินค้าเทกอง" },
    { term: "BULK CARRIER", meaning: "เรือขนส่งสินค้าเทกอง" },
    { term: "CARRIER", meaning: "สายการบินที่ทำการขนส่งสินค้า" }
  ]
};

let selectedTerm = null;
let playerName = "";

function startGame() {
  playerName = document.getElementById('player-name').value.trim();
  const week = document.getElementById('week-select').value;
  if (!playerName) {
    alert("กรุณากรอกชื่อเล่นก่อนเริ่มเกม");
    return;
  }
  const gameArea = document.getElementById("game-area");
  gameArea.innerHTML = "";
  const terms = shuffle([...dataByWeek[week]]);
  const meanings = shuffle([...dataByWeek[week]].map(x => x.meaning));

  terms.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = item.term;
    div.onclick = () => {
      selectedTerm = item.term;
      speak(item.term);
    };
    gameArea.appendChild(div);
  });

  meanings.forEach(meaning => {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = meaning;
    div.onclick = () => {
      const correct = dataByWeek[week].find(x => x.term === selectedTerm)?.meaning === meaning;
      if (correct) {
        div.classList.add("correct");
        speak("Correct!");
      } else {
        div.classList.add("incorrect");
        speak("Try again!");
      }
    };
    gameArea.appendChild(div);
  });
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  speechSynthesis.speak(msg);
}
