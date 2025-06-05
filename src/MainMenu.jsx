import React from "react";

export default function MainMenu({ onSelect }) {
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
      }}
    >
      <div className="bg-pastel rounded-2xl shadow-xl p-8 max-w-xs w-full text-center z-10 relative">
        <h1 className="text-3xl font-bold mb-8 text-purple-700">เลือกเกมที่ต้องการเล่น</h1>
        <div className="space-y-4">
          <button
            onClick={() => onSelect("vocab")}
            className="bg-[#4dd0e1] hover:bg-[#00bcd4] text-white font-bold py-3 rounded-xl shadow transition"
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
