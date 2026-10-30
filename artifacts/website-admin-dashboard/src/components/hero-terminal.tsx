import { useEffect, useMemo, useState } from "react";

type Scene = { command: string; output: string[] };

const BASE_SCENES: Scene[] = [
  {
    command: "./rakete --start",
    output: [
      "        /\\",
      "       /  \\",
      "      | () |",
      "      |    |",
      "     /| /\\ |\\",
      "    /_|/  \\|_\\",
      "       *  *",
      "      * ** *   Abheben in 3.. 2.. 1..",
    ],
  },
  {
    command: "kaffee --stark",
    output: [
      "      ( (",
      "       ) )",
      "    ........",
      "    |      |]",
      "    \\      /",
      "     `----'",
      "  Kaffee bereit. Weiter coden!",
    ],
  },
  {
    command: 'sag "Hallo!"',
    output: [
      "   ________",
      "  < Hallo! >",
      "   --------",
      "      \\   ^__^",
      "       \\  (oo)\\_______",
      "          (__)\\       )\\/\\",
      "              ||----w |",
      "              ||     ||",
    ],
  },
  {
    command: "cat katze.txt",
    output: [
      "    /\\_/\\",
      "   ( o.o )",
      "    > ^ <",
      "   /     \\",
      "  (|     |)",
      "   \"\" \"\"",
      "  miau. alles läuft.",
    ],
  },
  {
    command: "git push origin main",
    output: [
      "Objekte werden gezählt: 42, fertig.",
      "Schreibe Objekte: 100% (42/42)",
      "To github.com:anonym239/Websites-Dashboard",
      "   a1b2c3d..e4f5a6b  main -> main",
      "",
      "  [####################] 100%",
      "  Netlify baut neu ... live!",
    ],
  },
  {
    command: "./herz",
    output: [
      "   ****     ****",
      "  ******   ******",
      "  ***************",
      "   *************",
      "     *********",
      "       *****",
      "         *",
      "  Danke fürs Vorbeischauen!",
    ],
  },
];

const TYPE_DELAY = 70;
const OUTPUT_DELAY = 90;
const HOLD_DELAY = 2600;

/** Decorative terminal that types alternating commands and prints ASCII pictures. */
export function HeroTerminal({ projectNames }: { projectNames: string[] }) {
  const scenes = useMemo<Scene[]>(() => {
    const names = projectNames.slice(0, 6);
    const listing: Scene = {
      command: "ls ~/projekte",
      output: names.length
        ? [...names.map((name) => `drwxr-xr-x  alex  ${name}/`), "", `  ${projectNames.length} Projekt${projectNames.length === 1 ? "" : "e"} gefunden.`]
        : ["  (noch leer – das nächste Projekt kommt bald)"],
    };
    return [BASE_SCENES[0], listing, ...BASE_SCENES.slice(1)];
  }, [projectNames]);

  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);
  const scene = scenes[sceneIndex % scenes.length];

  useEffect(() => {
    if (reducedMotion) {
      setTyped(scene.command.length);
      setLines(scene.output.length);
      const timer = setTimeout(() => { setSceneIndex((index) => index + 1); }, HOLD_DELAY * 2);
      return () => clearTimeout(timer);
    }
    let timer: ReturnType<typeof setTimeout>;
    if (typed < scene.command.length) {
      timer = setTimeout(() => setTyped((count) => count + 1), TYPE_DELAY + Math.random() * 60);
    } else if (lines < scene.output.length) {
      timer = setTimeout(() => setLines((count) => count + 1), lines === 0 ? 350 : OUTPUT_DELAY);
    } else {
      timer = setTimeout(() => {
        setTyped(0);
        setLines(0);
        setSceneIndex((index) => index + 1);
      }, HOLD_DELAY);
    }
    return () => clearTimeout(timer);
  }, [typed, lines, scene, reducedMotion]);

  const typing = typed < scene.command.length;

  return (
    <div className="hero-terminal w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-[hsl(222_30%_8%)] shadow-[0_24px_60px_hsl(220_40%_4%/.45)] lg:w-[420px]" aria-hidden="true" data-testid="hero-terminal">
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/[.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[10px] text-white/40">alex@webspace: ~</span>
      </div>
      <div className="h-[270px] overflow-hidden px-4 py-3 font-mono text-[12px] leading-[1.45] text-[#d6dde8]">
        <div className="whitespace-pre">
          <span className="text-primary">alex@webspace</span>
          <span className="text-white/40">:</span>
          <span className="text-[#7aa2f7]">~</span>
          <span className="text-white/40">$ </span>
          {scene.command.slice(0, typed)}
          {typing && <span className="terminal-caret" />}
        </div>
        {scene.output.slice(0, lines).map((line, index) => (
          <div key={index} className="whitespace-pre text-[#a6e3c4]">{line || " "}</div>
        ))}
        {!typing && lines >= scene.output.length && (
          <div className="whitespace-pre">
            <span className="text-primary">alex@webspace</span>
            <span className="text-white/40">:</span>
            <span className="text-[#7aa2f7]">~</span>
            <span className="text-white/40">$ </span>
            <span className="terminal-caret" />
          </div>
        )}
      </div>
    </div>
  );
}
