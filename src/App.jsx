import React, { useState } from 'react';
import Game from './Game';

const App = () => {
  const [nickname, setNickname] = useState('');
  const [week, setWeek] = useState('');
  const [start, setStart] = useState(false);

  const handleStart = () => {
    if (nickname && week) {
      setStart(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pastel px-4">

      {/* ทดสอบสี Tailwind */}
      <div className="flex gap-2 mb-6">
        <div className="bg-green-500 text-white p-4 rounded">bg-green-500</div>
        <div className="bg-red-400 text-white p-4 rounded">bg-red-400</div>
        <div className="bg-blue-500 text-white p-4 rounded">bg-blue-500</div>
        <div className="bg-pastel text-black p-4 rounded">bg-pastel</div>
      </div>

      {!start ? (
        <div className="bg-white p-6 rounded-2xl shadow max-w-md w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">เริ่มเกมจับคู่คำศัพท์</h1>
          <input
            className="w-full border p-2 rounded"
            placeholder="กรอกชื่อเล่น"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <select
            className="w-full border p-2 rounded"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          >
            <option value="">เลือกสัปดาห์</option>
            {[...Array(7)].map((_, i) => (
              <option key={i} value={`week_${i + 1}`}>Week {i + 1}</option>
            ))}
          </select>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition"
            onClick={handleStart}
          >
            เริ่มเกม
          </button>
        </div>
      ) : (
        <Game nickname={nickname} week={week} />
      )}
    </div>
  );
};

export default App;
