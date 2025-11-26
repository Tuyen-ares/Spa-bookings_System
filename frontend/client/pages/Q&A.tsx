
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    SearchIcon, 
    PlusIcon, 
    MinusIcon, 
    ChatBubbleBottomCenterTextIcon, 
    PhoneIcon, 
    ArrowUturnLeftIcon,
    QuestionMarkCircleIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    SparklesIcon,
    ChevronDownIcon,
    ArrowRightIcon
} from '../../shared/icons';

// Expanded Data with Categories
const qaData = [
    {
        id: 1,
        category: 'booking',
        question: "Làm thế nào để đặt lịch hẹn tại Anh Thơ Spa?",
        answer: "Bạn có thể đặt lịch dễ dàng qua website bằng nút 'Đặt lịch ngay', qua fanpage Facebook, hoặc gọi hotline 098-765-4321. Chúng tôi khuyến khích đặt trước ít nhất 2 tiếng để được phục vụ chu đáo nhất."
    },
    {
        id: 2,
        category: 'service',
        question: "Tôi có cần chuẩn bị gì trước khi đến spa không?",
        answer: "Bạn chỉ cần mang theo tinh thần thoải mái! Nếu sử dụng liệu trình da mặt, hạn chế trang điểm đậm. Đến sớm 10 phút để thưởng trà và tư vấn soi da miễn phí nhé."
    },
    {
        id: 3,
        category: 'booking',
        question: "Chính sách hủy hoặc dời lịch hẹn như thế nào?",
        answer: "Vui lòng thông báo trước ít nhất 4 tiếng nếu bạn cần thay đổi. Việc này giúp chúng tôi sắp xếp lại kỹ thuật viên để phục vụ khách hàng khác tốt hơn."
    },
    {
        id: 4,
        category: 'payment',
        question: "Spa có những phương thức thanh toán nào?",
        answer: "Chúng tôi chấp nhận Tiền mặt, Chuyển khoản, Thẻ (Visa/Mastercard/JCB) và các ví điện tử (Momo, VNPay, ZaloPay). Có xuất hóa đơn VAT nếu bạn yêu cầu."
    },
    {
        id: 5,
        category: 'service',
        question: "Sản phẩm sử dụng tại spa có nguồn gốc từ đâu?",
        answer: "100% mỹ phẩm tại Anh Thơ Spa là hàng chính hãng từ các thương hiệu uy tín (Dermalogica, Murad, Ohui...) hoặc dược mỹ phẩm thiên nhiên độc quyền, an toàn cho mọi loại da."
    },
     {
        id: 6,
        category: 'service',
        question: "Liệu trình triệt lông có đau không?",
        answer: "Công nghệ Diode Laser lạnh âm độ giúp triệt lông êm ái, gần như không đau rát, chỉ có cảm giác châm chích rất nhẹ. An toàn tuyệt đối cho vùng da nhạy cảm."
    },
    {
        id: 7,
        category: 'payment',
        question: "Tôi có được hoàn tiền nếu không hài lòng không?",
        answer: "Chúng tôi cam kết chất lượng dịch vụ. Nếu có bất kỳ vấn đề gì trong quá trình trị liệu, vui lòng phản hồi ngay cho quản lý để được xử lý và bảo hành thỏa đáng."
    }
];

const categories = [
    { id: 'all', label: 'Tất cả câu hỏi', icon: <QuestionMarkCircleIcon className="w-5 h-5"/> },
    { id: 'booking', label: 'Đặt lịch & Giờ giấc', icon: <CalendarIcon className="w-5 h-5"/> },
    { id: 'service', label: 'Dịch vụ & Liệu trình', icon: <SparklesIcon className="w-5 h-5"/> },
    { id: 'payment', label: 'Thanh toán & Giá', icon: <CurrencyDollarIcon className="w-5 h-5"/> },
];

const QAPage: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const navigate = useNavigate();

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const filteredData = useMemo(() => {
        return qaData.filter(item => {
            const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    return (
        <div className="bg-white min-h-screen pb-20 font-sans">
            {/* 1. Premium Hero Section */}
            <div className="relative bg-brand-dark h-[50vh] min-h-[450px] overflow-hidden">
                <div className="absolute inset-0 bg-ocean-gradient opacity-90"></div>
                {/* Abstract Shapes */}
                <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/20 rounded-full blur-[80px]"></div>
                <div className="absolute top-[20%] right-[20%] w-4 h-4 bg-yellow-300 rounded-full blur-[2px] animate-ping"></div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-8 left-8 text-white/70 hover:text-white flex items-center gap-2 transition-colors group uppercase tracking-widest text-xs font-bold"
                    >
                        <ArrowUturnLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Quay lại
                    </button>

                    <span className="text-cyan-200 font-bold tracking-[0.3em] uppercase text-sm mb-4 animate-fadeInDown">Hỗ trợ khách hàng</span>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-8 leading-tight drop-shadow-lg animate-slideUpFade">
                        Trung Tâm Trợ Giúp
                    </h1>

                    {/* Modern Search Bar */}
                    <div className="relative w-full max-w-2xl group animate-slideUpFade animation-delay-200">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all duration-500"></div>
                        <div className="relative flex items-center bg-white/95 backdrop-blur-xl rounded-full shadow-2xl p-2 transition-all transform group-hover:scale-[1.02]">
                            <div className="p-3 bg-gray-50 rounded-full text-gray-400">
                                <SearchIcon className="w-6 h-6" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Bạn đang thắc mắc về điều gì?" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-gray-800 text-lg placeholder-gray-400 font-medium"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <span className="sr-only">Clear</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Content Section */}
            <div className="container mx-auto px-4 -mt-16 relative z-20 max-w-5xl">
                {/* Categories Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fadeInUp">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-md hover:-translate-y-1
                                ${activeCategory === cat.id 
                                    ? 'bg-white text-brand-primary shadow-xl ring-2 ring-brand-primary/20' 
                                    : 'bg-white/90 text-gray-500 hover:bg-white hover:text-brand-dark'}
                            `}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-5">
                    {filteredData.length > 0 ? (
                        filteredData.map((item, index) => {
                            const isOpen = openIndex === index;
                            return (
                                <div 
                                    key={item.id} 
                                    className={`group bg-white rounded-3xl transition-all duration-500 border border-gray-100 overflow-hidden ${isOpen ? 'shadow-soft-xl ring-1 ring-brand-primary/20' : 'shadow-sm hover:shadow-md'}`}
                                >
                                    <button
                                        onClick={() => handleToggle(index)}
                                        className="w-full flex justify-between items-center p-6 sm:p-8 text-left focus:outline-none cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-brand-primary text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-brand-secondary/30 group-hover:text-brand-primary'}`}>
                                                <span className="font-serif font-bold text-lg">{index + 1}</span>
                                            </div>
                                            <span className={`text-lg sm:text-xl font-bold transition-colors ${isOpen ? 'text-brand-dark' : 'text-gray-700 group-hover:text-brand-primary'}`}>
                                                {item.question}
                                            </span>
                                        </div>
                                        <div className={`p-2 rounded-full transition-transform duration-300 transform ${isOpen ? 'rotate-180 bg-gray-100 text-brand-primary' : 'text-gray-400 group-hover:translate-x-1'}`}>
                                            <ChevronDownIcon className="w-6 h-6" />
                                        </div>
                                    </button>
                                    
                                    <div
                                        className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="px-8 pb-8 pl-[5.5rem] pr-8 sm:pr-12">
                                            <p className="text-gray-600 leading-relaxed text-base font-light border-l-2 border-brand-secondary pl-4">
                                                {item.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <SearchIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 mb-2">Không tìm thấy kết quả</h3>
                            <p className="text-gray-400 mb-6">Hãy thử từ khóa khác hoặc chọn danh mục "Tất cả".</p>
                            <button onClick={() => {setSearchQuery(''); setActiveCategory('all');}} className="text-brand-primary font-bold hover:underline">
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};

export default QAPage;
