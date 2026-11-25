import { Fragment, type CSSProperties, type ElementType, type ReactNode } from "react";

// Server-safe reveal primitives. <RevealObserver> sets data-shown when they enter the viewport;
// the motion itself is CSS (globals.css "Motion"), so nothing here ships JavaScript.

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** Clip-mask word reveal: each word slides up from behind its own mask, staggered. */
export function Words({ text, as: Tag = "span", stagger = 110, delay = 0, className }: {
  text: string; as?: ElementType; stagger?: number; delay?: number; className?: string;
}) {
  return (
    <Tag className={className} data-reveal="mask" aria-label={text}>
      {text.split(" ").map((w, i) => (
        // A real space between word masks so copied/indexed text reads "Built to run", not "Builttorun".
        <Fragment key={i}>{i > 0 && " "}
        <span className="mask" aria-hidden="true">
          <span style={v({ "--d": `${delay + i * stagger}ms` })}>{w}</span>
        </span>
        </Fragment>
      ))}
    </Tag>
  );
}

/** Nixtio page titles: each letter rises from behind its word's mask, staggered. */
export function Letters({ text, as: Tag = "span", stagger = 38, delay = 0, className, id }: {
  text: string; as?: ElementType; stagger?: number; delay?: number; className?: string; id?: string;
}) {
  let n = 0;
  return (
    <Tag id={id} className={className} data-reveal="mask" aria-label={text}>
      {text.split(" ").map((w, i) => (
        // A real space between word masks so copied/indexed text reads "Built to run", not "Builttorun".
        <Fragment key={i}>{i > 0 && " "}
        <span className="mask" aria-hidden="true">
          {[...w].map((ch, j) => (
            <span key={j} style={v({ "--d": `${delay + n++ * stagger}ms` })}>{ch}</span>
          ))}
        </span>
        </Fragment>
      ))}
    </Tag>
  );
}

/** Words darken from gray to ink as the block scrolls through the viewport (CSS scroll timeline). */
export function Fill({ text, muted, as: Tag = "p", className, id }: {
  text: string; muted?: string; as?: ElementType; className?: string; id?: string;
}) {
  const words = text.split(" ");
  const rest = muted ? muted.split(" ") : [];
  const total = words.length + rest.length;
  return (
    <Tag id={id} className={`fill ${className ?? ""}`}>
      {words.map((w, i) => (
        <span key={i} style={v({ "--p": i / total })}>{w} </span>
      ))}
      {rest.map((w, i) => (
        <span key={`m${i}`} className="fill-muted" style={v({ "--p": (words.length + i) / total })}>{w} </span>
      ))}
    </Tag>
  );
}

/** Stacked lines that slide up one after another. */
export function Lines({ lines, as: Tag = "span", stagger = 120, delay = 0, className, id }: {
  lines: string[]; as?: ElementType; stagger?: number; delay?: number; className?: string; id?: string;
}) {
  return (
    <Tag id={id} className={className} data-reveal="mask" aria-label={lines.join(" ")}>
      {lines.map((l, i) => (
        <span key={i} className="mask mask-line" aria-hidden="true">
          <span style={v({ "--d": `${delay + i * stagger}ms` })}>{l}</span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade-and-rise the first time the element enters the viewport. */
export function Rise({ children, delay = 0, as: Tag = "div", className, ...rest }: {
  children: ReactNode; delay?: number; as?: ElementType; className?: string; [k: string]: unknown;
}) {
  return (
    <Tag className={className} data-reveal="rise" style={v({ "--d": `${delay}ms` })} {...rest}>
      {children}
    </Tag>
  );
}
