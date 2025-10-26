-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  poll_type TEXT NOT NULL CHECK (poll_type IN ('text', 'date', 'image', 'sticker')),
  is_public BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'draft')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  allow_add_options BOOLEAN DEFAULT false,
  minimum_votes INTEGER DEFAULT 1,
  maximum_votes INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT,
  image_url TEXT,
  sticker_url TEXT,
  date_value DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Anyone can view active polls"
    ON polls FOR SELECT
    USING (status = 'active' AND is_public = true);

CREATE POLICY "Users can view their own polls"
    ON polls FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create polls"
    ON polls FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls"
    ON polls FOR UPDATE
    USING (auth.uid() = created_by);

-- RLS Policies for poll_options
CREATE POLICY "Anyone can view poll options for active polls"
    ON poll_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.status = 'active'
        )
    );

CREATE POLICY "Users can create options for polls they created"
    ON poll_options FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.created_by = auth.uid()
        )
    );

-- RLS Policies for poll_votes
CREATE POLICY "Users can view their own votes"
    ON poll_votes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view vote counts for active polls"
    ON poll_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_votes.poll_id 
            AND polls.status = 'active'
        )
    );

CREATE POLICY "Authenticated users can vote"
    ON poll_votes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_votes.poll_id 
            AND polls.status = 'active'
            AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
        )
    );

CREATE POLICY "Users can delete their own votes"
    ON poll_votes FOR DELETE
    USING (auth.uid() = user_id);
