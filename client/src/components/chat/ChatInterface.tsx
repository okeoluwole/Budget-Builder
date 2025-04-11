import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatSession, ChatMessage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Send, Plus, Archive, Trash2, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const ChatInterface: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: isOpen,
  });
  
  // Fetch messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/sessions', currentSessionId, 'messages'],
    enabled: !!currentSessionId && isOpen,
  });
  
  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chat/sessions', { 
        title: 'New Conversation' 
      });
      const session = await response.json();
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setCurrentSessionId(session.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create a new chat session",
        variant: "destructive",
      });
    }
  });
  
  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentSessionId) return null;
      
      const response = await apiRequest('POST', `/api/chat/sessions/${currentSessionId}/messages`, { 
        content, 
        role: 'user' 
      });
      const message = await response.json();
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions', currentSessionId, 'messages'] });
      setInputMessage('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  });
  
  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest('DELETE', `/api/chat/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      if (currentSessionId === deletedId) {
        setCurrentSessionId(null);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  });
  
  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // If no current session, create one first
    if (!currentSessionId) {
      await createSessionMutation.mutateAsync();
      // Wait for the state to update
      setTimeout(() => {
        sendMessageMutation.mutate(inputMessage);
      }, 500);
    } else {
      sendMessageMutation.mutate(inputMessage);
    }
  };
  
  // Create a new chat session
  const handleNewChat = () => {
    createSessionMutation.mutate();
  };
  
  // Delete a chat session
  const handleDeleteSession = (sessionId: number) => {
    deleteSessionMutation.mutate(sessionId);
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat bubble button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full h-14 w-14 shadow-lg"
      >
        <MessageSquare />
      </Button>
      
      {/* Chat interface */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-96 h-[500px] shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b flex justify-between items-center bg-primary text-white">
              <h3 className="font-medium">Budget Assistant</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-primary-dark"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            
            {/* Main content */}
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-1/3 border-r p-2 bg-gray-50">
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  className="w-full mb-3 text-xs"
                  size="sm"
                  disabled={createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  New Chat
                </Button>
                
                <ScrollArea className="h-[400px] pr-2">
                  {sessionsLoading ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : sessions && sessions.length > 0 ? (
                    <div className="space-y-1">
                      {sessions.map((session) => (
                        <div 
                          key={session.id}
                          className={`flex justify-between items-center rounded p-2 text-xs cursor-pointer hover:bg-gray-100 ${
                            currentSessionId === session.id ? 'bg-gray-200' : ''
                          }`}
                          onClick={() => setCurrentSessionId(session.id)}
                        >
                          <div className="truncate flex-1">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            {session.title || 'Untitled'}
                          </div>
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-xs mt-8">
                      <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No conversations yet</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {/* Chat content */}
              <div className="flex-1 flex flex-col h-full">
                {/* Messages area */}
                <ScrollArea className="flex-1 p-3">
                  {currentSessionId ? (
                    messagesLoading ? (
                      <div className="flex justify-center items-center h-20">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div 
                            key={message.id}
                            className={`flex flex-col ${
                              message.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            </div>
                            <span className="text-xs text-gray-400 mt-1">
                              {formatTime(message.timestamp?.toString() || new Date().toString())}
                            </span>
                          </div>
                        ))}
                        {sendMessageMutation.isPending && (
                          <div className="flex items-start">
                            <div className="max-w-[80%] rounded-lg bg-gray-100 p-3">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-sm">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                        <h3 className="text-lg font-medium mb-1">How can I help today?</h3>
                        <p className="text-sm max-w-[250px]">
                          Ask me questions about your budget, specifications, or project planning.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                      <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                      <h3 className="text-lg font-medium mb-1">Start a new conversation</h3>
                      <p className="text-sm max-w-[250px]">
                        Create a new chat or select an existing one to begin.
                      </p>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Input area */}
                <div className="p-3 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1"
                      disabled={
                        createSessionMutation.isPending || 
                        sendMessageMutation.isPending
                      }
                    />
                    <Button 
                      type="submit"
                      size="icon"
                      disabled={
                        !inputMessage.trim() || 
                        createSessionMutation.isPending || 
                        sendMessageMutation.isPending
                      }
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChatInterface;