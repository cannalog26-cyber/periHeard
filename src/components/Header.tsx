import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { label: "Symptom Checker", to: "/" },
  { label: "Talk to Peri", to: "/", scrollTo: "brief-builder" },
  { label: "Community Forum", to: "/community" },
  { label: "Resources", to: "/resources" },
];

export function Header({ actions }: { actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4 whitespace-nowrap">
        <Link to="/" className="flex items-center shrink-0">
          <Logo />
          <h1 className="sr-only">PeriHeard</h1>
        </Link>
        <nav className="hidden lg:flex items-center gap-5 ml-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to as "/" | "/community" | "/resources"}
              className="text-sm font-medium text-foreground hover:text-secondary transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {actions}
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-transparent border-[1.5px] border-cta text-cta text-xs font-bold whitespace-nowrap hover:bg-cta hover:text-white transition-colors"
          >
            Sign Up
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-4 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to as "/" | "/community" | "/resources"}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
