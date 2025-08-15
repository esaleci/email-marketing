import type { ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { verifySession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await verifySession()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
    <div className="flex min-h-screen flex-col w-full max-w-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="px-4  flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 font-bold">
          <SidebarTrigger />
            <span className="text-primary">Email</span>
            <span>Marketing</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav user={user} />
          </div>
        </div>
      </header>
      {/* <div className="w-full flex-grow items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10"> */}
       <div className="w-full flex flex-row gap-5">
          <DashboardNav />
       
        <main className="flex w-full flex-col overflow-hidden py-6 px-4">{children}</main>
        </div>
      {/* </div> */}
    </div>
    </SidebarProvider>
  )
}
