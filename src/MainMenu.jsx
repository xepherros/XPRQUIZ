import React from "react";

export default function MainMenu({ onSelect }) {
  return (
    <div
      className="
        min-h-screen flex flex-col items-center justify-center
        bg-gradient-to-br from-pink-200 to-blue-200
        relative overflow-hidden
      "
    >
      {/* background floating shape */}
      <div className="absolute -top-16 -left-20 w-52 h-52 bg-pink-300 opacity-30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-300 opacity-40 rounded-full blur-2xl animate-pulse"></div>
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xs w-full text-center relative z-10">
        <h1 className="text-4xl font-extrabold mb-10 text-purple-700 drop-shadow">เลือกเกมที่ต้องการเล่น</h1>
        <div className="space-y-5">
          <button
            onClick={() => onSelect("vocab")}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-xl font-bold transition transform hover:scale-105 shadow-lg"
          >
            🎮 เกมจับคู่คำศัพท์
          </button>
          <button
            onClick={() => onSelect("spelling")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-xl font-bold transition transform hover:scale-105 shadow-lg"
          >
            🔤 เกมสะกดคำ
          </button>
        </div>
        <div className="mt-8 text-xs text-gray-400">© 2025 XPRQUIZ</div>
      </div>
    </div>
  );
}
