import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Image, Search, TrendingUp, Filter, Eye, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IssueUpvote } from "@/components/IssueUpvote";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const ViewReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from("issues")
          .select("*")
          .eq("is_spam", false) // Don't show spam issues to public
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }
        setReports(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel('public-issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && !payload.new.is_spam) {
            setReports(prev => [payload.new, ...prev]);
            toast({
              title: "New Issue Reported",
              description: `${payload.new.title} in ${payload.new.category}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setReports(prev => prev.map(report => 
              report.id === payload.new.id ? payload.new : report
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Filter and sort reports
  useEffect(() => {
    let filtered = reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort reports
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.upvotes_count || 0) - (a.upvotes_count || 0);
        case "priority":
          return (b.priority_score || 0) - (a.priority_score || 0);
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, categoryFilter, sortBy]);

  const uniqueCategories = [...new Set(reports.map(r => r.category))];

  const handleExport = () => {
    if (filteredReports.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no reports matching the current filters.",
        variant: "destructive",
      });
      return;
    }

    const reportData = filteredReports.map(report => ({
      ID: report.id,
      Title: report.title,
      Description: report.description,
      Category: report.category,
      Status: report.status,
      "Created At": new Date(report.created_at).toLocaleString(),
      Location: report.location_name,
      Address: report.street_address,
      Landmark: report.landmark,
      Upvotes: report.upvotes_count || 0,
      "Priority Score": report.priority_score || 0,
      "Image URL": report.image_url,
      "Public Notes": report.public_notes,
      "Assigned To": report.assigned_to,
      "Response Time": report.response_time,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, `community_reports_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export Successful",
      description: `${filteredReports.length} reports have been exported.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold mb-4 text-gray-800 flex items-center justify-center gap-3">
          <Eye className="h-10 w-10 text-primary" />
          Community Reports
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Transparency in action - track civic issues reported by your community
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
          </div>
          <span>•</span>
          <span>{filteredReports.length} Active Issues</span>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Explore & Filter Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Supported</SelectItem>
                <SelectItem value="priority">Highest Priority</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setSortBy("newest");
              }}
            >
              Clear
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 text-lg font-semibold">Failed to load reports: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group">
              {report.image_url && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={report.image_url} 
                    alt={report.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      <Image className="h-3 w-3 mr-1" />
                      Evidence
                    </Badge>
                  </div>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2 flex-1">
                    {report.title}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {report.priority_score || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Priority</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow space-y-4">
                <p className="text-gray-600 line-clamp-3">{report.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{report.category}</Badge>
                  <Badge 
                    variant={
                      report.status === 'resolved' ? 'default' : 
                      report.status === 'in_progress' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {report.status === 'in_progress' ? 'In Progress' : report.status}
                  </Badge>
                  {report.priority_score > 5 && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      High Priority
                    </Badge>
                  )}
                </div>

                {/* Location Information */}
                <div className="space-y-1 text-sm text-gray-500">
                  {report.location_name && (
                    <div className="flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">Location:</span>
                      <span>{report.location_name}</span>
                    </div>
                  )}
                  {report.street_address && (
                    <div className="flex items-start gap-1 ml-4">
                      <span className="font-medium">Address:</span>
                      <span>{report.street_address}</span>
                    </div>
                  )}
                  {report.landmark && (
                    <div className="flex items-start gap-1 ml-4">
                      <span className="font-medium">Landmark:</span>
                      <span>{report.landmark}</span>
                    </div>
                  )}
                </div>

                {/* Community Engagement */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <IssueUpvote 
                    issueId={report.id}
                    initialUpvotes={report.upvotes_count || 0}
                  />
                  
                  {report.response_time && report.status === 'resolved' && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Resolved in {report.response_time}
                    </div>
                  )}
                  
                  {report.assigned_to && (
                    <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      Assigned to {report.assigned_to}
                    </div>
                  )}
                </div>

                {/* Public Updates */}
                {report.public_notes && (
                  <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                    <div className="text-xs font-medium text-blue-700 mb-1">Official Update</div>
                    <div className="text-sm text-blue-800">{report.public_notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && filteredReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto mb-4" />
          </div>
          <p className="text-gray-500 text-lg mb-2">
            {reports.length === 0 ? "No reports have been submitted yet." : "No issues match your current filters."}
          </p>
          {reports.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewReports;