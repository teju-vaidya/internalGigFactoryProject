/**
 * AppLayout — Unified shell for all authenticated pages
 *
 * Features:
 *  - Collapsible sidebar (full ↔ icon-only)
 *  - Top navbar: page title, notifications, settings, profile with name
 *  - Role-based nav items
 *  - Fully responsive (mobile overlay drawer)
 */

import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Building2,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  FileCheck,
  Shield,
  ChevronDown,
  FileSearch,
  Handshake,
  Banknote,
  Check,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Mail,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../utils/api";
import { useSocket, destroySocket } from "../../hooks/useSocket";
import gigfactoryLogo from "../../assets/logo.png";
import gigfactoryIcon from "../../assets/favicon_nobg.png"; // same logo, smaller
import "./AppLayout.css";

/* ─── nav config per role ────────────────────────────────────────────── */
const NAV_CONFIG = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Reg. Requests", icon: FileSearch, to: "/admin/requests" },
    { label: "Gig Experts", icon: Users, to: "/admin/gigExperts" },
    { label: "Agencies", icon: Building2, to: "/admin/agencies" },
    { label: "Projects", icon: Briefcase, to: "/admin/projects" },
    { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
    { label: "Logs & Activity", icon: FileText, to: "/admin/activities" },
    { label: "Communication", icon: Mail, to: "/admin/communication" },
    { label: "Settings", icon: Settings, to: "/admin/settings" },
  ],
  gig_expert: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Browse Projects", icon: Briefcase, to: "/projects" },
    { label: "My Applications", icon: FileCheck, to: "/applications" },
    { label: "Active Projects", icon: FileText, to: "/activeProject" },
    { label: "My Profile", icon: User, to: "/profile" },
  ],
  agency: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Browse Projects", icon: Briefcase, to: "/projects" },
    { label: "My Applications", icon: FileCheck, to: "/applications" },
    { label: "Active Projects", icon: FileText, to: "/activeProject" },
    { label: "My Team", icon: Users, to: "/team" },
    { label: "My Profile", icon: User, to: "/profile" },
  ],
};

/* ─── Layout Context (so children can toggle sidebar) ────────────────── */
export const LayoutContext = createContext({});
export const useLayout = () => useContext(LayoutContext);

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay} days ago`;
}

/* ─── Notification dropdown ──────────────────────────────────────────── */
function NotifDropdown({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onDismiss,
  onClose,
}) {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role) || 'gig_expert';
  
  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <div className="flex items-center gap-2">
          <Bell size={18} color="#70d64d" />
          <span>Notifications</span>
        </div>
        <div className="flex items-center gap-3">
          {notifications.some((n) => !n.is_read) && (
            <button className="notif-mark-all-btn" onClick={onMarkAllRead}>
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="notif-close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="py-10 px-5 text-center text-[#6b7280] text-[0.88rem]">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => {
            let Icon = Bell;
            let iconClass = "icon-default";
            if (n.type === "project" || n.type === "new_project") {
              Icon = Handshake;
              iconClass = "icon-project";
            } else if (n.type === "payment") {
              Icon = Banknote;
              iconClass = "icon-payment";
            } else if (n.type === "approved") {
              Icon = Check;
              iconClass = "icon-approved";
            } else if (n.type === "meeting") {
              Icon = Calendar;
              iconClass = "icon-meeting";
            }

            return (
              <div
                key={n.id}
                className={`notif-item cursor-pointer ${!n.is_read ? "unread" : ""}`}
                onClick={() => {
                  if (!n.is_read) {
                    onMarkRead(n.id);
                  }
                  const refType = n.reference_type || n.referenceType;
                  const refId = n.reference_id || n.referenceId;
                  let targetUrl = n.action_url || (refType === 'project' && refId ? `/projects/${refId}` : null);
                  if (role === 'admin' && targetUrl) {
                    if (targetUrl.startsWith('/projects/')) {
                      targetUrl = targetUrl.replace('/projects/', '/admin/projects/');
                    }
                  }
                  if (targetUrl) {
                    if (targetUrl.startsWith("/")) {
                      navigate(targetUrl);
                    } else {
                      window.open(targetUrl, "_blank");
                    }
                  }
                  onClose();
                }}
              >
                <div className={`notif-icon-circle ${iconClass}`}>
                  <Icon size={16} />
                </div>
                <div className="notif-body">
                  <div className="notif-title-row">
                    <span className="notif-title-text">{n.title}</span>
                    <span className="notif-time">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="notif-desc-text">{n.message}</p>
                  <div className="notif-actions-row">
                    {!n.is_read && (
                      <button
                        className="notif-action-btn primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(n.id);
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      className="notif-action-btn secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(n.id);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Profile dropdown ───────────────────────────────────────────────── */
function ProfileDropdown({ user, onLogout, onClose }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const userName = user?.fullName || user?.full_name || "User";
  return (
    <div className="profile-dropdown">
      {!isAdmin && (
        <button
          className="profile-dd-item"
          onClick={() => {
            navigate("/profile");
            onClose();
          }}
        >
          <User size={14} /> My Profile
        </button>
      )}
      <button
        className="profile-dd-item"
        onClick={() => {
          navigate(isAdmin ? "/admin/settings" : "/settings");
          onClose();
        }}
      >
        <Settings size={14} /> Settings
      </button>
      <div className="profile-dd-divider" />
      <button className="profile-dd-item danger" onClick={onLogout}>
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}

/* ─── Main AppLayout ─────────────────────────────────────────────────── */
export default function AppLayout({ children, pageTitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isTopLevelPath = [
    "/",
    "/dashboard",
    "/admin/dashboard",
    "/projects",
    "/activeProject",
    "/applications",
    "/team",
    "/profile",
    "/settings",
    "/admin/projects",
    "/admin/gigExperts",
    "/admin/agencies",
    "/admin/requests",
    "/admin/activities",
    "/admin/analytics",
    "/admin/communication",
  ].includes(location.pathname);
  const user = useAuthStore((state) => state.user) || {};
  const profile = useAuthStore((state) => state.profile);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const userName = user?.fullName || user?.full_name || "User";
  const role = user?.role || "gig_expert";
  const avatarUrl =
    role === "gig_expert"
      ? profile?.user?.profile_photo || user?.profile_photo
      : role === "agency"
        ? profile?.logo || user?.profile_photo
        : user?.profile_photo;
  const navItems = NAV_CONFIG[role] || NAV_CONFIG.gig_expert;

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const listener = () => setIsMobile(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const effectiveCollapsed = isMobile ? false : collapsed;

  const queryClient = useQueryClient();

  // ── Initial fetch of notifications (once on mount) ──────────────────────
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await api.get("/notifications");
        return res.notifications || [];
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        return [];
      }
    },
    // No refetchInterval — Socket.IO handles real-time updates
    staleTime: Infinity,
  });

  // ── Real-time: receive new notifications via Socket.IO ───────────────────
  const { on, off } = useSocket();
  useEffect(() => {
    const handler = (newNotif) => {
      queryClient.setQueryData(["notifications"], (prev = []) => [
        newNotif,
        ...prev,
      ]);
    };
    on("new_notification", handler);
    return () => off("new_notification", handler);
  }, [on, off, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => api.path("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.path(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close mobile drawer on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    destroySocket();
    clearAuth();
    navigate(role === "admin" ? "/admin" : "/");
  };

  /* ── sidebar nav item ── */
  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `sidebar-nav-item relative group ${isActive ? "active" : ""} ${effectiveCollapsed ? "collapsed" : ""}`
      }
    >
      <item.icon size={18} className="nav-icon shrink-0" />
      {!effectiveCollapsed && <span className="nav-label">{item.label}</span>}

      {/* Premium Collapsed Sidebar Tooltip */}
      {effectiveCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center pointer-events-none z-[9999]">
          {/* Left pointing arrow */}
          <div className="w-2 h-2 bg-[#18181b] border-l border-b border-[#2d2d30] rotate-45 -mr-1.5 z-10 shrink-0" />
          <div className="bg-[#18181b] border border-[#2d2d30] text-gray-200 text-xs font-semibold px-2.5 py-1.5 rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] whitespace-nowrap">
            {item.label}
          </div>
        </div>
      )}
    </NavLink>
  );

  /* ── sidebar content ── */
  const SidebarContent = () => (
    <>
      {/* brand */}
      <div
        className={`sidebar-brand ${effectiveCollapsed ? "brand-collapsed" : ""}`}
      >
        <img
          src={effectiveCollapsed ? gigfactoryIcon : gigfactoryLogo}
          alt="GigFactory"
          className={`sidebar-logo ${effectiveCollapsed ? "sidebar-logo-collapsed" : ""}`}
        />
      </div>

      {/* role badge */}
      {!effectiveCollapsed && (
        <div className="sidebar-role-badge">
          <Shield size={12} color="#70d64d" />
          <span>
            {role === "admin"
              ? "Super Admin"
              : role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>
      )}

      {/* nav */}
      <nav className="sidebar-nav">
        {!effectiveCollapsed && <p className="nav-section-label">NAVIGATION</p>}
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* bottom: expand button / collapse button */}
      <div className="sidebar-bottom">
        {effectiveCollapsed ? (
          <button
            className="sidebar-nav-item collapsed expand-btn relative group"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight size={18} className="nav-icon" />

            {/* Custom Tooltip for Expand button */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center pointer-events-none z-[9999]">
              {/* Left pointing arrow */}
              <div className="w-2 h-2 bg-[#18181b] border-l border-b border-[#2d2d30] rotate-45 -mr-1.5 z-10 shrink-0" />
              <div className="bg-[#18181b] border border-[#2d2d30] text-gray-200 text-xs font-semibold px-2.5 py-1.5 rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] whitespace-nowrap">
                Expand sidebar
              </div>
            </div>
          </button>
        ) : (
          !isMobile && (
            <button
              className="sidebar-nav-item flex items-center justify-start gap-[10px] expand-btn"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} className="nav-icon shrink-0" />
              <span className="nav-label">Collapse Sidebar</span>
            </button>
          )
        )}
      </div>
    </>
  );

  return (
    <LayoutContext.Provider
      value={{ collapsed: effectiveCollapsed, setCollapsed }}
    >
      <div
        className={`app-shell ${effectiveCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {/* ── Mobile overlay ── */}
        {mobileOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`app-sidebar ${effectiveCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        >
          <SidebarContent />
        </aside>

        {/* ── Right panel (topbar + content) ── */}
        <div className="app-main">
          {/* ── Topbar ── */}
          <header className="app-topbar">
            {/* left: hamburger + page title */}
            <div className="topbar-left flex items-center gap-3 group">
              <button
                className="topbar-hamburger"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex flex-row items-baseline justify-center gap-0">
                {!isTopLevelPath && (
                  <button
                    onClick={() => navigate(-1)}
                    className="mr-0 w-0 opacity-0 scale-75 pointer-events-none group-hover:mr-2 group-hover:w-8 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 transition-all duration-300 ease-in-out bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-[#23232a] rounded-[8px] p-1.5 cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 overflow-hidden "
                    title="Go back"
                  >
                    <ArrowLeft size={16} className="shrink-0" />
                  </button>
                )}

                <h1 className="topbar-page-title">
                  {pageTitle || "Dashboard"}
                </h1>
              </div>
            </div>

            {/* right: notifications + settings + profile */}
            <div className="topbar-right">
              {/* Notifications */}
              <div className="topbar-icon-wrap" ref={notifRef}>
                <button
                  className="topbar-icon-btn"
                  onClick={() => {
                    setShowNotif((v) => !v);
                    setShowProfile(false);
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notif-dot" aria-hidden />
                  )}
                </button>
                {showNotif && (
                  <NotifDropdown
                    notifications={notifications}
                    onMarkAllRead={() => markAllReadMutation.mutate()}
                    onMarkRead={(id) => markReadMutation.mutate(id)}
                    onDismiss={(id) => dismissMutation.mutate(id)}
                    onClose={() => setShowNotif(false)}
                  />
                )}
              </div>

              {/* Divider */}
              <div className="topbar-divider" />

              {/* Profile */}
              <div className="topbar-icon-wrap" ref={profileRef}>
                <button
                  className="topbar-profile-btn"
                  onClick={() => {
                    setShowProfile((v) => !v);
                    setShowNotif(false);
                  }}
                  aria-label="Profile menu"
                >
                  <div className="topbar-profile-info">
                    <span className="topbar-name capitalize">
                      {userName?.split(" ")[0]}
                    </span>
                    <span className="topbar-profile-role">
                      {role === "admin"
                        ? "Super Admin" 
                        : role === "gig_expert" ? "Gig Expert" : role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  </div>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="topbar-profile-avatar-circle object-cover"
                    />
                  ) : (
                    <div className="topbar-profile-avatar-circle">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 1)}
                    </div>
                  )}
                </button>
                {showProfile && (
                  <ProfileDropdown
                    user={user}
                    onLogout={handleLogout}
                    onClose={() => setShowProfile(false)}
                  />
                )}
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="app-content">{children}</main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
