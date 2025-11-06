import React, { useState, useRef, useEffect } from 'react';
// FIX: Corrected import path for geminiService.
// FIX: Changed import path to resolve ambiguity.
// FIX: Corrected the import path to point to the correct geminiService file.
import { getChatbotResponse } from '../client/services/geminiService';
import type { ChatMessage } from '../types';
import { ChatbotIcon }from '../shared/icons';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-chatbot', handleOpenChat);

        return () => {
            window.removeEventListener('open-chatbot', handleOpenChat);
        };
    }, []);

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ sender: 'bot', text: 'Chào bạn! Tôi là Thơ, trợ lý ảo của Anh Thơ Spa. Tôi có thể giúp gì cho bạn?'}]);
        }
    }, [isOpen, messages.length]);

    const handleSendMessage = async () => {
        if (userInput.trim() === '' || isLoading) return;

        const currentInput = userInput;
        const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: currentInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            // Truyền toàn bộ lịch sử trò chuyện đến dịch vụ chatbot.
            const botResponse = await getChatbotResponse(newMessages);
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { sender: 'bot', text: "Rất xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };
    
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-primary text-white p-4 rounded-full shadow-lg hover:bg-brand-dark transition-colors"
                aria-label="Open Chat"
            >
               <ChatbotIcon className="h-8 w-8" />
            </button>
        );
    }
    
    return (
        <div className="fixed bottom-6 right-6 w-80 h-[28rem] bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300">
            <header className="bg-brand-primary text-white p-4 rounded-t-lg flex justify-between items-center">
                <h3 className="font-bold">Anh Thơ Spa Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="text-xl font-bold">&times;</button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto bg-brand-light">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-3 flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`p-2 rounded-lg max-w-xs ${msg.sender === 'bot' ? 'bg-gray-200 text-gray-800' : 'bg-brand-dark text-white'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="mb-3 flex justify-start">
                        <div className="p-2 rounded-lg bg-gray-200 text-gray-800">
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t flex">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi..."
                    className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} className="bg-brand-primary text-white p-2 rounded-r-md hover:bg-brand-dark disabled:opacity-50" disabled={isLoading}>&rarr;</button>
            </div>
        </div>
    );
};