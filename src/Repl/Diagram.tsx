import React from "react";

export function Diagram() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0.5 9.5 97 35"
      preserveAspectRatio="xMidYMid"
      className="modal-content__diagram"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="5"
          markerHeight="3"
          refX="0"
          refY="1.5"
          orient="auto"
        >
          <polygon points="0 0, 5 1.5, 0 3" />
        </marker>
      </defs>
      <rect
        x="0"
        y="10"
        width="51"
        height="9"
        stroke="#ccc"
        fill="transparent"
        strokeWidth="0.4"
        strokeDasharray="1 1"
      ></rect>
      <text x="5" y="16" fontSize="5" fill="white">
        MetaHTML (input)
      </text>
      <text x="24" y="26" fontSize="10" fill="white">
        +
      </text>
      <rect
        x="0"
        y="28"
        width="51"
        height="9"
        fill="transparent"
        strokeWidth="0.4"
        strokeDasharray="1 1"
      ></rect>
      <text x="13" y="34" fontSize="5">
        CSS (input)
      </text>

      <line
        x1="49"
        y1="23"
        x2="53"
        y2="23"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
      />

      <rect
        x="62"
        y="10"
        width="35"
        height="27"
        fill="transparent"
        strokeWidth="0.4"
        strokeDasharray="1 1"
      ></rect>
      <text x="65" y="20" fontSize="5" fill="white">
        Components
      </text>
      <text x="70" y="28" fontSize="5" fill="white">
        (output)
      </text>
    </svg>
  );
}
