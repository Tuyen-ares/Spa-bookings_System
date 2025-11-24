import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TikTokIcon, LogoIcon, LocationIcon, PhoneIcon, MailIcon, ClockIcon, ArrowRightIcon } from '../../shared/icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-brand-text relative pt-20 pb-10 overflow-hidden">
      {/* Vibrant Top Border Line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary via-blue-500 to-brand-accent"></div>
      
      {/* Background Decoration (Subtle) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
                <div className="p-2 bg-brand-secondary rounded-full group-hover:scale-110 transition-transform duration-300">
                    <LogoIcon className="w-8 h-8 text-brand-primary" />
                </div>
                <span className="text-2xl font-serif font-extrabold text-brand-dark tracking-tight">Anh Thơ Spa</span>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Nơi vẻ đẹp và sự thư thái hòa quyện. Chúng tôi cam kết mang đến những trải nghiệm chăm sóc sức khỏe và sắc đẹp đẳng cấp nhất từ thiên nhiên.
            </p>
            <div className="flex space-x-3">
              <SocialButton icon={<FacebookIcon />} label="Facebook" color="hover:bg-blue-600" />
              <SocialButton icon={<InstagramIcon />} label="Instagram" color="hover:bg-pink-600" />
              <SocialButton icon={<TikTokIcon />} label="TikTok" color="hover:bg-black" />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
             <h3 className="font-serif font-bold text-brand-dark text-xl mb-6 relative inline-block">
                 Khám Phá
                 <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-brand-primary rounded-full"></span>
             </h3>
             <ul className="space-y-4">
                <FooterLink to="/services">Dịch vụ & Liệu trình</FooterLink>
                <FooterLink to="/promotions">Ưu đãi & Quà tặng</FooterLink>
                <FooterLink to="/about">Câu chuyện thương hiệu</FooterLink>
                <FooterLink to="/qa">Hỏi đáp thường gặp</FooterLink>
                <FooterLink to="/policy">Chính sách bảo mật</FooterLink>
             </ul>
          </div>
          
          {/* Column 3: Contact Info */}
          <div>
            <h3 className="font-serif font-bold text-brand-dark text-xl mb-6 relative inline-block">
                 Liên Hệ
                 <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-brand-primary rounded-full"></span>
             </h3>
            <div className="space-y-5">
              <ContactItem icon={<LocationIcon />} title="Địa chỉ" content="87 Đ. Tô Ngọc Vân, P, Thủ Đức, Thành phố Hồ Chí Minh 71300" />
              <ContactItem icon={<PhoneIcon />} title="Hotline" content="0941-608-915" />
              <ContactItem icon={<MailIcon />} title="Email" content="contact@anhthospa.vn" />
              <ContactItem icon={<ClockIcon />} title="Giờ mở cửa" content="9:00 - 22:00 (T2-CN)" />
            </div>
          </div>
          
          {/* Column 4: Map & CTA */}
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-brand-dark text-xl mb-6 relative inline-block">
                 Chỉ Dẫn
                 <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-brand-primary rounded-full"></span>
             </h3>
             <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white transform transition-transform hover:scale-[1.02] duration-300">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096949178519!2d105.842724415332!3d21.02882159312151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab92d6940e89%3A0x285b0179a3746c24!2zSG_DoG4gS2ihur9tIExha2UsIEjDoG4gS2ihur9tLCBIw6AgTuG7mWksIFZp4buHdCBOYW0!5e0!3m2!1sen!2s!4v1628087140150!5m2!1sen!2s" 
                    width="100%" 
                    height="160" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy"
                    title="Spa Location"
                    className="filter grayscale-[30%] hover:grayscale-0 transition-all duration-500"
                ></iframe>
            </div>
            <Link to="/booking" className="block w-full text-center py-3 rounded-xl bg-brand-dark text-white font-bold shadow-md hover:bg-brand-primary transition-colors">
                Đặt Lịch Ngay
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Anh Thơ Spa. Bản quyền thuộc về chúng tôi.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-brand-primary transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-brand-primary transition-colors">Chính sách quyền riêng tư</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Helper Components
const SocialButton = ({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) => (
    <a 
        href="#" 
        className={`w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 ${color} hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md`} 
        aria-label={label}
    >
        <div className="w-5 h-5">{icon}</div>
    </a>
);

const FooterLink = ({ to, children }: { to: string, children: React.ReactNode }) => (
    <li className="transform transition-transform hover:translate-x-1">
        <Link to={to} className="text-gray-600 hover:text-brand-primary font-medium flex items-center gap-2 group">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary group-hover:bg-brand-primary transition-colors"></span>
            {children}
        </Link>
    </li>
);

const ContactItem = ({ icon, title, content, isLink, href }: { icon: React.ReactNode, title: string, content: string, isLink?: boolean, href?: string }) => (
    <div className="flex items-start gap-4 group">
        <div className="mt-1 w-8 h-8 rounded-lg bg-brand-secondary flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300 shrink-0">
            <div className="w-4 h-4">{icon}</div>
        </div>
        <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{title}</h4>
            {isLink ? (
                <a href={href} className="text-gray-700 font-semibold hover:text-brand-primary transition-colors block">{content}</a>
            ) : (
                <p className="text-gray-700 font-semibold">{content}</p>
            )}
        </div>
    </div>
);

export default Footer;