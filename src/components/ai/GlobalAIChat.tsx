import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AI_CHAT_ASK_EVENT } from '@/lib/aiChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function GlobalAIChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get context-aware suggested questions based on current page
  useEffect(() => {
    if (!isOpen) return;

    const path = location.pathname;
    let questions: string[] = [];

    if (path === '/dashboard') {
      questions = [
        t('aiChat.suggestions.dashboard1'),
        t('aiChat.suggestions.dashboard2'),
        t('aiChat.suggestions.dashboard3')
      ];
    } else if (path.startsWith('/projects/')) {
      questions = [
        t('aiChat.suggestions.project1'),
        t('aiChat.suggestions.project2'),
        t('aiChat.suggestions.project3')
      ];
    } else if (path === '/projects') {
      questions = [
        t('aiChat.suggestions.projects1'),
        t('aiChat.suggestions.projects2')
      ];
    } else {
      questions = [
        t('aiChat.suggestions.general1'),
        t('aiChat.suggestions.general2')
      ];
    }

    setSuggestedQuestions(questions);
  }, [location.pathname, isOpen, t]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getPageContext = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path.startsWith('/projects/')) return 'project_detail';
    if (path === '/projects') return 'projects_list';
    if (path === '/settings') return 'settings';
    return 'general';
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          message: messageText,
          context: {
            page: getPageContext(),
            projectId: location.pathname.split('/')[2] || null,
            conversationHistory: messages
          }
        }
      });

      if (error) {
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          toast({
            title: t('aiChat.errors.rateLimit'),
            description: t('aiChat.errors.rateLimitDesc'),
            variant: 'destructive'
          });
        } else if (error.message?.includes('credits') || error.message?.includes('402')) {
          toast({
            title: t('aiChat.errors.noCredits'),
            description: t('aiChat.errors.noCreditsDesc'),
            variant: 'destructive'
          });
        } else {
          throw error;
        }
        setMessages(prev => prev.slice(0, -1)); // Remove user message on error
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: t('aiChat.errors.general'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    sendMessage(question);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{t('aiChat.title')}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">{t('aiChat.welcome')}</p>
                <p className="text-xs mt-2">{t('aiChat.contextAware')}</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {messages.length === 0 && suggestedQuestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">{t('aiChat.suggestedQuestions')}</p>
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs h-auto py-2"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('aiChat.placeholder')}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
}
