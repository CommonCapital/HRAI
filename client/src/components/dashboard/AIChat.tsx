'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Loader2, MessageCircle, Send, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

interface Props {
  cvAnalysisId: string;
  isExpanded: boolean;
  onClose: () => void;
}

const CVAIChat = ({ cvAnalysisId, isExpanded, onClose }: Props) => {
  const trpc = useTRPC();
  const [input, setInput] = useState("");
  
  // Simple useChat - just like SEO report!
  const { messages, setMessages, sendMessage, status } = useChat({
    id: cvAnalysisId
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Fetch CV analysis to get initial messages
  const cvAnalysis = useQuery(
    trpc.candidates.getCVAnalysisById.queryOptions({ id: cvAnalysisId })
  );
  
  // Save messages mutation
  const saveMessagesMutation = useMutation(
    trpc.candidates.saveMessages.mutationOptions()
  );
  
  // Load messages on mount
  useEffect(() => {
    if (cvAnalysis.data?.messages && messages.length === 0) {
      setMessages(cvAnalysis.data.messages);
    }
  }, [cvAnalysis.data?.messages, messages.length, setMessages]);
  
  // Save messages when they change
  useEffect(() => {
    if (status !== "ready") return; // streaming still happening
    if (messages.length === 0) return;
    
    saveMessagesMutation.mutate({
      cvAnalysisId,
      messages
    });
  }, [status, messages.length]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim()) {
      sendMessage({ text: input, metadata: { cvAnalysisId } });
      setInput("");
    }
  };
  
  const isTyping = status === 'submitted';
  
  return (
    <>
      {/* Backdrop overlay */}
      {isExpanded && (
        <div 
          className='fixed inset-0 bg-black/5 z-40 transition-opacity duration-300'
          onClick={onClose}
        />
      )}
      
      {/* Chat window */}
      <div 
        className={cn(
          'fixed bottom-8 right-8 z-50 bg-white border border-black/10 flex flex-col overflow-hidden transition-all duration-300',
          isExpanded ? 'w-[90vw] sm:w-[500px] h-[90vh] sm:h-[600px] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-95 pointer-events-none'
        )}
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-8 py-6 bg-amber-100 text-amber-500 border-b border-white/10'>
          <div className='flex items-center gap-4'>
            <div className="w-10 h-10 border border-white/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className='font-light text-amber-500 tracking-wide' style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
                CV ANALYSIS ASSISTANT
              </h3>
              <div className='flex items-center gap-2 mt-1'>
                <div className={cn(
                  'w-1.5 h-1.5 bg-white', 
                  isTyping && "animate-pulse"
                )} />
                <p className='text-[11px] font-light tracking-wider uppercase' style={{ letterSpacing: '0.15em' }}>
                  {isTyping ? "Thinking" : "Online"}
                </p>
              </div>
            </div>
          </div>
          
          <div className='flex items-center gap-1'>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className='h-10 w-10 hover:bg-white/10 text-amber-500 transition-colors duration-300'
            >
              <Minimize2 className='h-4 w-4' strokeWidth={1.5} />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className='h-10 w-10 hover:bg-white/10 text-amber-500 transition-colors duration-300'
            >
              <X className='h-4 w-4' strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={chatRef} className='flex-1 overflow-y-auto p-8 space-y-6 bg-white'>
          {messages.length === 0 && (
            <div className='text-center py-16'>
              <div className='mb-6'>
                <MessageCircle className='h-16 w-16 text-black/20 mx-auto' strokeWidth={1} />
              </div>
              <p className='font-light text-lg mb-2' style={{ fontFamily: 'Garamond, serif', letterSpacing: '-0.02em' }}>
                Ask About This Candidate
              </p>
              <p className='text-xs font-light tracking-wider uppercase text-black/40' style={{ letterSpacing: '0.15em' }}>
                Get insights on experience, skills, and role fit
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn(
              'flex', 
              message.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[85%] px-6 py-4 text-sm transition-all duration-300",
                message.role === 'user' 
                  ? 'bg-amber-100 text-amber-500'
                  : "bg-white text-black border border-black/10"
              )}
              style={{ 
                fontFamily: 'Helvetica Neue, sans-serif',
                fontWeight: 300,
                lineHeight: 1.5,
                boxShadow: message.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {message.parts.map((part, index) => {
                  if (part.type === 'tool-web_search') {
                    switch (part.state) {
                      case 'input-streaming':
                      case 'input-available':
                        return (
                          <div
                            key={`${message.id}-${index}`}
                            className='flex items-center gap-2 text-xs tracking-wider uppercase'
                            style={{ letterSpacing: '0.1em' }}
                          >
                            <Loader2 className='w-3 h-3 animate-spin' strokeWidth={1.5} />
                            <span>Searching</span>
                          </div>
                        );
                      case 'output-available':
                        return (
                          <div
                            key={`${message.id}-${index}`}
                            className='text-xs tracking-wider uppercase'
                            style={{ letterSpacing: '0.1em' }}
                          >
                            ✓ Search Complete
                          </div>
                        );
                      case 'output-error':
                        return (
                          <div 
                            key={`${message.id}-${index}`}
                            className='text-xs tracking-wider uppercase'
                            style={{ letterSpacing: '0.1em' }}
                          >
                            ✗ Search Failed: {part.errorText}
                          </div>
                        );
                    }
                  }

                  if (part.type === 'text') {
                    return (
                      <div key={`${message.id}-${index}`} className="leading-relaxed">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({children}) => (
                              <p className='mb-4 last:mb-0' style={{ fontWeight: 300 }}>{children}</p>
                            ),
                            ul: ({children}) => (
                              <ul className='mb-4 pl-6 space-y-2' style={{ listStyleType: 'disc' }}>
                                {children}
                              </ul>
                            ),
                            ol: ({children}) => (
                              <ol className='mb-4 pl-6 space-y-2' style={{ listStyleType: 'decimal' }}>{children}</ol>
                            ),
                            li: ({children}) => (
                              <li className='text-sm' style={{ fontWeight: 300 }}>{children}</li>
                            ),
                            a: ({children, href}) => (
                              <a 
                                href={href}
                                className='underline hover:no-underline transition-all duration-300'
                                style={{ textDecorationThickness: '1px', textUnderlineOffset: '2px' }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >{children}</a>
                            ),
                            h1: ({children}) => (
                              <h1 className='text-lg mb-3 mt-6 first:mt-0' style={{ fontFamily: 'Garamond, serif', fontWeight: 400, letterSpacing: '-0.02em' }}>
                                {children}
                              </h1>
                            ),
                            h2: ({children}) => (
                              <h2 className='text-base mb-2 mt-4 first:mt-0' style={{ fontFamily: 'Garamond, serif', fontWeight: 400, letterSpacing: '-0.02em' }}>
                                {children}
                              </h2>
                            ),
                            h3: ({children}) => (
                              <h3 className='text-sm mb-2 mt-3 first:mt-0' style={{ fontWeight: 500 }}>{children}</h3>
                            ),
                            strong: ({children}) => (
                              <strong style={{ fontWeight: 500 }}>{children}</strong>
                            ),
                            em: ({children}) => (
                              <em className='italic'>{children}</em>
                            ),
                            code: ({children}) => (
                              <code className='bg-/5 px-2 py-0.5 text-xs' style={{ fontFamily: 'monospace' }}>
                                {children}
                              </code>
                            ),
                            pre: ({children}) => (
                              <pre className='bg-black/5 p-3 text-xs overflow-x-auto mb-4 border border-black/10' style={{ fontFamily: 'monospace' }}>
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className='flex justify-start'>
              <div className='bg-white border border-black/10 px-6 py-4 max-w-[85%]' style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div className='flex items-center gap-3'>
                  <Loader2 className='w-4 h-4 animate-spin' strokeWidth={1.5} />
                  <span className='text-xs font-light tracking-wider uppercase' style={{ letterSpacing: '0.1em' }}>
                    Thinking
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className='p-8 border-t border-black/10 bg-white'>
          <div className='flex gap-3'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your question..."
              className='flex-1 h-12 bg-white text-black border border-black/30 focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300'
              style={{ 
                fontFamily: 'Helvetica Neue, sans-serif',
                fontWeight: 300,
                fontSize: '16px'
              }}
              disabled={isTyping}
            />
            <Button 
              onClick={handleSubmit}
              disabled={!input.trim() || isTyping}
              className='h-12 px-6 bg-amber-100 hover:bg-white hover:text-black border border-black text-white transition-all duration-300 disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-white uppercase tracking-wider text-xs'
              style={{ letterSpacing: '0.15em', fontWeight: 400 }}
            >
              <Send className='w-4 h-4 text-amber-500 font-bold' strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CVAIChat;