import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, MapPin } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Issue {
  id: number;
  title: string;
  location: string;
  status: 'new' | 'in-progress' | 'resolved';
  created_at: string;
}

const statusVariantMap = {
  new: 'default',
  'in-progress': 'secondary',
  resolved: 'outline',
};

export const RecentIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setIssues(data as Issue[]);
    } catch (error: any) {
      console.error("Error fetching recent issues:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentIssues();

    const channel = supabase.channel('recent-issues-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, payload => {
        fetchRecentIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Recent Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map(issue => (
            <div key={issue.id} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-sm text-muted-foreground">{issue.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariantMap[issue.status] || 'default'}>{issue.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
