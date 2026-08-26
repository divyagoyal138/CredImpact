-- CredImpact PostgreSQL Database Schema & Seed Data

-- 1. Student Table
CREATE TABLE IF NOT EXISTS Student (
    studentid VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255),
    semester INT DEFAULT 1,
    department VARCHAR(100),
    creditcoins INT DEFAULT 0,
    collegecode VARCHAR(50),
    otp VARCHAR(10),
    createdat TIMESTAMP DEFAULT NOW()
);

-- 2. Admin Table
CREATE TABLE IF NOT EXISTS Admin (
    adminid VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    collegecode VARCHAR(50) NOT NULL,
    createdat TIMESTAMP DEFAULT NOW()
);

-- 3. Task / Event Table
CREATE TABLE IF NOT EXISTS Task (
    taskid SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    creditcoins INT DEFAULT 50,
    deadline VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    department VARCHAR(100),
    urgent BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    createdby VARCHAR(100),
    createdat TIMESTAMP DEFAULT NOW()
);

-- 4. Application Table
CREATE TABLE IF NOT EXISTS Application (
    applicationid SERIAL PRIMARY KEY,
    studentid VARCHAR(100) NOT NULL REFERENCES Student(studentid) ON DELETE CASCADE,
    taskid INT NOT NULL REFERENCES Task(taskid) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending',
    applieddate TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_student_task UNIQUE(studentid, taskid)
);

-- 5. Portfolio Table
CREATE TABLE IF NOT EXISTS Portfolio (
    portfolioid SERIAL PRIMARY KEY,
    studentid VARCHAR(100) UNIQUE NOT NULL REFERENCES Student(studentid) ON DELETE CASCADE,
    completedtasks INT DEFAULT 0,
    totalcredits INT DEFAULT 0,
    portfoliolink TEXT,
    updatedat TIMESTAMP DEFAULT NOW()
);

-- 6. Messages Table (Approved Admin Student Chat)
CREATE TABLE IF NOT EXISTS Messages (
    messageid SERIAL PRIMARY KEY,
    senderid VARCHAR(100) NOT NULL,
    receiverid VARCHAR(100) NOT NULL,
    senderrole VARCHAR(20) NOT NULL,
    taskid INT,
    messagetext TEXT NOT NULL,
    wordcount INT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW()
);

-- 7. CC Allocation History Table
CREATE TABLE IF NOT EXISTS CcAllocationHistory (
    allocationid SERIAL PRIMARY KEY,
    taskid INT NOT NULL,
    tasktitle VARCHAR(255) NOT NULL,
    ccamount INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    adminid VARCHAR(100) NOT NULL,
    adminname VARCHAR(100) NOT NULL,
    studentcount INT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW()
);

-- 8. CC Allocation Students Table
CREATE TABLE IF NOT EXISTS CcAllocationStudents (
    id SERIAL PRIMARY KEY,
    allocationid INT NOT NULL REFERENCES CcAllocationHistory(allocationid) ON DELETE CASCADE,
    studentid VARCHAR(100) NOT NULL,
    studentname VARCHAR(255),
    studentemail VARCHAR(255),
    department VARCHAR(100),
    ccawarded INT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Seed Data Insertion
-- ---------------------------------------------------------

-- Seed Admin
INSERT INTO Admin (adminid, name, email, collegecode)
VALUES ('ADM001', 'Wilson Rao', 'WR@jhc.com', 'JHC')
ON CONFLICT (adminid) DO NOTHING;

-- Seed Students
INSERT INTO Student (studentid, name, email, phone, password, semester, department, creditcoins, collegecode, otp)
VALUES 
    ('2023CSE045', 'Aarav Patel', 'aarav@kjsce.edu', '9876543210', '7391', 5, 'Computer Science', 150, 'JHC', '7391'),
    ('2023CSE012', 'Ananya Sharma', 'ananya@kjsce.edu', '9876543211', '7391', 5, 'Computer Science', 210, 'JHC', '7391'),
    ('2023IT008', 'Rohan Mehta', 'rohan@kjsce.edu', '9876543212', '7391', 3, 'IT Dept', 180, 'JHC', '7391'),
    ('2023BSC004', 'Priya Singh', 'priya@kjsce.edu', '9876543213', '7391', 4, 'BSCIT', 120, 'JHC', '7391'),
    ('2023ADM002', 'Karan Verma', 'karan@kjsce.edu', '9876543214', '7391', 2, 'Admin', 90, 'JHC', '7391')
ON CONFLICT (studentid) DO NOTHING;

-- Seed Tasks
INSERT INTO Task (taskid, title, description, creditcoins, deadline, status, department, urgent, category, createdby)
VALUES 
    (1, 'Design poster for Tech Fest 2025', 'Create promotional graphics and social banners for upcoming campus tech symposium.', 50, '2026-08-30', 'open', 'Computer Science', TRUE, 'Design', 'ADM001'),
    (2, 'Annual Hackathon Volunteer & Registration', 'Assist in managing registration counters and team onboarding for national hackathon.', 100, '2026-09-05', 'open', 'BSCIT', FALSE, 'Event Help', 'ADM001'),
    (3, 'Library Book Digitization & Cataloging', 'Help library staff scan and index rare historical research reference papers.', 40, '2026-08-28', 'completed', 'Library', FALSE, 'Admin', 'ADM001')
ON CONFLICT (taskid) DO NOTHING;

-- Seed Applications
INSERT INTO Application (applicationid, studentid, taskid, status, applieddate)
VALUES 
    (1, '2023CSE045', 1, 'Approved', NOW() - INTERVAL '2 days'),
    (2, '2023CSE012', 1, 'Pending', NOW() - INTERVAL '1 day'),
    (3, '2023IT008', 1, 'Approved', NOW()),
    (4, '2023BSC004', 2, 'Approved', NOW() - INTERVAL '3 days')
ON CONFLICT (applicationid) DO NOTHING;

-- Seed Portfolios
INSERT INTO Portfolio (studentid, completedtasks, totalcredits, portfoliolink)
VALUES 
    ('2023CSE045', 3, 150, 'https://portfolio.example.com/2023CSE045'),
    ('2023CSE012', 4, 210, 'https://portfolio.example.com/2023CSE012'),
    ('2023IT008', 2, 180, 'https://portfolio.example.com/2023IT008')
ON CONFLICT (studentid) DO NOTHING;

-- Seed Sample Allocation History
INSERT INTO CcAllocationHistory (allocationid, taskid, tasktitle, ccamount, department, venue, adminid, adminname, studentcount, createdat)
VALUES 
    (1, 1, 'Design poster for Tech Fest 2025', 50, 'Computer Science', 'Design Lab 304, IT Block', 'ADM001', 'Wilson Rao', 3, NOW() - INTERVAL '1 day'),
    (2, 2, 'Annual Hackathon Volunteer & Registration', 100, 'BSCIT', 'Main Campus Auditorium', 'ADM001', 'Wilson Rao', 2, NOW() - INTERVAL '5 days')
ON CONFLICT (allocationid) DO NOTHING;

INSERT INTO CcAllocationStudents (allocationid, studentid, studentname, studentemail, department, ccawarded)
VALUES 
    (1, '2023CSE045', 'Aarav Patel', 'aarav@kjsce.edu', 'Computer Science', 50),
    (1, '2023CSE012', 'Ananya Sharma', 'ananya@kjsce.edu', 'Computer Science', 50),
    (1, '2023IT008', 'Rohan Mehta', 'rohan@kjsce.edu', 'IT Dept', 50),
    (2, '2023BSC004', 'Priya Singh', 'priya@kjsce.edu', 'BSCIT', 100),
    (2, '2023ADM002', 'Karan Verma', 'karan@kjsce.edu', 'Admin', 100)
ON CONFLICT (id) DO NOTHING;

