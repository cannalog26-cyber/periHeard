import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 126 28"
      className={cn("block h-9 w-auto", className)}
      aria-label="PeriHeard"
      role="img"
    >
      <text
        x="0"
        y="20"
        fontFamily="Fraunces, ui-serif, Georgia, serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="22"
        letterSpacing="-0.03em"
        fill="currentColor"
        className="text-cta"
      >
        periHeard
      </text>
      {/* Berry dot over the ascender of the final "d" */}
      <circle
        cx="113.5"
        cy="5"
        r="3.5"
        className="fill-current text-accent"
      />
    </svg>
  );
}
