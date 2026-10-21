import type { ReactNode } from "react";

type IconName = "search" | "bag" | "arrow" | "pin" | "sparkle" | "menu" | "close" | "phone" | "mail" | "chevron" | "moon" | "sun" | "home" | "box" | "store" | "user" | "whatsapp" | "pause" | "play";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bag: <><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    sparkle: <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    phone: <><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M11 17h2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    chevron: <><path d="m6 9 6 6 6-6" /></>,
    moon: <><path d="M20.7 15.2A8.5 8.5 0 0 1 8.8 3.3 8.6 8.6 0 1 0 20.7 15.2Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    box: <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" /><path d="m3.5 7.8 8.5 4.4 8.5-4.4M12 12.2V21M7.5 5.2l9 4.6" /></>,
    store: <><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6" /><path d="M3 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /><path d="M9 20v-6h6v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    whatsapp: <><path d="M20.1 11.6a8.1 8.1 0 0 1-11.9 7.1L4 20l1.2-4A8.1 8.1 0 1 1 20.1 11.6Z" /><path d="M8.6 8.3c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.3l.7 1.5c.1.2.1.4-.1.5l-.5.6c-.1.2-.2.3-.1.5.3.7.9 1.2 1.6 1.6.2.1.3.1.5-.1l.6-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.3.3.3.5v.4c0 .3-.1.5-.4.7-.3.3-.8.4-1.4.3-.9-.1-2-.6-3.1-1.7-1.1-1.1-1.6-2.2-1.7-3.1-.1-.5.1-1.1.4-1.4Z" /></>,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    play: <><path d="m8 5 12 7-12 7V5Z" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
