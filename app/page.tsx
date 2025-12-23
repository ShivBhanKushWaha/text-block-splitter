"use client";
import { useState, useMemo } from "react";

/* ================= CONSTANTS ================= */

const MIN_BOX_WIDTH = 250;
const MIN_BOX_HEIGHT = 250;

const MAX_CHARS_PER_LINE = 60;
const MAX_LINES_PER_BLOCK = 12;

// monospace approx sizes
const CHAR_PIXEL = 8;
const LINE_PIXEL = 22;

/* ================= HELPERS ================= */

// build lines (NO word break)
const buildLines = (words: string[], maxChars: number) => {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;

    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
};

// build blocks
const buildBlocks = (
  text: string,
  maxCharsPerLine: number,
  linesPerBlock: number
) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = buildLines(words, maxCharsPerLine);

  const blocks: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerBlock) {
    blocks.push(lines.slice(i, i + linesPerBlock).join("\n"));
  }

  return blocks;
};

// copy block
const copyBlock = (block: string) => {
  navigator.clipboard.writeText(block);
};

/* ================= COMPONENT ================= */

export default function Home() {
  const [text, setText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // user inputs
  const [maxChars, setMaxChars] = useState(45);
  const [linesPerBlock, setLinesPerBlock] = useState(8);

  // clamp inputs
  const safeMaxChars = Math.min(Math.max(1, maxChars), MAX_CHARS_PER_LINE);
  const safeLinesPerBlock = Math.min(
    Math.max(1, linesPerBlock),
    MAX_LINES_PER_BLOCK
  );

  // build blocks
  const blocks = useMemo(() => {
    return buildBlocks(editedText ?? text, safeMaxChars, safeLinesPerBlock);
  }, [text, editedText, safeMaxChars, safeLinesPerBlock]);

  // 🔹 content-driven size calculation
  const maxLinesUsed = Math.max(...blocks.map((b) => b.split("\n").length), 1);

  const maxLineLength = Math.max(
    ...blocks.flatMap((b) => b.split("\n").map((line) => line.length)),
    1
  );

  const boxWidth = Math.max(
    MIN_BOX_WIDTH,
    Math.min(
      maxLineLength * CHAR_PIXEL + 40,
      MAX_CHARS_PER_LINE * CHAR_PIXEL + 40
    )
  );

  const boxHeight = Math.max(
    MIN_BOX_HEIGHT,
    Math.min(
      maxLinesUsed * LINE_PIXEL + 80,
      MAX_LINES_PER_BLOCK * LINE_PIXEL + 80
    )
  );

  /* ===== SAVE EDIT ===== */
  const handleSaveEdit = (index: number, value: string) => {
    const allBlocks = [...blocks];
    allBlocks[index] = value;

    const mergedText = allBlocks.join(" ");
    setEditedText(mergedText);
    setEditingIndex(null);
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      {/* CONTROLS */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="text-sm block mb-1">Characters per line</label>
          <input
            type="number"
            min={1}
            max={MAX_CHARS_PER_LINE}
            value={maxChars}
            onChange={(e) => {
              const val = Number(e.target.value);

              if (Number.isNaN(val)) return;

              setMaxChars(Math.min(Math.max(35, val), MAX_CHARS_PER_LINE));
            }}
            className="border px-2 py-1 w-28"
          />
          <p className="text-xs text-gray-500 mt-1">
            35 – {MAX_CHARS_PER_LINE}
          </p>
        </div>

        <div>
          <label className="text-sm block mb-1">Lines per block</label>
          <input
            type="number"
            min={1}
            max={MAX_LINES_PER_BLOCK}
            value={linesPerBlock}
            onChange={(e) => {
              const val = Number(e.target.value);

              if (Number.isNaN(val)) return;

              setLinesPerBlock(Math.min(Math.max(1, val), MAX_LINES_PER_BLOCK));
            }}
            className="border px-2 py-1 w-28"
          />
          <p className="text-xs text-gray-500 mt-1">
            1 – {MAX_LINES_PER_BLOCK}
          </p>
        </div>
      </div>

      {/* INPUT */}
      <textarea
        className="
          w-full h-80 resize-none
          border rounded-md p-3 mb-6
          font-mono text-sm
        "
        placeholder="पूरा content यहाँ paste करो..."
        value={editedText ?? text}
        onChange={(e) => {
          setText(e.target.value);
          setEditedText(null);
          setEditingIndex(null);
        }}
      />

      {/* BLOCKS */}
      <div className="flex flex-wrap gap-4 justify-center">
        {blocks.map((block, index) => {
          const isEditing = editingIndex === index;

          return (
            <div
              key={index}
              className="bg-white border shadow flex flex-col"
              style={{ width: boxWidth, height: boxHeight }}
            >
              {/* HEADER */}
              <div className="px-3 py-2 border-b text-sm font-semibold shrink-0">
                Block {index + 1}
              </div>

              {/* TEXT AREA (SCROLL ONLY WHEN NOT EDITING) */}
              <div
                className={`
    p-3 font-mono text-sm
    whitespace-pre-wrap
    leading-relaxed
    text-justify
    ${isEditing ? "overflow-hidden" : "overflow-auto"}
  `}
                style={{
                  flex: 1,
                  textJustify: "inter-word",
                  textAlignLast: "left",
                  wordSpacing: "0.02em",
                  hyphens: "none",
                }}
              >
                {isEditing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="
    w-full min-h-full resize-none
    outline-none border-none
    bg-transparent font-mono
    whitespace-pre-wrap
    leading-relaxed
    overflow-auto
  "
                    style={{
                      textJustify: "inter-word",
                      textAlignLast: "left",
                      wordSpacing: "0.02em",
                      hyphens: "none",
                    }}
                  />
                ) : (
                  block
                )}
              </div>

              {/* FOOTER – NEVER BREAKS */}
              <div className="flex justify-between items-center px-3 py-2 border-t shrink-0">
                <button
                  onClick={() => copyBlock(block)}
                  className="text-xs px-3 py-1 rounded bg-blue-600 text-white"
                >
                  Copy
                </button>

                {isEditing ? (
                  <button
                    onClick={() => handleSaveEdit(index, draft)}
                    className="text-xs px-3 py-1 rounded bg-green-600 text-white"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingIndex(index);
                      setDraft(block);
                    }}
                    className="text-xs px-3 py-1 rounded bg-gray-200"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
