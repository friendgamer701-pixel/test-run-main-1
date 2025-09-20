import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Image,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  ThumbsUp,
  Shield,
  Copy,
  Users,
  Activity,
  TrendingUp,
  Zap,
  Archive,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  created_at: string;
  upvotes_count: number;
  is_spam: boolean;
  duplicate_of: number | null;
  priority_score: number;
  response_time: string | null;
  assigned_to: string | null;
  public_notes: string | null;
}

const IssuesManagement = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showSpam, setShowSpam] = useState(false);
  const [sortBy, setSortBy] = useState("priority");
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { toast } = useToast();

  // Fetch issues from Supabase and set up real-time updates
  useEffect(() => {
    fetchIssues();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('issues-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          if (payload.eventType === 'INSERT') {
            setIssues(prev => [payload.new as Issue, ...prev]);
            toast({
              title: "New Issue Reported",
              description: `${payload.new.title} - ${payload.new.category}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setIssues(prev => prev.map(issue => 
              issue.id === payload.new.id ? payload.new as Issue : issue
            ));
          } else if (payload.eventType === 'DELETE') {
            setIssues(prev => prev.filter(issue => issue.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching issues:', error);
        toast({
          title: "Error",
          description: "Failed to fetch issues from database.",
          variant: "destructive",
        });
        return;
      }

      setIssues(data.map(issue => ({
        ...issue,
        response_time: issue.response_time as string | null
      })) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort issues
  useEffect(() => {
    let filtered = issues.filter(issue => {
      const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           issue.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
      const matchesSpam = showSpam ? true : !issue.is_spam;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesSpam;
    });

    // Sort issues
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return b.priority_score - a.priority_score;
        case "upvotes":
          return b.upvotes_count - a.upvotes_count;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return b.priority_score - a.priority_score;
      }
    });

    setFilteredIssues(filtered);
  }, [issues, searchTerm, statusFilter, categoryFilter, showSpam, sortBy]);

  const handleStatusChange = async (
    issueId: number,
    newStatus: string,
  ) => {
    try {
      const updateData: any = { status: newStatus };
      
      // Calculate response time for resolved issues
      if (newStatus === 'resolved') {
        const issue = issues.find(i => i.id === issueId);
        if (issue) {
          const created = new Date(issue.created_at);
          const now = new Date();
          const diffMs = now.getTime() - created.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          
          if (diffDays > 0) {
            updateData.response_time = `${diffDays} days ${diffHours % 24} hours`;
          } else {
            updateData.response_time = `${diffHours} hours`;
          }
        }
      }

      const { error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', issueId);

      if (error) {
        console.error('Error updating status:', error);
        toast({
          title: "Error",
          description: "Failed to update issue status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: "Issue status has been updated successfully.",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSpamToggle = async (issueId: number, isSpam: boolean) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ is_spam: isSpam })
        .eq('id', issueId);

      if (error) {
        console.error('Error updating spam status:', error);
        toast({
          title: "Error",
          description: "Failed to update spam status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isSpam ? "Marked as Spam" : "Unmarked as Spam",
        description: "Issue spam status has been updated.",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAssignIssue = async (issueId: number, assignedTo: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ assigned_to: assignedTo })
        .eq('id', issueId);

      if (error) {
        console.error('Error assigning issue:', error);
        toast({
          title: "Error",
          description: "Failed to assign issue.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Issue Assigned",
        description: `Issue assigned to ${assignedTo}`,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredIssues);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Issues");
    XLSX.writeFile(workbook, "issues.xlsx");

    toast({
      title: "Export Successful",
      description: `${filteredIssues.length} reports have been exported.`,
    });
  };

  const totalIssues = filteredIssues.length;
  const newIssues = filteredIssues.filter((i) => i.status === "new").length;
  const inProgressIssues = filteredIssues.filter((i) => i.status === "in_progress").length;
  const resolvedIssues = filteredIssues.filter((i) => i.status === "resolved").length;
  const spamIssues = issues.filter((i) => i.is_spam).length;
  const totalUpvotes = filteredIssues.reduce((sum, issue) => sum + issue.upvotes_count, 0);
  const uniqueCategories = [...new Set(issues.map(i => i.category))];
  const highPriorityIssues = filteredIssues.filter(i => i.priority_score > 5).length;

  const getStatusBadgeVariant = (status: string) => {
    if (status === "new") return "destructive";
    if (status === "in_progress") return "default";
    if (status === "resolved") return "secondary";
    return "outline";
  };

  const getStatusIcon = (status: string) => {
    if (status === "new") return <AlertTriangle className="h-4 w-4" />;
    if (status === "in_progress") return <Clock className="h-4 w-4" />;
    if (status === "resolved") return <CheckCircle2 className="h-4 w-4" />;
    return null;
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading issues management...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate('/admin')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-muted/40 p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                Issues Management
              </h1>
              <p className="text-muted-foreground">Comprehensive issue tracking and management system</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIssues}</div>
              <p className="text-xs text-muted-foreground">Active reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Zap className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{highPriorityIssues}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community</CardTitle>
              <ThumbsUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{totalUpvotes}</div>
              <p className="text-xs text-muted-foreground">Total upvotes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className=".tsx flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressIssues}</div>
              <p className="text-xs text-muted-foreground">Being resolved</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedIssues}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spam Blocked</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{spamIssues}</div>
              <p className="text-xs text-muted-foreground">Auto-filtered</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-7">
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
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="upvotes">Most Upvoted</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showSpam"
                  checked={showSpam}
                  onChange={(e) => setShowSpam(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showSpam" className="text-sm">Show Spam</label>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleExport} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setShowSpam(false);
                  setSortBy("priority");
                }}
              >
                Clear Filters
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Issues ({filteredIssues.length})</span>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredIssues.length} of {issues.length} total issues
              </div>
            </CardTitle>
            <CardDescription>Complete issue management with real-time updates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue & Community</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status & Progress</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => (
                  <TableRow key={issue.id} className={issue.is_spam ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {issue.title}
                              {issue.is_spam && <Badge variant="destructive" className="text-xs">SPAM</Badge>}
                              {issue.duplicate_of && <Badge variant="outline" className="text-xs">DUPLICATE</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {issue.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-primary">
                              {issue.priority_score}
                            </div>
                            <div className="text-xs text-muted-foreground">Priority</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-blue-600">
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-sm font-medium">{issue.upvotes_count}</span>
                            <span className="text-xs text-muted-foreground">upvotes</span>
                          </div>
                          {issue.assigned_to && (
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Assigned: {issue.assigned_to}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{issue.category}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2">
                        <Badge variant={getStatusBadgeVariant(issue.status)} className="gap-1">
                          {getStatusIcon(issue.status)}
                          {issue.status.replace('_', ' ')}
                        </Badge>
                        {issue.response_time && (
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            Resolved in: {issue.response_time}
                          </div>
                        )}
                        {issue.public_notes && (
                          <div className="text-xs bg-gray-50 p-2 rounded">
                            <strong>Update:</strong> {issue.public_notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">
                          {issue.location_name || `${issue.latitude}, ${issue.longitude}`}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {issue.image_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImage(issue.image_url)}
                          className="h-8 w-8 p-0"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No image</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      <div>
                        <div className="font-medium">
                          {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: #{issue.id}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Status Management</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(issue.id, "new")}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Mark as New
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(issue.id, "in_progress")}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(issue.id, "resolved")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Resolved
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleSpamToggle(issue.id, !issue.is_spam)}
                            className={issue.is_spam ? "text-green-600" : "text-red-600"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {issue.is_spam ? "Unmark as Spam" : "Mark as Spam"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => {
                              const assignTo = prompt("Assign to (enter name):");
                              if (assignTo) handleAssignIssue(issue.id, assignTo);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Assign Issue
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => window.open(`https://maps.google.com/?q=${issue.latitude},${issue.longitude}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(`Issue #${issue.id}: ${issue.title}`);
                              toast({ title: "Copied to clipboard" });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Issue Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredIssues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {issues.length === 0 ? "No issues reported yet." : "No issues match the current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Issue Image</DialogTitle>
            <DialogDescription>
              Uploaded image for this issue report
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Issue"
                className="max-w-full max-h-[400px] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IssuesManagement;
