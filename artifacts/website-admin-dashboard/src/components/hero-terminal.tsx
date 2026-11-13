import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------------- */
/* Types                                                                      */
/* ------------------------------------------------------------------------- */

type Tone = "text" | "dim" | "accent" | "flame" | "blue" | "white" | "red" | "matrix";
type Line = string | { text: string; tone: Tone };
type Frame = { lines: Line[]; ms: number };
/** A scene either prints its output line by line or plays animation frames. */
type Scene = { command: string; output?: Line[]; frames?: Frame[] };

const TONE_CLASS: Record<Tone, string> = {
  text: "text-[#a6e3c4]",
  dim: "text-white/35",
  accent: "text-primary",
  flame: "text-[#ffb86b]",
  blue: "text-[#7aa2f7]",
  white: "text-[#e8edf5]",
  red: "text-[#ff6b6b]",
  matrix: "text-[#3ddc84]",
};

const t = (text: string, tone: Tone): Line => ({ text, tone });
const lineText = (line: Line) => (typeof line === "string" ? line : line.text);
const lineTone = (line: Line): Tone => (typeof line === "string" ? "text" : line.tone);

/** Visible animation area below the prompt (fits the mobile height). */
const ROWS = 12;
const COLS = 38;

/* ------------------------------------------------------------------------- */
/* Rocket launch with countdown                                               */
/* ------------------------------------------------------------------------- */

const ROCKET = [
  "     /\\",
  "    /  \\",
  "   | () |",
  "   |    |",
  "   | AW |",
  "  /|    |\\",
  " /_|/\\/\\|_\\",
];
const FLAMES = [
  ["    )\"\"(", "   ( ** )", "    '**'"],
  ["    (\"\")", "   ) ** (", "    .**."],
  ["    )**(", "   ( \"\" )", "     **"],
];
const DIGITS: Record<string, string[]> = {
  "3": ["######", "    ##", "######", "    ##", "######"],
  "2": ["######", "    ##", "######", "##    ", "######"],
  "1": ["  ##  ", "####  ", "  ##  ", "  ##  ", "######"],
  "0": ["######", "##  ##", "##  ##", "##  ##", "######"],
};
const GROUND = "___/__________\\___________________";
const SMOKE = ["  (  )  (   ) ( )", " (   )(  )  (  ) (", "  ( )  (  ) (   )"];

function pad(text: string, width: number) {
  return text.length >= width ? text.slice(0, width) : text + " ".repeat(width - text.length);
}

function rocketFrames(): Frame[] {
  const frames: Frame[] = [];
  const sky = ROWS - 1; // last row is the status line
  const rocketTop = sky - 1 - ROCKET.length; // rocket stands on the ground row

  const padFrame = (digit: string | null, flame: string[] | null, status: Line): Frame["lines"] => {
    const rows: Line[] = Array.from({ length: sky }, () => "");
    ROCKET.forEach((row, i) => {
      const digitRow = digit ? DIGITS[digit][i - 1] : undefined;
      rows[rocketTop + i] = digitRow ? t(pad(row, 18) + digitRow, "white") : t(row, "white");
    });
    if (flame) rows[sky - 1] = t(`${flame[0]}  ${SMOKE[frames.length % 3]}`, "flame");
    else rows[sky - 1] = t(GROUND, "dim");
    rows[0] = t("  .        *            .      *", "dim");
    return [...rows, status];
  };

  for (const digit of ["3", "2", "1"]) {
    frames.push({ lines: padFrame(digit, null, t(`  T-${digit}  Systeme bereit ...`, "accent")), ms: 900 });
  }
  for (let i = 0; i < 4; i += 1) {
    frames.push({ lines: padFrame(i === 0 ? "0" : null, FLAMES[i % 3], t("  ZÜNDUNG!", "red")), ms: 180 });
  }

  // Lift-off: the rocket climbs, the trail grows and it speeds up.
  for (let step = 1; step <= rocketTop + ROCKET.length + 4; step += 1) {
    const rows: Line[] = Array.from({ length: sky }, () => "");
    const top = rocketTop - step;
    ROCKET.forEach((row, i) => {
      const y = top + i;
      if (y >= 0 && y < sky) rows[y] = t(row, "white");
    });
    const flame = FLAMES[step % 3];
    flame.forEach((row, i) => {
      const y = top + ROCKET.length + i;
      if (y >= 0 && y < sky) rows[y] = t(row, "flame");
    });
    for (let y = top + ROCKET.length + flame.length; y < sky - 1; y += 1) {
      if (y >= 0) rows[y] = t(step % 2 === y % 2 ? "      :" : "      .", "dim");
    }
    rows[sky - 1] = t(SMOKE[step % 3], "dim");
    if (!rows[0]) rows[0] = t("  .        *            .      *", "dim");
    const height = Math.round(step ** 2.2 * 12);
    frames.push({ lines: [...rows, t(`  Höhe: ${height.toLocaleString("de-DE")} m`, "accent")], ms: Math.max(55, 200 - step * 14) });
  }

  const space: Line[] = [
    t("  .     *        .        *     .", "dim"),
    t("     *       .        *", "dim"),
    "",
    t("          .  *  🛰  *  .", "white"),
    "",
    t("   *    .       *       .     *", "dim"),
    "",
    t("  Orbit erreicht. Grüße ins All!", "accent"),
  ];
  frames.push({ lines: space, ms: 2400 });
  return frames;
}

/* ------------------------------------------------------------------------- */
/* Car driving through the terminal                                           */
/* ------------------------------------------------------------------------- */

const CAR = ["     ______", "  __/__||__\\___", " |  _       _  |", " '-(_)-----(_)-'"];

function carFrames(): Frame[] {
  const frames: Frame[] = [];
  const width = CAR[1].length;
  for (let x = -width; x <= COLS; x += 2) {
    const rows: Line[] = ["", "", t("   ~ Ausfahrt Richtung neues Projekt ~", "dim"), "", ""];
    CAR.forEach((row) => {
      const shifted = x >= 0 ? " ".repeat(x) + row : row.slice(-x);
      const dust = x > 3 ? " ".repeat(Math.max(0, x - 3)) + (x % 4 === 0 ? "≈" : "~") : "";
      rows.push(t(row === CAR[3] && dust ? dust + shifted.slice(dust.length) : shifted, "blue"));
    });
    const offset = ((x % 6) + 6) % 6;
    rows.push(t(("—  ".repeat(16)).slice(offset, offset + COLS), "dim"));
    frames.push({ lines: rows, ms: 70 });
  }
  frames.push({ lines: ["", "", "", t("   Angekommen. Parken ... fertig.", "accent")], ms: 1600 });
  return frames;
}

/* ------------------------------------------------------------------------- */
/* Project health check with spinner                                          */
/* ------------------------------------------------------------------------- */

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function checkFrames(names: string[]): Frame[] {
  const list = names.slice(0, 8);
  if (!list.length) return [{ lines: ["  (noch leer – das nächste Projekt kommt bald)"], ms: 2400 }];
  const frames: Frame[] = [];
  list.forEach((name, current) => {
    for (let spin = 0; spin < 6; spin += 1) {
      const rows: Line[] = list.slice(0, current).map((done) => t(`  ✓ ${pad(done, 22)} online`, "text"));
      rows.push(t(`  ${SPINNER[(current * 6 + spin) % SPINNER.length]} ${pad(name, 22)} prüfe ...`, "flame"));
      frames.push({ lines: rows, ms: 75 });
    }
  });
  const final: Line[] = list.map((name) => t(`  ✓ ${pad(name, 22)} online`, "text"));
  final.push("", t(`  ${names.length} Projekt${names.length === 1 ? "" : "e"} – alles läuft.`, "accent"));
  frames.push({ lines: final, ms: 2600 });
  return frames;
}

/* ------------------------------------------------------------------------- */
/* git push + Netlify deploy with animated progress bar                       */
/* ------------------------------------------------------------------------- */

function deployFrames(): Frame[] {
  const head: Line[] = [
    "Objekte werden gezählt: 42, fertig.",
    "Schreibe Objekte: 100% (42/42)",
    "To github.com:anonym239/Websites-Dashboard",
    t("   a1b2c3d..e4f5a6b  main -> main", "blue"),
    "",
  ];
  const frames: Frame[] = head.map((_, i) => ({ lines: head.slice(0, i + 1), ms: 160 }));
  const steps = ["Abhängigkeiten", "Bauen", "Bilder optimieren", "Hochladen"];
  for (let pct = 0; pct <= 100; pct += 4) {
    const filled = Math.round(pct / 5);
    const step = steps[Math.min(steps.length - 1, Math.floor(pct / 26))];
    frames.push({
      lines: [
        ...head,
        t(`  ${SPINNER[pct % SPINNER.length]} Netlify: ${step} ...`, "flame"),
        t(`  [${"█".repeat(filled)}${"░".repeat(20 - filled)}] ${String(pct).padStart(3)}%`, "accent"),
      ],
      ms: 60,
    });
  }
  frames.push({ lines: [...head, t("  ✓ Netlify: Deploy fertig", "text"), t(`  [${"█".repeat(20)}] 100%`, "accent"), "", t("  🚀 live!", "white")], ms: 2400 });
  return frames;
}

/* ------------------------------------------------------------------------- */
/* Matrix rain                                                                */
/* ------------------------------------------------------------------------- */

function matrixFrames(): Frame[] {
  const chars = "01ｱｲｳｴｵｶｷｸｹｺｻｼｽ<>/{}=+*#";
  const width = 34;
  const drops = Array.from({ length: width }, () => -Math.floor(Math.random() * ROWS * 1.5));
  const frames: Frame[] = [];
  for (let f = 0; f < 34; f += 1) {
    const rows = Array.from({ length: ROWS - 1 }, (_, y) =>
      Array.from({ length: width }, (_, x) => {
        const d = drops[x];
        return y <= d && y > d - 5 ? chars[Math.floor(Math.random() * chars.length)] : " ";
      }).join(""),
    );
    frames.push({ lines: rows.map((row) => t(row, "matrix")), ms: 85 });
    drops.forEach((_, x) => {
      drops[x] += 1;
      if (drops[x] - 5 > ROWS) drops[x] = -Math.floor(Math.random() * 6);
    });
  }
  frames.push({ lines: ["", "", "", t("   Wach auf, Alex ...", "matrix"), t("   Die Websites haben dich.", "matrix")], ms: 2200 });
  return frames;
}

/* ------------------------------------------------------------------------- */
/* Beating heart                                                              */
/* ------------------------------------------------------------------------- */

const HEART_BIG = ["  ****     ****", " ******   ******", " ***************", "  *************", "    *********", "      *****", "        *"];
const HEART_SMALL = ["", "   ***   ***", "  ***** *****", "   *********", "     *****", "       *", ""];

function heartFrames(): Frame[] {
  const frames: Frame[] = [];
  for (let beat = 0; beat < 4; beat += 1) {
    frames.push({ lines: HEART_BIG.map((row) => t(row, "red")), ms: 260 });
    frames.push({ lines: HEART_SMALL.map((row) => t(row, "red")), ms: 420 });
  }
  frames.push({ lines: [...HEART_BIG.map((row) => t(row, "red")), "", t("  Danke fürs Vorbeischauen!", "accent")], ms: 2400 });
  return frames;
}

/* ------------------------------------------------------------------------- */
/* Static scenes                                                              */
/* ------------------------------------------------------------------------- */

const COFFEE: Scene = {
  command: "kaffee --stark",
  output: ["      ( (", "       ) )", "    ........", "    |      |]", "    \\      /", "     `----'", t("  Kaffee bereit. Weiter coden!", "accent")],
};

const COW: Scene = {
  command: 'sag "Hallo!"',
  output: ["   ________", "  < Hallo! >", "   --------", "      \\   ^__^", "       \\  (oo)\\_______", "          (__)\\       )\\/\\", "              ||----w |", "              ||     ||"],
};

/* ------------------------------------------------------------------------- */
/* Component                                                                  */
/* ------------------------------------------------------------------------- */

const TYPE_DELAY = 70;
const OUTPUT_DELAY = 90;
const HOLD_DELAY = 2600;
const PROMPT_USER = "alex@websites";

function Prompt() {
  return (
    <>
      <span className="text-primary">{PROMPT_USER}</span>
      <span className="text-white/40">:</span>
      <span className="text-[#7aa2f7]">~</span>
      <span className="text-white/40">$ </span>
    </>
  );
}

/** Decorative terminal that types commands and plays little ASCII animations. */
export function HeroTerminal({ projectNames }: { projectNames: string[] }) {
  const scenes = useMemo<Scene[]>(
    () => [
      { command: "./rakete --countdown 3", frames: rocketFrames() },
      { command: "check ~/projekte", frames: checkFrames(projectNames) },
      COFFEE,
      { command: "fahr --los", frames: carFrames() },
      { command: "git push && netlify deploy", frames: deployFrames() },
      COW,
      { command: "cmatrix", frames: matrixFrames() },
      { command: "./herz", frames: heartFrames() },
    ],
    [projectNames],
  );

  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [step, setStep] = useState(0); // output lines shown, or current frame
  const scene = scenes[sceneIndex % scenes.length];
  const steps = scene.frames ? scene.frames.length : scene.output?.length ?? 0;

  useEffect(() => {
    const next = () => {
      setTyped(0);
      setStep(0);
      setSceneIndex((index) => index + 1);
    };
    if (reducedMotion) {
      setTyped(scene.command.length);
      setStep(steps);
      const timer = setTimeout(next, HOLD_DELAY * 2);
      return () => clearTimeout(timer);
    }
    let timer: ReturnType<typeof setTimeout>;
    if (typed < scene.command.length) {
      timer = setTimeout(() => setTyped((count) => count + 1), TYPE_DELAY + Math.random() * 60);
    } else if (step < steps) {
      const delay = step === 0 ? 350 : scene.frames ? scene.frames[step - 1].ms : OUTPUT_DELAY;
      timer = setTimeout(() => setStep((count) => count + 1), delay);
    } else {
      // Frame scenes hold on their last frame for its own duration.
      timer = setTimeout(next, scene.frames ? scene.frames[steps - 1].ms : HOLD_DELAY);
    }
    return () => clearTimeout(timer);
  }, [typed, step, steps, scene, reducedMotion]);

  const typing = typed < scene.command.length;
  const done = !typing && step >= steps;
  const visible: Line[] = scene.frames ? (step > 0 ? scene.frames[Math.min(step, steps) - 1].lines : []) : (scene.output ?? []).slice(0, step);
  const logo = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}logo.svg`;

  return (
    <div className="hero-terminal w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-[hsl(222_30%_8%)] shadow-[0_24px_60px_hsl(220_40%_4%/.45)] lg:min-w-0 lg:max-w-[640px] lg:flex-1" aria-hidden="true" data-testid="hero-terminal">
      <div className="flex items-center gap-3 border-b border-white/5 bg-white/[.03] px-5 py-3">
        <img src={logo} alt="" className="h-6 w-6 rounded-md" />
        <span className="text-sm font-extrabold tracking-[-.02em] text-[#e8edf5]">Alex Websites</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-white/35">
          <span className="terminal-live-dot" />
          terminal
        </span>
      </div>
      <div className="h-[320px] overflow-hidden px-5 py-4 font-mono text-[13px] leading-[1.5] text-[#d6dde8] sm:h-[380px] sm:text-[15px]">
        <div className="whitespace-pre">
          <Prompt />
          {scene.command.slice(0, typed)}
          {typing && <span className="terminal-caret" />}
        </div>
        {visible.map((line, index) => (
          <div key={index} className={`whitespace-pre ${TONE_CLASS[lineTone(line)]}`}>{lineText(line) || " "}</div>
        ))}
        {done && !scene.frames && (
          <div className="whitespace-pre">
            <Prompt />
            <span className="terminal-caret" />
          </div>
        )}
      </div>
    </div>
  );
}
