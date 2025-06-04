import React, { useState } from "react";
import MainMenu from "./MainMenu";
import AppVocab from "./AppVocab";
import AppSpelling from "./AppSpelling";

export default function MainRouter() {
  const [screen, setScreen] = useState("mainmenu");

  const goHome = () => setScreen("mainmenu");

  return (
    <>
      {screen === "mainmenu" && <MainMenu onSelect={setScreen} />}
      {screen === "vocab" && <AppVocab goHome={goHome} />}
      {screen === "spelling" && <AppSpelling goHome={goHome} />}
    </>
  );
}
