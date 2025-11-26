
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    SparklesIcon, 
    HeartIcon, 
    UsersIcon, 
    TrophyIcon, 
    CheckCircleIcon,
    ArrowRightIcon,
    StarIcon,
    ClockIcon,
    LightBulbIcon,
    ShieldCheckIcon,
    ChevronDownIcon,
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '../../shared/icons';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0);
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [isMilestonePaused, setIsMilestonePaused] = useState(false);

    // Hero Slides Data
    const aboutHeroSlides = [
        {
            image: '../../../assets/IMG/hinhGiaoDien/banner-6.jpg',
            badge: 'SINCE 2018',
            titleFirst: 'Hành Trình',
            titleSecond: 'Đánh Thức Vẻ Đẹp',
            subtitle: 'Nơi kết tinh giữa tinh hoa thảo dược truyền thống và công nghệ làm đẹp hiện đại bậc nhất.'
        },
        {
            image: '../../../assets/IMG/hinhGiaoDien/banner-7.jpg',
            badge: 'SỨ MỆNH',
            titleFirst: 'Tận Tâm',
            titleSecond: 'Phụng Sự Khách Hàng',
            subtitle: 'Mỗi khách hàng là một người thân, chúng tôi chăm sóc bạn bằng cả trái tim và sự thấu hiểu.'
        },
        {
            image: '../../../assets/IMG/hinhGiaoDien/banner-8.jpg',
            badge: 'TẦM NHÌN',
            titleFirst: 'Vươn Tầm',
            titleSecond: 'Đẳng Cấp 5 Sao',
            subtitle: 'Không ngừng đổi mới công nghệ và nâng cao tay nghề để mang lại trải nghiệm hoàn hảo nhất.'
        },
        {
            image: '../../../assets/IMG/hinhGiaoDien/banner-9.jpg',
            badge: 'KHÔNG GIAN',
            titleFirst: 'Thư Thái',
            titleSecond: 'Chạm Đến Cảm Xúc',
            subtitle: 'Không gian thiền định với hương thơm thảo mộc, đánh thức mọi giác quan của bạn.'
        },
        {
            image: '../../../assets/IMG/hinhGiaoDien/banner-10.jpg',
            badge: 'CÔNG NGHỆ',
            titleFirst: 'Tiên Phong',
            titleSecond: 'Xu Hướng Làm Đẹp',
            subtitle: 'Sở hữu hệ thống máy móc công nghệ cao chuẩn FDA, cam kết hiệu quả điều trị vượt trội.'
        }
    ];

    const milestones = [
        {
            year: '2018',
            title: 'Khởi Nguồn Đam Mê',
            description: 'Anh Thơ Spa được thành lập tại một căn phòng nhỏ với niềm đam mê mãnh liệt về làm đẹp từ thảo dược thiên nhiên.',
            image: '../../../assets/IMG/hinhGiaoDien/khoi_nguon-dam-me.jpg'
        },
        {
            year: '2020',
            title: 'Mở Rộng Quy Mô',
            description: 'Chuyển sang cơ sở mới hiện đại hơn. Ra mắt bộ quy chuẩn phục vụ 5 sao và mở rộng đội ngũ lên 10 kỹ thuật viên cao cấp.',
            image: '../../../assets/IMG/hinhGiaoDien/quy_mo.jpg'
        },
        {
            year: '2022',
            title: 'Tiên Phong Công Nghệ',
            description: 'Đầu tư hệ thống máy móc công nghệ cao từ Hàn Quốc và Mỹ (Laser Diode, HIFU), kết hợp hoàn hảo giữa truyền thống và hiện đại.',
            image: '../../../assets/IMG/hinhGiaoDien/tien-phong-cong-nghe.jpg'
        },
        {
            year: '2024',
            title: 'Vươn Tầm Cao Mới',
            description: 'Trở thành Top 10 Spa uy tín nhất khu vực. Phục vụ hơn 10.000 khách hàng và ra mắt hệ thống đặt lịch thông minh.',
            image: '../../../assets/IMG/hinhGiaoDien/Vuong-tam-ca.jpg'
        }
    ];

    // Hero Carousel Auto-play
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroSlide((prev) => (prev + 1) % aboutHeroSlides.length);
        }, 2000);
        return () => clearInterval(timer);
    }, [aboutHeroSlides.length]);

    // Milestone Auto-play
    useEffect(() => {
        if (isMilestonePaused) return;
        const timer = setInterval(() => {
            setActiveMilestoneIndex((prev) => (prev + 1) % milestones.length);
        }, 2000);
        return () => clearInterval(timer);
    }, [isMilestonePaused, milestones.length]);

    // Parallax effect logic
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const technologies = [
        {
            name: 'AI Skin Analysis',
            desc: 'Công nghệ soi da 3D, phân tích 8 vấn đề da liễu ẩn sâu bằng trí tuệ nhân tạo.',
            img: '../../../assets/IMG/hinhGiaoDien/AI-Skin-Analysis.jpg',
            tag: 'Chuẩn đoán',
            icon: <EyeIcon className="w-6 h-6 text-white" />,
            color: 'bg-blue-500'
        },
        {
            name: 'Laser Diode Pro',
            desc: 'Triệt lông lạnh âm độ, không đau rát, hiệu quả gấp 3 lần công nghệ cũ.',
            img: '../../../assets/IMG/hinhGiaoDien/Laser-DiodePro.jpeg',
            tag: 'Điều trị',
            icon: <SparklesIcon className="w-6 h-6 text-white" />,
            color: 'bg-purple-500'
        },
        {
            name: 'HIFU 4D Lifting',
            desc: 'Sóng siêu âm hội tụ nâng cơ, trẻ hóa da tầng sâu không xâm lấn.',
            img: '../../../assets/IMG/hinhGiaoDien/HIFU-4D-Lifting.jpg',
            tag: 'Trẻ hóa',
            icon: <ArrowRightIcon className="w-6 h-6 text-white -rotate-90" />,
            color: 'bg-rose-500'
        },
        {
            name: 'Nano Cell Tech',
            desc: 'Đưa dưỡng chất thẩm thấu sâu vào trung bì, phục hồi da hư tổn tức thì.',
            img: '../../../assets/IMG/hinhGiaoDien/Nano-Cell-Tech.jpg',
            tag: 'Dưỡng da',
            icon: <LightBulbIcon className="w-6 h-6 text-white" />,
            color: 'bg-emerald-500'
        }
    ];

    const teamMembers = [
        { name: 'Trần Thị Hạnh', role: 'Founder & CEO', image: '../../../assets/IMG/hinhGiaoDien/Chuyen-gia-lam-dep-Le-Anh-2.jpg', quote: "Làm đẹp từ tâm." },
        { name: 'Lê Phương Anh', role: 'Chuyên gia Da liễu', image: '../../../assets/IMG/hinhGiaoDien/Chuyen-gia-lam-dep-Le-Anh-2.jpg', quote: "Hiểu làn da như hiểu chính mình." },
        { name: 'Nguyễn Quang Minh', role: 'Quản lý Vận hành', image: '../../../assets/IMG/hinhGiaoDien/Chuyen-gia-lam-dep-Le-Anh-2.jpg', quote: "Trải nghiệm là số 1." },
        { name: 'Phạm Văn Tài', role: 'KTV Trưởng', image: '../../../assets/IMG/hinhGiaoDien/Chuyen-gia-lam-dep-Le-Anh-2.jpg', quote: "Tỉ mỉ trong từng thao tác." }
    ];

    const ritualSteps = [
        { title: "01. Đón Tiếp & Soi Da", desc: "Thưởng trà thảo mộc, phân tích da AI.", icon: <UsersIcon className="w-6 h-6"/> },
        { title: "02. Tư Vấn Cá Nhân", desc: "Thiết kế phác đồ riêng biệt.", icon: <LightBulbIcon className="w-6 h-6"/> },
        { title: "03. Trị Liệu Chuyên Sâu", desc: "Kỹ thuật độc quyền & máy móc hiện đại.", icon: <SparklesIcon className="w-6 h-6"/> },
        { title: "04. Thư Giãn Sâu", desc: "Massage cổ vai gáy, ăn nhẹ dưỡng sinh.", icon: <HeartIcon className="w-6 h-6"/> },
        { title: "05. Đồng Hành", desc: "Hướng dẫn chăm sóc & theo dõi tại nhà.", icon: <ShieldCheckIcon className="w-6 h-6"/> },
    ];

    const partners = ['Dermalogica', 'Murad', 'Ohui', 'Image Skincare', 'Sothys', 'Paula\'s Choice'];

    const handleNextMilestone = () => {
        setActiveMilestoneIndex((prev) => (prev + 1) % milestones.length);
    };

    const handlePrevMilestone = () => {
        setActiveMilestoneIndex((prev) => (prev - 1 + milestones.length) % milestones.length);
    };

    const currentMilestone = milestones[activeMilestoneIndex];

    return (
        <div className="bg-white font-sans overflow-x-hidden selection:bg-brand-primary selection:text-white">
            
            {/* 1. Hero Carousel Section - Compact */}
            <section className="relative h-[75vh] w-full overflow-hidden bg-gray-900">
                {/* Background Slides */}
                {aboutHeroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-500 ease-in-out transform ${index === currentHeroSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                    >
                        <img src={slide.image} alt={slide.titleFirst} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30"></div>
                    </div>
                ))}

                {/* Content Container */}
                <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                    {aboutHeroSlides.map((slide, index) => (
                        <div
                            key={index}
                            className={`transition-all duration-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4 ${index === currentHeroSlide ? 'opacity-100 translate-y-[-50%]' : 'opacity-0 translate-y-[-40%] pointer-events-none'}`}
                        >
                            <div className="relative bg-gradient-to-b from-white/10 to-transparent backdrop-blur-[1px] border border-white/30 p-10 md:p-16 rounded-[3rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] overflow-hidden">
                                
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="inline-block mb-6 animate-fadeInDown">
                                        <span className="py-2 px-6 rounded-full border border-white/60 bg-white/10 backdrop-blur-md text-white text-[10px] md:text-xs font-extrabold tracking-[0.3em] uppercase shadow-lg drop-shadow-md">
                                            {slide.badge}
                                        </span>
                                    </div>
                                    
                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black text-white mb-6 leading-[1.1] tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-slideUpFade">
                                        {slide.titleFirst} <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white italic pr-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                            {slide.titleSecond}
                                        </span>
                                    </h1>
                                    
                                    <p className="text-lg md:text-xl text-white font-bold leading-relaxed mb-10 animate-slideUpFade animation-delay-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-2xl mx-auto">
                                        {slide.subtitle}
                                    </p>
                                    
                                    <div className="flex gap-4 animate-slideUpFade animation-delay-300">
                                        <button onClick={() => navigate(-1)} className="group relative px-8 py-3 overflow-hidden rounded-full bg-white text-brand-dark font-extrabold shadow-2xl hover:shadow-white/50 transition-all hover:-translate-y-1 text-base">
                                            <span className="relative z-10 flex items-center gap-2">
                                                <ArrowRightIcon className="w-5 h-5 rotate-180"/> Quay lại
                                            </span>
                                        </button>
                                        
                                        <button onClick={() => document.getElementById('founder-letter')?.scrollIntoView({ behavior: 'smooth' })} className="group relative px-8 py-3 overflow-hidden rounded-full bg-white/20 backdrop-blur-md text-white font-bold border-2 border-white/50 hover:bg-white/30 transition-all hover:-translate-y-1 shadow-xl text-base">
                                            <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                                                Tìm hiểu thêm <ChevronDownIcon className="w-4 h-4 animate-bounce"/>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {aboutHeroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentHeroSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-500 shadow-md ${currentHeroSlide === index ? 'w-12 bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]' : 'w-3 bg-white/40 hover:bg-white/80'}`}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* 2. Founder's Letter - Reduced Spacing */}
            <section id="founder-letter" className="py-20 bg-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-rose-50 to-transparent rounded-full blur-[100px] -z-10"></div>
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 relative group perspective-1000">
                            <div className="relative z-10 transform transition-transform duration-700 group-hover:rotate-y-6 group-hover:scale-105">
                                <img src="../../../assets/IMG/hinhGiaoDien/Chuyen-gia-lam-dep-Le-Anh-2.jpg" alt="Founder Trần Thị Hạnh" className="rounded-[2.5rem] shadow-2xl w-full object-cover h-[550px]" />
                                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent rounded-b-[2.5rem]"></div>
                                <div className="absolute bottom-8 left-8 text-white">
                                    <p className="font-serif text-2xl italic">Trần Thị Hạnh</p>
                                    <p className="text-[10px] uppercase tracking-widest opacity-80 mt-1">Founder & CEO</p>
                                </div>
                            </div>
                            <div className="absolute top-8 -left-8 w-full h-full border-2 border-brand-primary/30 rounded-[2.5rem] -z-10"></div>
                        </div>

                        <div className="lg:w-1/2">
                            <span className="inline-block py-1 px-3 border border-brand-dark rounded-full text-brand-dark text-[10px] font-bold uppercase tracking-widest mb-4">Lời ngỏ</span>
                            <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark mb-8 leading-none">
                                Thư Ngỏ Từ <br/> <span className="text-transparent bg-clip-text bg-ocean-gradient">Người Sáng Lập</span>
                            </h2>
                            <div className="space-y-6 text-base text-gray-600 leading-loose font-medium text-justify">
                                <p className="first-letter:text-6xl first-letter:font-serif first-letter:text-brand-primary first-letter:float-left first-letter:mr-3 first-letter:mt-[-8px]">
                                    Chào bạn, hành trình của Anh Thơ Spa bắt đầu từ chính nỗi trăn trở của tôi về làn da nhạy cảm và mong muốn tìm kiếm một phương pháp làm đẹp an toàn, bền vững.
                                </p>
                                <p>
                                    Tôi tin rằng, vẻ đẹp thực sự không đến từ việc cố gắng thay đổi bản thân để giống một ai đó, mà là việc <span className="bg-rose-50 px-1 text-brand-accent font-bold">nuôi dưỡng và đánh thức</span> phiên bản tốt nhất của chính mình. Tại Anh Thơ Spa, chúng tôi không bán "dịch vụ", chúng tôi trao gửi sự "tận tâm".
                                </p>
                                <p>
                                    Mỗi liệu trình tại đây đều được tôi và đội ngũ chuyên gia nghiên cứu kỹ lưỡng, kết hợp giữa y học cổ truyền phương Đông và công nghệ hiện đại phương Tây.
                                </p>
                            </div>
                            <div className="mt-10 flex items-center gap-6">
                                
                                <div className="h-px bg-gray-300 w-16"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Floating Stats Strip */}
            <div className="bg-brand-secondary py-16 relative">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-[2.5rem] shadow-soft-xl p-10 flex flex-wrap justify-between items-center gap-6 border border-white transform -translate-y-1/2 mb-[-6rem] relative z-20">
                        {[
                            { num: '6+', label: 'Năm Kinh Nghiệm', icon: <ClockIcon className="w-6 h-6"/> },
                            { num: '10k+', label: 'Khách Hàng Hài Lòng', icon: <UsersIcon className="w-6 h-6"/> },
                            { num: '100%', label: 'Cam Kết Hiệu Quả', icon: <ShieldCheckIcon className="w-6 h-6"/> },
                            { num: '50+', label: 'Giải Thưởng Uy Tín', icon: <TrophyIcon className="w-6 h-6"/> },
                        ].map((stat, idx) => (
                            <div key={idx} className="flex-1 min-w-[180px] text-center group">
                                <div className="mx-auto w-14 h-14 bg-brand-secondary/50 rounded-xl flex items-center justify-center text-brand-primary mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    {stat.icon}
                                </div>
                                <span className="block text-4xl font-serif font-black text-brand-dark mb-1">{stat.num}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. The "Anh Thơ Ritual" */}
            <section className="pt-32 pb-20 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/noise.png')] opacity-30 mix-blend-soft-light pointer-events-none"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-radial from-cyan-50/50 to-transparent -z-10"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-brand-primary font-bold tracking-widest uppercase text-xs bg-brand-secondary px-4 py-1.5 rounded-full border border-brand-primary/10">Quy trình phục vụ</span>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark mt-4 mb-4">Trải Nghiệm 5 Bước Độc Quyền</h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">Hành trình thư giãn và tái tạo năng lượng được thiết kế chuẩn y khoa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                        <div className="hidden md:block absolute top-10 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent -z-0"></div>
                        
                        {ritualSteps.map((step, idx) => (
                            <div key={idx} className="relative group">
                                <div className="bg-white border border-gray-100 p-6 rounded-[1.5rem] h-full flex flex-col items-center text-center transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-xl z-10 relative shadow-md hover:border-brand-primary/30">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 text-white transform group-hover:rotate-12 transition-transform">
                                        {step.icon}
                                    </div>
                                    <span className="absolute top-3 right-5 text-5xl font-serif font-black text-gray-50 opacity-20 -z-10 select-none group-hover:text-brand-primary/30 transition-colors">{idx + 1}</span>
                                    <h4 className="font-bold text-brand-dark text-lg mb-2">{step.title}</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. History Timeline - Compact */}
            <section 
                className="py-20 bg-gradient-to-b from-white via-brand-secondary/10 to-white overflow-hidden relative"
                onMouseEnter={() => setIsMilestonePaused(true)}
                onMouseLeave={() => setIsMilestonePaused(false)}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-full bg-[url('/img/general/noise.png')] opacity-10 mix-blend-multiply pointer-events-none"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1.5 px-5 rounded-full bg-white border border-gray-100 text-brand-primary font-bold tracking-widest uppercase text-xs shadow-sm mb-3">Hành trình phát triển</span>
                        <h2 className="text-4xl md:text-6xl font-serif font-extrabold text-brand-dark">Dấu Ấn Vàng Son</h2>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="relative flex justify-center items-center mb-16 h-32">
                            <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10 rounded-full"></div>
                            
                            <div className="flex justify-between items-center w-full max-w-3xl px-4">
                                {milestones.map((milestone, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveMilestoneIndex(index)}
                                        className={`group relative flex flex-col items-center transition-all duration-500 outline-none`}
                                    >
                                        <div 
                                            className={`
                                                rounded-full border-4 transition-all duration-500 z-20 mb-3
                                                ${index === activeMilestoneIndex 
                                                    ? 'w-10 h-10 bg-brand-primary border-white shadow-[0_0_20px_rgba(219,39,119,0.6)] scale-125' 
                                                    : 'w-5 h-5 bg-white border-gray-300 group-hover:border-brand-primary group-hover:scale-110'}
                                            `}
                                        >
                                            {index === activeMilestoneIndex && (
                                                <div className="absolute inset-0 rounded-full bg-brand-primary animate-ping opacity-50"></div>
                                            )}
                                        </div>
                                        
                                        <span 
                                            className={`
                                                font-serif font-black transition-all duration-500 leading-none
                                                ${index === activeMilestoneIndex 
                                                    ? 'text-6xl md:text-7xl text-brand-primary drop-shadow-lg -translate-y-2' 
                                                    : 'text-xl md:text-2xl text-gray-300 group-hover:text-gray-400'}
                                            `}
                                        >
                                            {milestone.year}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative px-4">
                            <button 
                                onClick={handlePrevMilestone}
                                className="absolute top-1/2 left-0 md:-left-6 transform -translate-y-1/2 z-30 p-3 rounded-full bg-white shadow-lg text-gray-400 hover:text-brand-primary hover:scale-110 transition-all border border-gray-100"
                            >
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 animate-fadeIn" key={activeMilestoneIndex}>
                                <div className="w-full md:w-1/2 relative group perspective-1000">
                                    <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white transform transition-transform duration-700 hover:scale-[1.02] h-[350px] md:h-[400px]">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent mix-blend-overlay z-10"></div>
                                        <img 
                                            src={currentMilestone.image} 
                                            alt={currentMilestone.title} 
                                            className="w-full h-full object-cover transition-transform duration-[2000ms] ease-linear hover:scale-110" 
                                        />
                                        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-5 py-1.5 rounded-full shadow-lg z-20 text-brand-dark font-bold border border-white text-sm">
                                            {currentMilestone.year}
                                        </div>
                                    </div>
                                    <div className="absolute -top-8 -left-8 w-32 h-32 bg-rose-200 rounded-full blur-2xl -z-10 animate-pulse"></div>
                                    <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-blue-200 rounded-full blur-2xl -z-10 animate-pulse animation-delay-500"></div>
                                </div>

                                <div className="w-full md:w-1/2 text-left">
                                    <div className="relative bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-1">
                                        <span className="text-[8rem] md:text-[10rem] font-serif font-black text-gray-50 absolute -top-16 -right-8 select-none z-0 pointer-events-none opacity-50">{currentMilestone.year}</span>
                                        
                                        <div className="relative z-10">
                                            <div className="w-16 h-1 bg-gradient-to-r from-brand-primary to-brand-accent mb-6 rounded-full"></div>
                                            <h3 className="text-3xl md:text-5xl font-serif font-bold text-brand-dark mb-6 leading-tight drop-shadow-sm">
                                                {currentMilestone.title}
                                            </h3>
                                            <p className="text-gray-600 text-lg leading-loose font-medium">
                                                {currentMilestone.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleNextMilestone}
                                className="absolute top-1/2 right-0 md:-right-6 transform -translate-y-1/2 z-30 p-3 rounded-full bg-white shadow-lg text-gray-400 hover:text-brand-primary hover:scale-110 transition-all border border-gray-100"
                            >
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex justify-center mt-10 gap-2">
                            {milestones.map((_, idx) => (
                                <div 
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeMilestoneIndex ? 'w-10 bg-brand-primary' : 'w-2 bg-gray-300'}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Technology Showcase */}
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/noise.png')] opacity-20 mix-blend-soft-light"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div className="max-w-2xl">
                            <span className="text-brand-primary font-bold tracking-widest uppercase text-xs bg-cyan-50 px-3 py-1 rounded-full">High-Tech Beauty</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold mt-3 mb-4 text-brand-dark">Công Nghệ Đỉnh Cao</h2>
                            <p className="text-lg text-gray-600 font-light">Hệ thống máy móc nhập khẩu 100% từ Hàn Quốc & Mỹ.</p>
                        </div>
                        <div className="hidden md:block w-24 h-1 bg-ocean-gradient rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {technologies.map((tech, index) => (
                            <div key={index} className="group relative bg-white rounded-[1.5rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="h-48 overflow-hidden relative">
                                    <img src={tech.img} alt={tech.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-dark shadow-sm">
                                        {tech.tag}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="p-6 relative">
                                    <div className={`absolute -top-6 right-5 w-12 h-12 ${tech.color} rounded-xl flex items-center justify-center text-brand-primary shadow-lg transform rotate-12 group-hover:rotate-0 transition-all duration-500 border border-white`}>
                                        {tech.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-primary transition-colors">{tech.name}</h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">{tech.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* 7. Our Sanctuary */}
            <section className="py-20 bg-brand-secondary/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark">Không Gian Chữa Lành</h2>
                        <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">Một ốc đảo bình yên giữa lòng thành phố.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[600px]">
                         {/* Large Item */}
                         <div className="md:col-span-2 md:row-span-2 relative rounded-[2rem] overflow-hidden group shadow-lg cursor-pointer border-4 border-white">
                           <img src="../../../assets/IMG/hinhGiaoDien/phong_vip.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                         </div>
                         
                         {/* Small Items */}
                         <div className="relative rounded-[2rem] overflow-hidden group shadow-md cursor-pointer border-2 border-white">
                            
                             <img src="../../../assets/IMG/hinhGiaoDien/banner-6.jpg" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-white font-bold text-base">Sảnh Chờ</span>
                             </div>
                         </div>
                         <div className="relative rounded-[2rem] overflow-hidden group shadow-md cursor-pointer border-2 border-white">
                             <img src="../../../assets/IMG/hinhGiaoDien/dich_vu.jpg" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-white font-bold text-base">Dịch vụ tốt</span>
                             </div>
                         </div>
                         <div className="md:col-span-2 relative rounded-[2rem] overflow-hidden group shadow-md cursor-pointer bg-ocean-gradient flex items-center justify-center text-center p-6 border-4 border-white">
                             <div className="relative z-10">
                                 <h3 className="text-2xl font-serif font-bold text-white mb-1">Trải nghiệm 5 giác quan</h3>
                                 <p className="text-cyan-50 font-medium text-base">Hương thơm - Âm nhạc - Ánh sáng - Vị giác - Xúc giác</p>
                             </div>
                             <div className="absolute inset-0 bg-[url('/img/general/spa-pattern.png')] opacity-10 mix-blend-overlay"></div>
                         </div>
                    </div>
                </div>
            </section>

            {/* 8. Partners */}
            <section className="py-16 bg-white border-y border-gray-100 overflow-hidden">
                 <div className="container mx-auto px-4 text-center mb-8">
                    <p className="text-gray-400 uppercase tracking-[0.3em] font-bold text-[10px]">Đối tác chiến lược</p>
                 </div>
                 <div className="flex overflow-hidden space-x-16 group">
                    <div className="flex space-x-16 animate-marquee whitespace-nowrap">
                        {[...partners, ...partners].map((p, i) => (
                            <span key={i} className="text-3xl font-serif font-bold text-gray-300 hover:text-brand-primary transition-colors cursor-default">{p}</span>
                        ))}
                    </div>
                 </div>
            </section>



            {/* 10. CTA - Compact */}
            <div className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-ocean-gradient">
                     <div className="absolute inset-0 bg-[url('/img/general/spa-pattern.png')] opacity-10 mix-blend-overlay"></div>
                     <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <StarIcon className="w-12 h-12 text-yellow-300 mx-auto mb-6 animate-spin-slow drop-shadow-lg" />
                    <h2 className="text-5xl md:text-7xl font-serif font-black text-white mb-8 leading-tight drop-shadow-xl">
                        Trải Nghiệm <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100">Sự Khác Biệt</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link 
                            to="/booking" 
                            className="inline-flex items-center justify-center gap-2 bg-white text-brand-dark font-extrabold py-4 px-12 rounded-full text-lg hover:bg-cyan-50 transition-all shadow-2xl hover:-translate-y-1 hover:shadow-white/50 group"
                        >
                            Đặt Lịch Ngay <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1"/>
                        </Link>
                         <Link 
                            to="/services" 
                            className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/40 backdrop-blur-sm text-white font-bold py-4 px-12 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1"
                        >
                            Xem Dịch Vụ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
