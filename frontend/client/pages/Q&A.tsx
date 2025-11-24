
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '../../shared/icons';

const qaData = [
    {
        question: "Làm thế nào để đặt lịch hẹn tại Anh Thơ Spa?",
        answer: "Chào bạn, bạn có thể đặt lịch hẹn dễ dàng qua website của chúng tôi bằng cách nhấn vào nút 'Đặt lịch ngay', hoặc gọi trực tiếp đến hotline 098-765-4321. Chúng tôi luôn sẵn sàng hỗ trợ bạn."
    },
    {
        question: "Tôi có cần chuẩn bị gì trước khi đến spa không?",
        answer: "Để có trải nghiệm tốt nhất, bạn nên đến trước giờ hẹn 5-10 phút để thư giãn và điền thông tin tư vấn. Nếu bạn sử dụng các liệu trình về da mặt, bạn nên để mặt mộc. Ngoài ra, hãy mặc trang phục thoải mái nhé."
    },
    {
        question: "Chính sách hủy hoặc dời lịch hẹn như thế nào?",
        answer: "Chúng tôi hiểu rằng đôi khi bạn cần thay đổi kế hoạch. Vui lòng thông báo cho chúng tôi trước ít nhất 4 tiếng để hủy hoặc dời lịch hẹn miễn phí. Nếu thông báo muộn hơn, chúng tôi có thể áp dụng một khoản phí nhỏ."
    },
    {
        question: "Spa có những phương thức thanh toán nào?",
        answer: "Anh Thơ Spa chấp nhận thanh toán bằng tiền mặt, chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ (Visa, Mastercard) và các ví điện tử phổ biến như Momo, VNPay."
    },
    {
        question: "Tôi có thể mua sản phẩm chăm sóc da tại spa không?",
        answer: "Chắc chắn rồi! Chúng tôi có cung cấp các sản phẩm chăm sóc da cao cấp được sử dụng trong các liệu trình tại spa. Các chuyên viên của chúng tôi sẽ tư vấn sản phẩm phù hợp nhất với tình trạng da của bạn."
    },
     {
        question: "Liệu trình triệt lông có an toàn và hiệu quả không?",
        answer: "Chúng tôi sử dụng công nghệ Diode Laser tiên tiến, được chứng nhận an toàn và hiệu quả cao. Công nghệ này có hệ thống làm lạnh giúp giảm thiểu cảm giác khó chịu và phù hợp với nhiều loại da khác nhau. Hiệu quả có thể khác nhau tùy thuộc vào cơ địa mỗi người, nhưng hầu hết khách hàng đều thấy kết quả rõ rệt sau vài buổi."
    }
];

const QAPage: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const navigate = useNavigate();

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

                <div className="space-y-4">
                    {qaData.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
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
            </div>
        </div>
    );
};

export default QAPage;