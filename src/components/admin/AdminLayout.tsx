import { Fragment, type ReactNode } from "react";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import AdminNav from "@/components/admin/AdminNav";
import type { AdminBreadcrumbItem } from "@/types/admin";
interface AdminLayoutProps {
  title: string;
  description?: string;
  breadcrumbs: AdminBreadcrumbItem[];
  children: ReactNode;
  actions?: ReactNode;
}
const AdminLayout = ({
  title,
  description,
  breadcrumbs,
  children,
  actions
}: AdminLayoutProps) => <SidebarProvider>
    <div className="flex min-h-screen bg-background">
      <Sidebar className="bg-muted/30 backdrop-blur" collapsible="icon">
        <AdminNav />
      </Sidebar>
      <SidebarInset>
        <div className="grid min-h-screen flex-1 grid-rows-[auto,1fr]">
          <header className="sticky top-0 z-20 w-full border-b border-border/60 bg-background/80 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-11 w-11 rounded-full md:hidden" aria-label="Toggle navigation" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return <Fragment key={`${item.label}-${index}`}>
                          <BreadcrumbItem>
                            {item.href && !isLast ? <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink> : <BreadcrumbPage>{item.label}</BreadcrumbPage>}
                          </BreadcrumbItem>
                          {isLast ? null : <BreadcrumbSeparator />}
                        </Fragment>;
                  })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                  {description ? <p className="text-sm text-muted-foreground sm:text-base">{description}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
              </div>
            </div>
            <Separator className="bg-border/60" />
          </header>
          <main className="px-4 py-6 sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </div>
  </SidebarProvider>;
export default AdminLayout;