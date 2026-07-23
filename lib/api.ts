
const API_BASE = 'http://localhost:5000/api';

// Helper for fetch requests
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
}

// College verification
export const verifyCollege = async (collegeCode: string) => {
  return fetchApi('/college/verify', {
    method: 'POST',
    body: JSON.stringify({ collegeCode }),
  });
};

// Student login
export const verifyStudentUid = async (collegeCode: string, studentUid: string) => {
  return fetchApi('/student/login/verify-uid', {
    method: 'POST',
    body: JSON.stringify({ collegeCode, studentUid }),
  });
};

export const verifyStudentOtp = async (collegeCode: string, studentUid: string, otp: string) => {
  return fetchApi('/student/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ collegeCode, studentUid, otp }),
  });
};

export const getStudentDetails = async (studentId: string) => {
  return fetchApi(`/student/${studentId}`);
};
