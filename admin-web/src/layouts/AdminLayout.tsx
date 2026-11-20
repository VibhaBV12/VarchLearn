import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Library,
  Sparkles,
  CalendarCheck,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  Menu,
  X,
  Star,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/classes-students', label: 'Class & Student Management', icon: Users },
  { to: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { to: '/activity-bank', label: 'Activity Bank', icon: Library },
  { to: '/ai-generation', label: 'Textbook & AI Content Generation', icon: Sparkles },
  { to: '/activity-assignment', label: 'Activity Assignment', icon: CalendarCheck },
  { to: '/student-analysis', label: 'Student Analysis', icon: UserCheck },
  { to: '/class-analysis', label: 'Class Analysis', icon: BarChart3 },
  { to: '/progress-analysis', label: 'Progress Analysis', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE_BOTTOM_TABS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/classes-students', label: 'Classes', icon: Users },
  { to: '/assessments', label: 'Tests', icon: ClipboardCheck },
  { to: '/ai-generation', label: 'AI Gen', icon: Sparkles },
];

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, logoutAdmin, adminUser } = useAdmin();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#39245F] to-[#532B9E] text-white">
      <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7041C6] flex items-center justify-center shadow">
            <Star className="w-5 h-5 text-[#FFB800] fill-[#FFB800]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">VarchLearn</h1>
            <p className="text-[11px] text-purple-200 font-medium">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Close Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 min-h-[44px] py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#39245F] shadow-sm'
                    : 'text-purple-100 hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs text-purple-200">
        <div className="font-bold text-white truncate">{adminUser?.name || settings.adminProfile.name}</div>
        <button onClick={logoutAdmin} className="mt-2 text-xs font-bold text-purple-200 hover:text-white underline">Sign Out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F6FC] overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Full 10-Item Navigation Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E2D6F8] px-3 sm:px-4 lg:px-8 py-2.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#F3EEFC] text-[#39245F]"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <Star className="w-4 h-4 text-[#FFB800] fill-[#FFB800]" />
              <span className="font-extrabold text-[#39245F] text-base">VarchLearn</span>
            </div>
            <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F3EEFC] text-[#7041C6]">
              Admin • {settings.generalSettings.academicYear}
            </span>
          </div>

          <div className="text-xs text-[#64587A] font-medium hidden md:block truncate max-w-xs">
            {settings.generalSettings.supportMessage}
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile-First Bottom Quick-Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E2D6F8] flex items-center justify-around px-1 py-1.5 shadow-lg">
        {MOBILE_BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 rounded-xl text-[11px] font-bold ${
                  isActive ? 'text-[#7041C6] bg-[#F3EEFC]' : 'text-[#64587A]'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 rounded-xl text-[11px] font-bold text-[#64587A]"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
