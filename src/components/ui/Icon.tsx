/**
 * Íconos de trazo fino y extremos redondeados, en la línea de SF Symbols.
 * Inline SVG (sin dependencias) y usables desde componentes de servidor o cliente.
 */
const PATHS = {
  home: "M3.5 10.5 12 3.75l8.5 6.75M5.75 9v10.25h4.5v-5.5h3.5v5.5h4.5V9",
  checklist:
    "M9 6.5h10.5M9 12h10.5M9 17.5h10.5M4 6.25l1.25 1.25 2-2.5M4 11.75 5.25 13l2-2.5M4 17.25l1.25 1.25 2-2.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.25c.9-3.4 3.9-5.25 7.5-5.25s6.6 1.85 7.5 5.25",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.75 19.5c.75-3 3.2-4.75 6.25-4.75s5.5 1.75 6.25 4.75M16 4.25a3.5 3.5 0 0 1 0 6.5M17.75 14.9c1.8.6 3.1 2.1 3.5 4.6",
  book: "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z",
  bell: "M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5l1.5-2ZM10 20.5a2 2 0 0 0 4 0",
  chart: "M4 20h16M7 16.5V11M12 16.5V6.5M17 16.5v-3.5",
  building:
    "M4.5 20.5V5.25L12 3l7.5 2.25V20.5M3 20.5h18M8.5 8.5h1M14.5 8.5h1M8.5 12h1M14.5 12h1M10.5 20.5v-4h3v4",
  shield: "M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3ZM9 12l2 2 4-4",
  folder: "M3.5 7.5A1.5 1.5 0 0 1 5 6h4.25l2 2.25H19a1.5 1.5 0 0 1 1.5 1.5v8.75A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-11Z",
  logout: "M14.5 4.5h3.75a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14.5M10 16.5 5.5 12 10 7.5M5.75 12H15",
  "chevron-right": "m9.5 5.5 6.5 6.5-6.5 6.5",
  "chevron-left": "M14.5 5.5 8 12l6.5 6.5",
  more: "M5.5 12h.01M12 12h.01M18.5 12h.01",
  check: "m5 12.5 4.5 4.5L19 7.5",
  x: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  phone:
    "M5.25 3.75h3l1.5 4.5-2 1.25a11 11 0 0 0 6.75 6.75l1.25-2 4.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5C10.5 20.25 3.75 13.5 3.75 5.25a1.5 1.5 0 0 1 1.5-1.5Z",
  alert: "M12 4 2.75 19.5h18.5L12 4ZM12 10v4.25M12 17h.01",
  calendar: "M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-12ZM4.5 9.5h15M8.5 3v4M15.5 3v4",
  download: "M12 3.75v11.5M7.5 11l4.5 4.5 4.5-4.5M4.5 19.5h15",
  plus: "M12 5v14M5 12h14",
  pencil: "M14.5 5.5l4 4M4.5 19.5l1-4.5L15.75 4.75a1.77 1.77 0 0 1 2.5 0l1 1a1.77 1.77 0 0 1 0 2.5L9 18.5l-4.5 1Z",
  trash:
    "M4.5 6.5h15M9.5 6.5V4.75h5V6.5M6.5 6.5l.9 12.6a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.6M10 10.5v6M14 10.5v6",
  search: "M10.75 18a7.25 7.25 0 1 0 0-14.5 7.25 7.25 0 0 0 0 14.5ZM16 16l4.5 4.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 3 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
