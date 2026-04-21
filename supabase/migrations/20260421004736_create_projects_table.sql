/*
  # Create projects table

  Stores VlogAI project metadata so state persists across sessions.

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `rushes` (text[], list of imported filenames)
      - `duration` (numeric, seconds)
      - `module_settings` (jsonb, active module flags)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Public read/write for prototype (no auth required)
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Nouveau projet',
  rushes text[] NOT NULL DEFAULT '{}',
  duration numeric NOT NULL DEFAULT 0,
  module_settings jsonb NOT NULL DEFAULT '{"smartCut":true,"subtitles":true,"moodSync":false,"eyeContact":false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON projects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
