
CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT ALL ON public.forum_categories TO service_role;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are readable by everyone" ON public.forum_categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('story','question')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_posts_category_created_idx ON public.forum_posts(category_id, created_at DESC);
CREATE INDEX forum_posts_created_idx ON public.forum_posts(created_at DESC);
GRANT SELECT, INSERT ON public.forum_posts TO anon, authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are readable by everyone" ON public.forum_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create posts" ON public.forum_posts FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_replies_post_idx ON public.forum_replies(post_id, created_at ASC);
GRANT SELECT, INSERT ON public.forum_replies TO anon, authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies are readable by everyone" ON public.forum_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can reply" ON public.forum_replies FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.forum_categories (slug, name, description, sort_order) VALUES
  ('perimenopause', 'Perimenopause', 'Early changes, cycles, mood, sleep', 1),
  ('symptoms', 'Symptoms', 'Hot flushes, brain fog, joint pain and more', 2),
  ('hrt', 'HRT & Treatments', 'Experiences with HRT, alternatives, side effects', 3),
  ('gp-appointments', 'GP Appointments', 'What worked, what didn''t, advocating for yourself', 4),
  ('mental-health', 'Mental Health', 'Anxiety, low mood, and emotional wellbeing', 5),
  ('lifestyle', 'Lifestyle & Wellbeing', 'Exercise, nutrition, sleep, relationships', 6);
