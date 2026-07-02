import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Percent,
  Calendar,
  Zap,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../../utils/api';

// Formatting helper for currency
const fmtCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// Custom Tooltip component to match dark theme aesthetics
const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121215] border border-[#23232a] rounded-[8px] p-[12px] shadow-xl">
        <p className="text-gray-400 text-[0.75rem] font-semibold mb-[6px]">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-[8px] my-[2px]">
            <span
              className="w-[8px] h-[8px] rounded-full inline-block"
              style={{ backgroundColor: item.color || item.fill }}
            />
            <span className="text-gray-300 text-[0.8rem]">{item.name}:</span>
            <span className="text-white text-[0.8rem] font-bold">
              {prefix}{typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Summary Card Component
function AnalyticCard({ label, value, Icon, subText, accentColor = '#70d64d', isLoading }) {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px] flex flex-col gap-[12px] relative overflow-hidden group hover:border-[#2f2f38] transition-all duration-300">
      {/* Decorative gradient overlay */}
      <div
        className="absolute top-0 right-0 w-[80px] h-[80px] opacity-[0.03] rounded-full blur-[20px] group-hover:opacity-[0.06] transition-all duration-300"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-[0.7rem] font-bold tracking-[1px] uppercase m-0">
            {label}
          </p>
          <p className="text-white text-[2rem] font-extrabold m-0 mt-[8px] leading-none tracking-tight">
            {isLoading ? (
              <span className="skeleton-pulse inline-block w-[120px] h-[32px] rounded-[6px]" />
            ) : (
              value
            )}
          </p>
        </div>
        <div
          className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center border transition-all duration-300"
          style={{
            backgroundColor: `${accentColor}08`,
            borderColor: `${accentColor}20`
          }}
        >
          <Icon size={20} color={accentColor} />
        </div>
      </div>
      {!isLoading && subText && (
        <p className="text-gray-500 text-[0.75rem] m-0 flex items-center gap-[4px]">
          {subText}
        </p>
      )}
    </div>
  );
}

// Chart Wrapper Card
function ChartCard({ title, subtitle, children, icon: Icon, iconColor = '#70d64d', isLoading, action }) {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px] flex flex-col gap-[16px] hover:border-[#2f2f38] transition-all duration-300">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-[8px]">
            {Icon && <Icon size={16} color={iconColor} />}
            <h3 className="text-white text-[1rem] font-bold m-0">{title}</h3>
          </div>
          {subtitle && <p className="text-gray-500 text-[0.75rem] m-0 mt-[4px]">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="min-h-[280px] flex items-center justify-center relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-[12px]">
            <div className="w-[36px] h-[36px] border-[3px] border-[rgba(112,214,77,0.1)] border-t-[#70d64d] rounded-full animate-spin" />
            <p className="text-gray-600 text-[0.75rem]">Loading chart data...</p>
          </div>
        ) : (
          <div className="w-full h-full min-h-[280px]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function LeafletMap({ locations, selectedLocation, onSelectLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // 1. Inject CSS
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject JS
    const scriptId = 'leaflet-script';
    let script = document.getElementById(scriptId);

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return;
      if (mapRef.current) return;

      const L = window.L;

      // Initialize map centered on India
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      mapRef.current = map;
    };

    if (!window.L) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initMap();
        };
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initMap);
      }
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync markers when locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    locations.forEach(loc => {
      const isSelected = selectedLocation?.name === loc.name;
      const markerColor = isSelected ? '#70d64d' : '#38bdf8';
      const size = isSelected ? 14 : 10;

      const html = `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * 2.5}px;
            height: ${size * 2.5}px;
            background-color: ${markerColor};
            border-radius: 50%;
            opacity: 0.35;
            animation: pulse-ring 2s infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size}px;
            height: ${size}px;
            background-color: ${markerColor};
            border: 2px solid #121215;
            border-radius: 50%;
            box-shadow: 0 0 10px ${markerColor};
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: html,
        iconSize: [size * 2.5, size * 2.5],
        iconAnchor: [size * 1.25, size * 1.25]
      });

      const marker = L.marker([loc.lat, loc.lon], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          onSelectLocation(loc);
        });

      marker.bindTooltip(`<strong>${loc.name}</strong><br/>${loc.count} users`, {
        direction: 'top',
        className: 'leaflet-tooltip-dark',
        opacity: 0.95
      });

      markersRef.current.push(marker);
    });
  }, [locations, selectedLocation]);

  // Pan to selected location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;
    map.setView([selectedLocation.lat, selectedLocation.lon], 6, {
      animate: true,
      duration: 1.2
    });
  }, [selectedLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  );
}

export default function AdminAnalytics() {
  const [rangeType, setRangeType] = useState('daily');

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    rangeType: 'daily',
    startDate: '',
    endDate: '',
  });

  const [selectedLocation, setSelectedLocation] = useState(null);

  const { data: analyticsResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-analytics', appliedFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('rangeType', appliedFilters.rangeType);
      if (appliedFilters.rangeType === 'custom') {
        if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
        if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);
      }
      return api.get(`/profiles/admin/analytics?${params.toString()}`);
    },
    refetchInterval: 300_000, // every 5 mins
  });

  const handleRangeTypeChange = (type) => {
    setRangeType(type);
    if (type !== 'custom') {
      setAppliedFilters({
        rangeType: type,
        startDate: '',
        endDate: ''
      });
    } else {
      if (!customStart || !customEnd) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const todayStr = today.toISOString().split('T')[0];
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        setCustomStart(thirtyDaysAgoStr);
        setCustomEnd(todayStr);
      }
    }
  };

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      setAppliedFilters({
        rangeType: 'custom',
        startDate: customStart,
        endDate: customEnd
      });
    }
  };

  const analytics = analyticsResponse?.data || {};

  // Theme-compliant colors matching dashboard accent tones
  const COLORS = {
    green: '#70d64d',
    blue: '#38bdf8',
    purple: '#c084fc',
    amber: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
    gray: '#6b7280'
  };

  const projectStatusColors = [COLORS.blue, COLORS.amber, COLORS.green, COLORS.gray];
  const milestoneCompletionColors = [COLORS.green, COLORS.amber, COLORS.red];

  // Map values for Summary Cards
  const totalUsersVal = analytics.summaryCards?.totalUsers?.toLocaleString('en-IN') || '0';
  const totalProjectsVal = analytics.summaryCards?.totalProjects?.toLocaleString('en-IN') || '0';
  const totalBidsVal = analytics.summaryCards?.totalBids?.toLocaleString('en-IN') || '0';
  const totalPaymentsVal = fmtCurrency(analytics.summaryCards?.totalPayments);
  const loginTrendsMap = analytics.loginTrendsMap || [];
  const filteredActivityTrends = analytics.userActivityTrends || [];

  const getTimeLabel = () => {
    if (appliedFilters.rangeType === 'daily') {
      return 'last 30 days';
    }
    if (appliedFilters.rangeType === 'weekly') {
      return 'last 12 weeks';
    }
    if (appliedFilters.rangeType === 'monthly') {
      return 'last 12 months';
    }
    if (appliedFilters.rangeType === 'custom') {
      if (appliedFilters.startDate && appliedFilters.endDate) {
        const start = new Date(appliedFilters.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const end = new Date(appliedFilters.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return `${start} - ${end}`;
      }
      return 'selected range';
    }
    return 'selected range';
  };
  const timeLabel = getTimeLabel();

  return (
    <div className="flex flex-col gap-[24px] pb-[40px]">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-[1.8rem] font-extrabold m-0 tracking-tight">System Analytics</h1>
          <p className="text-gray-400 text-[0.85rem] mt-[4px]">Platform performance metrics, registrations, activities and financials</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="flex items-center gap-[8px] bg-[#121215] border border-[#23232a] hover:border-[#70d64d] text-gray-300 hover:text-white px-[16px] py-[10px] rounded-[8px] transition-all text-[0.85rem] font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* Duration Filter Bar */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[16px] flex flex-wrap items-center justify-between gap-[16px]">
        <div className="flex items-center gap-[12px]">
          <div className="flex items-center gap-[8px]">
            <Calendar size={16} className="text-[#70d64d]" />
            <span className="text-white text-[0.85rem] font-semibold">Time Range:</span>
          </div>

          <div className="flex bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[2px]">
            {['daily', 'weekly', 'monthly', 'custom'].map((type) => (
              <button
                key={type}
                onClick={() => handleRangeTypeChange(type)}
                className={`px-[12px] py-[6px] rounded-[6px] text-[0.75rem] font-medium transition-all ${rangeType === type
                  ? 'bg-[#70d64d] text-[#0c0c0e] font-bold'
                  : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {rangeType === 'custom' && (
          <div className="flex flex-wrap items-center gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <span className="text-gray-500 text-[0.75rem]">Start:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[10px] py-[6px] text-[0.75rem] outline-none focus:border-[#70d64d] transition-colors [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-[6px]">
              <span className="text-gray-500 text-[0.75rem]">End:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[10px] py-[6px] text-[0.75rem] outline-none focus:border-[#70d64d] transition-colors [color-scheme:dark]"
              />
            </div>
            <button
              onClick={handleApplyCustomRange}
              disabled={!customStart || !customEnd}
              className="bg-[#0c0c0e] border border-[#23232a] hover:border-[#70d64d] text-white px-[12px] py-[6px] rounded-[6px] text-[0.75rem] font-semibold transition-colors disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* 1. Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <AnalyticCard
          label="Total Registrations"
          value={totalUsersVal}
          Icon={Users}
          subText={`Across all roles (${timeLabel})`}
          accentColor={COLORS.blue}
          isLoading={isLoading}
        />
        <AnalyticCard
          label="Active Projects"
          value={totalProjectsVal}
          Icon={Briefcase}
          subText={`Total uploaded projects (${timeLabel})`}
          accentColor={COLORS.green}
          isLoading={isLoading}
        />
        <AnalyticCard
          label="Total Bids Submitted"
          value={totalBidsVal}
          Icon={FileText}
          subText={`Gig Expert & Agency proposals (${timeLabel})`}
          accentColor={COLORS.purple}
          isLoading={isLoading}
        />
        <AnalyticCard
          label="Total Transacted"
          value={totalPaymentsVal}
          Icon={DollarSign}
          subText={`Completed milestone payouts (${timeLabel})`}
          accentColor={COLORS.amber}
          isLoading={isLoading}
        />
      </div>

      {/* 1.5 Real-Time Geographic Login Trends Map & Panel */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px] hover:border-[#2f2f38] transition-all duration-300">
        <div className="flex flex-col gap-[6px] mb-[20px]">
          <div className="flex items-center gap-[8px]">
            <TrendingUp size={16} color={COLORS.green} />
            <h3 className="text-white text-[1rem] font-bold m-0">Geographic Login Trends</h3>
          </div>
          <p className="text-gray-500 text-[0.75rem] m-0">Live login logs and session distribution mapped globally (Google Analytics style)</p>
        </div>

        {/* Map + Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
          {/* Map Column (spans 2 on large screens) */}
          <div className="lg:col-span-2 bg-[#0c0c0e] border border-[#1e1e24] rounded-[10px] min-h-[350px] relative overflow-hidden flex flex-col">
            <style dangerouslySetInnerHTML={{
              __html: `
              .leaflet-tooltip-dark {
                background-color: #121215 !important;
                border: 1px solid #23232a !important;
                color: #fff !important;
                font-family: inherit !important;
                font-size: 0.75rem !important;
                border-radius: 6px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
                padding: 6px 10px !important;
              }
              .leaflet-tooltip-top:before {
                border-top-color: #23232a !important;
              }
              @keyframes pulse-ring {
                0% {
                  transform: translate(-50%, -50%) scale(0.5);
                  opacity: 0.55;
                }
                100% {
                  transform: translate(-50%, -50%) scale(1.5);
                  opacity: 0;
                }
              }
            `}} />

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-[12px]">
                <div className="w-[36px] h-[36px] border-[3px] border-[rgba(112,214,77,0.1)] border-t-[#70d64d] rounded-full animate-spin" />
                <p className="text-gray-600 text-[0.75rem]">Loading geographic data...</p>
              </div>
            ) : (
              <div className="flex-1 w-full h-full min-h-[350px] z-10">
                <LeafletMap
                  locations={loginTrendsMap}
                  selectedLocation={selectedLocation}
                  onSelectLocation={setSelectedLocation}
                />
              </div>
            )}
          </div>

          {/* Sidebar Details Column */}
          <div className="bg-[#0c0c0e] border border-[#1e1e24] rounded-[10px] p-[20px] flex flex-col min-h-[300px] max-h-[350px] overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-t-[#70d64d] border-transparent rounded-full animate-spin" />
                <span className="text-gray-600 text-[0.7rem]">Syncing sessions...</span>
              </div>
            ) : selectedLocation ? (
              /* Detail state */
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-start border-b border-[#23232a] pb-[12px] mb-[12px] shrink-0">
                  <div>
                    <h4 className="text-white text-[0.85rem] font-bold m-0 pr-6 truncate max-w-[180px]" title={selectedLocation.name}>
                      {selectedLocation.name}
                    </h4>
                    <p className="text-[0.68rem] text-gray-500 m-0 mt-[2px]">{selectedLocation.count} users recorded</p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="bg-transparent border border-[#23232a] text-gray-400 hover:text-white cursor-pointer text-[0.68rem] font-medium py-1 px-2 hover:bg-[#1a1a22] rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Logins List */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-[8px] custom-scrollbar">
                  {(selectedLocation.users || []).map((usr) => {
                    const roleColor = usr.userRole === 'admin' ? COLORS.amber : usr.userRole === 'agency' ? COLORS.purple : COLORS.blue;
                    const dateStr = usr.loginAt ? new Date(usr.loginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(usr.loginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
                    return (
                      <div key={usr.id} className="bg-[#121215] border border-[#1e1e24] rounded-[6px] p-[10px] flex flex-col gap-[4px] hover:border-[#2f2f38] transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-[0.78rem] font-bold truncate max-w-[140px]">{usr.userName}</span>
                          <span
                            style={{ backgroundColor: `${roleColor}15`, color: roleColor }}
                            className="text-[0.58rem] font-bold px-[4px] py-[1px] rounded uppercase shrink-0"
                          >
                            {usr.userRole}
                          </span>
                        </div>
                        <div className="text-[0.7rem] text-gray-400 truncate">{usr.userEmail}</div>
                        <div className="flex justify-between items-center text-[0.62rem] text-gray-500 mt-[2px] border-t border-[#1a1a22] pt-[4px]">
                          <span className="truncate max-w-[120px]">{usr.browser} on {usr.device}</span>
                          <span className="text-[#70d64d] shrink-0">{dateStr}</span>
                        </div>
                        <div className="text-[0.58rem] text-gray-600">IP: {usr.ipAddress}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Top Locations state */
              <div className="flex flex-col h-full overflow-hidden">
                <h4 className="text-white text-[0.85rem] font-bold m-0 border-b border-[#23232a] pb-[12px] mb-[12px] shrink-0">
                  Top Login Locations
                </h4>

                {loginTrendsMap.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-[0.75rem]">
                    No login data recorded.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-[10px] custom-scrollbar">
                    {(() => {
                      const sortedLocs = [...loginTrendsMap].sort((a, b) => b.count - a.count);
                      const maxCount = Math.max(...sortedLocs.map(l => l.count), 1);
                      return sortedLocs.map((loc) => {
                        const pct = (loc.count / maxCount) * 100;
                        return (
                          <div
                            key={loc.name}
                            onClick={() => setSelectedLocation(loc)}
                            className="group cursor-pointer flex flex-col gap-[3px] hover:bg-[#121215] p-[4px] rounded transition-colors"
                          >
                            <div className="flex justify-between items-center text-[0.72rem]">
                              <span className="text-gray-300 font-medium group-hover:text-white transition-colors truncate max-w-[150px]">
                                {loc.name}
                              </span>
                              <span className="text-white font-bold">{loc.count}</span>
                            </div>
                            <div className="w-full bg-[#181820] h-[4px] rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#38bdf8] to-[#70d64d] h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Activity Trends (Area Chart - full width with overall duration filter) */}
      <ChartCard
        title="User Activity Trends"
        subtitle="Active vs inactive users based on login history in the selected period"
        icon={Users}
        iconColor={COLORS.blue}
        isLoading={isLoading}
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={filteredActivityTrends}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.gray} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.gray} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#23232a" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#4b5563"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#4b5563"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
            />
            <Area
              type="monotone"
              dataKey="Active"
              stroke={COLORS.green}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActive)"
            />
            <Area
              type="monotone"
              dataKey="Inactive"
              stroke={COLORS.gray}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInactive)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Grid containing major charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">

        {/* 2. User Registration Trends (Area Chart - spans 2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="User Registration Trends"
            subtitle="Monthly growth split by account type (last 12 months)"
            icon={TrendingUp}
            iconColor={COLORS.blue}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={analytics.userRegistrationTrends || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorFreelancers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAgencies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#23232a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="Gig Experts"
                  stroke={COLORS.green}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFreelancers)"
                />
                <Area
                  type="monotone"
                  dataKey="Agencies"
                  stroke={COLORS.blue}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAgencies)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 3. Project Status Overview (Donut Chart - spans 1 col) */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Project Status Overview"
            subtitle="Current distribution of active projects"
            icon={PieChartIcon}
            iconColor={COLORS.green}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.projectStatusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(analytics.projectStatusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={projectStatusColors[index % projectStatusColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 4. Project Creation Trends (Bar Chart - spans 1 col) */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Project Postings"
            subtitle="Monthly project creation rate (last 12 months)"
            icon={Calendar}
            iconColor={COLORS.purple}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.projectCreationTrends || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="#23232a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Projects" fill={COLORS.purple} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 5. Bid Activity Trends (Stacked Area Chart - spans 2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Bid Activity Trends"
            subtitle="Proposal applications grouped by status (last 12 months)"
            icon={Zap}
            iconColor={COLORS.amber}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={analytics.bidActivityTrends || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="#23232a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  stackId="1"
                  dataKey="Accepted"
                  stroke={COLORS.green}
                  fill={COLORS.green}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  stackId="1"
                  dataKey="Pending"
                  stroke={COLORS.amber}
                  fill={COLORS.amber}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  stackId="1"
                  dataKey="Rejected"
                  stroke={COLORS.red}
                  fill={COLORS.red}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  stackId="1"
                  dataKey="Applied"
                  stroke={COLORS.blue}
                  fill={COLORS.blue}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 6. Monthly Revenue (Bar Chart - spans 2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Monthly Payout Revenue"
            subtitle="Aggregated amount paid to gig experts/agencies"
            icon={BarChart3}
            iconColor={COLORS.green}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.monthlyRevenue || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#23232a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Bar dataKey="Revenue" fill={COLORS.green} radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 7. Milestone Completion Rate (Donut Chart - spans 1 col) */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Milestone Fulfillment"
            subtitle="Completion and overdue rates for milestones"
            icon={Percent}
            iconColor={COLORS.amber}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.milestoneCompletion || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(analytics.milestoneCompletion || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={milestoneCompletionColors[index % milestoneCompletionColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 8. Project Categories (Horizontal Bar Chart - spans 2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Projects by Category"
            subtitle="Concentration of project postings across categories"
            icon={Briefcase}
            iconColor={COLORS.blue}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={analytics.projectCategoryDistribution || []}
                margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid stroke="#23232a" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#e5e7eb"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.blue} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 9. Top Bidders (Horizontal Bar Chart - spans 1 col) */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Top Application Bidders"
            subtitle="Most active gig experts and agencies by bid counts"
            icon={Award}
            iconColor={COLORS.purple}
            isLoading={isLoading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={analytics.topBidders || []}
                margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid stroke="#23232a" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#e5e7eb"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.purple} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
