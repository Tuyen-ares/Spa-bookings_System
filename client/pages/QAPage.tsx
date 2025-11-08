
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

interface QAItem {
    id: string;
    question: string;
    answer: string;
}

const QAPage: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [qaData, setQaData] = useState<QAItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQA = async () => {
            try {
                setIsLoading(true);
                // TODO: Create API endpoint for QA data
                // For now, return empty array - QA data should be managed in database
                setQaData([]);
            } catch (error) {
                console.error("Failed to fetch QA data:", error);
                setQaData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQA();
    }, []);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-brand-dark font-semibold hover:text-brand-primary mb-8 transition-colors group"
                    aria-label="Quay lại trang trước"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Quay lại
                </button>
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark">Câu Hỏi Thường Gặp</h1>
                    <p className="mt-4 text-lg text-brand-text max-w-2xl mx-auto">Tìm câu trả lời cho những thắc mắc phổ biến nhất của bạn tại đây.</p>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang tải câu hỏi...</p>
                    </div>
                ) : qaData.length > 0 ? (
                    <div className="space-y-4">
                        {qaData.map((item, index) => (
                            <div key={item.id || index} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <button
                                    onClick={() => handleToggle(index)}
                                    className="w-full flex justify-between items-center text-left p-5 font-semibold text-brand-dark hover:bg-brand-secondary/50 focus:outline-none"
                                >
                                    <span className="text-lg">{item.question}</span>
                                    <ChevronDownIcon className={`w-6 h-6 transition-transform transform ${openIndex === index ? 'rotate-180' : ''}`} />
                                </button>
                                <div
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}
                                >
                                    <div className="p-5 border-t border-gray-200">
                                        <p className="text-brand-text leading-relaxed">{item.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">Chưa có câu hỏi thường gặp nào. Vui lòng quay lại sau.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QAPage;