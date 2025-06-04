import React, { useState } from "react";
import MainMenu from "./MainMenu";
import AppVocab from "./AppVocab";
import AppSpelling from "./AppSpelling";

export default function MainRouter() {
  const [screen, setScreen] = useState("menu");
  const goHome = () => setScreen("menu");

  return (
    <>
      {screen === "menu" && <MainMenu onSelect={setScreen} />}
      {screen === "vocab" && <AppVocab goHome={goHome} />}
      {screen === "spelling" && <AppSpelling goHome={goHome} />}
    </>
  );
}
