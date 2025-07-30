"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Mail, FileText, Send, Settings, HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export function DashboardNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: BarChart3,
      dis:false,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/recipients",
      label: "Recipients",
      icon: Users,
       dis:false,
      active: pathname === "/dashboard/recipients",
    },
    {
      href: "/dashboard/templates",
      label: "Templates",
      icon: FileText,
       dis:false,
      active: pathname === "/dashboard/templates",
    },
    {
      href: "/dashboard/campaigns",
      label: "Campaigns",
      icon: Mail,
       dis:false,
      active: pathname === "/dashboard/campaigns",
    },
    {
      href: "/dashboard/senders",
      label: "Senders",
      icon: Send,
       dis:false,
      active: pathname === "/dashboard/senders",
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
       dis:false,
      active: pathname === "/dashboard/settings",
    },
    {
      href: "/dashboard/help",
      label: "Help & Support",
      icon: HelpCircle,
       dis:true,
      active: pathname === "/dashboard/help",
    },
  ]

  return (
    <nav className="grid items-start gap-2 px-2 py-4">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            route.active ? "bg-accent text-accent-foreground" : "transparent",
          )}
           style={{
          pointerEvents: route.dis ? 'none' : 'auto',
          opacity: route.dis ? 0.5 : 1,
          cursor: route.dis ? 'not-allowed' : 'pointer',
        }}
        >
          <route.icon className="mr-2 h-4 w-4" />
          <span>{route.label}</span>
        </Link>
      ))}
    </nav>
  )
}
