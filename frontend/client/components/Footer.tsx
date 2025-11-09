
import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '../../shared/icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-t from-brand-light to-brand-secondary text-brand-text mt-24">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-serif font-bold text-brand-text mb-4">Anh Thơ Spa</h3>
            <p className="max-w-md mb-6 text-sm leading-relaxed text-brand-text/80">Nơi vẻ đẹp và sự thư thái hòa quyện. Chúng tôi cam kết mang đến những dịch vụ tốt nhất.</p>
            <div className="flex space-x-5">
              <a href="#" className="text-brand-text/70 hover:text-brand-primary transition-colors" aria-label="Facebook"><FacebookIcon /></a>
              <a href="#" className="text-brand-text/70 hover:text-brand-primary transition-colors" aria-label="Instagram"><InstagramIcon /></a>
              <a href="#" className="text-brand-text/70 hover:text-brand-primary transition-colors" aria-label="TikTok"><TikTokIcon /></a>
            </div>
          </div>

          <div>
             <h3 className="font-semibold text-brand-text mb-4 tracking-wide">Liên kết nhanh</h3>
             <ul className="space-y-3 text-sm text-brand-text/80">
                <li><Link to="/services" className="hover:text-brand-primary transition-colors">Dịch vụ</Link></li>
                <li><Link to="/promotions" className="hover:text-brand-primary transition-colors">Ưu đãi</Link></li>
                <li><Link to="/#about" className="hover:text-brand-primary transition-colors">Giới thiệu</Link></li>
                <li><Link to="/policy" className="hover:text-brand-primary transition-colors">Chính sách</Link></li>
             </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-brand-text mb-4 tracking-wide">Liên hệ</h3>
            <div className="space-y-3 text-sm text-brand-text/80">
              <p><strong>Địa chỉ:</strong> 123 Beauty St, Hà Nội, Việt Nam</p>
              <p><strong>Hotline:</strong> 098-765-4321</p>
              <p><strong>Email:</strong> contact@anhthospa.vn</p>
              <p><strong>Giờ mở cửa:</strong> 9:00 - 20:00 (T2-CN)</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-brand-text mb-4 tracking-wide">Bản đồ</h3>
             <div className="rounded-lg overflow-hidden shadow-soft-lg border border-gray-200/50">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096949178519!2d105.842724415332!3d21.02882159312151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab92d6940e89%3A0x285b0179a3746c24!2zSG_DoG4gS2ihur9tIExha2UsIEjDoG4gS2ihur9tLCBIw6AgTuG7mWksIFZp4buHdG5hbQ!5e0!3m2!1sen!2s!4v1628087140150!5m2!1sen!2s" 
                    width="100%" 
                    height="150" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy"
                    title="Spa Location"
                ></iframe>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-brand-primary/20 pt-8 text-center text-sm text-brand-text/70">
          <p>&copy; {new Date().getFullYear()} Anh Thơ Spa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;