
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../services/geminiService';
import type { ChatMessage, Service, TreatmentCourse } from '../../types';
import { ChatbotIcon }from '../../shared/icons';

interface ChatbotProps {
    services?: Service[];
    treatmentCourses?: TreatmentCourse[];
}

const Chatbot: React.FC<ChatbotProps> = ({ services = [], treatmentCourses = [] }) => {
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
            // Pass services and treatment courses to the chatbot
            const botResponse = await getChatbotResponse(newMessages, services, treatmentCourses);
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { sender: 'bot', text: "Rất xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ với chúng tôi qua hotline: 098-765-4321." }]);
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
                className="fixed bottom-6 right-6 bg-brand-primary text-white p-4 rounded-full shadow-soft-xl hover:bg-brand-dark transition-all duration-300 transform hover:scale-110"
                aria-label="Mở Trò chuyện"
            >
               <ChatbotIcon className="h-8 w-8" />
            </button>
        );
    }
    
    return (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-brand-light rounded-lg shadow-2xl flex flex-col transition-all duration-300 border border-gray-200/80">
            <header className="bg-brand-primary text-white p-4 rounded-t-lg flex justify-between items-center">
                <h3 className="font-semibold text-lg">Trợ lý Anh Thơ Spa</h3>
                <button onClick={() => setIsOpen(false)} className="text-xl font-bold">&times;</button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto bg-brand-secondary">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-3 flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`p-3 rounded-lg max-w-xs text-base ${msg.sender === 'bot' ? 'bg-white text-brand-text shadow-sm' : 'bg-brand-dark text-white shadow-sm'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="mb-3 flex justify-start">
                        <div className="p-3 rounded-lg bg-white text-brand-text shadow-sm">
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t bg-white flex">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} className="bg-brand-primary text-white px-4 rounded-r-lg hover:bg-brand-dark disabled:opacity-50 transition-colors" disabled={isLoading}>Gửi</button>
            </div>
        </div>
    );
};

export default Chatbot;
