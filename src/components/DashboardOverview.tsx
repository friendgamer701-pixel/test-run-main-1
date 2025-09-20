import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  Lightbulb,
  Trash2,
  Palette,
  Route,
  Wrench,
  Droplets,
  RectangleHorizontal,
  TrafficCone,
  HelpCircle
} from "lucide-react";
import { RecentIssues } from '@/components/RecentIssues';
import { Progress } from "@/components/ui/progress";

const initialCategoryItems = [
    { id: 'Pothole', title: 'Potholes', icon: Route, count: 0, total: 50 },
    { id: 'Broken Streetlight', title: 'Street Lights', icon: Lightbulb, count: 0, total: 30 },
    { id: 'Overflowing Trash Bin', title: 'Trash Bins', icon: Trash2, count: 0, total: 25 },
    { id: 'Graffiti', title: 'Graffiti', icon: Palette, count: 0, total: 35 },
    { id: 'Damaged Public Property', title: 'Damaged Public Property', icon: Wrench, count: 0, total: 20 },
    { id: 'Water Leak', title: 'Water Leak', icon: Droplets, count: 0, total: 15 },
    { id: 'Sidewalk Damage', title: 'Sidewalk Damage', icon: RectangleHorizontal, count: 0, total: 40 },
    { id: 'Traffic Signal Issue', title: 'Traffic Signal Issue', icon: TrafficCone, count: 0, total: 10 },
    { id: 'Other', title: 'Other', icon: HelpCircle, count: 0, total: 20 },
];

const CategoryOverview = ({ categoryCounts, loading }: { categoryCounts: typeof initialCategoryItems, loading: boolean }) => {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Category Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <div key={index}>
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {categoryCounts.map(category => (
                    <div key={category.id}>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span>{category.title}</span>
                            <span>{`${category.count}/${category.total}`}</span>
                        </div>
                        <Progress value={(category.count / category.total) * 100} />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


export const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedToday: 0,
    inProgress: 0,
    activeStaff: 18 // Static for now
  });
  const [categoryCounts, setCategoryCounts] = useState(initialCategoryItems);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { data: issues, error } = await supabase.from('issues').select('*');
      if (error) throw error;

      const totalIssues = issues.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const resolvedToday = issues.filter(issue =>
        issue.status === 'resolved' && new Date(issue.updated_at) >= today
      ).length;

      const inProgress = issues.filter(issue => issue.status === 'in-progress').length;

      const counts = issues.reduce((acc, issue) => {
        if (issue.status !== 'resolved') {
            const category = initialCategoryItems.find(item => item.id === issue.category);
            if (category) {
                acc[issue.category] = (acc[issue.category] || 0) + 1;
            } else {
                acc['Other'] = (acc['Other'] || 0) + 1;
            }
        }
        return acc;
      }, {} as { [key: string]: number });

      const updatedCategories = initialCategoryItems.map(cat => ({
        ...cat,
        count: counts[cat.id] || 0
      }));

      setStats({ totalIssues, resolvedToday, inProgress, activeStaff: 18 });
      setCategoryCounts(updatedCategories);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase.channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, payload => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const overviewStats = [
    { title: "Total Issues", value: stats.totalIssues, icon: AlertTriangle, color: "text-red-500" },
    { title: "Resolved Today", value: stats.resolvedToday, icon: CheckCircle2, color: "text-green-500" },
    { title: "In Progress", value: stats.inProgress, icon: Clock, color: "text-yellow-500" },
    { title: "Active Staff", value: stats.activeStaff, icon: Users, color: "text-blue-500" },
  ];

  if (loading) {
      return (
          <div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                      <Card key={index}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <Skeleton className="h-4 w-2/4" />
                          </CardHeader>
                          <CardContent>
                              <Skeleton className="h-8 w-1/4" />
                          </CardContent>
                      </Card>
                  ))}
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-5">
                  <div className="lg:col-span-3">
                      <Skeleton className="h-96" />
                  </div>
                  <div className="lg:col-span-2">
                      <Skeleton className="h-96" />
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <RecentIssues />
        </div>
        <div className="lg:col-span-2">
            <CategoryOverview categoryCounts={categoryCounts} loading={loading} />
        </div>
      </div>
    </div>
  );
};
