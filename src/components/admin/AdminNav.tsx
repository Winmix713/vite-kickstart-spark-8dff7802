import { Fragment, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar.hooks";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import { NAV_SECTIONS } from "./AdminNav.constants";
const AdminNav = () => {
  const location = useLocation();
  const {
    profile: authProfile
  } = useAuth();
  const {
    profile: adminProfile
  } = useAdminAuth();
  const sidebar = useSidebar();
  const profile = adminProfile ?? authProfile;
  const role = profile?.role ?? "user";
  const sections = useMemo(() => NAV_SECTIONS.map(section => ({
    label: section.label,
    items: section.items.filter(item => !item.roles || item.roles.includes(role))
  })).filter(section => section.items.length > 0), [role]);
  const handleNavigate = () => {
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  };
  return <Fragment>
      <SidebarHeader className="gap-3 border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WinMix Admin</span>
          <span className="text-lg font-semibold text-foreground">Control Center</span>
        </div>
        <Badge variant="secondary" className="w-fit">{role.toUpperCase()}</Badge>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section, index) => <Fragment key={section.label}>
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase tracking-wide text-xs text-muted-foreground">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map(item => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                return <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} size="lg" onClick={handleNavigate}>
                          <Link to={item.href} className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span className="flex flex-col items-start">
                              <span className="text-sm font-medium leading-tight">{item.label}</span>
                              {item.description ? <span className="text-xs text-muted-foreground">{item.description}</span> : null}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
              })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {index < sections.length - 1 ? <SidebarSeparator className="my-1" /> : null}
          </Fragment>)}
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <p className="leading-relaxed">
          Signed in as <span className="font-medium text-foreground">{profile?.email ?? "unknown"}</span>
        </p>
      </SidebarFooter>
    </Fragment>;
};
export default AdminNav;