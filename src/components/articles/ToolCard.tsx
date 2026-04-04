"use client";

import { useState } from "react";
import { Calculate, ArrowRightAlt } from "@material-symbols-svg/react";
import { C, font } from "./config";
import type { Tool } from "./config";

interface Props {
  tool: Tool;
  color: string;
}

export function ToolCard({ tool, color }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={tool.url}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        background: hovered ? `${color}08` : C.white,
        border: `1px solid ${hovered ? `${color}30` : C.border}`,
        textDecoration: "none",
        transition: "all .2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${color}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Calculate size={14} color={color} aria-hidden="true" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.textDark }}>
          {tool.title}
        </div>
        <div style={{ fontFamily: font, fontSize: 11, color: C.textLight, marginTop: 1 }}>
          {tool.desc}
        </div>
      </div>

      <ArrowRightAlt
        size={10}
        color={color}
        aria-hidden="true"
        style={{ opacity: hovered ? 1 : 0.4, transition: "opacity .2s" }}
      />
    </a>
  );
}
