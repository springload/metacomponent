import Modal from "react-modal";
import "./Modals.css";

Modal.setAppElement("#root");

export const modalStyles = {
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
    border: "none",
  },
  content: {
    background: "none",
    inset: "0px",
    border: "none",
    top: "0px",
    bottom: "0px",
    right: "0px",
    left: "0px",
  },
} as const;
