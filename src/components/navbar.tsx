"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, Search, Ticket, X, LayoutDashboard, CalendarPlus, ScanLine, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/events", label: "Explore" },
  { href: "/events?audience=COLLEGE", label: "College Events" },
  { href: "/organizer", label: "Host an Event" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const role = (session?.user as any)?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0B14]/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-display font-bold tracking-tight text-gradient">EVENTRA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href ? "text-white bg-white/[0.07]" : "text-white/65 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/events")}
            aria-label="Search events"
            className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full border border-white/10 bg-white/[0.04] text-white/50 text-sm hover:text-white/80 hover:border-white/20 transition-colors w-56"
          >
            <Search className="h-4 w-4" />
            Search events...
          </button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus-ring rounded-full">
                  <Avatar>
                    <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "Account"} />
                    <AvatarFallback>{session.user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                  <p className="text-xs text-white/50 truncate">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tickets"><Ticket className="mr-2 h-4 w-4" /> My Tickets</Link>
                </DropdownMenuItem>
                {(role === "ORGANIZER" || role === "ADMIN") && (
                  <DropdownMenuItem asChild>
                    <Link href="/organizer"><CalendarPlus className="mr-2 h-4 w-4" /> Organizer Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {(role === "EVENT_STAFF" || role === "ORGANIZER" || role === "ADMIN") && (
                  <DropdownMenuItem asChild>
                    <Link href="/scanner"><ScanLine className="mr-2 h-4 w-4" /> QR Scanner</Link>
                  </DropdownMenuItem>
                )}
                {role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-400">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}

          <button className="md:hidden p-2 text-white/70" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/[0.06] px-5 py-4 space-y-1 animate-in">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/75 hover:bg-white/[0.05]">
              {l.label}
            </Link>
          ))}
          {!session?.user && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
