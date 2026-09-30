const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api')
      ? rawApiUrl
      : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : 'http://localhost:5000/api';


// Helper for fetch requests
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('credimpact_token');
    if (!token) {
      const storedUser = localStorage.getItem('credimpact_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          token = parsed.token || null;
        } catch {
          // Ignore JSON parse error
        }
      }
    }
  }

  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { message?: string }).message || `API Error: ${response.status}`);
  }

  if (data && typeof data === 'object') {
    const result = data as { exists?: boolean; valid?: boolean; message?: string };
    if (result.exists === false || result.valid === false) {
      throw new Error(result.message || 'Verification failed');
    }
  }

  return data;
}

// College verification
export const verifyCollege = async (collegeCode: string) => {
  return fetchApi('/college/verify', {
    method: 'POST',
    body: JSON.stringify({ collegeCode }),
  });
};

// Admin login
export const verifyAdminUsername = async (collegeCode: string, adminUid: string) => {
  return fetchApi('/admin/verify-username', {
    method: 'POST',
    body: JSON.stringify({ collegeCode, adminUid }),
  });
};

export const verifyAdminLogin = async (collegeCode: string, adminUid: string, password: string) => {
  return fetchApi('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ collegeCode, adminUid, password }),
  });
};

export const getAdminDetails = async (adminId: string) => {
  return fetchApi(`/admin/${adminId}`);
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

export const updateStudentProfile = async (studentId: string, data: { email?: string; phone?: string; portfolioLink?: string }) => {
  return fetchApi(`/student/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Tasks API
export const getTasks = async () => {
  return fetchApi('/tasks');
};

export const createTask = async (taskData: { title: string; description: string; creditcoins: number; deadline?: string; createdby?: string }) => {
  return fetchApi('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

// Applications API
export const getStudentApplications = async (studentId: string) => {
  return fetchApi(`/applications/student/${studentId}`);
};

export const getAdminApplications = async (adminId: string) => {
  return fetchApi(`/admin/applications/${adminId}`);
};

export const applyForTask = async (studentId: string, taskId: number) => {
  return fetchApi('/applications', {
    method: 'POST',
    body: JSON.stringify({ studentId, taskId }),
  });
};

export const deleteApplication = async (studentId: string, taskId: number) => {
  return fetchApi('/applications', {
    method: 'DELETE',
    body: JSON.stringify({ studentId, taskId }),
  });
};

export const updateApplicationStatus = async (applicationId: number, status: 'Approved' | 'Rejected') => {
  return fetchApi('/admin/applications/action', {
    method: 'POST',
    body: JSON.stringify({ applicationId, status }),
  });
};

export const completeTask = async (studentId: string, taskId: number) => {
  return fetchApi('/applications/complete', {
    method: 'POST',
    body: JSON.stringify({ studentId, taskId }),
  });
};

// Portfolio API
export const getStudentPortfolio = async (studentId: string) => {
  return fetchApi(`/portfolio/${studentId}`);
};

// Leaderboard API
export const getLeaderboard = async () => {
  return fetchApi('/leaderboard');
};

// Chat API
export const getChatContacts = async (userId: string, role: 'student' | 'admin') => {
  return fetchApi(`/chat/contacts?user_id=${encodeURIComponent(userId)}&role=${role}`);
};

export const getChatMessages = async (user1: string, user2: string) => {
  return fetchApi(`/chat/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
};

export const sendChatMessage = async (data: {
  senderId: string;
  receiverId: string;
  senderRole: 'student' | 'admin';
  messageText: string;
  taskId?: number;
}) => {
  return fetchApi('/chat/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Students directory & CC Distribution API
export const getStudents = async (department?: string) => {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  return fetchApi(`/students${query}`);
};

export const distributeCC = async (data: {
  taskId: number;
  cc: number;
  studentIds: string[];
  venue?: string;
  department?: string;
  studentsInfo?: any[];
}) => {
  return fetchApi('/admin/distribute-cc', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getCCAllocationHistory = async () => {
  return fetchApi('/admin/cc-allocation-history');
};
