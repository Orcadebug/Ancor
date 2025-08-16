import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  MessageSquare,
  FileText,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  Bot,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ExternalLink,
  Sparkles,
  History,
  BookOpen,
  Target,
  GitCompare,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  queryType?: "simple" | "complex" | "comparison" | "timeline" | "risk";
}

interface DocumentSource {
  id: string;
  name: string;
  page?: number;
  relevanceScore: number;
  excerpt: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface SuggestedQuestion {
  id: string;
  text: string;
  category: "general" | "legal" | "financial" | "analysis";
  icon: any;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Employment Contract Analysis",
    lastMessage: "What are the termination clauses in the contract?",
    timestamp: new Date("2024-01-15T14:30:00"),
    messageCount: 8,
  },
  {
    id: "2",
    title: "Q4 Financial Review",
    lastMessage: "Compare revenue growth with previous quarters",
    timestamp: new Date("2024-01-15T10:15:00"),
    messageCount: 12,
  },
  {
    id: "3",
    title: "Risk Assessment Review",
    lastMessage: "Identify potential compliance issues",
    timestamp: new Date("2024-01-14T16:45:00"),
    messageCount: 5,
  },
];

const suggestedQuestions: SuggestedQuestion[] = [
  {
    id: "1",
    text: "Summarize the key points from all uploaded contracts",
    category: "general",
    icon: BookOpen,
  },
  {
    id: "2",
    text: "What are the potential legal risks in the recent documents?",
    category: "legal",
    icon: Target,
  },
  {
    id: "3",
    text: "Compare Contract A vs Contract B terms and conditions",
    category: "analysis",
    icon: GitCompare,
  },
  {
    id: "4",
    text: "Show me a timeline of all mentioned events and dates",
    category: "analysis",
    icon: Clock,
  },
  {
    id: "5",
    text: "Calculate total financial commitments across all documents",
    category: "financial",
    icon: FileText,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    type: "assistant",
    content:
      "Hello! I'm your AI document assistant. I've analyzed your document library and I'm ready to help you with any questions about your contracts, reports, and other documents. What would you like to know?",
    timestamp: new Date("2024-01-15T14:25:00"),
  },
  {
    id: "2",
    type: "user",
    content: "What are the key terms in the employment contract for John Doe?",
    timestamp: new Date("2024-01-15T14:26:00"),
  },
  {
    id: "3",
    type: "assistant",
    content:
      "Based on the employment contract for John Doe, here are the key terms:\n\n**Position & Compensation:**\n• Role: Senior Software Engineer\n• Base Salary: $120,000 annually\n• Bonus: Performance-based up to 15%\n• Stock Options: 1,000 shares vesting over 4 years\n\n**Benefits:**\n• Health, dental, and vision insurance\n• 401(k) with 4% company match\n• 3 weeks PTO + holidays\n• $2,000 annual learning budget\n\n**Key Clauses:**\n• 90-day probationary period\n• Non-compete for 12 months post-employment\n• Intellectual property assignment\n• Termination requires 2 weeks notice",
    timestamp: new Date("2024-01-15T14:26:30"),
    sources: [
      {
        id: "1",
        name: "Employment Contract - John Doe.pdf",
        page: 1,
        relevanceScore: 0.95,
        excerpt:
          "Position: Senior Software Engineer, Base Salary: $120,000 per annum...",
      },
      {
        id: "1",
        name: "Employment Contract - John Doe.pdf",
        page: 3,
        relevanceScore: 0.88,
        excerpt:
          "Benefits package includes health insurance, 401(k) matching...",
      },
    ],
    queryType: "simple",
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >("1");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I'm analyzing your question and searching through your document library. This is a simulated response for demonstration purposes.",
        timestamp: new Date(),
        sources: [
          {
            id: "1",
            name: "Sample Document.pdf",
            page: 2,
            relevanceScore: 0.92,
            excerpt:
              "This is a sample excerpt from the document that relates to your question...",
          },
        ],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    textareaRef.current?.focus();
  };

  const exportConversation = () => {
    const conversationText = messages
      .map((msg) => `${msg.type === "user" ? "You" : "AI"}: ${msg.content}`)
      .join("\n\n");

    const blob = new Blob([conversationText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === "user";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex max-w-[70%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? "bg-primary ml-2" : "bg-muted mr-2"
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Bot className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground border"
            }`}
          >
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                <p className="text-xs font-medium mb-2 opacity-80">Sources:</p>
                <div className="space-y-2">
                  {message.sources.map((source, index) => (
                    <div key={index} className="bg-background/10 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {source.name}
                        </span>
                        <div className="flex items-center space-x-1">
                          {source.page && (
                            <Badge variant="outline" className="text-xs">
                              p.{source.page}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {Math.round(source.relevanceScore * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs opacity-80 italic">
                        "{source.excerpt}"
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs mt-1 p-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message actions */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted-foreground/20">
              <span className="text-xs opacity-60">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {!isUser && (
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversation Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Conversations</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="p-4 space-y-2">
                  {mockConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conv.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {conv.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {conv.messageCount} messages
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    AI Document Assistant
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportConversation}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100vh-16rem)]">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="pr-4">
                  {messages.map(renderMessage)}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="flex max-w-[70%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted mr-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="rounded-lg px-4 py-3 bg-muted text-foreground border">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Ask anything about your documents..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions & Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Suggested Queries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-3">
                  {suggestedQuestions.map((question) => {
                    const IconComponent = question.icon;
                    return (
                      <Button
                        key={question.id}
                        variant="outline"
                        className="w-full text-left h-auto p-3 justify-start"
                        onClick={() => handleSuggestedQuestion(question.text)}
                      >
                        <div className="flex items-start space-x-2">
                          <IconComponent className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs leading-relaxed">
                            {question.text}
                          </span>
                        </div>
                      </Button>
                    );
                  })}

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Search className="h-3 w-3 mr-2" />
                        Search Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <History className="h-3 w-3 mr-2" />
                        View Chat History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Filter className="h-3 w-3 mr-2" />
                        Filter by Source
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-3">Document Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Documents:
                        </span>
                        <span className="font-medium">847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Indexed Pages:
                        </span>
                        <span className="font-medium">12,503</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Last Updated:
                        </span>
                        <span className="font-medium">2 min ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
