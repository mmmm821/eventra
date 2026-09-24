import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24">
      <div className="container py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <span className="text-lg font-display font-bold text-gradient">EVENTRA</span>
          <p className="mt-3 text-sm text-white/50 max-w-xs">
            Discover and book tickets for college fests, hackathons, concerts, and everything in between.
          </p>
        </div>
        <FooterCol title="Discover" links={[
          { href: "/events", label: "All events" },
          { href: "/events?audience=COLLEGE", label: "College events" },
          { href: "/events?sort=trending", label: "Trending" },
        ]} />
        <FooterCol title="Organizers" links={[
          { href: "/organizer", label: "Host an event" },
          { href: "/organizer/events", label: "Manage events" },
          { href: "/scanner", label: "Scan tickets" },
        ]} />
        <FooterCol title="Company" links={[
          { href: "/", label: "About" },
          { href: "/", label: "Contact" },
          { href: "/", label: "Terms" },
        ]} />
      </div>
      <div className="container py-6 border-t border-white/[0.06] text-xs text-white/35">
        © {new Date().getFullYear()} EVENTRA. Built for demo purposes — payments run in Razorpay test mode.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-white/80 mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-white/50 hover:text-white/80 transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
