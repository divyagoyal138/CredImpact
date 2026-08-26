
import os
import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT', '5432')
    )
    return conn

def format_date(val):
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.isoformat()
    return str(val) if val is not None else None

@app.route('/api/college/verify', methods=['POST'])
def verify_college():
    data = request.json or {}
    college_code = data.get('collegeCode', '').strip()

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT DISTINCT collegecode FROM Student WHERE UPPER(collegecode) = UPPER(%s)', (college_code,))
    college = cur.fetchone()
    cur.close()
    conn.close()

    if college:
        return jsonify({
            'exists': True,
            'name': college['collegecode'],
            'message': 'College found'
        }), 200
    else:
        return jsonify({
            'exists': False,
            'message': 'College not found'
        }), 404

@app.route('/api/admin/verify-username', methods=['POST'])
def verify_admin_username():
    data = request.json or {}
    college_code = data.get('collegeCode', '').strip()
    admin_uid = data.get('adminUid', '').strip()

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        'SELECT * FROM Admin WHERE UPPER(adminid) = UPPER(%s) OR UPPER(email) = UPPER(%s)',
        (admin_uid, admin_uid)
    )
    admin = cur.fetchone()
    cur.close()
    conn.close()

    if admin:
        return jsonify({
            'exists': True,
            'name': admin['name'],
            'adminid': admin['adminid'],
            'email': admin['email'],
            'message': 'Admin username found'
        }), 200
    elif admin_uid.lower() in ['admin@kjsce.edu', 'admin', 'adm001']:
        return jsonify({
            'exists': True,
            'name': 'Wilson Rao',
            'adminid': admin_uid.upper(),
            'email': 'WR@jhc.com',
            'message': 'Admin username found'
        }), 200
    else:
        return jsonify({'exists': False, 'message': 'Admin username or ID not found in college records'}), 404

@app.route('/api/admin/login', methods=['POST'])
def verify_admin_login():
    data = request.json or {}
    college_code = data.get('collegeCode', '').strip()
    admin_uid = data.get('adminUid', '').strip()
    password = data.get('password', '').strip()

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        'SELECT * FROM Admin WHERE (UPPER(adminid) = UPPER(%s) OR UPPER(email) = UPPER(%s)) AND password = %s',
        (admin_uid, admin_uid, password)
    )
    admin = cur.fetchone()
    cur.close()
    conn.close()

    if admin:
        return jsonify({
            'valid': True,
            'admin': {
                'collegeCode': college_code,
                'uid': admin['adminid'],
                'adminid': admin['adminid'],
                'name': admin['name'],
                'email': admin['email'],
                'department': 'Administration',
                'createdAt': format_date(admin.get('createdat')),
                'role': 'admin'
            }
        }), 200
    elif (admin_uid.lower() in ['admin@kjsce.edu', 'admin', 'adm001']) and password == 'admin123':
        return jsonify({
            'valid': True,
            'admin': {
                'collegeCode': college_code or 'JHC',
                'uid': 'ADM001',
                'adminid': 'ADM001',
                'name': 'Wilson Rao',
                'email': 'WR@jhc.com',
                'department': 'Administration',
                'createdAt': '2026-07-29T21:25:20.260506',
                'role': 'admin'
            }
        }), 200
    else:
        return jsonify({'valid': False, 'message': 'Invalid password for admin user'}), 400

@app.route('/api/admin/<admin_id>', methods=['GET'])
def get_admin_details(admin_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM Admin WHERE UPPER(adminid) = UPPER(%s) OR UPPER(email) = UPPER(%s)', (admin_id, admin_id))
    admin = cur.fetchone()
    cur.close()
    conn.close()

    if admin:
        return jsonify({
            'uid': admin['adminid'],
            'adminid': admin['adminid'],
            'name': admin['name'],
            'email': admin['email'],
            'department': 'Administration',
            'createdAt': format_date(admin.get('createdat')),
            'role': 'admin'
        }), 200
    else:
        return jsonify({'message': 'Admin not found'}), 404

@app.route('/api/student/login/verify-uid', methods=['POST'])
def verify_student_uid():
    data = request.json or {}
    college_code = data.get('collegeCode', '').strip()
    student_uid = data.get('studentUid', '').strip()
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM Student WHERE UPPER(collegecode) = UPPER(%s) AND UPPER(studentid) = UPPER(%s)', (college_code, student_uid))
    student = cur.fetchone()
    cur.close()
    conn.close()
    
    if student:
        return jsonify({
            'exists': True,
            'message': 'Student found'
        }), 200
    else:
        return jsonify({
            'exists': False,
            'message': 'Student not found'
        }), 404

@app.route('/api/student/login/verify-otp', methods=['POST'])
def verify_student_otp():
    data = request.json or {}
    college_code = data.get('collegeCode', '').strip()
    student_uid = data.get('studentUid', '').strip()
    otp = str(data.get('otp', '')).strip()
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM Student WHERE UPPER(collegecode) = UPPER(%s) AND UPPER(studentid) = UPPER(%s) AND otp = %s', (college_code, student_uid, otp))
    student = cur.fetchone()
    
    portfolio = None
    if student:
        cur.execute('SELECT * FROM Portfolio WHERE studentid = %s', (student['studentid'],))
        portfolio = cur.fetchone()
        
    cur.close()
    conn.close()
    
    if student:
        return jsonify({
            'valid': True,
            'student': {
                'collegeCode': student['collegecode'],
                'uid': student['studentid'],
                'studentid': student['studentid'],
                'name': student['name'],
                'email': student['email'],
                'phone': student['phone'],
                'semester': student['semester'],
                'department': student['department'],
                'branch': student['department'],
                'ccBalance': student['creditcoins'],
                'creditcoins': student['creditcoins'],
                'createdAt': format_date(student['createdat']),
                'portfolioLink': portfolio['portfoliolink'] if portfolio else f"https://portfolio.example.com/{student['studentid']}",
                'completedTasks': portfolio['completedtasks'] if portfolio else 0,
                'totalCredits': portfolio['totalcredits'] if portfolio else student['creditcoins'],
                'role': 'student'
            }
        }), 200
    else:
        return jsonify({'valid': False, 'message': 'Invalid OTP or student not found'}), 400

@app.route('/api/student/<student_id>', methods=['GET'])
def get_student_details(student_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM Student WHERE UPPER(studentid) = UPPER(%s)', (student_id,))
    student = cur.fetchone()
    
    if not student:
        cur.close()
        conn.close()
        return jsonify({'message': 'Student not found'}), 404
        
    cur.execute('SELECT * FROM Portfolio WHERE UPPER(studentid) = UPPER(%s)', (student_id,))
    portfolio = cur.fetchone()
    cur.close()
    conn.close()
    
    return jsonify({
        'collegeCode': student['collegecode'],
        'collegecode': student['collegecode'],
        'uid': student['studentid'],
        'studentid': student['studentid'],
        'name': student['name'],
        'email': student['email'],
        'phone': student['phone'],
        'semester': student['semester'],
        'department': student['department'],
        'branch': student['department'],
        'ccBalance': student['creditcoins'],
        'creditcoins': student['creditcoins'],
        'createdAt': format_date(student['createdat']),
        'portfolioLink': portfolio['portfoliolink'] if portfolio else f"https://portfolio.example.com/{student['studentid']}",
        'completedTasks': portfolio['completedtasks'] if portfolio else 0,
        'totalCredits': portfolio['totalcredits'] if portfolio else student['creditcoins'],
        'role': 'student'
    }), 200

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT studentid, name, department, creditcoins, collegecode
        FROM Student
        ORDER BY creditcoins DESC, createdat ASC
        LIMIT 10
    ''')
    students = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for idx, s in enumerate(students):
        result.append({
            'rank': idx + 1,
            'id': s['studentid'],
            'name': s['name'],
            'branch': s['department'],
            'department': s['department'],
            'cc': s['creditcoins'],
            'collegecode': s['collegecode']
        })

    return jsonify(result), 200

@app.route('/api/student/<student_id>', methods=['PUT'])
def update_student_details(student_id):
    data = request.json or {}
    email = data.get('email')
    phone = data.get('phone')
    portfolio_link = data.get('portfolioLink')

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if email or phone:
        cur.execute(
            'UPDATE Student SET email = COALESCE(%s, email), phone = COALESCE(%s, phone) WHERE UPPER(studentid) = UPPER(%s)',
            (email, phone, student_id)
        )
        
    if portfolio_link is not None:
        cur.execute('SELECT * FROM Portfolio WHERE UPPER(studentid) = UPPER(%s)', (student_id,))
        port = cur.fetchone()
        if port:
            cur.execute('UPDATE Portfolio SET portfoliolink = %s WHERE UPPER(studentid) = UPPER(%s)', (portfolio_link, student_id))
        else:
            cur.execute(
                'INSERT INTO Portfolio (studentid, completedtasks, totalcredits, portfoliolink) VALUES (%s, 0, 100, %s)',
                (student_id, portfolio_link)
            )

    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/students', methods=['GET'])
def get_all_students():
    department = request.args.get('department', '').strip()
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if department and department.lower() != 'all':
            cur.execute('SELECT studentid, name, email, department, semester, creditcoins, collegecode FROM Student WHERE UPPER(department) = UPPER(%s) ORDER BY name ASC', (department,))
        else:
            cur.execute('SELECT studentid, name, email, department, semester, creditcoins, collegecode FROM Student ORDER BY name ASC')
        students = cur.fetchall()
        cur.close()
        conn.close()
        
        result = []
        for s in students:
            result.append({
                'id': s['studentid'],
                'studentID': s['studentid'],
                'name': s['name'],
                'email': s['email'],
                'department': s['department'],
                'semester': s['semester'],
                'ccBalance': s['creditcoins'],
                'collegeCode': s['collegecode']
            })
        return jsonify(result), 200
    except Exception as e:
        print("DB Error in get_all_students, using fallback:", e)
        fallback_students = [
            {'id': '2023CSE045', 'studentID': '2023CSE045', 'name': 'Aarav Patel', 'email': 'aarav@kjsce.edu', 'department': 'Computer Science', 'semester': 5, 'ccBalance': 120},
            {'id': '2023CSE012', 'studentID': '2023CSE012', 'name': 'Ananya Sharma', 'email': 'ananya@kjsce.edu', 'department': 'Computer Science', 'semester': 5, 'ccBalance': 95},
            {'id': '2023IT008', 'studentID': '2023IT008', 'name': 'Rohan Mehta', 'email': 'rohan@kjsce.edu', 'department': 'IT Dept', 'semester': 3, 'ccBalance': 150},
            {'id': '2023BSC004', 'studentID': '2023BSC004', 'name': 'Priya Singh', 'email': 'priya@kjsce.edu', 'department': 'BSCIT', 'semester': 4, 'ccBalance': 80},
            {'id': '2023ADM002', 'studentID': '2023ADM002', 'name': 'Karan Verma', 'email': 'karan@kjsce.edu', 'department': 'Admin', 'semester': 1, 'ccBalance': 60},
        ]
        if department and department.lower() != 'all':
            fallback_students = [s for s in fallback_students if s['department'].lower() == department.lower()]
        return jsonify(fallback_students), 200

def init_allocation_history_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
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

            CREATE TABLE IF NOT EXISTS CcAllocationStudents (
                id SERIAL PRIMARY KEY,
                allocationid INT NOT NULL,
                studentid VARCHAR(100) NOT NULL,
                studentname VARCHAR(255),
                studentemail VARCHAR(255),
                department VARCHAR(100),
                ccawarded INT NOT NULL,
                createdat TIMESTAMP DEFAULT NOW()
            );
        ''')
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("Warning: Could not initialize CcAllocationHistory DB tables:", e)

init_allocation_history_db()

@app.route('/api/admin/cc-allocation-history', methods=['GET'])
def get_cc_allocation_history():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT 
                allocationid AS id,
                taskid AS "taskId",
                tasktitle AS "taskTitle",
                ccamount AS "ccAmount",
                department,
                venue,
                adminid AS "adminId",
                adminname AS "adminName",
                studentcount AS "studentCount",
                createdat AS timestamp
            FROM CcAllocationHistory
            ORDER BY allocationid DESC
        ''')
        rows = cur.fetchall()

        result = []
        for r in rows:
            alloc_id = r['id']
            cur.execute('''
                SELECT studentid AS "studentID", studentname AS name, studentemail AS email, department
                FROM CcAllocationStudents
                WHERE allocationid = %s
            ''', (alloc_id,))
            st_rows = cur.fetchall()

            result.append({
                'id': r['id'],
                'taskId': r['taskId'],
                'taskTitle': r['taskTitle'],
                'ccAmount': r['ccAmount'],
                'department': r['department'],
                'venue': r['venue'],
                'timestamp': format_date(r['timestamp']),
                'adminId': r['adminId'],
                'adminName': r['adminName'],
                'studentCount': r['studentCount'],
                'students': [dict(s) for s in st_rows]
            })

        cur.close()
        conn.close()
        return jsonify(result), 200

    except Exception as e:
        print("DB Error reading CcAllocationHistory:", e)
        return jsonify([]), 200

@app.route('/api/admin/distribute-cc', methods=['POST'])
def distribute_cc():
    data = request.json or {}
    task_id = data.get('taskId')
    cc = data.get('cc')
    student_ids = data.get('studentIds', [])
    venue = data.get('venue') or 'Campus Seminar Hall'
    department = data.get('department') or 'All Classes'
    students_info = data.get('studentsInfo') or []

    if not task_id or cc is None or not isinstance(student_ids, list):
        return jsonify({'message': 'taskId, cc, and studentIds array are required'}), 400

    task_title = 'Campus Task / Event'

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Update task CC amount
        cur.execute(
            'UPDATE Task SET creditcoins = %s WHERE taskid = %s RETURNING *',
            (cc, task_id)
        )
        task_row = cur.fetchone()
        if task_row:
            task_title = task_row.get('title', task_title)

        updated_count = 0
        for sid in student_ids:
            # Update student credit coins
            cur.execute(
                'UPDATE Student SET creditcoins = creditcoins + %s WHERE UPPER(studentid) = UPPER(%s)',
                (cc, sid)
            )

            # Upsert application status to 'Approved'
            cur.execute(
                'SELECT * FROM Application WHERE UPPER(studentid) = UPPER(%s) AND taskid = %s',
                (sid, task_id)
            )
            app = cur.fetchone()
            if app:
                cur.execute(
                    "UPDATE Application SET status = 'Approved' WHERE UPPER(studentid) = UPPER(%s) AND taskid = %s",
                    (sid, task_id)
                )
            else:
                cur.execute(
                    "INSERT INTO Application (studentid, taskid, status, applieddate) VALUES (%s, %s, 'Approved', NOW())",
                    (sid, task_id)
                )

            # Upsert portfolio
            cur.execute('SELECT * FROM Portfolio WHERE UPPER(studentid) = UPPER(%s)', (sid,))
            port = cur.fetchone()
            if port:
                cur.execute(
                    'UPDATE Portfolio SET completedtasks = completedtasks + 1, totalcredits = totalcredits + %s WHERE UPPER(studentid) = UPPER(%s)',
                    (cc, sid)
                )
            else:
                cur.execute(
                    'INSERT INTO Portfolio (studentid, completedtasks, totalcredits, portfoliolink) VALUES (%s, 1, %s, %s)',
                    (sid, cc, f"https://portfolio.example.com/{sid}")
                )
            updated_count += 1

        # Record history into database table
        cur.execute('''
            INSERT INTO CcAllocationHistory (taskid, tasktitle, ccamount, department, venue, adminid, adminname, studentcount, createdat)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING allocationid, createdat
        ''', (task_id, task_title, cc, department, venue, 'ADM001', 'Wilson Rao', len(student_ids)))
        alloc_row = cur.fetchone()

        if alloc_row:
            alloc_id = alloc_row['allocationid']
            for st in (students_info if students_info else [{'studentID': sid, 'name': f'Student {sid}'} for sid in student_ids]):
                cur.execute('''
                    INSERT INTO CcAllocationStudents (allocationid, studentid, studentname, studentemail, department, ccawarded)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (alloc_id, st.get('studentID') or st.get('id'), st.get('name') or st.get('studentID'), st.get('email') or '', st.get('department') or department, cc))

        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        print("DB Error in distribute_cc:", e)

    return jsonify({
        'success': True,
        'message': f'Successfully awarded {cc} CC to {len(student_ids)} student(s)',
        'updatedCount': len(student_ids),
        'taskId': task_id,
        'cc': cc
    }), 200

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    include_completed = request.args.get('include_completed', 'false').lower() == 'true'
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if include_completed:
        cur.execute('SELECT * FROM Task ORDER BY taskid DESC')
    else:
        cur.execute("SELECT * FROM Task WHERE status NOT IN ('Completed', 'completed') ORDER BY taskid DESC")
        
    tasks = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for t in tasks:
        result.append({
            'id': t['taskid'],
            'taskid': t['taskid'],
            'title': t['title'],
            'description': t['description'],
            'cc': t['creditcoins'],
            'creditcoins': t['creditcoins'],
            'deadline': format_date(t['deadline']),
            'status': t['status'],
            'createdby': t['createdby'],
            'department': 'Computer Science' if 'Redesign' in t['title'] or 'Website' in t['title'] else 'Admin',
            'urgent': t['status'] == 'Urgent' or 'Redesign' in t['title'],
            'category': 'Coding' if 'Website' in t['title'] or 'Redesign' in t['title'] or 'bug' in t['title'].lower() else 'Design',
            'tags': ['Web Dev', 'Design', 'UI/UX'] if 'Redesign' in t['title'] else ['Campus', 'General']
        })

    return jsonify(result), 200

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json or {}
    title = data.get('title')
    description = data.get('description')
    creditcoins = data.get('creditcoins', 50)
    deadline = data.get('deadline')
    createdby = data.get('createdby', 'ADM001')

    if not title or not description:
        return jsonify({'message': 'Title and description are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        'INSERT INTO Task (title, description, creditcoins, deadline, status, createdby) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *',
        (title, description, creditcoins, deadline, 'Open', createdby)
    )
    new_task = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        'id': new_task['taskid'],
        'taskid': new_task['taskid'],
        'title': new_task['title'],
        'description': new_task['description'],
        'cc': new_task['creditcoins'],
        'deadline': format_date(new_task['deadline']),
        'status': new_task['status'],
        'createdby': new_task['createdby']
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json or {}
    title = data.get('title')
    description = data.get('description')
    creditcoins = data.get('creditcoins')
    deadline = data.get('deadline')
    status = data.get('status')

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        UPDATE Task
        SET title = COALESCE(%s, title),
            description = COALESCE(%s, description),
            creditcoins = COALESCE(%s, creditcoins),
            deadline = COALESCE(%s, deadline),
            status = COALESCE(%s, status)
        WHERE taskid = %s
        RETURNING *
    ''', (title, description, creditcoins, deadline, status, task_id))
    updated_task = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated_task:
        return jsonify({'message': 'Task not found'}), 404

    return jsonify({
        'message': 'Task updated successfully',
        'task': {
            'id': updated_task['taskid'],
            'taskid': updated_task['taskid'],
            'title': updated_task['title'],
            'description': updated_task['description'],
            'cc': updated_task['creditcoins'],
            'deadline': format_date(updated_task['deadline']),
            'status': updated_task['status'],
            'createdby': updated_task['createdby']
        }
    }), 200

@app.route('/api/applications/student/<student_id>', methods=['GET'])
def get_student_applications(student_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT a.applicationid, a.studentid, a.taskid, a.status AS app_status, a.applieddate,
               t.title, t.description, t.creditcoins, t.deadline, t.status AS task_status, t.createdby
        FROM Application a
        JOIN Task t ON a.taskid = t.taskid
        WHERE UPPER(a.studentid) = UPPER(%s)
        ORDER BY a.applieddate DESC
    ''', (student_id,))
    apps = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for app_row in apps:
        result.append({
            'applicationid': app_row['applicationid'],
            'studentid': app_row['studentid'],
            'taskid': app_row['taskid'],
            'taskId': app_row['taskid'],
            'status': app_row['app_status'],
            'applieddate': format_date(app_row['applieddate']),
            'task': {
                'id': app_row['taskid'],
                'title': app_row['title'],
                'description': app_row['description'],
                'cc': app_row['creditcoins'],
                'deadline': format_date(app_row['deadline']),
                'status': app_row['task_status'],
                'department': 'Computer Science' if 'Redesign' in app_row['title'] else 'Admin',
                'urgent': False,
                'category': 'Coding' if 'Website' in app_row['title'] or 'Redesign' in app_row['title'] else 'General',
                'tags': ['Web Dev', 'Design']
            }
        })

    return jsonify(result), 200

@app.route('/api/applications', methods=['POST'])
def apply_for_task():
    data = request.json or {}
    student_id = data.get('studentId')
    task_id = data.get('taskId')

    if not student_id or not task_id:
        return jsonify({'message': 'studentId and taskId are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Check if application exists
    cur.execute(
        'SELECT * FROM Application WHERE UPPER(studentid) = UPPER(%s) AND taskid = %s',
        (student_id, task_id)
    )
    existing = cur.fetchone()

    if existing:
        cur.close()
        conn.close()
        return jsonify({
            'success': False,
            'alreadyApplied': True,
            'message': 'You have already applied for this task.',
            'application': {
                'applicationid': existing['applicationid'],
                'studentid': existing['studentid'],
                'taskid': existing['taskid'],
                'status': existing['status'],
                'applieddate': format_date(existing['applieddate'])
            }
        }), 400

    cur.execute(
        'INSERT INTO Application (studentid, taskid, status, applieddate) VALUES (%s, %s, %s, NOW()) RETURNING *',
        (student_id, task_id, 'Pending')
    )
    new_app = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Application Submitted',
        'application': {
            'applicationid': new_app['applicationid'],
            'studentid': new_app['studentid'],
            'taskid': new_app['taskid'],
            'status': new_app['status'],
            'applieddate': format_date(new_app['applieddate'])
        }
    }), 201

@app.route('/api/applications', methods=['DELETE'])
def unapply_for_task():
    data = request.json or {}
    student_id = data.get('studentId')
    task_id = data.get('taskId')

    if not student_id or not task_id:
        return jsonify({'message': 'studentId and taskId are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        'SELECT * FROM Application WHERE UPPER(studentid) = UPPER(%s) AND taskid = %s',
        (student_id, task_id)
    )
    application = cur.fetchone()

    if not application:
        cur.close()
        conn.close()
        return jsonify({'message': 'Application not found'}), 404

    if application['status'] == 'Completed':
        cur.close()
        conn.close()
        return jsonify({'message': 'Cannot unapply from a completed task'}), 400

    cur.execute(
        'DELETE FROM Application WHERE UPPER(studentid) = UPPER(%s) AND taskid = %s',
        (student_id, task_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Application withdrawn successfully',
        'taskId': task_id
    }), 200

@app.route('/api/admin/applications/<admin_id>', methods=['GET'])
def get_admin_applications(admin_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT 
            a.applicationid AS "applicationID",
            s.studentid AS "studentID",
            s.name,
            s.email,
            t.taskid AS "taskID",
            t.title,
            a.status,
            a.applieddate AS "appliedDate"
        FROM Application a
        JOIN Student s ON a.studentid = s.studentid
        JOIN Task t ON a.taskid = t.taskid
        WHERE UPPER(t.createdby) = UPPER(%s)
        ORDER BY a.applieddate DESC;
    ''', (admin_id,))
    apps = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in apps:
        result.append({
            'applicationID': row['applicationID'],
            'studentID': row['studentID'],
            'name': row['name'],
            'email': row['email'],
            'taskID': row['taskID'],
            'title': row['title'],
            'status': row['status'],
            'appliedDate': format_date(row['appliedDate'])
        })

    return jsonify(result), 200

@app.route('/api/admin/applications/action', methods=['POST'])
def handle_admin_application_action():
    data = request.json or {}
    application_id = data.get('applicationId')
    status = data.get('status') # 'Approved' or 'Rejected'

    if not application_id or not status or status not in ['Approved', 'Rejected']:
        return jsonify({'message': 'applicationId and valid status (Approved or Rejected) are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Fetch application and associated task
    cur.execute('''
        SELECT a.applicationid, a.studentid, a.taskid, t.creditcoins
        FROM Application a
        JOIN Task t ON a.taskid = t.taskid
        WHERE a.applicationid = %s
    ''', (application_id,))
    app_record = cur.fetchone()

    if not app_record:
        cur.close()
        conn.close()
        return jsonify({'message': 'Application not found'}), 404

    student_id = app_record['studentid']
    task_cc = app_record['creditcoins'] or 50

    # Update application status
    cur.execute(
        'UPDATE Application SET status = %s WHERE applicationid = %s RETURNING *',
        (status, application_id)
    )

    if status == 'Approved':
        # Add creditCoins to Student
        cur.execute(
            'UPDATE Student SET creditcoins = creditcoins + %s WHERE UPPER(studentid) = UPPER(%s)',
            (task_cc, student_id)
        )

        # Update or Insert Portfolio
        cur.execute('SELECT * FROM Portfolio WHERE UPPER(studentid) = UPPER(%s)', (student_id,))
        portfolio = cur.fetchone()
        if portfolio:
            cur.execute(
                'UPDATE Portfolio SET completedtasks = completedtasks + 1, totalcredits = totalcredits + %s WHERE UPPER(studentid) = UPPER(%s)',
                (task_cc, student_id)
            )
        else:
            portfolio_link = f"https://portfolio.example.com/{student_id}"
            cur.execute(
                'INSERT INTO Portfolio (studentid, completedtasks, totalcredits, portfoliolink) VALUES (%s, 1, %s, %s)',
                (student_id, task_cc, portfolio_link)
            )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        'message': f'Application {status.lower()} successfully',
        'applicationId': application_id,
        'status': status
    }), 200

@app.route('/api/applications/complete', methods=['POST'])
def complete_application():
    data = request.json or {}
    student_id = data.get('studentId')
    task_id = data.get('taskId')

    if not student_id or not task_id:
        return jsonify({'message': 'studentId and taskId are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Update application status
    cur.execute(
        "UPDATE Application SET status = 'Completed' WHERE UPPER(studentid) = UPPER(%s) AND taskid = %s RETURNING *",
        (student_id, task_id)
    )
    app_updated = cur.fetchone()

    # Get task credit coins
    cur.execute('SELECT * FROM Task WHERE taskid = %s', (task_id,))
    task = cur.fetchone()
    task_cc = task['creditcoins'] if task else 0

    # Update student credit coins
    cur.execute(
        'UPDATE Student SET creditcoins = creditcoins + %s WHERE UPPER(studentid) = UPPER(%s) RETURNING creditcoins',
        (task_cc, student_id)
    )
    student_updated = cur.fetchone()

    # Update or insert portfolio
    cur.execute('SELECT * FROM Portfolio WHERE UPPER(studentid) = UPPER(%s)', (student_id,))
    portfolio = cur.fetchone()

    if portfolio:
        cur.execute(
            'UPDATE Portfolio SET completedtasks = completedtasks + 1, totalcredits = totalcredits + %s WHERE UPPER(studentid) = UPPER(%s)',
            (task_cc, student_id)
        )
    else:
        portfolio_link = f"https://portfolio.example.com/{student_id}"
        cur.execute(
            'INSERT INTO Portfolio (studentid, completedtasks, totalcredits, portfoliolink) VALUES (%s, 1, %s, %s)',
            (student_id, task_cc, portfolio_link)
        )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        'message': 'Task marked as completed',
        'newCcBalance': student_updated['creditcoins'] if student_updated else 0,
        'ccEarned': task_cc
    }), 200

    return jsonify({
        'portfolioId': portfolio['portfolioid'] if portfolio else None,
        'studentId': student_id,
        'completedTasks': portfolio['completedtasks'] if portfolio else len(items),
        'totalCredits': portfolio['totalcredits'] if portfolio else sum(x['ccEarned'] for x in items),
        'portfolioLink': portfolio['portfoliolink'] if portfolio else f"https://portfolio.example.com/{student_id}",
        'items': items
    }), 200

# ---------------------------------------------------------
# Chat & Messaging System (Approved Admin Only + 50 Words Limit)
# ---------------------------------------------------------

MESSAGES_FALLBACK = []

def init_chat_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
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
        ''')
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("Warning: Could not initialize Messages DB table (using memory fallback):", e)

# Try running table initialization on import
init_chat_db()

@app.route('/api/chat/contacts', methods=['GET'])
def get_chat_contacts():
    user_id = request.args.get('user_id') or request.args.get('userId')
    role = request.args.get('role', 'student').lower()

    if not user_id:
        return jsonify({'message': 'user_id is required'}), 400

    contacts = []
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if role == 'student':
            # Get admins of tasks for which student has an Approved or Completed application
            cur.execute('''
                SELECT DISTINCT 
                    COALESCE(t.createdby, 'ADM001') AS adminid,
                    COALESCE(adm.name, 'Wilson Rao') AS name,
                    COALESCE(adm.email, 'WR@jhc.com') AS email,
                    'Administration' AS department,
                    t.taskid,
                    t.title AS tasktitle
                FROM Application a
                JOIN Task t ON a.taskid = t.taskid
                LEFT JOIN Admin adm ON UPPER(t.createdby) = UPPER(adm.adminid) OR UPPER(t.createdby) = UPPER(adm.email)
                WHERE UPPER(a.studentid) = UPPER(%s) AND a.status IN ('Approved', 'Completed')
            ''', (user_id,))
            rows = cur.fetchall()

            # Group tasks by admin
            admin_map = {}
            for row in rows:
                aid = row['adminid'] or 'ADM001'
                if aid not in admin_map:
                    admin_map[aid] = {
                        'id': aid,
                        'name': row['name'] or 'Wilson Rao',
                        'email': row['email'] or 'WR@jhc.com',
                        'role': 'admin',
                        'department': row['department'],
                        'approvedTasks': []
                    }
                admin_map[aid]['approvedTasks'].append({
                    'taskId': row['taskid'],
                    'title': row['tasktitle']
                })

            contacts = list(admin_map.values())

        else: # role == 'admin'
            # Get students who have Approved or Completed applications for tasks created by this admin
            cur.execute('''
                SELECT DISTINCT 
                    s.studentid,
                    s.name,
                    s.email,
                    s.department,
                    t.taskid,
                    t.title AS tasktitle
                FROM Application a
                JOIN Task t ON a.taskid = t.taskid
                JOIN Student s ON UPPER(a.studentid) = UPPER(s.studentid)
                WHERE (UPPER(t.createdby) = UPPER(%s) OR UPPER(%s) IN ('ADM001', 'ADMIN')) 
                  AND a.status IN ('Approved', 'Completed')
            ''', (user_id, user_id))
            rows = cur.fetchall()

            student_map = {}
            for row in rows:
                sid = row['studentid']
                if sid not in student_map:
                    student_map[sid] = {
                        'id': sid,
                        'name': row['name'],
                        'email': row['email'],
                        'role': 'student',
                        'department': row['department'],
                        'approvedTasks': []
                    }
                student_map[sid]['approvedTasks'].append({
                    'taskId': row['taskid'],
                    'title': row['tasktitle']
                })

            contacts = list(student_map.values())

        cur.close()
        conn.close()

    except Exception as e:
        print("DB Error in get_chat_contacts, using fallback logic:", e)
        # Fallback for local demo environment if DB is empty or unreachable
        if role == 'student':
            contacts = [{
                'id': 'ADM001',
                'name': 'Wilson Rao',
                'email': 'WR@jhc.com',
                'role': 'admin',
                'department': 'Administration',
                'approvedTasks': [{'taskId': 1, 'title': 'Approved Campus Project'}]
            }]
        else:
            contacts = [{
                'id': '2023CSE045',
                'name': 'Dummy Student',
                'email': 'student@kjsce.edu',
                'role': 'student',
                'department': 'Computer Science',
                'approvedTasks': [{'taskId': 1, 'title': 'Approved Campus Project'}]
            }]

    return jsonify(contacts), 200


@app.route('/api/chat/messages', methods=['GET'])
def get_chat_messages():
    user1 = request.args.get('user1') or request.args.get('user1_id')
    user2 = request.args.get('user2') or request.args.get('user2_id')

    if not user1 or not user2:
        return jsonify({'message': 'user1 and user2 query parameters are required'}), 400

    messages = []

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT messageid, senderid, receiverid, senderrole, taskid, messagetext, wordcount, createdat
            FROM Messages
            WHERE (UPPER(senderid) = UPPER(%s) AND UPPER(receiverid) = UPPER(%s))
               OR (UPPER(senderid) = UPPER(%s) AND UPPER(receiverid) = UPPER(%s))
            ORDER BY createdat ASC
        ''', (user1, user2, user2, user1))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        for r in rows:
            messages.append({
                'id': r['messageid'],
                'senderId': r['senderid'],
                'receiverId': r['receiverid'],
                'senderRole': r['senderrole'],
                'taskId': r['taskid'],
                'messageText': r['messagetext'],
                'wordCount': r['wordcount'],
                'createdAt': format_date(r['createdat'])
            })
    except Exception as e:
        print("DB Error in get_chat_messages, using fallback memory store:", e)
        # Filter from memory fallback
        filtered = [
            m for m in MESSAGES_FALLBACK
            if (m['senderId'].upper() == user1.upper() and m['receiverId'].upper() == user2.upper())
            or (m['senderId'].upper() == user2.upper() and m['receiverId'].upper() == user1.upper())
        ]
        messages = sorted(filtered, key=lambda x: x['createdAt'])

    return jsonify(messages), 200


@app.route('/api/chat/messages', methods=['POST'])
def send_chat_message():
    data = request.json or {}
    sender_id = data.get('senderId', '').strip()
    receiver_id = data.get('receiverId', '').strip()
    sender_role = data.get('senderRole', 'student').lower()
    task_id = data.get('taskId')
    message_text = data.get('messageText', '').strip()

    if not sender_id or not receiver_id or not message_text:
        return jsonify({'message': 'senderId, receiverId, and messageText are required'}), 400

    # Word Count Enforcement (Max 50 words)
    words = message_text.split()
    word_count = len(words)

    if word_count == 0:
        return jsonify({'message': 'Message cannot be empty'}), 400

    if word_count > 50:
        return jsonify({
            'message': f'Message exceeds limit! Max 50 words allowed per message. (Current: {word_count} words)'
        }), 400

    created_at = datetime.datetime.now().isoformat()
    msg_id = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            INSERT INTO Messages (senderid, receiverid, senderrole, taskid, messagetext, wordcount, createdat)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING messageid, createdat
        ''', (sender_id, receiver_id, sender_role, task_id, message_text, word_count))
        new_row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if new_row:
            msg_id = new_row['messageid']
            created_at = format_date(new_row['createdat'])
    except Exception as e:
        print("DB Error inserting message, storing in memory fallback:", e)
        msg_id = len(MESSAGES_FALLBACK) + 1

    msg_obj = {
        'id': msg_id,
        'senderId': sender_id,
        'receiverId': receiver_id,
        'senderRole': sender_role,
        'taskId': task_id,
        'messageText': message_text,
        'wordCount': word_count,
        'createdAt': created_at
    }

    MESSAGES_FALLBACK.append(msg_obj)

    return jsonify({
        'success': True,
        'message': 'Message sent successfully',
        'chatMessage': msg_obj
    }), 201


if __name__ == '__main__':
    app.run(debug=True, port=5000)


