import React, { useState, useRef } from "react";

type FlashProps = {
  text: React.ReactNode;
  children: React.ReactNode;
};

export function Flash({ text, children }: FlashProps) {
  const timer = useRef<NodeJS.Timeout>();
  const [animate, setAnimate] = useState("off");
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key.trim() === "") return;
    setAnimate("on");
    timer.current = setTimeout(() => {
      if (timer.current) clearTimeout(timer.current);
      setAnimate("off");
    }, 1000);
  };

  return (
    <div onKeyPress={handleKey} className="flash-container">
      <div className={`flash flash--${animate}`}>
        <span className="flash__text">{text}</span>
      </div>
      {children}
    </div>
  );
}
