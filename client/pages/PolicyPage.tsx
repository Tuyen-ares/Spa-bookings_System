
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PolicyPage: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Chính sách bảo mật thông tin",
            content: [
                "Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Mọi thông tin bạn cung cấp (tên, số điện thoại, email) chỉ được sử dụng cho mục đích quản lý lịch hẹn, chăm sóc khách hàng và thông báo các chương trình ưu đãi của Anh Thơ Spa.",
                "Chúng tôi không chia sẻ, bán hoặc cho thuê thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào mà không có sự đồng ý của bạn, trừ khi được yêu cầu bởi pháp luật."
            ]
        },
        {
            title: "Chính sách đặt lịch và hủy lịch",
            content: [
                "Quý khách vui lòng đặt lịch hẹn trước để đảm bảo chúng tôi có thể phục vụ bạn một cách tốt nhất.",
                "Trường hợp cần thay đổi hoặc hủy lịch, xin vui lòng thông báo cho chúng tôi trước ít nhất 4 tiếng so với giờ hẹn. Điều này giúp chúng tôi sắp xếp lại lịch và phục vụ các khách hàng khác.",
                "Nếu không thông báo hoặc thông báo muộn, chúng tôi có thể áp dụng một khoản phí nhỏ hoặc ghi nhận vào lịch sử đặt hẹn của bạn."
            ]
        },
        {
            title: "Chính sách thành viên và điểm thưởng",
            content: [
                "Mọi khách hàng sử dụng dịch vụ tại Anh Thơ Spa đều có thể trở thành thành viên và tham gia chương trình tích điểm.",
                "Với mỗi 1.000đ chi tiêu cho dịch vụ, bạn sẽ nhận được 1 điểm thưởng vào tài khoản.",
                "Điểm thưởng có thể được sử dụng để đổi lấy các voucher giảm giá hoặc các phần quà đặc biệt trong Cửa hàng Loyalty. Điểm thưởng không có giá trị quy đổi thành tiền mặt."
            ]
        },
        {
            title: "Điều khoản sử dụng chung",
            content: [
                "Để đảm bảo không gian thư giãn chung, quý khách vui lòng giữ im lặng và tắt chuông điện thoại trong khu vực trị liệu.",
                "Chúng tôi không chịu trách nhiệm đối với tài sản cá nhân của khách hàng. Vui lòng tự bảo quản tư trang cá nhân cẩn thận.",
                "Anh Thơ Spa có quyền từ chối phục vụ nếu khách hàng có hành vi không phù hợp hoặc gây ảnh hưởng đến các khách hàng khác và nhân viên."
            ]
        }
    ];

    return (
        <div className="container mx-auto px-4 py-12 animate-fadeInUp">
            <div className="max-w-4xl mx-auto">
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

                <div className="bg-white p-8 sm:p-12 rounded-lg shadow-xl border-t-4 border-brand-primary">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">Chính Sách & Điều Khoản</h1>
                        <p className="mt-4 text-lg text-brand-text/80">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>

                    <div className="space-y-10">
                        {sections.map((section, index) => (
                            <div key={index}>
                                <h2 className="text-2xl font-bold font-serif text-brand-dark mb-4 border-b-2 border-brand-secondary pb-2">{section.title}</h2>
                                <div className="space-y-4 text-brand-text/90 leading-relaxed">
                                    {section.content.map((paragraph, pIndex) => (
                                        <p key={pIndex}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyPage;
