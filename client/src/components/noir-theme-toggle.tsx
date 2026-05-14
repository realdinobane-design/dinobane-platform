import { useEffect, useState } from "react";
import { useAuth } from "@/App";

/* =========================================================
   NOIR THEME TOGGLE
   ---------------------------------------------------------
   A small floating chip available to members only. Toggles
   a body class `theme-noir` that is consumed by index.css to
   re-skin the whole site to the noir minimalist palette.

   Persistence: localStorage only. No DB writes, no auth
   touch. Survives reloads and follows the user across
   pages on the same device.

   Visibility rule: rendered globally in App.tsx, but only
   actually paints if the signed-in user is a paid member.
   ========================================================= */

const STORAGE_KEY = "dinobane.theme.noir";

export function getNoirEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function applyNoir(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("theme-noir", enabled);
}

export function NoirThemeToggle() {
  const { user } = useAuth();
  const [on, setOn] = useState<boolean>(() => getNoirEnabled());

  // Apply the class on mount + whenever toggled.
  useEffect(() => {
    applyNoir(on);
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* storage may be unavailable — ignore */
    }
  }, [on]);

  // If the user becomes a non-member (logout, expiry), force-off.
  useEffect(() => {
    if (!user || !user.isMember) {
      if (on) setOn(false);
    }
  }, [user, on]);

  if (!user || !user.isMember) return null;

  return (
    <>
      <style>{CSS}</style>
      <button
        type="button"
        className={`ntt-chip${on ? " ntt-chip-on" : ""}`}
        aria-pressed={on}
        aria-label={on ? "Switch to default theme" : "Switch to noir theme"}
        onClick={() => setOn((v) => !v)}
        title={on ? "Noir theme — click to switch off" : "Switch to noir theme"}
      >
        <span className="ntt-track" aria-hidden>
          <span className="ntt-thumb" />
        </span>
        <span className="ntt-label">Noir</span>
      </button>
    </>
  );
}

const CSS = `
.ntt-chip{
  position:fixed; left:18px; bottom:18px; z-index:90;
  display:inline-flex; align-items:center; gap:10px;
  padding:8px 14px 8px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size:11px; letter-spacing:.24em; text-transform:uppercase;
  background:rgba(0,0,0,.72); color:#f5f5f5;
  border:1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  cursor:pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease, transform .15s ease;
}
.ntt-chip:hover{
  border-color:#e10b0b; color:#fff;
}
.ntt-chip:active{ transform:translateY(1px) }

.ntt-track{
  width:30px; height:16px; border-radius:999px;
  background:rgba(255,255,255,.18); position:relative;
  transition: background .2s ease;
}
.ntt-thumb{
  position:absolute; top:2px; left:2px;
  width:12px; height:12px; border-radius:50%;
  background:#f5f5f5;
  transition: transform .25s cubic-bezier(.4,.2,.2,1), background .2s ease;
}
.ntt-chip-on{
  background:#ffffff; color:#0a0a0a;
  border-color:rgba(10,10,10,.16);
}
.ntt-chip-on:hover{ border-color:#e10b0b; color:#0a0a0a }
.ntt-chip-on .ntt-track{ background:#0a0a0a }
.ntt-chip-on .ntt-thumb{ transform:translateX(14px); background:#ffffff }

@media (max-width: 640px){
  .ntt-chip{ left:12px; bottom:12px; padding:6px 12px 6px 6px; font-size:10px }
  .ntt-track{ width:26px; height:14px }
  .ntt-thumb{ width:10px; height:10px }
  .ntt-chip-on .ntt-thumb{ transform:translateX(12px) }
}
`;
