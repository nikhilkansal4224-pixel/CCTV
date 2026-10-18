import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, Video, AlertTriangle, Layers, Cpu, Camera, 
  BellRing, BarChart3, Sliders, Server, CreditCard, HelpCircle, 
  Search, Compass, Maximize2, Volume2, VolumeX, ChevronRight, 
  ChevronDown, Menu, X, ArrowUpRight, Radio, LogOut 
} from 'lucide-react';
import BlueprintNavigatorModal from '../BlueprintNavigatorModal';
import OmniSearchPalette from '../OmniSearchPalette';
import { MOCK_ALERTS } from '../../data/mockData';

const NAV_GROUPS = [
  {
    title: 'Surveillance & Live',
    icon: Video,
    items: [
      { name: 'Command Center (Grid)', path: '/dashboard', badge: 'Core' },
      { name: 'Single Stream (PTZ)', path: '/live/cam-01', badge: 'Live' },
      { name: 'Floorplan Map', path: '/live/map', badge: 'Geo' },
      { name: 'Custom Layouts', path: '/dashboard/layouts' },
      { name: 'Fullscreen Kiosk', path: '/live/kiosk', badge: 'Wall' },
    ]
  },
  {
    title: 'Incident Response',
    icon: AlertTriangle,
    items: [
      { name: 'Live Alert Queue', path: '/alerts/live', badge: 'Ticker', alertCount: 2 },
      { name: 'Incident Details', path: '/alerts/alt-101' },
      { name: 'Review / Triage', path: '/alerts/review', badge: 'Triage' },
      { name: 'Escalation / Siren', path: '/alerts/alt-101/escalate' },
      { name: 'Incident History', path: '/alerts/alt-101/history' },
    ]
  },
  {
    title: 'Forensics & Playback',
    icon: Layers,
    items: [
      { name: 'Events Archive', path: '/events' },
      { name: 'AI Video Search', path: '/events/search' },
      { name: '24/7 NVR Player', path: '/playback/cam-01' },
      { name: 'Video Clip Editor', path: '/playback/clip-editor' },
      { name: 'Export Manager', path: '/exports' },
    ]
  },
  {
    title: 'AI Models & Calibration',
    icon: Cpu,
    items: [
      { name: 'AI Engine Status', path: '/ai/overview' },
      { name: 'Detection Zones Canvas', path: '/cameras/cam-01/zones', badge: 'Draw' },
      { name: 'Sensitivity & Sliders', path: '/cameras/cam-01/sensitivity' },
      { name: 'Privacy Masking', path: '/cameras/cam-01/privacy-mask' },
      { name: 'Thermal Calibration', path: '/cameras/cam-01/calibration' },
      { name: 'AI Model Selector', path: '/ai/models' },
    ]
  },
  {
    title: 'Cameras & Hardware',
    icon: Camera,
    items: [
      { name: 'Camera Master Fleet', path: '/cameras' },
      { name: 'Add Camera Wizard', path: '/cameras/new', badge: 'ONVIF' },
      { name: 'Camera Diagnostics', path: '/cameras/cam-01' },
      { name: 'PTZ Preset Patrol', path: '/cameras/cam-01/ptz' },
      { name: 'Retention Schedule', path: '/cameras/cam-01/storage' },
      { name: 'Firmware & Edge OTA', path: '/hardware/updates' },
    ]
  },
  {
    title: 'Rules & Automations',
    icon: BellRing,
    items: [
      { name: 'Automated Alert Rules', path: '/notifications/rules' },
      { name: 'IFTTT Rule Builder', path: '/notifications/rules/new', badge: 'Builder' },
      { name: 'Shifts & Armed Hours', path: '/notifications/schedules' },
      { name: 'Integrations Hub', path: '/integrations' },
      { name: 'Webhooks & Signing', path: '/integrations/webhooks' },
      { name: 'Slack / Telegram Bots', path: '/integrations/chat' },
      { name: 'Relays & Hardware Siren', path: '/integrations/relays' },
    ]
  },
  {
    title: 'Analytics & Heatmaps',
    icon: BarChart3,
    items: [
      { name: 'Executive Overview', path: '/analytics/overview' },
      { name: 'Spatial Heatmaps', path: '/analytics/heatmaps', badge: 'Density' },
      { name: 'Peak Traffic & Dwell', path: '/analytics/traffic' },
      { name: 'False Alarm Metrics', path: '/analytics/accuracy' },
      { name: 'Automated Reports', path: '/analytics/reports' },
      { name: 'Reports Archive', path: '/analytics/reports/archive' },
    ]
  },
  {
    title: 'Workspace & Security',
    icon: Sliders,
    items: [
      { name: 'Organization Profile', path: '/settings/org' },
      { name: 'User Management', path: '/settings/users' },
      { name: 'Invite Member', path: '/settings/users/invite' },
      { name: 'RBAC Permissions', path: '/settings/roles' },
      { name: 'Multi-Site Locations', path: '/settings/locations' },
      { name: 'System Audit Logs', path: '/settings/audit-logs' },
    ]
  },
  {
    title: 'Infrastructure & Nodes',
    icon: Server,
    items: [
      { name: 'Edge Gateway Nodes', path: '/system/nodes', badge: 'Jetson' },
      { name: 'Storage & Disk NAS', path: '/system/storage' },
      { name: 'Network Diagnostics', path: '/system/network' },
    ]
  },
  {
    title: 'Billing & Limits',
    icon: CreditCard,
    items: [
      { name: 'Plan Overview', path: '/billing' },
      { name: 'Upgrade Tiers', path: '/billing/plans' },
      { name: 'Payment Cards', path: '/billing/payment-methods' },
      { name: 'Invoices & Tax', path: '/billing/invoices' },
      { name: 'Compute Metering', path: '/billing/usage' },
    ]
  },
  {
    title: 'Support & Help Desk',
    icon: HelpCircle,
    items: [
      { name: 'Support Tickets', path: '/support/tickets' },
      { name: 'Submit Ticket', path: '/support/tickets/new' },
      { name: 'Stream Troubleshooter', path: '/support/troubleshoot', badge: 'Diag' },
    ]
  }
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    'Surveillance & Live': true,
    'Incident Response': true,
    'AI Models & Calibration': true
  });
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [omniOpen, setOmniOpen] = useState(false);
  const [audioSirens, setAudioSirens] = useState(true);

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const activeAlert = MOCK_ALERTS[0];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Command Rail */}
      <aside 
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-72'
        } bg-[#090e1a] border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 shrink-0`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
                <Shield size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  AEGIS SOC <span className="text-[10px] font-mono px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">3.8</span>
                </div>
                <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="live-dot live-dot-green"></span> INGESTION: 8/8 ACTIVE
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" className="mx-auto">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold">
                <Shield size={18} />
              </div>
            </Link>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Blueprint Fast-Jump Trigger */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/60">
          <button
            onClick={() => setBlueprintOpen(true)}
            className={`w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} transition cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              <Compass size={15} className="text-cyan-400" />
              {!sidebarCollapsed && <span className="font-semibold">Master Blueprint</span>}
            </div>
            {!sidebarCollapsed && <span className="text-[10px] bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-400 border border-cyan-800">87 Pages</span>}
          </button>
        </div>

        {/* Navigation Modules Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
          {NAV_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups[group.title] || sidebarCollapsed;
            return (
              <div key={group.title} className="space-y-1">
                {/* Section Header */}
                {!sidebarCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <GroupIcon size={13} className="text-cyan-400/80" />
                      <span>{group.title}</span>
                    </div>
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : (
                  <div className="flex justify-center py-1 text-slate-400" title={group.title}>
                    <GroupIcon size={16} className="text-cyan-400" />
                  </div>
                )}

                {/* Sub-items */}
                {isOpen && (
                  <div className="space-y-0.5 pl-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={sidebarCollapsed ? item.name : undefined}
                          className={`flex items-center ${
                            sidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                          } rounded-lg text-xs transition ${
                            isActive
                              ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className={sidebarCollapsed ? 'hidden' : 'truncate'}>{item.name}</span>
                          {!sidebarCollapsed && item.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.badge}
                            </span>
                          )}
                          {!sidebarCollapsed && item.alertCount && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 font-bold animate-pulse">
                              {item.alertCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Operator Bottom Profile & Switcher */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                SV
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">Major S. Vance</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">SOC Chief • Admin</div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400 mx-auto">
              SV
            </div>
          )}

          {!sidebarCollapsed && (
            <Link to="/auth/login" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition" title="Log Out">
              <LogOut size={15} />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Command View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Top Tactical Status & Alert Ticker */}
        <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-20">
          {/* Live Incident Ticker */}
          <div className="flex items-center gap-3 overflow-hidden">
            <Link
              to="/alerts/live"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-xs font-mono text-red-300 hover:bg-red-900/60 transition shrink-0"
            >
              <span className="live-dot live-dot-red"></span>
              <span className="font-bold">ACTIVE BREACH:</span>
              <span className="truncate max-w-[280px] lg:max-w-md hidden sm:inline">
                {activeAlert.cameraName} • {activeAlert.type} ({activeAlert.confidence}% Conf)
              </span>
            </Link>

            <span className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <span className="live-dot live-dot-green"></span>
              <span>Cluster: 3 Nodes (18ms RTT)</span>
            </span>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setOmniOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition cursor-pointer"
            >
              <Search size={14} className="text-cyan-400" />
              <span className="hidden md:inline">Command Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">⌘K</kbd>
            </button>

            <button
              onClick={() => setAudioSirens(!audioSirens)}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                audioSirens 
                  ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:text-cyan-300' 
                  : 'bg-red-950/40 border-red-900 text-red-400 hover:text-red-300'
              }`}
              title={audioSirens ? 'Audible Alarms Active' : 'Audible Alarms Muted'}
            >
              {audioSirens ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <Link
              to="/live/kiosk"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition"
              title="Enter Fullscreen Kiosk Mode"
            >
              <Maximize2 size={16} />
            </Link>

            <button
              onClick={() => setBlueprintOpen(true)}
              className="btn btn-outline-cyan btn-sm text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Compass size={14} />
              <span className="hidden sm:inline">Blueprint (87)</span>
            </button>

            <Link
              to="/"
              className="btn btn-secondary btn-sm text-xs hidden lg:flex items-center gap-1"
            >
              Public Site <ArrowUpRight size={12} />
            </Link>
          </div>
        </header>

        {/* Viewport Content Slot */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Blueprint Navigator Pill Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setBlueprintOpen(true)}
          className="px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-xl shadow-cyan-500/25 flex items-center gap-2 hover:scale-105 transition cursor-pointer border border-cyan-300/40"
        >
          <Compass size={16} />
          <span>87-Page Blueprint</span>
        </button>
      </div>

      {/* Modals */}
      <BlueprintNavigatorModal isOpen={blueprintOpen} onClose={() => setBlueprintOpen(false)} />
      <OmniSearchPalette isOpen={omniOpen} onClose={() => setOmniOpen(false)} />
    </div>
  );
}
