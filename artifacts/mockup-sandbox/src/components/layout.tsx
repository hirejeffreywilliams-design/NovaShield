import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  FileWarning,
  UserCheck,
  Building2,
  Video,
  BarChart3,
  MessageSquare,
  FileSignature,
  ShieldAlert,
  BookOpen,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "../lib/auth";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Incidents", path: "/incidents", icon: AlertTriangle },
  { label: "Complaints", path: "/complaints", icon: FileWarning },
  { label: "Officers", path: "/officers", icon: UserCheck },
  { label: "Departments", path: "/departments", icon: Building2 },
  { label: "Body Camera", path: "/body-camera", icon: Video },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Community Forum", path: "/forums", icon: MessageSquare },
  { label: "Petitions", path: "/petitions", icon: FileSignature },
  { label: "Whistleblower", path: "/whistleblower", icon: ShieldAlert },
  { label: "Know Your Rights", path: "/rights", icon: BookOpen },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Admin Panel", path: "/admin", icon: Settings },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col border-r border-[#1e1e1e] bg-[#0a0a0a]
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[68px]" : "w-[260px]"}
        `}
      >
        {/* Logo section */}
        <div className="flex items-center gap-3 border-b border-[#1e1e1e] px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold tracking-tight gradient-text leading-tight">
                NovaShield
              </h1>
              <p className="text-[10px] text-[#a3a3a3] leading-tight">
                Police Audit &amp; Accountability
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `
                    group flex items-center gap-3 rounded-lg px-3 py-2.5
                    text-sm font-medium transition-all duration-150
                    ${
                      isActive
                        ? "bg-[#0EA5E9]/10 text-[#0EA5E9] shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                        : "text-[#a3a3a3] hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
                    }
                    ${collapsed ? "justify-center px-2" : ""}
                  `
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors duration-150`}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-[#1e1e1e] px-2 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2
                       text-sm text-[#a3a3a3] transition-colors hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-[#1e1e1e] bg-[#0a0a0a] px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#a3a3a3]">
              Police Accountability Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button
              className="relative rounded-lg p-2 text-[#a3a3a3] transition-colors
                         hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#0EA5E9]" />
            </button>

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e1e1e]">
                <User className="h-4 w-4 text-[#a3a3a3]" />
              </div>
              {user && (
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-[#e5e5e5] leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-[#a3a3a3] leading-tight">
                    {user.role}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-[#a3a3a3] transition-colors
                           hover:bg-[#1e1e1e] hover:text-[#ef4444]"
                title="Logout"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
