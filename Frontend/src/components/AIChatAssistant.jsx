
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User } from 'lucide-react';

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm your AI financial assistant. I can help you understand your spending patterns, set goals, and provide personalized advice. What would you like to know about your finances?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in real implementation, this would call your AI backend)
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 2,
        type: 'assistant',
        content: generateAIResponse(input)
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('budget') || lowerInput.includes('spending')) {
      return "Based on your transaction history, I can see you're spending quite a bit on dining out. Consider setting a monthly budget of $300 for restaurants and meal planning for 2-3 days a week to save money.";
    } else if (lowerInput.includes('save') || lowerInput.includes('goal')) {
      return "Great question! I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Based on your current income, you could save an additional $200-300 per month by optimizing your discretionary spending.";
    } else if (lowerInput.includes('invest')) {
      return "For investment advice, I'd recommend starting with your emergency fund first (3-6 months of expenses). Once that's established, consider low-cost index funds for long-term growth. Remember, I can help with budgeting, but consult a financial advisor for specific investment recommendations.";
    } else {
      return "I can help you with budgeting, expense tracking, setting financial goals, and analyzing your spending patterns. Try asking me about your budget, savings goals, or spending trends!";
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Financial Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="p-3 rounded-lg text-sm bg-gray-100 text-gray-900">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your finances..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
