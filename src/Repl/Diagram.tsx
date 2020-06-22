import React from "react";
import "./Diagram.css";

export function Diagram() {
  return (
    <div className="diagram">
      <div className="box diagram-metahtml">
        MetaHTML <br /> (input)
      </div>
      <div className="diagram-plus">+</div>
      <div className="box diagram-css">
        Standard CSS <br /> (input)
      </div>
      <div className="diagram-equals">=</div>
      <div className="box diagram-output">Components (output)</div>
    </div>
  );
}
