import React, { useState, useEffect } from "react";

// ส่ง prop: { onBack, goHome, initialWeek, SHEET_API_URL, gameType }
export default function VocabLeaderboard({
  onBack,
  goHome,
  initialWeek = "week_1",
  SHEET_API_URL = "/api/gas-proxy",
  gameType = "vocab" // เพิ่ม default "vocab"
}) {
  const [week, setWeek] = useState(initialWeek);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        // เพิ่มการ filter ตาม gameType
        const res = await fetch(
          `${SHEET_API_URL}?week=${encodeURIComponent(week)}&gameType=${encodeURIComponent(gameType)}`
        );
        let list = await res.json();
        // กรองชื่อซ้ำ เอาเวลาน้อยสุด
        const unique = {};
        list.forEach(item => {
          if (!unique[item.name] || Number(item.time) < Number(unique[item.name].time)) {
            unique[item.name] = item;
          }
        });
        setData(Object.values(unique).sort((a, b) => Number(a.time) - Number(b.time)));
      } catch (e) {
        setData([]);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, [week, SHEET_API_URL, gameType]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0,0,0,0.15)",
        minHeight: "100vh",
        minWidth: "100vw",
        top: 0, left: 0
      }}
    >
      <div className="max-w-xs w-full bg-pastel p-6 rounded-2xl shadow-xl text-center font-sans">
        <h2 className="text-blue-800 text-2xl font-bold mb-3">
          อันดับ ({week.replace("week_", "Week ")})
        </h2>
        <select
          value={week}
          onChange={e => setWeek(e.target.value)}
          className="text-base mb-3 border border-gray-400 rounded px-2 py-1"
        >
          {[...Array(7)].map((_, i) => (
            <option key={i} value={`week_${i + 1}`}>{`Week ${i + 1}`}</option>
          ))}
        </select>
        <div className="mb-4 text-left pl-2 min-h-[40px]">
          {loading ? (
            <span>กำลังโหลด...</span>
          ) : data.length === 0 ? (
            <span>ยังไม่มีข้อมูล</span>
          ) : (
            <ol>
              {data.map((item, idx) => (
                <li key={idx}>
                  {item.name} — {item.time} วินาที
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            ← กลับ
          </button>
          <button
            onClick={goHome}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <span role="img" aria-label="home">🏠</span> กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
}
