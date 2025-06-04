import React from "react";

export default function MainMenu({ onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-200 to-blue-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xs w-full text-center">
        <h1 className="text-3xl font-bold mb-8 text-purple-700">เลือกเกมที่ต้องการเล่น</h1>
        <div className="space-y-4">
          <button
            onClick={() => onSelect("vocab")}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-xl font-bold transition"
          >
            🎮 เกมจับคู่คำศัพท์
          </button>
          <button
            onClick={() => onSelect("spelling")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-xl font-bold transition"
          >
            🔤 เกมสะกดคำ
          </button>
        </div>
      </div>
    </div>
  );
}
