export const TIER_CONFIG = {
  Normal: { next: 5000000, color: "text-slate-400", bg: "bg-slate-100", icon: "fa-shield-halved", label: "Bronze" },
  Bronze: { next: 10000000, color: "text-orange-500", bg: "bg-orange-100", icon: "fa-medal", label: "Silver" },
  Silver: { next: 15000000, color: "text-zinc-400", bg: "bg-zinc-100", icon: "fa-award", label: "Gold" },
  Gold: { next: 20000000, color: "text-yellow-500", bg: "bg-yellow-100", icon: "fa-crown", label: "Diamond" },
  Diamond: { next: null, color: "text-cyan-500", bg: "bg-cyan-100", icon: "fa-gem", label: "Maximum" },
};
