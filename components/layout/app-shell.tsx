"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, Building2, ChevronDown, LayoutDashboard, LogOut, MessageCircle, PanelLeft } from "lucide-react";
import { AnimatedSidebar, AnimatedSidebarContent, AnimatedSidebarFooter, AnimatedSidebarGroup, AnimatedSidebarGroupContent, AnimatedSidebarGroupLabel, AnimatedSidebarHeader, AnimatedSidebarInset, AnimatedSidebarMenu, AnimatedSidebarMenuButton, AnimatedSidebarMenuItem, AnimatedSidebarProvider, AnimatedSidebarTrigger, useAnimatedSidebar } from "@/components/motion/animated-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/types";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "psp"] },
  { label: "Deposits", href: "/deposits", icon: ArrowDownToLine, roles: ["admin", "psp"] },
  { label: "Withdrawals", href: "/withdrawals", icon: ArrowUpFromLine, roles: ["admin", "psp"] },
  { label: "PSP partners", href: "/clients", icon: Building2, roles: ["admin"] },
  { label: "Support chat", href: "/chat", icon: MessageCircle, roles: ["admin", "psp"] },
] as const;

function NavItems({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <AnimatedSidebarMenu>
      {navigation.filter((item) => (item.roles as readonly Role[]).includes(role)).map(({ label, href, icon: Icon }) => (
        <AnimatedSidebarMenuItem key={href}>
          <AnimatedSidebarMenuButton href={href} icon={<Icon className="size-4" />} isActive={pathname === href}>{label}</AnimatedSidebarMenuButton>
        </AnimatedSidebarMenuItem>
      ))}
    </AnimatedSidebarMenu>
  );
}

function Brand() {
  const { state, isMobile } = useAnimatedSidebar();
  const compact = state === "collapsed" && !isMobile;
  return (
    <Link href="/dashboard" aria-label="Vaspan operations" title={compact ? "Vaspan operations" : undefined} className={`flex min-w-0 items-center ${compact ? "justify-center" : "gap-3"}`}>
      <Image src="/vaspan-logo.svg" alt="" width={40} height={40} priority className="size-10 shrink-0 object-contain" />
      {!compact && <span className="min-w-0 text-base font-semibold tracking-tight">Vaspan<span className="text-primary">.</span><span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Payment operations</span></span>}
    </Link>
  );
}

export function AppShell({ children, role, userName }: { children: React.ReactNode; role: Role; userName: string }) {
  const pathname = usePathname();
  const current = navigation.find((item) => item.href === pathname)?.label ?? "Workspace";
  return (
    <AnimatedSidebarProvider defaultOpen>
      <AnimatedSidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <AnimatedSidebarHeader className="px-3 py-5">
          <Brand />
        </AnimatedSidebarHeader>
        <AnimatedSidebarContent>
          <AnimatedSidebarGroup><AnimatedSidebarGroupLabel>Workspace</AnimatedSidebarGroupLabel><AnimatedSidebarGroupContent><NavItems role={role} /></AnimatedSidebarGroupContent></AnimatedSidebarGroup>
          <div className="mx-3 mt-auto rounded-2xl border border-border bg-card p-3 group-data-[state=collapsed]/sidebar-wrapper:hidden"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Activity className="size-3.5 text-emerald-500" />All systems operational</div><p className="text-[11px] leading-4 text-muted-foreground">Transfers and settlement queues are processing normally.</p></div>
        </AnimatedSidebarContent>
        <AnimatedSidebarFooter><div className="flex items-center gap-2 px-1"><Avatar className="size-8"><AvatarFallback>{userName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar-wrapper:hidden"><p className="truncate text-xs font-medium">{userName}</p><p className="text-[10px] capitalize text-muted-foreground">{role} account</p></div><ChevronDown className="size-3 text-muted-foreground group-data-[state=collapsed]/sidebar-wrapper:hidden" /></div></AnimatedSidebarFooter>
      </AnimatedSidebar>
      <AnimatedSidebarInset>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3"><AnimatedSidebarTrigger className="border border-border bg-background shadow-xs hover:bg-accent" aria-label="Toggle sidebar"><PanelLeft className="size-4" /></AnimatedSidebarTrigger><div className="hidden h-5 border-l border-border sm:block" /><div><p className="text-sm font-semibold">{current}</p><p className="hidden text-xs text-muted-foreground sm:block">Payment operations / {current}</p></div></div>
          <div className="flex items-center gap-2"><span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 sm:inline-flex">Live workspace</span><ThemeToggle /><Button variant="outline" size="icon" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut className="size-4" /></Button></div>
        </header>
        <main className="ib-portal-shell min-h-[calc(100svh-72px)] flex-1 p-4 sm:p-7 lg:p-9">{children}</main>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  );
}
