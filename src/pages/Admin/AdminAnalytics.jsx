import React from 'react';
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
function ChartCard({ title, subtitle, children, icon: Icon, iconColor = '#70d64d', isLoading }) {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px] flex flex-col gap-[16px] hover:border-[#2f2f38] transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-[8px]">
            {Icon && <Icon size={16} color={iconColor} />}
            <h3 className="text-white text-[1rem] font-bold m-0">{title}</h3>
          </div>
          {subtitle && <p className="text-gray-500 text-[0.75rem] m-0 mt-[4px]">{subtitle}</p>}
        </div>
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

export default function AdminAnalytics() {
  
  const { data: analyticsResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/profiles/admin/analytics'),
    refetchInterval: 300_000, // every 5 mins
  });

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

      {/* 1. Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <AnalyticCard
          label="Total Registrations"
          value={totalUsersVal}
          Icon={Users}
          subText="Across all platform roles"
          accentColor={COLORS.blue}
          isLoading={isLoading}
        />
        <AnalyticCard
          label="Active Projects"
          value={totalProjectsVal}
          Icon={Briefcase}
          subText="Total uploaded projects"
          accentColor={COLORS.green}
          isLoading={isLoading}
        />
        <AnalyticCard
          label="Total Bids Submitted"
          value={totalBidsVal}
          Icon={FileText}
          subText="Freelancer & Agency proposals"
          accentColor={COLORS.purple}
          isLoading={isLoading}
        />
        <AnalyticCard
          label="Total Transacted"
          value={totalPaymentsVal}
          Icon={DollarSign}
          subText="Completed milestone payouts"
          accentColor={COLORS.amber}
          isLoading={isLoading}
        />
      </div>

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
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAgencies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
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
                  dataKey="Freelancers" 
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
                  dataKey="Not Selected" 
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
            subtitle="Aggregated amount paid to freelancers/agencies"
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
            subtitle="Most active freelancers and agencies by bid counts"
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
