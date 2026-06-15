/** A CSS object (camelCase keys) or a raw CSS declaration string. */
export type ConsoleStyle = Partial<CSSStyleDeclaration> | string;

/** A piece of styled console text. */
export type Segment = {
  readonly text: string;
  readonly css: string;
};

/** Minimal console surface needed to emit a styled line. */
export type LogConsole = Pick<Console, "log">;

/** A part of a styled line: either a styled Segment or a plain string. */
export type Part = Segment | string;

/** The assembled `%c` format string and its paired style strings. */
export type Assembled = {
  readonly format: string;
  readonly styles: string[];
};

function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function toCss(style?: ConsoleStyle): string {
  if (!style) {
    return "";
  }
  if (typeof style === "string") {
    return style;
  }
  return Object.entries(style)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${camelToKebab(key)}: ${String(value)}`)
    .join("; ");
}

function isSegment(part: Part): part is Segment {
  return typeof part === "object" && part !== null && "text" in part;
}

/** Build an arbitrary styled segment. */
export function segment(text: string, style?: ConsoleStyle): Segment {
  return { text, css: toCss(style) };
}

/** Build a styled label segment with sensible default badge styling. */
export function badge(label: string, style?: ConsoleStyle): Segment {
  const base = "padding: 2px 6px; border-radius: 4px; font-weight: 600;";
  const extra = toCss(style);
  return { text: label, css: extra ? `${base} ${extra}` : base };
}

/** Assemble parts into a `%c` format string plus matching style strings. */
export function assemble(parts: Part[]): Assembled {
  let format = "";
  const styles: string[] = [];
  for (const part of parts) {
    if (isSegment(part)) {
      format += `%c${part.text}%c`;
      styles.push(part.css, "");
    } else {
      format += part;
    }
  }
  return { format, styles };
}

/**
 * Emit assembled `parts` as a single console.log call on `consoleTarget`, with
 * any `rest` arguments appended raw (so objects keep their interactive inspect).
 * No-op when the target has no `log`.
 */
export function emit(
  consoleTarget: LogConsole | undefined,
  parts: Part[],
  ...rest: unknown[]
): void {
  if (!consoleTarget?.log) {
    return;
  }
  const { format, styles } = assemble(parts);
  consoleTarget.log(format, ...styles, ...rest);
}

/** Convenience: emit styled parts to the global console. */
export function log(...parts: Part[]): void {
  emit(globalThis.console, parts);
}
