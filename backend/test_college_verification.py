import unittest
from app import app

class CollegeVerificationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_valid_college_code_jhc(self):
        response = self.app.post('/api/college/verify', json={'collegeCode': 'JHC'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('exists'))
        self.assertEqual(data.get('name'), 'JHC')

    def test_valid_college_code_case_insensitive(self):
        response = self.app.post('/api/college/verify', json={'collegeCode': 'jhc'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('exists'))

    def test_invalid_college_code_rejected(self):
        response = self.app.post('/api/college/verify', json={'collegeCode': 'NONEXISTENT_COLLEGE_999'})
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertFalse(data.get('exists'))
        self.assertIn('Invalid college code', data.get('message', ''))

    def test_empty_college_code_rejected(self):
        response = self.app.post('/api/college/verify', json={'collegeCode': ''})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data.get('exists'))

    def test_student_uid_invalid_college(self):
        response = self.app.post('/api/student/login/verify-uid', json={
            'collegeCode': 'INVALID_XYZ',
            'studentUid': '24BIT020'
        })
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertFalse(data.get('exists'))

    def test_student_uid_valid_college(self):
        response = self.app.post('/api/student/login/verify-uid', json={
            'collegeCode': 'JHC',
            'studentUid': '24BIT020'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('exists'))

if __name__ == '__main__':
    unittest.main()
