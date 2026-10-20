"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
type Choices = {
  version: 1;
  analytics: boolean;
  maps: boolean;
  motion: boolean;
  at: string;
};
type Preferences = {
  choices: Choices | null;
  save: (a: boolean, m: boolean, motion?: boolean) => void;
  open: () => void;
  motionOff: boolean;
};
const Context = createContext<Preferences | null>(null);
const KEY = "mb-preferences-v1";
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [choices, setChoices] = useState<Choices | null>(null),
    [visible, setVisible] = useState(false),
    [manage, setManage] = useState(false),
    [analytics, setAnalytics] = useState(false),
    [maps, setMaps] = useState(false),
    [motion, setMotion] = useState(true),
    [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    // Initialise browser-only preferences after the matching server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSystemReduced(media.matches);
    const listener = () => setSystemReduced(media.matches);
    media.addEventListener("change", listener);
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || "null");
      if (
        c?.version === 1 &&
        typeof c.analytics === "boolean" &&
        typeof c.maps === "boolean" &&
        Date.now() - Date.parse(c.at) < 180 * 86400000
      ) {
        setChoices(c);
        setAnalytics(c.analytics);
        setMaps(c.maps);
        setMotion(c.motion !== false);
      } else setVisible(true);
    } catch {
      setVisible(true);
    }
    return () => media.removeEventListener("change", listener);
  }, []);
  function save(a: boolean, m: boolean, mo = true) {
    const c: Choices = {
      version: 1,
      analytics: a,
      maps: m,
      motion: mo,
      at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch {}
    setChoices(c);
    setAnalytics(a);
    setMaps(m);
    setMotion(mo);
    setVisible(false);
    setManage(false);
    // A reload unloads the optional analytics SDK after withdrawal. Remove its first-party cookies too.
    if (choices?.analytics && !a) {
      document.cookie
        .split(";")
        .map((s) => s.trim().split("=")[0])
        .filter((n) => n.startsWith("_ga"))
        .forEach((n) => {
          document.cookie = `${n}=;Max-Age=0;path=/`;
          const parts = location.hostname.split(".");
          for (let i = 0; i < parts.length - 1; i++)
            document.cookie = `${n}=;Max-Age=0;path=/;domain=.${parts.slice(i).join(".")}`;
        });
      location.reload();
    }
  }
  const motionOff = systemReduced || choices?.motion === false;
  return (
    <Context.Provider
      value={{ choices, save, open: () => setVisible(true), motionOff }}
    >
      <div data-motion={motionOff ? "off" : "on"}>{children}</div>
      {visible && (
        <section className="cookie-banner" aria-label="Cookie choices">
          <div>
            <h2>Cookies</h2>
            <p>
              Necessary storage keeps your quote basket working. With
              permission, we use analytics and Google Maps.{" "}
              <Link href="/cookies">Read our cookie policy</Link>.
            </p>
            {manage && (
              <div className="cookie-options">
                <label>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />{" "}
                  Optional analytics
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={maps}
                    onChange={(e) => setMaps(e.target.checked)}
                  />{" "}
                  Google Maps
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={motion}
                    onChange={(e) => setMotion(e.target.checked)}
                  />{" "}
                  Product animations
                </label>
              </div>
            )}
          </div>
          <div className="cookie-actions">
            <button
              className="button button-small button-outline"
              onClick={() => save(false, false, motion)}
            >
              Reject optional
            </button>
            <button
              className="button button-small button-outline"
              onClick={() => save(true, true, motion)}
            >
              Accept optional
            </button>
            {manage ? (
              <button
                className="button button-small"
                onClick={() => save(analytics, maps, motion)}
              >
                Save choices
              </button>
            ) : (
              <button className="text-button" onClick={() => setManage(true)}>
                Manage choices
              </button>
            )}
          </div>
        </section>
      )}
    </Context.Provider>
  );
}
export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("Preferences provider missing");
  return value;
}
export function CookieSettings() {
  const { open } = usePreferences();
  return <button onClick={open}>Cookie preferences</button>;
}
// No Google request, event or consent ping is made until permission is granted.
export function Analytics() {
  const { choices } = usePreferences();
  const pathname = usePathname();
  const id = process.env.NEXT_PUBLIC_GA4_ID;
  useEffect(() => {
    if (!choices?.analytics || !id || !/^G-[A-Z0-9]+$/.test(id)) return;
    const w = window as typeof window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer ??= [];
    w.gtag ??= function () {
      // The gtag command queue expects the Arguments object, not an event array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    if (!document.getElementById("mb-analytics")) {
      const s = document.createElement("script");
      s.id = "mb-analytics";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(s);
      w.gtag("js", new Date());
      w.gtag("config", id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
    if (!pathname.startsWith("/admin"))
      w.gtag("event", "page_view", {
        page_path: pathname,
        page_location: location.origin + pathname,
        page_title: document.title,
      });
  }, [choices?.analytics, id, pathname]);
  return null;
}
