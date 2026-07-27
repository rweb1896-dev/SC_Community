INSERT INTO categories (name, description)
VALUES
  ('Health Help', 'Requests and resources for medical help, blood donation, care, and wellness.'),
  ('Job Updates', 'Career opportunities, referrals, exam alerts, and professional guidance.'),
  ('Business Growth', 'Local businesses, entrepreneurship, vendor support, and collaboration.'),
  ('Open Forum/SOS', 'Community discussions, urgent support, and open announcements.')
ON CONFLICT (name) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_phone_number
  ON users (phone_number)
  WHERE phone_number IS NOT NULL;
