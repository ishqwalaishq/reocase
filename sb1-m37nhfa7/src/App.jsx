import React, { useState } from 'react';
import { Search, BookOpen, Users, FileText, Menu, X, Send } from 'lucide-react';

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyDzSNp2oeWwi9EkioJZjIpaDM7D4XAVxdM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectToContact = (e) => {
    e.preventDefault();
    // You can replace this with your actual contact page URL
    window.location.href = '/contact';
    // Or if you want to open in a new tab:
    // window.open('/contact', '_blank');
  };

  const educationalTopics = [
    'Learn Management fundamentals',
    'Master Accounting principles', 
    'Understand Income Tax regulations',
    'Build with JavaScript',
    'Design Database Management systems',
    'Code with Python'
  ];

  const isRelevantQuestion = (message) => {
    const educationalKeywords = [
      'learn', 'study', 'teach', 'explain', 'how', 'what', 'why', 'when', 'where',
      'management', 'accounting', 'tax', 'javascript', 'python', 'database', 'programming',
      'code', 'development', 'business', 'finance', 'education', 'course', 'tutorial',
      'help', 'understand', 'concept', 'theory', 'practice', 'example', 'guide',
      'skill', 'knowledge', 'training', 'lesson', 'chapter', 'topic', 'subject'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasEducationalKeywords = educationalKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    const isReasonableLength = message.trim().length >= 3;
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
    const hasReasonableSpecialChars = specialCharRatio < 0.5;
    
    return hasEducationalKeywords && isReasonableLength && hasReasonableSpecialChars;
  };

  const formatAIMessage = (message) => {
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^\d+\.\s+(.*$)/gm, '<li class="numbered">$1</li>')
      .replace(/^[-*]\s+(.*$)/gm, '<li class="bullet">$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  const addMessage = (sender, message) => {
    const newMessage = {
      id: Date.now(),
      sender,
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const generateAIResponse = async (userMessage) => {
    if (!isRelevantQuestion(userMessage)) {
      addMessage('ai', 'Please make sure to provide relevant topic or correct your question. I\'m here to help with educational topics like Management, Accounting, Programming, and other learning subjects.');
      return;
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
      addMessage('ai', 'API key configuration error. Please check the console for details.');
      console.error('Gemini API key is not properly configured');
      return;
    }

    setIsLoading(true);
    addMessage('ai', 'Thinking...');

    try {
      console.log('Making API request to:', GEMINI_API_URL);
      console.log('API Key (first 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...');
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful educational assistant. Provide clear, detailed, and well-structured educational responses to help users learn. Focus on topics like Management, Accounting, Income Tax, JavaScript, Database Management, and Python. 

Format your responses using:
- **Bold text** for important concepts
- *Italic text* for emphasis
- \`code\` for technical terms
- # Main headings for major topics
- ## Sub-headings for sections
- ### Sub-sub-headings for details
- - Bullet points for lists
- 1. Numbered lists for steps
- Use line breaks for better readability

Provide comprehensive answers with examples, explanations, and practical tips. Make your responses engaging and educational.

User question: ${userMessage}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      // Remove "Thinking..." message
      setChatMessages(prev => prev.filter(msg => msg.message !== 'Thinking...'));

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        const aiResponse = data.candidates[0].content.parts[0].text;
        addMessage('ai', aiResponse);
      } else {
        console.error('API Error Response:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error Data:', errorData);
        
        let errorMessage = 'Failed to get Gemini AI response';
        if (response.status === 401) {
          errorMessage = 'Invalid API key or unauthorized access. The API key may be expired or restricted.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
        } else if (response.status === 500) {
          errorMessage = 'Gemini server error. Please try again later.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. The API key may not have permission for this domain or the quota may be exceeded.';
        } else if (errorData.error) {
          errorMessage = `API Error: ${errorData.error.message || errorData.error}`;
        }
        
        addMessage('ai', errorMessage + ' (Check browser console for technical details)');
      }
    } catch (error) {
      console.error('Full Error Details:', error);
      setChatMessages(prev => prev.filter(msg => msg.message !== 'Thinking...'));
      
      let userFriendlyMessage = error.message || 'Sorry, I\'m having trouble connecting right now. Please try again later.';
      if (error.message && error.message.includes('Failed to fetch')) {
        userFriendlyMessage = 'Network error: Unable to connect to AI service. Please check your internet connection and try again.';
      }
      
      addMessage('ai', userFriendlyMessage + ' (Check browser console for technical details)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLearning = () => {
    const query = searchQuery.trim();
    if (query) {
      setIsAIChatOpen(true);
      if (chatMessages.length === 0) {
        addMessage('ai', 'Hello! I\'m your AI learning assistant. Ask me anything!');
      }
      addMessage('user', query);
      generateAIResponse(query);
      setSearchQuery('');
    } else {
      alert('Please enter what you want to learn!');
    }
  };

  const handleTopicClick = (topic) => {
    setSearchQuery(topic);
    handleStartLearning();
  };

  const handleSendMessage = () => {
    const message = chatInput.trim();
    if (message && !isLoading) {
      addMessage('user', message);
      setChatInput('');
      generateAIResponse(message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openAIChat = () => {
    setIsAIChatOpen(true);
    if (chatMessages.length === 0) {
      addMessage('ai', 'Hello! I\'m your AI learning assistant. Ask me anything!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="px-6 py-4 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            reocaso
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Updates</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Courses</a>
            <div className="relative group">
              <a href="#" className="text-slate-300 hover:text-white transition-colors flex items-center">
                Resources
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Blogs</a>
          </div>

          {/* Social Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-300" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-700/50">
            <div className="flex flex-col space-y-2 mt-4">
              <a href="#" className="text-slate-300 hover:text-white transition-colors py-2">Updates</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors py-2">Courses</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors py-2">Resources</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors py-2">Blogs</a>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            What do you want to Learn?
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Create personalized learning experiences with AI-powered assistance.
          </p>
        </div>

        {/* Usage Info */}
        <div className="text-center mb-8">
          <span className="text-slate-400">423K daily learners active.</span>
          <a href="#contact" onClick={redirectToContact} className="text-blue-400 hover:text-blue-300 ml-4 transition-colors">
            Improve your skills storage →
          </a>
        </div>

        {/* Search Interface */}
        <div className="relative mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type what you want to learn and we'll bring it to life"
              className="w-full bg-transparent text-white placeholder-slate-400 resize-none outline-none text-lg min-h-[120px]"
              rows="4"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartLearning();
                }
              }}
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-slate-400" />
                <BookOpen className="w-5 h-5 text-slate-400" />
              </div>
              <button 
                onClick={handleStartLearning}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Start Learning
              </button>
            </div>
          </div>
        </div>

        {/* Learning Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {educationalTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleTopicClick(topic)}
              className="bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-left text-slate-300 hover:text-white transition-all hover:border-slate-600/50"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* AI Assistant Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-8 border border-blue-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              AI Learning Assistant
            </h3>
            <p className="text-slate-300 mb-6">
              Get personalized help with your learning journey. Our AI assistant is powered by advanced language models to provide instant support and guidance.
            </p>
            <button 
              onClick={openAIChat}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Try AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      {isAIChatOpen && (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
          {/* Chat Header */}
          <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
            <h4 className="text-xl font-bold text-blue-400">AI Learning Assistant</h4>
            <button
              onClick={() => setIsAIChatOpen(false)}
              className="text-slate-400 hover:text-red-400 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatAIMessage(msg.message) 
                      }}
                      className="prose prose-invert max-w-none"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="bg-slate-800 border-t border-slate-700 p-4 max-w-4xl mx-auto w-full">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything!..."
                disabled={isLoading}
                className="flex-1 bg-slate-700 text-white placeholder-slate-400 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400">
            © 2024 Reocaso. Empowering learners with AI-driven education.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;