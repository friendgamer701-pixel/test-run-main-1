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
import heroImage from "@/assets/hero-cityscape.jpg";

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
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-cover bg-center h-[300px]" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 flex items-center gap-3">
            <Eye className="h-10 w-10 md:h-12 md:w-12" />
            Community Reports
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-5 max-w-2xl">
            Transparency in action - track civic issues reported by your community
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
            <span>•</span>
            <span>{filteredReports.length} Active Issues</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-16">
        {/* Enhanced Filters */}
        <Card className="mb-8 shadow-lg z-10 relative border border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-700">
              <Filter className="h-5 w-5" />
              Explore & Filter Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
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
                <SelectTrigger className="h-10">
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
                <SelectTrigger className="h-10">
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
                className="h-10 w-full"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setSortBy("newest");
                }}
              >
                Clear
              </Button>
              <Button onClick={handleExport} className="h-10 w-full">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="pt-8">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="shadow-md">
                  <Skeleton className="h-36 md:h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-between items-center mt-4">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="text-center py-12 shadow-md">
              <CardTitle className="text-red-500">Failed to load reports</CardTitle>
              <p className="text-red-500 mt-2">Error: {error}</p>
            </Card>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {filteredReports.map((report) => (
                <Card key={report.id} className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group border-0">
                  {report.image_url && (
                    <div className="relative w-full h-36 md:h-48 overflow-hidden">
                      <img 
                        src={report.image_url} 
                        alt={report.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-black/50 text-white border-0">
                          <Image className="h-3.5 w-3.5 mr-1.5" />
                          Evidence
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2 flex-1">
                        {report.title}
                      </CardTitle>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-primary">
                          {report.priority_score || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Priority</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 pt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow flex flex-col space-y-4">
                    <p className="text-gray-600 line-clamp-3 flex-grow">{report.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{report.category}</Badge>
                      <Badge 
                        className={report.status === 'resolved' ? "bg-green-100 text-green-800" : report.status === 'in_progress' ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}
                      >
                        {report.status === 'in_progress' ? 'In Progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      {report.priority_score > 5 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          High Priority
                        </Badge>
                      )}
                    </div>

                    {/* Location Information */}
                    <div className="space-y-1 text-sm text-gray-500 border-t pt-4">
                      {report.location_name && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{report.location_name}{report.street_address ? `, ${report.street_address}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  {/* Community Engagement */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                      <IssueUpvote 
                        issueId={report.id}
                        initialUpvotes={report.upvotes_count || 0}
                      />
                      
                      {report.response_time && report.status === 'resolved' && (
                        <div className="text-xs text-green-600">
                          Resolved in {report.response_time}
                        </div>
                      )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && filteredReports.length === 0 && (
            <Card className="text-center py-20 shadow-md">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <p className="text-gray-500 text-xl font-medium mt-4">
                {reports.length === 0 ? "No reports have been submitted yet." : "No issues match your current filters."}
              </p>
              {reports.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewReports;
