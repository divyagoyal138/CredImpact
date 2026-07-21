'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Static credentials
const STATIC_COLLEGE_CODE = 'KJSCE'
const STATIC_STUDENT_UID = '2023CSE045'
const STATIC_ADMIN_UID = 'admin@kjsce.edu'
const STATIC_OTP = '7391'
const STATIC_ADMIN_PASSWORD = 'admin123'

const STATIC_STUDENT_USER = {
  collegeCode: 'KJSCE',
  uid: '2023CSE045',
  name: 'Rahul Sharma',
  branch: 'Computer Engineering',
  year: '3rd Year',
  semester: 'Semester 5',
  division: 'B',
  phone: '+91 98XXX XX789',
  ccBalance: 340,
  department: 'CSE',
  role: 'student',
  photo: null,
}

const STATIC_ADMIN_USER = {
  collegeCode: 'KJSCE',
  uid: 'admin@kjsce.edu',
  name: 'Admin User',
  department: 'Administration',
  role: 'admin',
  photo: null,
}

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [collegeCode, setCollegeCode] = useState('')
  const [collegeCodeError, setCollegeCodeError] = useState('')
  const [uid, setUid] = useState('')
  const [uidError, setUidError] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordError, setAdminPasswordError] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  // Step 1: College Code validation
  const handleCollegeCodeContinue = () => {
    setCollegeCodeError('')
    if (!collegeCode) {
      setCollegeCodeError('Please enter your college code')
      return
    }

    if (collegeCode.toUpperCase() !== STATIC_COLLEGE_CODE) {
      setCollegeCodeError('College not found. Please check your code.')
      return
    }

    setStep(2)
  }

  // Step 2: Role selection
  const handleRoleSelect = () => {
    if (role === 'admin') {
      setStep(3) // Admin password step
    } else {
      setStep(4) // Student UID step
    }
  }

  // Step 3: Admin password submission
  const handleAdminPasswordSubmit = () => {
    setAdminPasswordError('')
    if (!adminPassword) {
      setAdminPasswordError('Please enter admin password')
      return
    }

    if (adminPassword !== STATIC_ADMIN_PASSWORD) {
      setAdminPasswordError('Incorrect password. Please try again.')
      return
    }

    localStorage.setItem('credimpact_user', JSON.stringify(STATIC_ADMIN_USER))
    setStep(5)
  }

  // Step 4: Student UID validation
  const handleUidSubmit = () => {
    setUidError('')
    if (!uid) {
      setUidError('Please enter your UID')
      return
    }

    if (uid !== STATIC_STUDENT_UID) {
      setUidError('UID not registered in college records')
      return
    }

    setStep(6)
  }

  // Step 5: Student OTP handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setOtpError('')

    // Auto-focus next box
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleOtpSubmit = () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 4) {
      setOtpError('Please enter all 4 digits')
      return
    }

    if (otpCode !== STATIC_OTP) {
      setOtpError('Incorrect code. Please try again.')
      return
    }

    // Store user in localStorage
    localStorage.setItem('credimpact_user', JSON.stringify(STATIC_STUDENT_USER))
    setStep(5)
  }

  const handleEnterCredImpact = () => {
    const storedUser = localStorage.getItem('credimpact_user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      if (user.role === 'admin') {
        router.push('/admin-dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  }

  const handleBackStep1 = () => {
    setStep(1)
    setCollegeCode('')
    setCollegeCodeError('')
    setUid('')
    setUidError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] rounded-[16px] border border-border bg-card p-10">
        {/* Step Indicator */}
        <div className="mb-6 text-center text-xs text-muted-foreground">
          {step === 1 && "Step 1 of 4"}
          {step === 2 && "Step 2 of 4"}
          {step === 3 && "Step 3 of 4"}
          {step === 4 && "Step 3 of 5"}
          {step === 5 && "Success!"}
          {step === 6 && "Step 4 of 5"}
        </div>

        {/* Logo and Tagline */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">
            Cred<span className="text-primary">Impact</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Earn your reputation before you graduate
          </p>
        </div>

        {/* Step 1: College Code */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="college-code" className="block text-sm font-medium text-foreground mb-2">
                College Code
              </label>
              <input
                id="college-code"
                type="text"
                value={collegeCode}
                onChange={(e) => {
                  setCollegeCode(e.target.value.toUpperCase())
                  setCollegeCodeError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleCollegeCodeContinue()}
                placeholder="Enter your college code"
                className="w-full rounded-[10px] border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {collegeCodeError && (
                <p className="mt-2 text-xs text-destructive">{collegeCodeError}</p>
              )}
            </div>
            <button
              onClick={handleCollegeCodeContinue}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Contact your college admin if you do not have a code
            </p>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-6">
              <div className="inline-block rounded-full bg-secondary px-3 py-1 text-xs text-primary font-medium">
                Logged in as {collegeCode}
              </div>
            </div>

            <div>
              <button
                onClick={handleBackStep1}
                className="text-sm font-medium text-primary hover:underline mb-4"
              >
                ← Back
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select your role
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => setRole('student')}
                  className={`w-full rounded-[10px] border px-4 py-3 text-left transition-colors ${
                    role === 'student'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-muted'
                  }`}
                >
                  <div className="font-medium text-foreground">Student</div>
                  <div className="text-xs text-muted-foreground mt-1">Access tasks and complete them</div>
                </button>
                <button
                  onClick={() => setRole('admin')}
                  className={`w-full rounded-[10px] border px-4 py-3 text-left transition-colors ${
                    role === 'admin'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-muted'
                  }`}
                >
                  <div className="font-medium text-foreground">Admin</div>
                  <div className="text-xs text-muted-foreground mt-1">Manage tasks and applicants</div>
                </button>
              </div>
            </div>
            <button
              onClick={handleRoleSelect}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Admin Password */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-primary hover:underline mb-4"
              >
                ← Back
              </button>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-foreground mb-2">
                Admin Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value)
                  setAdminPasswordError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminPasswordSubmit()}
                placeholder="Enter admin password"
                className="w-full rounded-[10px] border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {adminPasswordError && (
                <p className="mt-2 text-xs text-destructive">{adminPasswordError}</p>
              )}
            </div>
            <button
              onClick={handleAdminPasswordSubmit}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Login as Admin
            </button>
          </div>
        )}

        {/* Step 4: Student UID */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="mb-6">
              <div className="inline-block rounded-full bg-secondary px-3 py-1 text-xs text-primary font-medium">
                Logged in as {collegeCode} • Student
              </div>
            </div>

            <div>
              <button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-primary hover:underline mb-4"
              >
                ← Back
              </button>
            </div>

            <div>
              <label htmlFor="uid" className="block text-sm font-medium text-foreground mb-2">
                University ID
              </label>
              <input
                id="uid"
                type="text"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value)
                  setUidError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleUidSubmit()}
                placeholder="Enter your UID eg. 2023CSE045"
                className="w-full rounded-[10px] border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {uidError && (
                <p className="mt-2 text-xs text-destructive">{uidError}</p>
              )}
            </div>
            <button
              onClick={handleUidSubmit}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Send Verification Code
            </button>
          </div>
        )}

        {/* Step 6: Student OTP */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setStep(4)}
                className="text-sm font-medium text-primary hover:underline"
              >
                ← Back
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Verification code sent to {STATIC_STUDENT_USER.phone}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-4">
                Verification Code
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el
                    }}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    maxLength={1}
                    className="h-14 w-14 rounded-[10px] border border-border bg-input text-center text-2xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ))}
              </div>
              {otpError && (
                <p className="mt-3 text-center text-xs text-destructive">{otpError}</p>
              )}
            </div>

            <button
              onClick={handleOtpSubmit}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Verify and Continue
            </button>

            <div className="text-center">
              <button className="text-sm font-medium text-primary hover:underline">
                Resend code
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <svg
                  className="h-8 w-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium text-foreground">
                Welcome back {role === 'admin' ? STATIC_ADMIN_USER.name : STATIC_STUDENT_USER.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {role === 'admin'
                  ? STATIC_ADMIN_USER.department
                  : `${STATIC_STUDENT_USER.branch} • ${STATIC_STUDENT_USER.year} • Division ${STATIC_STUDENT_USER.division}`}
              </p>
            </div>

            <button
              onClick={handleEnterCredImpact}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enter CredImpact
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
