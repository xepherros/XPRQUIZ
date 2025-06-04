import React, { useState } from "react";
import MainMenu from "./MainMenu";
import AppSpelling from "./AppSpelling";
import AppVocab from "./AppVocab"; // ต้อง import ทุกคอมโพเนนต์ที่ใช้

export default function MainRouter() {
  const [screen, setScreen] = useState("menu");
  const goHome = () => setScreen("menu");

  return (
    <>
      {screen === "menu" && <MainMenu onSelect={setScreen} />}
      {screen === "spelling" && <AppSpelling goHome={goHome} />}
      {screen === "vocab" && <AppVocab goHome={goHome} />}
    </>
  );
}
