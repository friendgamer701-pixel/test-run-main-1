import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IssueUpvoteProps {
  issueId: number;
  initialUpvotes: number;
  className?: string;
}

export const IssueUpvote = ({ issueId, initialUpvotes, className = "" }: IssueUpvoteProps) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get user's IP for tracking upvotes (simple spam prevention)
  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return `anonymous-${Date.now()}`; // Fallback
    }
  };

  // Check if user has already upvoted
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      const userIP = await getUserIP();
      const { data } = await supabase
        .from('issue_upvotes')
        .select('id')
        .eq('issue_id', issueId)
        .eq('user_ip', userIP)
        .maybeSingle();
      
      setHasUpvoted(!!data);
    };

    checkUpvoteStatus();
  }, [issueId]);

  const handleUpvote = async () => {
    if (loading) return;
    
    setLoading(true);
    const userIP = await getUserIP();

    try {
      if (hasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .eq('issue_id', issueId)
          .eq('user_ip', userIP);

        if (error) {
          console.error('Error removing upvote:', error);
          toast({
            title: "Error",
            description: "Failed to remove upvote. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setUpvotes(prev => prev - 1);
        setHasUpvoted(false);
        toast({
          title: "Upvote Removed",
          description: "Your support has been removed from this issue.",
        });
      } else {
        // Add upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({
            issue_id: issueId,
            user_ip: userIP,
          });

        if (error) {
          console.error('Error adding upvote:', error);
          toast({
            title: "Error", 
            description: "Failed to upvote. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setUpvotes(prev => prev + 1);
        setHasUpvoted(true);
        toast({
          title: "Thank You!",
          description: "Your support helps prioritize this issue.",
        });
      }
    } catch (error) {
      console.error('Upvote error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={hasUpvoted ? "default" : "outline"}
      size="sm"
      onClick={handleUpvote}
      disabled={loading}
      className={`flex items-center gap-2 ${className}`}
    >
      <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? "fill-current" : ""}`} />
      <span>{upvotes}</span>
      <span className="hidden sm:inline">
        {hasUpvoted ? "Supported" : "Support"}
      </span>
    </Button>
  );
};