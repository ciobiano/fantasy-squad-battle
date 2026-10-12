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
} as const;

export function TabIcon({ name }: { name: keyof typeof TAB_ICONS }) {
  return (
    <svg width={26} height={26} viewBox="0 0 26 26" aria-hidden="true" {...stroke}>
      <path d={TAB_ICONS[name]} />
    </svg>
  );
}
