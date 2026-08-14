'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../layout'
import { getChatContacts, getChatMessages, sendChatMessage } from '@/lib/api'

export default function ChatPage() {
  const router = useRouter()
  const { user } = useDashboard()
  
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  
  const messagesEndRef = useRef(null)

  const studentId = user?.uid || user?.studentid

  // Calculate word count
  const wordsArray = inputMessage.trim().split(/\s+/).filter(Boolean)
  const wordCount = inputMessage.trim() ? wordsArray.length : 0
  const maxWords = 50
  const isOverLimit = wordCount > maxWords

  const fetchContacts = useCallback(async () => {
    if (!studentId) return
    try {
      setLoadingContacts(true)
      const data = await getChatContacts(studentId, 'student')
      if (Array.isArray(data)) {
        setContacts(data)
        if (data.length > 0 && !selectedContact) {
          setSelectedContact(data[0])
        }
      }
    } catch (err) {
      console.error('Error fetching chat contacts:', err)
    } finally {
      setLoadingContacts(false)
    }
  }, [studentId, selectedContact])

  const fetchMessages = useCallback(async () => {
    if (!studentId || !selectedContact) return
    try {
      const data = await getChatMessages(studentId, selectedContact.id)
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err)
    }
  }, [studentId, selectedContact])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    if (selectedContact) {
      setLoadingMessages(true)
      fetchMessages().finally(() => setLoadingMessages(false))
      
      // Auto-poll messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedContact, fetchMessages])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!inputMessage.trim() || isOverLimit || sending || !selectedContact) return

    setErrorMessage('')
    setSending(true)

    try {
      const activeTaskId = selectedContact.approvedTasks?.[0]?.taskId
      const res = await sendChatMessage({
        senderId: studentId,
        receiverId: selectedContact.id,
        senderRole: 'student',
        messageText: inputMessage.trim(),
        taskId: activeTaskId
      })

      if (res?.chatMessage) {
        setMessages((prev) => [...prev, res.chatMessage])
        setInputMessage('')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleQuickTemplate = (text) => {
    setInputMessage(text)
    setErrorMessage('')
  }

  const getWordCountBadgeColor = () => {
    if (wordCount === 0) return 'bg-secondary text-muted-foreground border-border'
    if (wordCount <= 35) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
    if (wordCount <= 49) return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    return 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse font-bold'
  }

  if (loadingContacts) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <i className="ti ti-loader animate-spin text-xl text-primary" aria-hidden="true" />
          <span>Loading approved chat channels...</span>
        </div>
      </div>
    )
  }

  // Locked State if no approved task admins exist
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 md:p-12 text-center shadow-sm min-h-[500px]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-5 shadow-inner">
          <i className="ti ti-lock text-4xl" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Admin Chat Locked</h2>
        <p className="mt-2.5 max-w-md text-sm text-muted-foreground leading-relaxed">
          Direct messaging is unlocked exclusively for <strong className="text-foreground">approved task administrators</strong>. 
          Once an admin approves your task application, your chat room will open automatically here.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 active:scale-95"
          >
            <i className="ti ti-list-check text-base" aria-hidden="true" />
            Explore Open Tasks
          </button>
          <button
            onClick={() => router.push('/dashboard/applied')}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary active:scale-95"
          >
            <i className="ti ti-send text-base" aria-hidden="true" />
            View Applied Tasks
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[560px] max-h-[780px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm relative">
      {/* Sidebar: Approved Contacts */}
      <div className={`w-64 md:w-72 shrink-0 border-r border-border bg-card/80 flex flex-col transition-all duration-300 ${
        showMobileSidebar ? 'absolute inset-y-0 left-0 z-30 w-72 bg-card border-r shadow-xl' : 'hidden md:flex'
      }`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <i className="ti ti-messages text-primary text-base" aria-hidden="true" />
              Approved Admins
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Active task approvers
            </p>
          </div>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {contacts.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {contacts.map((contact) => {
            const isSelected = selectedContact?.id === contact.id
            return (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact)
                  setShowMobileSidebar(false)
                }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                  isSelected
                    ? 'bg-secondary/90 border-primary/40 shadow-sm'
                    : 'border-transparent hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs border border-primary/30">
                    {contact.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-foreground">{contact.name}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium shrink-0">Admin</span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground mt-0.5">{contact.department}</p>
                  {contact.approvedTasks?.[0] && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-500 font-medium truncate">
                      <i className="ti ti-circle-check-filled text-[10px] shrink-0" aria-hidden="true" />
                      <span className="truncate">{contact.approvedTasks[0].title}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/40">
        {/* Chat Top Bar */}
        <div className="p-3.5 px-4 border-b border-border bg-card flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <i className="ti ti-menu-2 text-lg" aria-hidden="true" />
            </button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs border border-primary/30">
              {selectedContact?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground truncate">{selectedContact?.name}</h3>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 flex items-center gap-1 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Task Approved Admin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedContact?.email} • {selectedContact?.department}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs bg-secondary/80 px-3 py-1 rounded-lg border border-border text-muted-foreground flex items-center gap-1.5 font-medium">
              <i className="ti ti-info-circle text-primary" aria-hidden="true" />
              Strict 50-Word Limit
            </span>
          </div>
        </div>

        {/* Message Bubble Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              <i className="ti ti-loader animate-spin text-lg text-primary mr-2" aria-hidden="true" />
              Loading message thread...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground/60 mb-2">
                <i className="ti ti-message-dots text-2xl" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-foreground">No messages yet</p>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">
                Send a brief update to <strong className="text-foreground">{selectedContact?.name}</strong> regarding your task. Max 50 words per message.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId?.toUpperCase() === studentId?.toUpperCase()
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {isMe ? 'You' : selectedContact?.name}
                    </span>
                    <span className="text-[9px] bg-secondary/80 px-1.5 py-0.2 rounded border border-border/60 text-muted-foreground font-mono">
                      {msg.wordCount || msg.messageText.split(' ').length} words
                    </span>
                  </div>

                  <div
                    className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-xs'
                        : 'bg-card border border-border text-foreground rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>
                  </div>

                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Template Pills */}
        <div className="px-3.5 py-2 bg-card/60 border-t border-border flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] text-muted-foreground font-semibold shrink-0 flex items-center gap-1">
            <i className="ti ti-bolt text-amber-500" aria-hidden="true" />
            Quick:
          </span>
          {[
            'Hi Admin, I have started working on the task.',
            'Task completed! Please review my submission.',
            'Could you clarify the deadline for this task?'
          ].map((pillText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickTemplate(pillText)}
              className="shrink-0 rounded-full border border-border bg-secondary/70 px-3 py-1 text-[11px] text-foreground transition hover:bg-secondary hover:border-primary/50 active:scale-95"
            >
              {pillText}
            </button>
          ))}
        </div>

        {/* Input Form with Word Limit */}
        <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0">
          {errorMessage && (
            <div className="mb-2 text-xs font-semibold text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded-lg border border-destructive/20">
              <i className="ti ti-alert-circle text-base shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="relative flex flex-col rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <textarea
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value)
                setErrorMessage('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Type message here (Strict 50-word max limit)..."
              rows={2}
              className="w-full resize-none bg-transparent p-3 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/70"
            />

            {/* Bottom Bar inside Input Box */}
            <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${getWordCountBadgeColor()}`}>
                  <i className="ti ti-letter-case text-xs" aria-hidden="true" />
                  {wordCount} / {maxWords} words
                </span>

                {isOverLimit && (
                  <span className="text-[11px] font-semibold text-destructive flex items-center gap-1 truncate">
                    <i className="ti ti-alert-triangle shrink-0" aria-hidden="true" />
                    Exceeds 50 words!
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isOverLimit || sending}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
              >
                {sending ? (
                  <>
                    <i className="ti ti-loader animate-spin text-sm" aria-hidden="true" />
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <i className="ti ti-send text-sm" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
