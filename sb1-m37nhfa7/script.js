// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyDzSNp2oeWwi9EkioJZjIpaDM7D4XAVxdM'; // You may need to update this key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// DOM Elements
const learningQuery = document.getElementById('learningQuery');
const startLearningBtn = document.getElementById('startLearning');
const topicButtons = document.querySelectorAll('.topic-btn');
const tryAIBtn = document.getElementById('tryAI');
const aiChat = document.getElementById('aiChat');
const closeChatBtn = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');

// Event Listeners
startLearningBtn.addEventListener('click', handleStartLearning);
tryAIBtn.addEventListener('click', openAIChat);
closeChatBtn.addEventListener('click', closeAIChat);
sendMessageBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Contact redirect function
function redirectToContact() {
    // You can replace this with your actual contact page URL
    window.location.href = '/contact';
    // Or if you want to open in a new tab:
    // window.open('/contact', '_blank');
}
// Topic button event listeners
topicButtons.forEach(button => {
    button.addEventListener('click', () => {
        const topic = button.getAttribute('data-topic');
        learningQuery.value = topic;
        handleStartLearning();
    });
});

// Functions
function handleStartLearning() {
    const query = learningQuery.value.trim();
    if (query) {
        // Open AI chat and start conversation with the learning query
        openAIChat();
        addMessage('user', query);
        generateAIResponse(query);
    } else {
        alert('Please enter what you want to learn!');
    }
}

function openAIChat() {
    aiChat.classList.remove('hidden');
    if (chatMessages.children.length === 0) {
        addMessage('ai', 'Hello! I\'m your AI learning assistant. Ask me anything!');
    }
}

function closeAIChat() {
    aiChat.classList.add('hidden');
}

function addMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    if (sender === 'ai') {
        // Format AI messages with rich text formatting
        messageDiv.innerHTML = formatAIMessage(message);
    } else {
        // Keep user messages as plain text for security
        messageDiv.textContent = message;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatAIMessage(message) {
    // Convert markdown-style formatting to HTML
    let formatted = message
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to <em>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert `code` to <code>
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Convert ### headings to <h3>
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // Convert ## headings to <h2>
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        // Convert # headings to <h1>
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Convert numbered lists (1. item)
        .replace(/^\d+\.\s+(.*$)/gm, '<li class="numbered">$1</li>')
        // Convert bullet points (- item or * item)
        .replace(/^[-*]\s+(.*$)/gm, '<li class="bullet">$1</li>')
        // Convert line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags if not already wrapped
    if (!formatted.includes('<p>') && !formatted.includes('<h1>') && !formatted.includes('<h2>') && !formatted.includes('<h3>')) {
        formatted = '<p>' + formatted + '</p>';
    }
    
    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li class="bullet">.*?<\/li>)(?:\s*<li class="bullet">.*?<\/li>)*/g, function(match) {
        return '<ul class="bullet-list">' + match + '</ul>';
    });
    
    formatted = formatted.replace(/(<li class="numbered">.*?<\/li>)(?:\s*<li class="numbered">.*?<\/li>)*/g, function(match) {
        return '<ol class="numbered-list">' + match + '</ol>';
    });
    
    return formatted;
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addMessage('user', message);
        chatInput.value = '';
        generateAIResponse(message);
    }
}

function isRelevantQuestion(message) {
    // Check for educational keywords and common learning topics
    const educationalKeywords = [
        'learn', 'study', 'teach', 'explain', 'how', 'what', 'why', 'when', 'where',
        'management', 'accounting', 'tax', 'javascript', 'python', 'database', 'programming',
        'code', 'development', 'business', 'finance', 'education', 'course', 'tutorial',
        'help', 'understand', 'concept', 'theory', 'practice', 'example', 'guide',
        'skill', 'knowledge', 'training', 'lesson', 'chapter', 'topic', 'subject'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Check if message contains educational keywords
    const hasEducationalKeywords = educationalKeywords.some(keyword => 
        lowerMessage.includes(keyword)
    );
    
    // Check for very short messages (likely not educational)
    const isReasonableLength = message.trim().length >= 3;
    
    // Check for excessive special characters or gibberish
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
    const hasReasonableSpecialChars = specialCharRatio < 0.5;
    
    return hasEducationalKeywords && isReasonableLength && hasReasonableSpecialChars;
}

async function generateAIResponse(userMessage) {
    // Validate if the question is relevant to learning
    if (!isRelevantQuestion(userMessage)) {
        addMessage('ai', 'Please make sure to provide relevant topic or correct your question. I\'m here to help with educational topics like Management, Accounting, Programming, and other learning subjects.');
        return;
    }

    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '' || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        // Remove typing indicator
        const messages = chatMessages.querySelectorAll('.message.ai');
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.textContent === 'Thinking...') {
            lastMessage.remove();
        }
        addMessage('ai', 'API key configuration error. Please check the console for details.');
        console.error('Gemini API key is not properly configured');
        return;
    }

    // Disable send button to prevent spam
    sendMessageBtn.disabled = true;
    chatInput.disabled = true;

    try {
        // Add typing indicator
        addMessage('ai', 'Thinking...');
        
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

        // Remove typing indicator
        const messages = chatMessages.querySelectorAll('.message.ai');
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.textContent === 'Thinking...') {
            lastMessage.remove();
        }

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
                errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again. The system will automatically retry in 60 seconds.';
                addMessage('ai', errorMessage);
                // Auto-retry after 60 seconds
                setTimeout(() => {
                    addMessage('ai', 'Retrying your request...');
                    generateAIResponse(userMessage);
                }, 60000);
                return; // Exit early to avoid throwing error
            } else if (response.status === 500) {
                errorMessage = 'Gemini server error. Please try again later.';
            } else if (response.status === 403) {
                errorMessage = 'Access forbidden. The API key may not have permission for this domain or the quota may be exceeded.';
            } else if (errorData.error) {
                errorMessage = `API Error: ${errorData.error.message || errorData.error}`;
            }
            
            console.error('Final error message:', errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Full Error Details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Remove typing indicator if there was an error
        const messages = chatMessages.querySelectorAll('.message.ai');
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.textContent === 'Thinking...') {
            lastMessage.remove();
        }
        
        let userFriendlyMessage = error.message || 'Sorry, I\'m having trouble connecting right now. Please try again later.';
        if (error.message && error.message.includes('Failed to fetch')) {
            userFriendlyMessage = 'Network error: Unable to connect to AI service. Please check your internet connection and try again.';
        }
        
        addMessage('ai', userFriendlyMessage + ' (Check browser console for technical details)');
    } finally {
        // Re-enable send button and input after response or error
        sendMessageBtn.disabled = false;
        chatInput.disabled = false;
    }
}

// Mobile menu functionality (basic)
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
});