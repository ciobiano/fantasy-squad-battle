// Inline stroke icons (2px, round caps, currentColor), per the Design System.

interface IconProps {
  readonly size?: number;
  readonly className?: string;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ChevronDown({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className} {...stroke} strokeWidth={1.8}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function ChevronRight({ size = 14, className }: IconProps) {
  return (
    <svg width={size * 0.58} height={size} viewBox="0 0 8 14" aria-hidden="true" className={className} {...stroke} strokeWidth={1.8}>
      <path d="M1.5 1.5L6.5 7l-5 5.5" />
    </svg>
  );
}

/** A link that leaves the app. */
export function ExternalIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" {...stroke} strokeWidth={1.7}>
      <path d="M5.5 2.5h-3v9h9v-3M8 2h4v4M12 2 6.5 7.5" />
    </svg>
  );
}

/** Back to the previous screen. */
export function BackIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size * 0.61} height={size} viewBox="0 0 11 18" aria-hidden="true" {...stroke} strokeWidth={2.2}>
      <path d="M9 1.5 1.75 9 9 16.5" />
    </svg>
  );
}

export function UndoIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" {...stroke} strokeWidth={1.9}>
      <path d="M8 4.5 3.5 9 8 13.5M4 9h9.5a5 5 0 0 1 0 10H10" />
    </svg>
  );
}

export function RedoIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" {...stroke} strokeWidth={1.9}>
      <path d="M14 4.5 18.5 9 14 13.5M18 9H8.5a5 5 0 0 0 0 10H12" />
    </svg>
  );
}

/** "Out → in": a transfer. */
export function ArrowRight({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 16 12" aria-hidden="true" className={className} {...stroke} strokeWidth={1.8}>
      <path d="M1 6h13M9.5 1.5 14 6l-4.5 4.5" />
    </svg>
  );
}

export function ThemeIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" />
    </svg>
  );
}

export function AlertIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" {...stroke} strokeWidth={1.6}>
      <circle cx="9" cy="9" r="7.5" />
      <path d="M9 5v5" strokeWidth={1.8} />
      <circle cx="9" cy="12.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function OfflineIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" {...stroke} strokeWidth={1.8}>
      <path d="M3 8.5a12 12 0 0 1 16 0M6 12a7.5 7.5 0 0 1 10 0M9 15.5a3 3 0 0 1 4 0" />
      <path d="M3 3l16 16" stroke="var(--down)" />
    </svg>
  );
}

export const TAB_ICONS = {
  league: "M3 22h20M5.5 22v-6h5v6M10.5 22V9h5v13M15.5 22v-9h5v9",
  fixtures: "M5.5 5h15a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3.5 10.5h19M8.5 3v4M17.5 3v4M8 15h2M12 15h2M16 15h2M8 18.5h2M12 18.5h2",
  players: "M13 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5zM4.5 22.5c.6-4.6 4.1-7.5 8.5-7.5s7.9 2.9 8.5 7.5",
  /** A clipboard with a tick: the plan. */
  planner: "M9 4.5H7.5a2 2 0 0 0-2 2V21a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2H17M9.5 3h7v3.5h-7zM9 14.5l2.75 2.75L17 12",
} as const;

/** Story viewer icons, as drawn on the canvas (S-Story). */
export function CloseIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" {...stroke}>
      <path d="M5 5l12 12M17 5L5 17" />
    </svg>
  );
}

export function ShareIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={1.9}>
      <path d="M10 13V3M6 7l4-4 4 4" />
      <path d="M4 11v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function PauseIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={2.2}>
      <path d="M7 4v12M13 4v12" />
    </svg>
  );
}

export function PlayIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 4.5v11l9-5.5z" fill="currentColor" />
    </svg>
  );
}

/**
 * Brand marks for the share sheet, drawn from Simple Icons 16.33.0 (CC0 path data).
 * Each brand's rules: WhatsApp's glyph keeps its own green (Meta: never change a
 * logo's colours, never make it the most prominent thing); X's mark is black or
 * white only (here white, on the dark sheet). Neither is altered or combined.
 */
const WHATSAPP_GREEN = "#25D366";

export function WhatsAppMark({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={WHATSAPP_GREEN}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </svg>
  );
}

export function XMark({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"
      />
    </svg>
  );
}

export function DownloadIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={1.9}>
      <path d="M10 3v10M6 9l4 4 4-4" />
      <path d="M4 15v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
    </svg>
  );
}

export function TabIcon({ name }: { name: keyof typeof TAB_ICONS }) {
  return (
    <svg width={26} height={26} viewBox="0 0 26 26" aria-hidden="true" {...stroke}>
      <path d={TAB_ICONS[name]} />
    </svg>
  );
}
