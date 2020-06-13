import { useState, useEffect } from "react";

export function useModalState() {
  const [isWhatOpen, setIsWhatOpen] = useState<boolean>(false);
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(
    window.location.hash.includes("why")
  );

  const openWhatModal = () => {
    setIsWhyOpen(false);
    setIsWhatOpen(true);
  };
  const closeWhatModal = () => setIsWhatOpen(false);

  const openWhyModal = () => {
    setIsWhatOpen(false);
    setIsWhyOpen(true);
  };
  const closeWhyModal = () => setIsWhyOpen(false);

  useEffect(() => {
    const root: HTMLElement | null = document.querySelector("#root");
    if (!root) return;
    if (isWhatOpen || isWhyOpen) {
      root.classList.add("blur");
    } else {
      root.classList.remove("blur");
    }
  }, [isWhatOpen, isWhyOpen]);

  return {
    isWhatOpen,
    setIsWhatOpen,
    openWhatModal,
    closeWhatModal,
    isWhyOpen,
    setIsWhyOpen,
    openWhyModal,
    closeWhyModal,
  };
}
