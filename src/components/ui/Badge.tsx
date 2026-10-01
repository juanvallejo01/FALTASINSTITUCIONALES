import { TONE_BADGE, type Tone } from "@/lib/labels";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`badge ${TONE_BADGE[tone]}`}>{children}</span>;
}
