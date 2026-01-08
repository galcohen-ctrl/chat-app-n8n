'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw, LogOut, Loader2, Search, MessageCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

// Login Form Component
function LoginForm({ onLogin }: { onLogin: (userData: { email: string; name: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (email === 'gal.cohen@comosense.com' && password === '12345678') {
      if (!name.trim()) {
        setError('Please enter your name');
        setIsLoading(false);
        return;
      }
      onLogin({ email, name: name.trim() });
    } else {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to start chatting</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300"
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Chat Interface Component with Direct HTTP Response
function ChatInterface({ user, onLogout }: { user: { email: string; name: string }; onLogout: () => void }) {
  const [question, setQuestion] = useState('');
  const [chatState, setChatState] = useState<'idle' | 'waiting' | 'completed' | 'rating'>('idle');
  const [currentSession, setCurrentSession] = useState<{ question: string; sessionId: string } | null>(null);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState, response]);

  // Check for pending rating on mount
  useEffect(() => {
    const pendingRating = sessionStorage.getItem('pendingRating');
    if (pendingRating) {
      const { question, answer } = JSON.parse(pendingRating);
      setCurrentSession({ question, sessionId: '' });
      setResponse(answer);
      setChatState('rating');
      setShowRatingModal(true);
    }
  }, []);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || chatState !== 'idle') return;

    const sessionId = generateSessionId();
    const userQuestion = question.trim();
    setChatState('waiting');
    setCurrentSession({ question: userQuestion, sessionId });
    setQuestion('');
    setError('');

    // Use Next.js API route to avoid CORS issues
    const apiUrl = '/api/webhook';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: userQuestion,
          user_name: user.name
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response text first
      const textResponse = await response.text();

      // Log for debugging
      console.log('Raw response:', textResponse);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      // Set the response from n8n
      const aiResponse = data.response || data.answer || data.message || 'Response received';
      setResponse(aiResponse);
      setChatState('completed');

      // Store in sessionStorage for rating persistence
      sessionStorage.setItem('pendingRating', JSON.stringify({
        question: userQuestion,
        answer: aiResponse
      }));
    } catch (error: any) {
      console.error('Webhook error:', error);
      setError(`Error: ${error.message || 'Unknown error'}`);
      setChatState('completed');
      setResponse('Sorry, I encountered an error while processing your question. Please try asking a new question.');
    }
  };

  const handleNewQuestion = () => {
    // Show rating modal instead of immediately starting new question
    setShowRatingModal(true);
    setChatState('rating');
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!currentSession || !response) return;

    setIsSubmittingRating(true);

    try {
      // Send rating to n8n webhook
      const ratingWebhook = 'https://comosense.app.n8n.cloud/webhook/9db5b565-c34b-47f4-b2ef-61cab6134b16';

      await fetch('/api/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook_url: ratingWebhook,
          name: user.name,
          question: currentSession.question,
          ai_answer: response,
          rating: rating
        })
      });

      // Clear session and allow new question
      sessionStorage.removeItem('pendingRating');
      setShowRatingModal(false);
      setChatState('idle');
      setCurrentSession(null);
      setResponse('');
      setError('');
    } catch (error) {
      console.error('Rating submission error:', error);
      // Still allow new question even if rating fails
      sessionStorage.removeItem('pendingRating');
      setShowRatingModal(false);
      setChatState('idle');
      setCurrentSession(null);
      setResponse('');
      setError('');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const truncateName = (name: string, maxLength = 12) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-white flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Hi {user.name} :)</h1>
              <p className="text-xs text-gray-500">Ask me anything</p>
            </div>
          </motion.div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        <div className="flex-1 space-y-4">
          <AnimatePresence mode="wait">
            {chatState === 'idle' && !currentSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">How can I help you?</h2>
                <p className="text-gray-500">Type your question below to get started</p>
              </motion.div>
            )}

            {(chatState === 'waiting' || chatState === 'completed') && currentSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="flex justify-end mb-1">
                      <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 text-xs font-medium">
                        {truncateName(user.name)}
                      </Badge>
                    </div>
                    <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-4 rounded-2xl rounded-tr-md shadow-lg border-0">
                      <p className="text-sm leading-relaxed">{currentSession.question}</p>
                    </Card>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Assistant</span>
                    </div>
                    <Card className="bg-white p-4 rounded-2xl rounded-tl-md shadow-md border border-gray-100">
                      {chatState === 'waiting' ? (
                        <div className="flex items-center gap-3 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none text-gray-700
                          [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800
                          [&_strong]:font-bold [&_strong]:text-gray-900
                          [&_em]:italic
                          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
                          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2
                          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1
                          [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-2
                          [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-2
                          [&_li]:my-1
                          [&_p]:my-2
                          [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                          [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2
                          [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => (
                                <a {...props} target="_blank" rel="noopener noreferrer" />
                              ),
                            }}
                          >
                            {response}
                          </ReactMarkdown>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-6 sticky bottom-4">
          {chatState === 'completed' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Button
                onClick={handleNewQuestion}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold px-8 py-6 rounded-2xl shadow-lg shadow-cyan-500/25 transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Ask a New Question
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Card className="p-2 bg-white shadow-xl border-0 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={chatState === 'waiting' ? 'Please wait for the response...' : 'Type your question here...'}
                    disabled={chatState !== 'idle'}
                    className="flex-1 border-0 focus-visible:ring-0 text-base h-12 px-4 bg-transparent"
                  />
                  <Button
                    type="submit"
                    disabled={!question.trim() || chatState !== 'idle'}
                    className="h-12 w-12 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/25 transition-all duration-300"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </div>
      </main>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && !isSubmittingRating}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Rate the Response</h2>
                <p className="text-gray-600 text-sm">How helpful was this answer?</p>
              </div>

              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6].map((rating) => (
                  <motion.button
                    key={rating}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRatingSubmit(rating)}
                    disabled={isSubmittingRating}
                    className="group relative"
                  >
                    <svg
                      className="w-12 h-12 transition-all duration-200"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill="url(#gold-gradient)"
                        className="group-hover:drop-shadow-lg"
                      />
                      <defs>
                        <linearGradient id="gold-gradient" x1="12" y1="2" x2="12" y2="21.02">
                          <stop offset="0%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#FFA500" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-600">
                      {rating}
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-xs text-gray-500 mt-8">
                {isSubmittingRating ? 'Submitting...' : 'Click a star to rate'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Chat Page Component
export default function Chat() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem('chatUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData: { email: string; name: string }) => {
    sessionStorage.setItem('chatUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chatUser');
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <ChatInterface user={user} onLogout={handleLogout} />;
}
