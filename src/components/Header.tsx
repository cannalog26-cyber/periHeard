import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logoAsset from "@/assets/periHeard-logo.png.asset.json";

const navItems = [
  { label: "Symptom Checker", to: "/" },
  { label: "Talk to Peri", to: "/" },
  { label: "Community Forum", to: "/community" },
  { label: "Resources", to: "/resources" },
];

export function Header({ actions }: { actions?: ReactNode }) {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logoAsset.url} alt="PeriHeard" className="h-9 w-auto" />
            <h1 className="sr-only">PeriHeard</h1>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to as "/" | "/community" | "/resources"}
                className="text-sm font-medium text-foreground hover:text-secondary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
