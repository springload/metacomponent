import React from "react";

export function Diagram() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-3 0 97 100"
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
        width="35"
        height="9"
        stroke="#ccc"
        strokeWidth="0.4"
        strokeDasharray="1 1"
      ></rect>
      <text x="5" y="16" fontSize="5" fill="white">
        MetaHTML
      </text>
      <text x="17" y="23" fontSize="5" fill="white">
        +
      </text>
      <rect
        x="0"
        y="24"
        width="35"
        height="9"
        fill="transparent"
        strokeWidth="0.4"
        strokeDasharray="1 1"
      ></rect>
      <text x="5" y="30.5" fontSize="5">
        CSS
      </text>

      <line
        x1="38"
        y1="21.5"
        x2="42"
        y2="21.5"
        strokeWidth="1"
        markerEnd="url(#arrowhead)"
      />

      <rect
        x="50"
        y="10"
        width="35"
        height="23"
        fill="transparent"
        strokeWidth="0.4"
        strokeDasharray="1 1"
      ></rect>
      <text x="53" y="23" fontSize="5" fill="white">
        Components
      </text>
    </svg>
  );
}
