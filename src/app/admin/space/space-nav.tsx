import Link from "next/link";
import { BarChart3, Bug, FileText, Flag, LayoutDashboard, ScrollText, Users, Wallet } from "lucide-react";

// Side list of Piron Work Space. A section without a page yet shows the step that builds it.
const ITEMS = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard, href: "/admin/space", step: 1 },
  { key: "people", label: "People", Icon: Users, href: null, step: 2 },
  { key: "marketplace", label: "Marketplace", Icon: BarChart3, href: null, step: 3 },
  { key: "errors", label: "Errors", Icon: Bug, href: null, step: 4 },
  { key: "features", label: "Features", Icon: Flag, href: null, step: 5 },
  { key: "money", label: "Money", Icon: Wallet, href: null, step: 6 },
  { key: "reports", label: "Reports", Icon: FileText, href: null, step: 7 },
  { key: "audit", label: "Audit log", Icon: ScrollText, href: null, step: 7 },
];

export function SpaceNav({ active }: { active: string }) {
  return (
    <nav aria-label="Space sections" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map(({ key, label, Icon, href, step }) => {
        const on = key === active;
        const cls = `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${on ? "bg-brand-100 text-brand-900" : href ? "hover:bg-brand-50" : "text-ink-muted"}`;
        const inner = (
          <>
            <Icon className="size-4" />
            {label}
            {!href && <span className="ml-auto rounded-full bg-stone-100 px-1.5 text-[10px] font-semibold text-ink-muted">Step {step}</span>}
          </>
        );
        return href ? (
          <Link key={key} href={href} aria-current={on ? "page" : undefined} className={cls}>{inner}</Link>
        ) : (
          <span key={key} className={cls}>{inner}</span>
        );
      })}
    </nav>
  );
}
