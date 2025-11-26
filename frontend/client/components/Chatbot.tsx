
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../services/geminiService';
import type { ChatMessage } from '../../types';
import { PaperAirplaneIcon, MinusIcon, SparklesIcon } from '../../shared/icons';

const SUGGESTIONS = [
    "Đặt lịch hẹn thế nào?",
    "Bảng giá dịch vụ?",
    "Đang có khuyến mãi gì?",
    "Địa chỉ Spa ở đâu?",
    "Tư vấn da mụn"
];

const AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"; // Cartoon Support Agent Image

const TypingIndicator = () => (
    <div className="flex space-x-1 p-2.5 bg-gray-100 rounded-2xl rounded-tl-none w-fit items-center h-10 shadow-sm border border-gray-200">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

const FormatText = ({ text }: { text: string }) => {
    // Split by line breaks first
    const lines = text.split('\n');
    
    return (
        <div className="space-y-2">
            {lines.map((line, lineIdx) => {
                if (!line.trim()) return <br key={lineIdx} />;
                
                // Check if line is a bullet point
                const isBullet = line.trim().startsWith('*') && !line.trim().startsWith('**');
                const isNumbered = /^\d+\./.test(line.trim());
                
                // Parse bold text (wrapped in ** **)
                const parts = line.split(/(\*\*.*?\*\*)/g);
                
                const content = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={i} className="font-bold text-brand-dark">
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }
                    return <span key={i}>{part}</span>;
                });
                
                // Render based on line type
                if (isBullet) {
                    return (
                        <div key={lineIdx} className="flex gap-2 items-start">
                            <span className="text-brand-primary mt-1">•</span>
                            <span className="flex-1">{content}</span>
                        </div>
                    );
                } else if (isNumbered) {
                    return (
                        <div key={lineIdx} className="flex gap-2 items-start">
                            <span className="text-brand-primary font-semibold">{line.match(/^\d+\./)?.[0]}</span>
                            <span className="flex-1">{content}</span>
                        </div>
                    );
                } else {
                    return <div key={lineIdx}>{content}</div>;
                }
            })}
        </div>
    );
};

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-chatbot', handleOpenChat);
        return () => window.removeEventListener('open-chatbot', handleOpenChat);
    }, []);

    useEffect(() => {
        scrollToBottom();
        if (isOpen && messages.length === 0) {
            // Add initial greeting with a slight delay for effect
            setTimeout(() => {
                setMessages([{ 
                    sender: 'bot', 
                    text: 'Chào bạn! 💕 Tôi là Thơ - trợ lý AI của Anh Thơ Spa. Tôi có thể giúp bạn tra cứu dịch vụ, đặt lịch hoặc xem ưu đãi mới nhất không?' 
                }]);
            }, 500);
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, messages.length]);

    const handleSendMessage = async (text: string = userInput) => {
        if (!text.trim() || isLoading) return;

        const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: text }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const botResponse = await getChatbotResponse(newMessages);
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { sender: 'bot', text: "Rất xin lỗi, kết nối đang bị gián đoạn. Bạn vui lòng thử lại sau hoặc gọi hotline nhé! 😓" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSendMessage(suggestion);
    };
    
    // Render Button (Launcher)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 group flex items-center justify-center z-[100] transition-all duration-500 hover:scale-110"
                aria-label="Mở Trò chuyện"
            >
                {/* Pulsing Effect - Enhanced */}
                <span className="absolute inline-flex h-[120%] w-[120%] rounded-full bg-brand-primary opacity-30 animate-ping group-hover:animate-none"></span>
                <span className="absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-brand-primary to-rose-500 opacity-20 blur-md"></span>
                
                {/* Main Button */}
                <div className="relative bg-white p-1 rounded-full shadow-[0_8px_20px_rgba(225,29,72,0.3)] border-2 border-rose-100 overflow-hidden w-16 h-16 flex items-center justify-center">
                    <img src={AVATAR_URL} alt="Chatbot" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
                    
                    {/* Notification Badge (Mock) */}
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
                    </span>
                </div>
                
                {/* Tooltip - Improved */}
                <div className="absolute right-full mr-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-glass text-brand-dark text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none border border-white/50">
                    Chat với Thơ ngay! 👋
                </div>
            </button>
        );
    }
    
    // Render Chat Window
    return (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[100] flex flex-col justify-end md:justify-auto pointer-events-none">
            <div className="pointer-events-auto w-full h-full md:w-[400px] md:h-[600px] bg-white/95 backdrop-blur-xl md:rounded-[2rem] shadow-2xl flex flex-col transition-all duration-300 border border-white/60 overflow-hidden animate-slideUpFade ring-1 ring-black/5">
                
                {/* Header */}
                <header className="bg-gradient-to-r from-brand-primary via-rose-500 to-brand-dark p-5 flex justify-between items-center shadow-md relative overflow-hidden shrink-0">
                    {/* Abstract Shapes in Header */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl animate-pulse"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/40 overflow-hidden">
                                <img src={AVATAR_URL} alt="Chatbot" className="w-full h-full object-cover" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight font-serif">Trợ lý Anh Thơ</h3>
                            <p className="text-rose-100 text-xs flex items-center gap-1.5 font-medium">
                                <SparklesIcon className="w-3 h-3 animate-pulse" /> Luôn sẵn sàng hỗ trợ
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 relative z-10">
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors group" 
                            title="Thu nhỏ"
                        >
                            <MinusIcon className="w-6 h-6 group-hover:scale-110 transition-transform"/>
                        </button>
                    </div>
                </header>
                
                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                    <div className="space-y-5">
                        <div className="text-center text-[10px] text-gray-400 my-4 flex items-center justify-center gap-3 uppercase tracking-widest font-bold">
                            <span className="h-px w-8 bg-gray-200"></span>
                            <span>Hôm nay</span>
                            <span className="h-px w-8 bg-gray-200"></span>
                        </div>

                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'} items-end gap-2.5 group animate-fadeIn`}>
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 mb-1 shadow-sm overflow-hidden">
                                        <img src={AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div 
                                    className={`
                                        p-3.5 max-w-[80%] text-sm shadow-sm leading-relaxed relative
                                        ${msg.sender === 'bot' 
                                            ? 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100' 
                                            : 'bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-2xl rounded-br-none shadow-md'
                                        }
                                    `}
                                >
                                    <FormatText text={msg.text} />
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start items-end gap-2.5 animate-fadeIn">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 mb-1 shadow-sm overflow-hidden">
                                    <img src={AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
                                </div>
                                <TypingIndicator />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                
                {/* Suggestions (Quick Replies) */}
                {messages.length < 4 && !isLoading && (
                    <div className="px-4 py-3 bg-white/50 backdrop-blur-sm border-t border-gray-100 overflow-x-auto flex gap-2 shrink-0 no-scrollbar scroll-smooth mask-linear-fade">
                        {SUGGESTIONS.map((sug, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSuggestionClick(sug)}
                                className="whitespace-nowrap px-4 py-2 bg-white border border-brand-primary/10 text-brand-primary text-xs font-bold rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-sm hover:shadow-md flex-shrink-0 transform hover:-translate-y-0.5"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-[1.5rem] px-2 py-2 focus-within:ring-2 focus-within:ring-brand-primary/30 focus-within:bg-white transition-all border border-gray-200 focus-within:border-brand-primary/50 shadow-inner">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập câu hỏi của bạn..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder:text-gray-400 px-3 py-1"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSendMessage()} 
                            disabled={!userInput.trim() || isLoading}
                            className={`
                                p-2.5 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center
                                ${!userInput.trim() || isLoading
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-tr from-brand-primary to-rose-500 text-white hover:shadow-lg hover:scale-105 active:scale-95'}
                            `}
                        >
                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                        </button>
                    </div>
                    <div className="text-center mt-2 flex justify-center items-center gap-1">
                        <SparklesIcon className="w-3 h-3 text-yellow-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
