-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_upvotes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;