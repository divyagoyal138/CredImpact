'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  verifyCollege, 
  verifyStudentUid, 
  verifyStudentOtp, 
  verifyAdminUsername, 
  verifyAdminLogin 
} from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  // Steps: 
  // 1: College Code
  // 2: Role selection
  // 3: Admin Username
  // 4: Student UID
  // 5: Success
  // 6: Student OTP
  // 7: Admin Password
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1)
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [collegeCode, setCollegeCode] = useState('')
  const [collegeCodeError, setCollegeCodeError] = useState('')
  
  // Admin credentials
  const [adminUid, setAdminUid] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminUidError, setAdminUidError] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordError, setAdminPasswordError] = useState('')

  // Student credentials
  const [uid, setUid] = useState('')
  const [uidError, setUidError] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [otpError, setOtpError] = useState('')

  const [loading, setLoading] = useState(false)
  const [otpInfoMessage, setOtpInfoMessage] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  // Step 1: College Code validation
  const handleCollegeCodeContinue = async () => {
    setCollegeCodeError('')
    if (!collegeCode) {
      setCollegeCodeError('Please enter your college code')
      return
    }

    setLoading(true)
    try {
      await verifyCollege(collegeCode)
      setStep(2)
    } catch (error: any) {
      setCollegeCodeError(error.message || 'College not found')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Role selection
  const handleRoleSelect = () => {
    if (role === 'admin') {
      setStep(3) // Step 3: Admin Username
    } else {
      setStep(4) // Step 4: Student UID
    }
  }

  // Step 3: Admin Username validation
  const handleAdminUidSubmit = async () => {
    setAdminUidError('')
    if (!adminUid) {
      setAdminUidError('Please enter admin username or ID')
      return
    }

    setLoading(true)
    try {
      const res = await verifyAdminUsername(collegeCode, adminUid)
      if (res && res.name) {
        setAdminName(res.name)
      } else {
        setAdminName('Wilson Rao')
      }
      setStep(7) // Step 7: Admin Password
    } catch (error: any) {
      setAdminUidError(error.message || 'Admin username or ID not found in database')
    } finally {
      setLoading(false)
    }
  }

  // Step 7: Admin Password submission
  const handleAdminPasswordSubmit = async () => {
    setAdminPasswordError('')
    if (!adminPassword) {
      setAdminPasswordError('Please enter admin password')
      return
    }

    setLoading(true)
    try {
      const response = await verifyAdminLogin(collegeCode, adminUid, adminPassword)
      const adminData = response.admin
      if (adminData && adminData.name) {
        setAdminName(adminData.name)
      }
      if (response.token) {
        localStorage.setItem('credimpact_token', response.token)
      }
      localStorage.setItem('credimpact_user', JSON.stringify({ ...adminData, token: response.token }))
      setStep(5)
    } catch (error: any) {
      setAdminPasswordError(error.message || 'Incorrect admin password')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Student UID validation
  const handleUidSubmit = async () => {
    setUidError('')
    if (!uid) {
      setUidError('Please enter your UID')
      return
    }

    setLoading(true)
    try {
      const res = await verifyStudentUid(collegeCode, uid)
      if (res && res.message) {
        setOtpInfoMessage(res.message)
      }
      setStep(6)
    } catch (error: any) {
      setUidError(error.message || 'UID not registered in college records')
    } finally {
      setLoading(false)
    }
  }

  // Step 6: Student OTP handling
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

  const handleOtpSubmit = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 4) {
      setOtpError('Please enter all 4 digits')
      return
    }

    setLoading(true)
    try {
      const response = await verifyStudentOtp(collegeCode, uid, otpCode)
      if (response.token) {
        localStorage.setItem('credimpact_token', response.token)
      }
      localStorage.setItem('credimpact_user', JSON.stringify({ ...response.student, token: response.token }))
      setStep(5)
    } catch (error: any) {
      setOtpError(error.message || 'Incorrect code. Please try again.')
    } finally {
      setLoading(false)
    }
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
    setAdminUid('')
    setAdminUidError('')
    setAdminPassword('')
    setAdminPasswordError('')
    setUid('')
    setUidError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] rounded-[16px] border border-border bg-card p-10">
        {/* Step Indicator */}
        <div className="mb-6 text-center text-xs text-muted-foreground">
          {step === 1 && "Step 1 of 4: College Code"}
          {step === 2 && "Step 2 of 4: Select Role"}
          {step === 3 && "Step 3 of 4: Admin Username"}
          {step === 7 && "Step 4 of 4: Admin Password"}
          {step === 4 && "Step 3 of 4: Student UID"}
          {step === 6 && "Step 4 of 4: Verification Code"}
          {step === 5 && "Success!"}
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
                placeholder="Enter your college code (e.g. KJSCE, JHC)"
                className="w-full rounded-[10px] border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {collegeCodeError && (
                <p className="mt-2 text-xs text-destructive">{collegeCodeError}</p>
              )}
            </div>
            <button
              onClick={handleCollegeCodeContinue}
              disabled={loading}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Continue'}
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
                  type="button"
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
                  type="button"
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

        {/* Step 3: Admin Username */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-4">
              <div className="inline-block rounded-full bg-secondary px-3 py-1 text-xs text-primary font-medium">
                {collegeCode} • Admin
              </div>
            </div>

            <div>
              <button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-primary hover:underline mb-2"
              >
                ← Back
              </button>
            </div>

            <div>
              <label htmlFor="admin-uid" className="block text-sm font-medium text-foreground mb-2">
                Admin Username or ID
              </label>
              <input
                id="admin-uid"
                type="text"
                value={adminUid}
                onChange={(e) => {
                  setAdminUid(e.target.value)
                  setAdminUidError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminUidSubmit()}
                placeholder="Enter admin ID e.g. ADM001"
                className="w-full rounded-[10px] border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {adminUidError && (
                <p className="mt-2 text-xs text-destructive">{adminUidError}</p>
              )}
            </div>
            <button
              onClick={handleAdminUidSubmit}
              disabled={loading}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 7: Admin Password */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="mb-4">
              <div className="inline-block rounded-full bg-secondary px-3 py-1 text-xs text-primary font-medium">
                {collegeCode} • Admin: {adminName || adminUid}
              </div>
            </div>

            <div>
              <button
                onClick={() => setStep(3)}
                className="text-sm font-medium text-primary hover:underline mb-2"
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
              disabled={loading}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
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
              disabled={loading}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Send Verification Code'}
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
                {otpInfoMessage || 'Verification code sent to your registered phone'}
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
              disabled={loading}
              className="w-full rounded-[10px] bg-primary px-4 py-3 h-11 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify and Continue'}
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
                Welcome back {(() => {
                  const storedUser = localStorage.getItem('credimpact_user')
                  if (storedUser) return JSON.parse(storedUser).name
                  return 'User'
                })()}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {(() => {
                  const storedUser = localStorage.getItem('credimpact_user')
                  if (storedUser) {
                    const u = JSON.parse(storedUser)
                    if (u.role === 'admin') return `Admin · ${u.department}`
                    return `${u.department} • Semester ${u.semester}`
                  }
                  return ''
                })()}
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
