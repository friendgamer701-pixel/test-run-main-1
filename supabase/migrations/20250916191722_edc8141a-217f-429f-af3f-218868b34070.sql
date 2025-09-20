-- Add community upvotes table
CREATE TABLE public.issue_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id BIGINT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_ip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_ip)
);

-- Enable RLS on upvotes table
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing upvotes
CREATE POLICY "Anyone can view upvotes" 
ON public.issue_upvotes 
FOR SELECT 
USING (true);

-- Create policy for creating upvotes
CREATE POLICY "Anyone can create upvotes" 
ON public.issue_upvotes 
FOR INSERT 
WITH CHECK (true);

-- Add spam detection and community features to issues table
ALTER TABLE public.issues 
ADD COLUMN upvotes_count INTEGER DEFAULT 0,
ADD COLUMN is_spam BOOLEAN DEFAULT false,
ADD COLUMN duplicate_of BIGINT REFERENCES public.issues(id),
ADD COLUMN priority_score INTEGER DEFAULT 0,
ADD COLUMN response_time INTERVAL,
ADD COLUMN assigned_to TEXT,
ADD COLUMN public_notes TEXT;

-- Create function to update upvotes count
CREATE OR REPLACE FUNCTION public.update_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.issues 
    SET upvotes_count = upvotes_count + 1,
        priority_score = upvotes_count + 1
    WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.issues 
    SET upvotes_count = GREATEST(upvotes_count - 1, 0),
        priority_score = GREATEST(upvotes_count - 1, 0)
    WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for upvotes count
CREATE TRIGGER update_upvotes_count_trigger
  AFTER INSERT OR DELETE ON public.issue_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_upvotes_count();

-- Enable real-time for issues table
ALTER TABLE public.issues REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.issues;

-- Enable real-time for upvotes table
ALTER TABLE public.issue_upvotes REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.issue_upvotes;

-- Create function to detect potential duplicates
CREATE OR REPLACE FUNCTION public.find_similar_issues(
  input_title TEXT,
  input_description TEXT,
  input_category TEXT,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE(
  issue_id BIGINT,
  title TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    GREATEST(
      similarity(i.title, input_title),
      similarity(i.description, input_description)
    ) as sim_score
  FROM public.issues i
  WHERE i.category = input_category
    AND i.is_spam = false
    AND GREATEST(
      similarity(i.title, input_title),
      similarity(i.description, input_description)
    ) > similarity_threshold
  ORDER BY sim_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance
CREATE INDEX idx_issues_category_spam ON public.issues(category, is_spam);
CREATE INDEX idx_issues_priority ON public.issues(priority_score DESC, created_at DESC);
CREATE INDEX idx_issues_status_created ON public.issues(status, created_at DESC);