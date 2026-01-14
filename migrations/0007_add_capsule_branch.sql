-- Add branch column to capsules table
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS branch TEXT;

-- Create index for branch column
CREATE INDEX IF NOT EXISTS idx_capsules_branch ON capsules(branch);

-- Update existing capsules (C1-C26) to have 'Pelangi' branch
UPDATE capsules SET branch = 'Pelangi' WHERE number LIKE 'C%' AND branch IS NULL;

-- Insert new JB capsules (J1-J4)
INSERT INTO capsules (number, section, position, branch, is_available, cleaning_status, to_rent) VALUES
  ('J1', 'middle', 'top', 'JB', true, 'cleaned', true),
  ('J2', 'middle', 'bottom', 'JB', true, 'cleaned', true),
  ('J3', 'middle', 'top', 'JB', true, 'cleaned', true),
  ('J4', 'middle', 'bottom', 'JB', true, 'cleaned', true)
ON CONFLICT (number) DO NOTHING;

-- Insert new JB rooms (R1-R6)
INSERT INTO capsules (number, section, branch, is_available, cleaning_status, to_rent) VALUES
  ('R1', 'middle', 'JB', true, 'cleaned', true),
  ('R2', 'middle', 'JB', true, 'cleaned', true),
  ('R3', 'middle', 'JB', true, 'cleaned', true),
  ('R4', 'middle', 'JB', true, 'cleaned', true),
  ('R5', 'middle', 'JB', true, 'cleaned', true),
  ('R6', 'middle', 'JB', true, 'cleaned', true)
ON CONFLICT (number) DO NOTHING;
