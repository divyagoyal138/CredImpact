
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

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

@app.route('/api/college/verify', methods=['POST'])
def verify_college():
    data = request.json
    college_code = data.get('collegeCode', '').strip()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT DISTINCT collegecode FROM Student WHERE UPPER(collegecode) = UPPER(%s)', (college_code,))
    college = cur.fetchone()
    cur.close()
    conn.close()

    if college:
        return jsonify({
            'exists': True,
            'name': college[0],
            'message': 'College found'
        }), 200
    else:
        return jsonify({
            'exists': False,
            'message': 'College not found'
        }), 404

@app.route('/api/student/login/verify-uid', methods=['POST'])
def verify_student_uid():
    data = request.json
    college_code = data.get('collegeCode', '').strip()
    student_uid = data.get('studentUid', '').strip()
    
    conn = get_db_connection()
    cur = conn.cursor()
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
    data = request.json
    college_code = data.get('collegeCode', '').strip()
    student_uid = data.get('studentUid', '').strip()
    otp = data.get('otp', '').strip()
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM Student WHERE UPPER(collegecode) = UPPER(%s) AND UPPER(studentid) = UPPER(%s) AND otp = %s', (college_code, student_uid, otp))
    student = cur.fetchone()
    cur.close()
    conn.close()
    
    if student:
        return jsonify({
            'valid': True,
            'student': {
                'collegeCode': student[9],  # collegecode
                'uid': student[0],          # studentid
                'name': student[1],         # name
                'email': student[2],        # email
                'phone': student[3],        # phone
                'semester': student[5],     # semester
                'department': student[6],   # department
                'ccBalance': student[7],    # creditcoins
                'role': 'student'
            }
        }), 200
    else:
        return jsonify({'valid': False, 'message': 'Invalid OTP or student not found'}), 400

@app.route('/api/student/<student_id>', methods=['GET'])
def get_student_details(student_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM Student WHERE studentid = %s', (student_id,))
    student = cur.fetchone()
    cur.close()
    conn.close()
    
    if student:
        return jsonify({
            'collegeCode': student[9],
            'uid': student[0],
            'name': student[1],
            'email': student[2],
            'phone': student[3],
            'semester': student[5],
            'department': student[6],
            'ccBalance': student[7],
            'role': 'student'
        }), 200
    else:
        return jsonify({'message': 'Student not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
