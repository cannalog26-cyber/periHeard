import { cn } from "@/lib/utils";
import logoAsset from "@/assets/periHeard-logo.png.asset.json";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="PeriHeard"
      className={cn("block h-9 w-auto", className)}
    />
  );
}

