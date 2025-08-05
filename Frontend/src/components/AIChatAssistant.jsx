import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { aiChatAPI } from '../lib/api';

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content:
        "Hi! I'm your AI financial assistant. I can provide personalized advice based on your actual financial data. What would you like to know about your spending, goals, or financial situation?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiChatAPI.sendMessage(currentInput);

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to get response');

      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'How am I doing with my budget this month?',
    'What can I do to save more money?',
    'How close am I to my savings goals?',
    "What's my biggest spending category?",
    'Give me tips to reduce expenses',
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  return (
    <Card className="flex flex-col h-[500px] w-full max-w-2xl mx-auto shadow-md rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Financial Assistant
        </CardTitle>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded mt-2">
            {error}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 overflow-hidden">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
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
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing your financial data...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 2).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
