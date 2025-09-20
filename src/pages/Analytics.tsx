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
import { Home, List, BarChart3, Shield, Activity } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";
import { UserMenu } from "@/components/UserMenu";

// Types for our data
type Issue = Tables<"issues">;

interface MonthlyReportData {
  month: string;
  total: number;
  resolved: number;
}

interface CategoryDistributionData {
  category: string;
  count: number;
}

interface ResolutionTimeData {
  category: string;
  avg_time_hours: number;
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
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1943"];
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
          nameKey="category"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
            return (
              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={isMobile ? { fontSize: '0.7rem', whiteSpace: 'normal' } : {}} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const ResolutionTimeChart = ({ data }: { data: ResolutionTimeData[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} layout="vertical">
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="category" type="category" width={100} />
      <Tooltip formatter={(value) => `${Number(value).toFixed(2)} hours`} />
      <Legend />
      <Bar dataKey="avg_time_hours" fill="#8884d8" name="Average Resolution Time (hours)" />
    </BarChart>
  </ResponsiveContainer>
);

const LocationHotspotsChart = ({ data }: { data: LocationHotspotData[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="location" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#FF8042" name="Number of Reports" />
    </BarChart>
  </ResponsiveContainer>
);

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
  const [resolutionTimeData, setResolutionTimeData] = useState<ResolutionTimeData[]>([]);
  const [locationData, setLocationData] = useState<LocationHotspotData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: issues, error } = await supabase.from('issues').select('*');
      
      if (error || !issues) {
        console.error("Error fetching issues:", error);
        setLoading(false);
        return;
      }

      // Process data for each chart
      processMonthlyReports(issues);
      processCategoryDistribution(issues);
      processResolutionTimes(issues);
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
        acc[issue.category] = { category: issue.category, count: 0 };
      }
      acc[issue.category].count++;
      return acc;
    }, {} as Record<string, CategoryDistributionData>);
    setCategoryData(Object.values(data));
  };

  const processResolutionTimes = (issues: Issue[]) => {
    const resolvedIssues = issues.filter(i => i.status === 'resolved' && i.resolved_at);
    const dataByCategory = resolvedIssues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = { total_time: 0, count: 0 };
      }
      const timeDiff = new Date(issue.resolved_at!).getTime() - new Date(issue.created_at).getTime();
      acc[issue.category].total_time += timeDiff / (1000 * 60 * 60); // in hours
      acc[issue.category].count++;
      return acc;
    }, {} as Record<string, { total_time: number; count: number }>);

    const avgData = Object.keys(dataByCategory).map(category => ({
      category,
      avg_time_hours: dataByCategory[category].total_time / dataByCategory[category].count,
    }));
    setResolutionTimeData(avgData);
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

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div>Loading analytics...</div>
    </div>
  );

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-2xl font-semibold">CiviLink</span>
          </div>
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
                  <CardTitle>Average Resolution Time by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResolutionTimeChart data={resolutionTimeData} />
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
