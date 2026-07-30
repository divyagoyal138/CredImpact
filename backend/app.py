
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

@app.route('/api/portfolio/<student_id>', methods=['GET'])
def get_portfolio(student_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM Portfolio WHERE UPPER(studentid) = UPPER(%s)', (student_id,))
    portfolio = cur.fetchone()

    cur.execute('''
        SELECT a.applicationid, a.taskid, a.applieddate, t.title, t.description, t.creditcoins
        FROM Application a
        JOIN Task t ON a.taskid = t.taskid
        WHERE UPPER(a.studentid) = UPPER(%s) AND a.status = 'Completed'
        ORDER BY a.applieddate DESC
    ''', (student_id,))
    completed_items = cur.fetchall()

    cur.close()
    conn.close()

    items = []
    for item in completed_items:
        items.append({
            'id': item['taskid'],
            'title': item['title'],
            'description': item['description'],
            'ccEarned': item['creditcoins'],
            'date': format_date(item['applieddate']),
            'tags': ['Completed', 'Campus Task']
        })

    return jsonify({
        'portfolioId': portfolio['portfolioid'] if portfolio else None,
        'studentId': student_id,
        'completedTasks': portfolio['completedtasks'] if portfolio else len(items),
        'totalCredits': portfolio['totalcredits'] if portfolio else sum(x['ccEarned'] for x in items),
        'portfolioLink': portfolio['portfoliolink'] if portfolio else f"https://portfolio.example.com/{student_id}",
        'items': items
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

