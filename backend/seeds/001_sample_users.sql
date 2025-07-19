-- Sample users data for development
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, country, email_verified, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'User', 'admin@airvik.com', '+1234567890', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wdgpt0AvgM9OHkS.fI4/j9gJA7TrX.', 'US', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-2222-2222-222222222222', 'John', 'Doe', 'john@example.com', '+1987654321', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wdgpt0AvgM9OHkS.fI4/j9gJA7TrX.', 'UK', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-3333-3333-333333333333', 'Jane', 'Smith', 'jane@example.com', '+1122334455', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wdgpt0AvgM9OHkS.fI4/j9gJA7TrX.', 'CA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Note: All passwords are set to 'password123' for testing purposes
-- The password_hash is a bcrypt hash that should be replaced in production
