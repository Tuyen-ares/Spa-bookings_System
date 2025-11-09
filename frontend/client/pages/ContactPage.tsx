
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon, MailIcon, LocationIcon, ClockIcon } from '../../shared/icons';

const ContactPage: React.FC = () => {
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.");
        e.currentTarget.reset();
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
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
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark">Liên Hệ Với Chúng Tôi</h1>
                    <p className="mt-4 text-lg text-brand-text max-w-2xl mx-auto">Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.</p>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-6 text-brand-text">
                        <h2 className="text-2xl font-bold font-serif text-brand-dark">Thông tin liên hệ</h2>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 text-brand-primary"><LocationIcon /></div>
                            <div>
                                <h3 className="font-semibold">Địa chỉ</h3>
                                <p>123 Beauty St, Hà Nội, Việt Nam</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 text-brand-primary"><PhoneIcon /></div>
                            <div>
                                <h3 className="font-semibold">Hotline</h3>
                                <p>098-765-4321</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 text-brand-primary"><MailIcon /></div>
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <p>contact@anhthospa.vn</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="mt-1 text-brand-primary"><ClockIcon /></div>
                            <div>
                                <h3 className="font-semibold">Giờ mở cửa</h3>
                                <p>9:00 - 20:00 (Thứ 2 - Chủ Nhật)</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <h2 className="text-2xl font-bold font-serif text-brand-dark mb-6">Gửi tin nhắn cho chúng tôi</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-brand-text">Họ và tên</label>
                                <input type="text" id="name" required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-brand-text">Email</label>
                                <input type="email" id="email" required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-brand-text">Chủ đề</label>
                                <input type="text" id="subject" required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-brand-text">Nội dung</label>
                                <textarea id="message" rows={5} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"></textarea>
                            </div>
                            <div>
                                <button type="submit" className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg">
                                    Gửi Tin Nhắn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Map */}
                <div className="mt-12 rounded-lg overflow-hidden shadow-xl">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096949178519!2d105.842724415332!3d21.02882159312151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab92d6940e89%3A0x285b0179a3746c24!2zSG_DoG4gS2nhur9tIExha2UsIEjDoG4gS2ihur9tLCBIw6AgTuG7mWksIFZp4buHdCBOYW0!5e0!3m2!1sen!2s!4v1628087140150!5m2!1sen!2s"
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        title="Vị trí Anh Thơ Spa"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;