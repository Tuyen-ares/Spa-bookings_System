import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon, LocationIcon, ClockIcon, ArrowUturnLeftIcon } from '../../shared/icons';

const ContactPage: React.FC = () => {
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.");
        e.currentTarget.reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* Hero Section */}
            <div className="relative h-[30vh] md:h-[35vh] bg-brand-dark overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-ocean-gradient opacity-90"></div>
                <div className="absolute inset-0 bg-[url('/img/general/noise.png')] opacity-20 mix-blend-soft-light"></div>
                
                {/* Animated Blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse animation-delay-500"></div>

                <div className="relative z-10 text-center px-4">
                     <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
                        Hỗ trợ 24/7
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-white mb-3 md:mb-4 drop-shadow-lg animate-slideUpFade">
                        Liên Hệ Với Chúng Tôi
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-cyan-50 max-w-xl mx-auto font-medium leading-relaxed animate-slideUpFade animation-delay-200">
                        Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-12 md:-mt-16 relative z-20 max-w-7xl">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -top-10 md:-top-12 left-4 md:left-8 flex items-center text-white/80 hover:text-white text-sm font-bold transition-colors group bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
                >
                    <ArrowUturnLeftIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Quay lại
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Contact Info Cards - Vertical Stack */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <LocationIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-brand-dark mb-2">Địa chỉ</h3>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">123 Beauty St, Quận Hoàn Kiếm, Hà Nội, Việt Nam</p>
                        </div>

                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <PhoneIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-brand-dark mb-2">Hotline</h3>
                            <p className="text-sm text-gray-600 font-medium mb-1">098-765-4321</p>
                            <p className="text-xs text-gray-400">Gọi để đặt lịch hoặc hỗ trợ nhanh</p>
                        </div>

                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <ClockIcon className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-bold text-brand-dark mb-2">Giờ mở cửa</h3>
                            <p className="text-sm text-gray-600 font-medium">Thứ 2 - Chủ nhật: 09:00 - 20:00</p>
                            <p className="text-xs text-gray-400 mt-1">Mở cửa tất cả các ngày trong tuần</p>
                        </div>
                    </div>

                    {/* Info - Main Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100 h-full">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-dark mb-3 md:mb-4">Giới thiệu ngắn</h2>
                            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Anh Thơ Spa chuyên cung cấp các dịch vụ chăm sóc sức khỏe và sắc đẹp chuyên nghiệp, kết hợp kỹ thuật hiện đại và sản phẩm cao cấp. Đội ngũ chuyên viên giàu kinh nghiệm cam kết mang lại trải nghiệm thư giãn và kết quả tối ưu cho khách hàng.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-gray-50 p-4 md:p-5 rounded-xl">
                                    <h3 className="font-bold text-sm md:text-base mb-2">Địa chỉ</h3>
                                    <p className="text-sm text-gray-600">123 Beauty St, Quận Hoàn Kiếm, Hà Nội</p>
                                </div>

                                <div className="bg-gray-50 p-4 md:p-5 rounded-xl">
                                    <h3 className="font-bold text-sm md:text-base mb-2">Giờ mở cửa</h3>
                                    <p className="text-sm text-gray-600">Thứ 2 - Chủ nhật: 09:00 - 20:00</p>
                                </div>

                                <div className="md:col-span-2 bg-gray-50 p-4 md:p-5 rounded-xl">
                                    <h3 className="font-bold text-sm md:text-base mb-3">Liên hệ qua Hotline</h3>
                                    <a href="tel:0987654321" className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition-colors">
                                        <PhoneIcon className="w-4 h-4" /> 098-765-4321
                                    </a>
                                    <p className="text-xs text-gray-500 mt-2">Vui lòng gọi hotline để đặt lịch hoặc cần hỗ trợ nhanh.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;