import React from "react";
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Sidebar, SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarHeader, SidebarFooter, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarTrigger
} from "@/components/ui/sidebar";
import { Home, List, BarChart3, Shield } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";
import { UserMenu } from "@/components/UserMenu";
import { Skeleton } from "@/components/ui/skeleton";

// Types for our data
type Issue = Tables<"issues">;

interface MonthlyReportData {
  month: string;
  total: number;
  resolved: number;
}

interface CategoryDistributionData {
  name: string;
  count: number;
  fill: string;
}

interface ReportsByDayData {
  day: string;
  count: number;
}

interface LocationHotspotData {
  location: string;
  count: number;
}

// Helper function to format month
const formatMonth = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
};

// Reusable Chart Components
const MonthlyReportsChart = ({ data }: { data: MonthlyReportData[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar dataKey="total" fill="#8884d8" name="Total Reports" />
      <Bar dataKey="resolved" fill="#82ca9d" name="Resolved Reports" />
    </BarChart>
  </ResponsiveContainer>
);

const CategoryDistributionChart = ({ data }: { data: CategoryDistributionData[] }) => {
  const isMobile = useIsMobile();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={isMobile ? 60 : 80}
          fill="#8884d8"
          dataKey="count"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
            return (
              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`%${(percent * 100).toFixed(0)}`}
              </text>
            );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={isMobile ? { fontSize: '0.7rem', whiteSpace: 'normal' } : {}} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const ReportsByDayChart = ({ data }: { data: ReportsByDayData[] }) => {
  const isMobile = useIsMobile();
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1943", "#8884d8"];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={isMobile ? { top: 5, right: 20, left: -20, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" name="Number of Reports" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const LocationHotspotsChart = ({ data }: { data: LocationHotspotData[] }) => {
  const isMobile = useIsMobile();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={isMobile ? { top: 5, right: 20, left: -20, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF8042" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#FF8042" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="location" />
        <YAxis />
        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px' }} />
        <Legend />
        <Bar dataKey="count" fill="url(#colorUv)" name="Number of Reports" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}


// Custom Tooltip for detailed view
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-primary">{`Total: ${payload[0].value}`}</p>
        <p className="text-green-500">{`Resolved: ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};

const AnalyticsContent = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistributionData[]>([]);
  const [reportsByDayData, setReportsByDayData] = useState<ReportsByDayData[]>([]);
  const [locationData, setLocationData] = useState<LocationHotspotData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1943"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: issues, error } = await supabase.from('issues').select<'*', Issue>('*');
      
      if (error || !issues) {
        console.error("Error fetching issues:", error);
        setLoading(false);
        return;
      }

      // Process data for each chart
      processMonthlyReports(issues);
      processCategoryDistribution(issues);
      processReportsByDay(issues);
      processLocationHotspots(issues);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const processMonthlyReports = (issues: Issue[]) => {
    const data = issues.reduce((acc, issue) => {
      const month = formatMonth(issue.created_at);
      if (!acc[month]) {
        acc[month] = { month, total: 0, resolved: 0 };
      }
      acc[month].total++;
      if (issue.status === 'resolved') {
        acc[month].resolved++;
      }
      return acc;
    }, {} as Record<string, MonthlyReportData>);
    setMonthlyData(Object.values(data));
  };

  const processCategoryDistribution = (issues: Issue[]) => {
    const data = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = { name: issue.category, count: 0, fill: '' };
      }
      acc[issue.category].count++;
      return acc;
    }, {} as Record<string, CategoryDistributionData>);
    
    const sortedData = Object.values(data).sort((a,b) => b.count - a.count).map((item, index) => ({...item, fill: COLORS[index % COLORS.length]}));
    setCategoryData(sortedData);
  };

  const processReportsByDay = (issues: Issue[]) => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = issues.reduce((acc, issue) => {
        const day = daysOfWeek[new Date(issue.created_at).getDay()];
        if (!acc[day]) {
            acc[day] = { day, count: 0 };
        }
        acc[day].count++;
        return acc;
    }, {} as Record<string, ReportsByDayData>);

    const sortedData = daysOfWeek.map(day => data[day] || { day, count: 0 });
    setReportsByDayData(sortedData);
  };

  const processLocationHotspots = (issues: Issue[]) => {
    const data = issues.reduce((acc, issue) => {
      const location = issue.location_name || 'Unknown';
      if (!acc[location]) {
        acc[location] = { location, count: 0 };
      }
      acc[location].count++;
      return acc;
    }, {} as Record<string, LocationHotspotData>);
    setLocationData(Object.values(data).sort((a,b) => b.count - a.count).slice(0, 10)); // Top 10
  };

  const chartCardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <button onClick={() => navigate('/')} className="flex items-center gap-3 p-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-2xl font-semibold">CiviLink</span>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" onClick={() => navigate('/admin')} className="h-12 hover:scale-105 hover:shadow-lg transition-transform duration-200">
                  <Home className="w-5 h-5" />
                  <span className="text-base">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="All Reports" onClick={() => navigate('/admin/issues')} className="h-12 hover:scale-105 hover:shadow-lg transition-transform duration-200">
                  <List className="w-5 h-5" />
                  <span className="text-base">All Reports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Analytics" isActive className="h-12 hover:scale-105 hover:shadow-lg transition-transform duration-200">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-base">Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background px-4 py-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden flex-shrink-0" />
        </header>
        <main className="p-4 sm:px-6 sm:py-0">
          {loading ? (
            <div className="space-y-6">
              <Card style={chartCardStyle}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-6">
                <Card style={chartCardStyle}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
                <Card style={chartCardStyle}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              </div>
              <Card style={chartCardStyle}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card style={chartCardStyle}>
                <CardHeader>
                  <CardTitle>Monthly Reports Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <MonthlyReportsChart data={monthlyData} />
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card style={chartCardStyle}>
                  <CardHeader>
                    <CardTitle>Issue Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CategoryDistributionChart data={categoryData} />
                  </CardContent>
                </Card>

                <Card style={chartCardStyle}>
                  <CardHeader>
                    <CardTitle>Reports by Day of the Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReportsByDayChart data={reportsByDayData} />
                  </CardContent>
                </Card>
              </div>
              
              <Card style={chartCardStyle}>
                <CardHeader>
                  <CardTitle>Top 10 Report Hotspots</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationHotspotsChart data={locationData} />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </>
  );
}

const Analytics = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AnalyticsContent />
    </SidebarProvider>
  );
};

export default Analytics;
