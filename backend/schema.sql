
-- This matches the user's actual database structure
-- Student table (as created by user)
-- Columns: studentid, name, email, phone, password, semester, department, creditcoins, createdat, collegecode, otp

-- Insert dummy data if not exists
INSERT INTO Student (studentid, name, email, phone, password, semester, department, creditcoins, collegecode, otp)
VALUES ('2023CSE045', 'Dummy Student', 'student@kjsce.edu', '9876543210', '7391', 5, 'Computer Science', 100, 'KJSCE', '7391')
ON CONFLICT (studentid) DO NOTHING;
