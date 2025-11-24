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
    ChevronDownIcon
} from '../../shared/icons';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    // Parallax effect logic
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const milestones = [
        {
            year: '2018',
            title: 'Khởi Nguồn Đam Mê',
            description: 'Anh Thơ Spa được thành lập tại một căn phòng nhỏ với niềm đam mê mãnh liệt về làm đẹp từ thảo dược thiên nhiên.',
            image: 'https://picsum.photos/seed/milestone-2018/600/400'
        },
        {
            year: '2020',
            title: 'Mở Rộng Quy Mô',
            description: 'Chuyển sang cơ sở mới hiện đại hơn. Ra mắt bộ quy chuẩn phục vụ 5 sao và mở rộng đội ngũ lên 10 kỹ thuật viên cao cấp.',
            image: 'https://picsum.photos/seed/milestone-2020/600/400'
        },
        {
            year: '2022',
            title: 'Tiên Phong Công Nghệ',
            description: 'Đầu tư hệ thống máy móc công nghệ cao từ Hàn Quốc và Mỹ (Laser Diode, HIFU), kết hợp hoàn hảo giữa truyền thống và hiện đại.',
            image: 'https://picsum.photos/seed/milestone-2022/600/400'
        },
        {
            year: '2024',
            title: 'Vươn Tầm Cao Mới',
            description: 'Trở thành Top 10 Spa uy tín nhất khu vực. Phục vụ hơn 10.000 khách hàng và ra mắt hệ thống đặt lịch thông minh.',
            image: 'https://picsum.photos/seed/milestone-2024/600/400'
        }
    ];

    const technologies = [
        {
            name: 'AI Skin Analysis',
            desc: 'Công nghệ soi da 3D, phân tích 8 vấn đề da liễu ẩn sâu bằng trí tuệ nhân tạo.',
            img: 'https://picsum.photos/seed/tech-ai/500/400',
            tag: 'Chuẩn đoán'
        },
        {
            name: 'Laser Diode Pro',
            desc: 'Triệt lông lạnh âm độ, không đau rát, hiệu quả gấp 3 lần công nghệ cũ.',
            img: 'https://picsum.photos/seed/tech-laser/500/400',
            tag: 'Điều trị'
        },
        {
            name: 'HIFU 4D Lifting',
            desc: 'Sóng siêu âm hội tụ nâng cơ, trẻ hóa da tầng sâu không xâm lấn.',
            img: 'https://picsum.photos/seed/tech-hifu/500/400',
            tag: 'Trẻ hóa'
        },
        {
            name: 'Nano Cell Tech',
            desc: 'Đưa dưỡng chất thẩm thấu sâu vào trung bì, phục hồi da hư tổn tức thì.',
            img: 'https://picsum.photos/seed/tech-nano/500/400',
            tag: 'Dưỡng da'
        }
    ];

    const teamMembers = [
        { name: 'Trần Thị Hạnh', role: 'Founder & CEO', image: 'https://picsum.photos/seed/U001/500/600', quote: "Làm đẹp từ tâm." },
        { name: 'Lê Phương Anh', role: 'Chuyên gia Da liễu', image: 'https://picsum.photos/seed/U003/500/600', quote: "Hiểu làn da như hiểu chính mình." },
        { name: 'Nguyễn Quang Minh', role: 'Quản lý Vận hành', image: 'https://picsum.photos/seed/U002/500/600', quote: "Trải nghiệm là số 1." },
        { name: 'Phạm Văn Tài', role: 'KTV Trưởng', image: 'https://picsum.photos/seed/U004/500/600', quote: "Tỉ mỉ trong từng thao tác." }
    ];

    const ritualSteps = [
        { title: "01. Đón Tiếp & Soi Da", desc: "Thưởng trà thảo mộc, phân tích da AI.", icon: <UsersIcon className="w-6 h-6"/> },
        { title: "02. Tư Vấn Cá Nhân", desc: "Thiết kế phác đồ riêng biệt.", icon: <LightBulbIcon className="w-6 h-6"/> },
        { title: "03. Trị Liệu Chuyên Sâu", desc: "Kỹ thuật độc quyền & máy móc hiện đại.", icon: <SparklesIcon className="w-6 h-6"/> },
        { title: "04. Thư Giãn Sâu", desc: "Massage cổ vai gáy, ăn nhẹ dưỡng sinh.", icon: <HeartIcon className="w-6 h-6"/> },
        { title: "05. Đồng Hành", desc: "Hướng dẫn chăm sóc & theo dõi tại nhà.", icon: <ShieldCheckIcon className="w-6 h-6"/> },
    ];

    const partners = ['Dermalogica', 'Murad', 'Ohui', 'Image Skincare', 'Sothys', 'Paula\'s Choice'];

    return (
        <div className="bg-white font-sans overflow-x-hidden selection:bg-brand-primary selection:text-white">
            
            {/* 1. Immersive Hero Section - Bright & Fresh */}
            <div className="relative h-screen flex items-center justify-center bg-brand-secondary/20 overflow-hidden">
                {/* Dynamic Background - Light */}
                <div className="absolute inset-0 bg-gradient-to-b from-white via-brand-secondary/40 to-white z-0"></div>
                
                {/* Animated Orbs - Parallax - Soft Colors */}
                <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-cyan-300/20 rounded-full blur-[120px] animate-pulse" style={{ transform: `translateY(${scrollY * 0.2}px)` }}></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-rose-300/20 rounded-full blur-[120px] animate-pulse animation-delay-500" style={{ transform: `translateY(${-scrollY * 0.2}px)` }}></div>

                {/* Content */}
                <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center h-full justify-center">
                    <div className="inline-block mb-8 animate-fadeInDown" style={{ opacity: Math.max(0, 1 - scrollY / 500) }}>
                         <span className="py-2 px-8 rounded-full border border-brand-primary/30 bg-white/60 backdrop-blur-md text-brand-primary text-xs md:text-sm font-bold tracking-[0.4em] uppercase shadow-sm">
                            Since 2018
                        </span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-brand-dark mb-8 leading-[1.1] tracking-tight drop-shadow-sm animate-slideUpFade" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
                        Hành Trình <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-500 italic pr-2">Đánh Thức Vẻ Đẹp</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed mb-12 animate-slideUpFade animation-delay-200">
                        Nơi kết tinh giữa tinh hoa thảo dược truyền thống và <br className="hidden md:block"/> công nghệ làm đẹp hiện đại bậc nhất.
                    </p>
                    
                    <button onClick={() => navigate(-1)} className="group relative px-10 py-4 overflow-hidden rounded-full bg-ocean-gradient text-white font-bold shadow-xl hover:shadow-brand-primary/40 transition-all hover:-translate-y-1 animate-slideUpFade animation-delay-300">
                        <span className="relative z-10 flex items-center gap-2 text-lg">
                            <ArrowRightIcon className="w-6 h-6 rotate-180"/> Quay lại
                        </span>
                    </button>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-brand-primary/50">
                        <ChevronDownIcon className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* 2. Founder's Letter - Editorial Layout - Clean White */}
            <section className="py-32 bg-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-rose-50 to-transparent rounded-full blur-[120px] -z-10"></div>
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2 relative group perspective-1000">
                            <div className="relative z-10 transform transition-transform duration-700 group-hover:rotate-y-6 group-hover:scale-105">
                                <img src="https://picsum.photos/seed/founder-portrait/600/800" alt="Founder Trần Thị Hạnh" className="rounded-[3rem] shadow-2xl w-full object-cover h-[700px]" />
                                {/* Signature Overlay */}
                                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent rounded-b-[3rem]"></div>
                                <div className="absolute bottom-10 left-10 text-white">
                                    <p className="font-serif text-3xl italic">Trần Thị Hạnh</p>
                                    <p className="text-xs uppercase tracking-widest opacity-80 mt-1">Founder & CEO</p>
                                </div>
                            </div>
                            {/* Decor Elements */}
                            <div className="absolute top-10 -left-10 w-full h-full border-2 border-brand-primary/30 rounded-[3rem] -z-10"></div>
                        </div>

                        <div className="lg:w-1/2">
                            <span className="inline-block py-1 px-3 border border-brand-dark rounded-full text-brand-dark text-xs font-bold uppercase tracking-widest mb-6">Lời ngỏ</span>
                            <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark mb-10 leading-none">
                                Thư Ngỏ Từ <br/> <span className="text-transparent bg-clip-text bg-ocean-gradient">Người Sáng Lập</span>
                            </h2>
                            <div className="space-y-8 text-lg text-gray-600 leading-loose font-medium text-justify">
                                <p className="first-letter:text-7xl first-letter:font-serif first-letter:text-brand-primary first-letter:float-left first-letter:mr-4 first-letter:mt-[-10px]">
                                    Chào bạn, hành trình của Anh Thơ Spa bắt đầu từ chính nỗi trăn trở của tôi về làn da nhạy cảm và mong muốn tìm kiếm một phương pháp làm đẹp an toàn, bền vững giữa "ma trận" mỹ phẩm hóa chất.
                                </p>
                                <p>
                                    Tôi tin rằng, vẻ đẹp thực sự không đến từ việc cố gắng thay đổi bản thân để giống một ai đó, mà là việc <span className="bg-rose-50 px-1 text-brand-accent font-bold">nuôi dưỡng và đánh thức</span> phiên bản tốt nhất của chính mình. Tại Anh Thơ Spa, chúng tôi không bán "dịch vụ", chúng tôi trao gửi sự "tận tâm".
                                </p>
                                <p>
                                    Mỗi liệu trình tại đây đều được tôi và đội ngũ chuyên gia nghiên cứu kỹ lưỡng, kết hợp giữa y học cổ truyền phương Đông và công nghệ hiện đại phương Tây, để đảm bảo hiệu quả cao nhất nhưng vẫn an toàn tuyệt đối.
                                </p>
                            </div>
                            <div className="mt-12 flex items-center gap-6">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Signature_sample.svg" alt="Signature" className="h-16 opacity-80 filter sepia-[.25] hue-rotate-[-30deg]" />
                                <div className="h-px bg-gray-300 w-20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Floating Stats Strip - Fresh Style */}
            <div className="bg-brand-secondary py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-[3rem] shadow-soft-xl p-12 md:p-16 flex flex-wrap justify-between items-center gap-8 border border-white transform -translate-y-1/2 mb-[-8rem] relative z-20">
                        {[
                            { num: '6+', label: 'Năm Kinh Nghiệm', icon: <ClockIcon className="w-8 h-8"/> },
                            { num: '10k+', label: 'Khách Hàng Hài Lòng', icon: <UsersIcon className="w-8 h-8"/> },
                            { num: '100%', label: 'Cam Kết Hiệu Quả', icon: <ShieldCheckIcon className="w-8 h-8"/> },
                            { num: '50+', label: 'Giải Thưởng Uy Tín', icon: <TrophyIcon className="w-8 h-8"/> },
                        ].map((stat, idx) => (
                            <div key={idx} className="flex-1 min-w-[200px] text-center group">
                                <div className="mx-auto w-16 h-16 bg-brand-secondary/50 rounded-2xl flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    {stat.icon}
                                </div>
                                <span className="block text-5xl font-serif font-black text-brand-dark mb-2">{stat.num}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. The "Anh Thơ Ritual" - 5 Steps - Light Background */}
            <section className="pt-40 pb-32 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/noise.png')] opacity-30 mix-blend-soft-light pointer-events-none"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-radial from-cyan-50/50 to-transparent -z-10"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-24">
                        <span className="text-brand-primary font-bold tracking-widest uppercase text-sm bg-brand-secondary px-5 py-2 rounded-full border border-brand-primary/10">Quy trình phục vụ</span>
                        <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark mt-6 mb-6">Trải Nghiệm 5 Bước Độc Quyền</h2>
                        <p className="text-gray-600 text-xl max-w-2xl mx-auto font-light">Hành trình thư giãn và tái tạo năng lượng được thiết kế chuẩn y khoa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent -z-0"></div>
                        
                        {ritualSteps.map((step, idx) => (
                            <div key={idx} className="relative group">
                                <div className="bg-white border border-gray-100 p-8 rounded-[2rem] h-full flex flex-col items-center text-center transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-2xl z-10 relative shadow-lg hover:border-brand-primary/30">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30 text-white transform group-hover:rotate-12 transition-transform">
                                        {step.icon}
                                    </div>
                                    <span className="absolute top-4 right-6 text-6xl font-serif font-black text-gray-50 opacity-20 -z-10 select-none group-hover:text-brand-primary/30 transition-colors">{idx + 1}</span>
                                    <h4 className="font-bold text-brand-dark text-xl mb-3">{step.title}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. History Timeline - Enhanced Clarity & Animation */}
            <section className="py-32 bg-gradient-to-b from-white via-brand-secondary/20 to-white overflow-hidden relative">
                {/* Background Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-full bg-[url('/img/general/noise.png')] opacity-10 mix-blend-multiply pointer-events-none"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-32">
                        <span className="inline-block py-2 px-6 rounded-full bg-white border border-gray-100 text-brand-primary font-bold tracking-widest uppercase text-sm shadow-sm mb-4">Hành trình phát triển</span>
                        <h2 className="text-5xl md:text-7xl font-serif font-extrabold text-brand-dark">Dấu Ấn Vàng Son</h2>
                    </div>

                    <div className="relative max-w-6xl mx-auto">
                        {/* The River (Center Line) */}
                        <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-gradient-to-b from-transparent via-brand-primary to-transparent opacity-40 rounded-full"></div>
                        
                        <div className="space-y-40">
                            {milestones.map((milestone, index) => (
                                <div key={index} className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} relative gap-16 group perspective-1000`}>
                                    
                                    {/* Connector Line (Horizontal) - Only visible on Desktop */}
                                    <div className={`hidden md:block absolute top-1/2 ${index % 2 === 0 ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} w-[10%] h-0.5 border-t-2 border-dashed border-brand-primary/30 -z-10 group-hover:border-brand-primary/60 transition-colors duration-500`}></div>

                                    {/* Image Side - Floating Island */}
                                    <div className="flex-1 w-full md:w-1/2 pl-20 md:px-0 relative">
                                         <div className={`relative h-80 w-full rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-4 border-8 border-white z-20`}>
                                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                            <img src={milestone.image} alt={milestone.title} className="w-full h-full object-cover filter brightness-95 group-hover:brightness-105 transition-all duration-700" />
                                        </div>
                                        {/* Shadow/Reflection beneath image */}
                                        <div className="absolute -bottom-6 left-10 right-10 h-10 bg-brand-dark/20 blur-xl rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    </div>
                                    
                                    {/* Center Node - Pulsing Heart */}
                                    <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-brand-primary z-30 shadow-[0_0_20px_rgba(14,116,144,0.4)] group-hover:scale-125 transition-transform duration-500 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-ocean-gradient animate-pulse"></div>
                                    </div>
                                    
                                    {/* Text Side - Glass Card */}
                                    <div className="flex-1 w-full md:w-1/2 pl-20 md:pl-0 md:pr-0 text-left">
                                        <div className={`relative bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-500 group-hover:bg-white/95 transform group-hover:-translate-y-2 overflow-hidden`}>
                                            {/* Giant Watermark Year */}
                                            <span className="absolute -top-6 -right-6 text-9xl font-serif font-black text-gray-50 select-none z-0 group-hover:text-brand-secondary/80 transition-colors duration-700 opacity-70">{milestone.year}</span>
                                            
                                            <div className="relative z-10">
                                                <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-white bg-brand-primary rounded-full uppercase shadow-md">{milestone.year}</span>
                                                <h3 className="text-3xl font-bold text-brand-dark mb-4 group-hover:text-brand-primary transition-colors duration-300">{milestone.title}</h3>
                                                <p className="text-gray-600 text-lg leading-relaxed font-medium">{milestone.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Technology Showcase - Light & Clean */}
            <section className="py-32 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/noise.png')] opacity-20 mix-blend-soft-light"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="max-w-2xl">
                            <span className="text-brand-primary font-bold tracking-widest uppercase text-sm bg-cyan-50 px-3 py-1 rounded-full">High-Tech Beauty</span>
                            <h2 className="text-5xl md:text-6xl font-serif font-bold mt-4 mb-6 text-brand-dark">Công Nghệ Đỉnh Cao</h2>
                            <p className="text-xl text-gray-600 font-light">Hệ thống máy móc nhập khẩu 100% từ Hàn Quốc & Mỹ, đạt chuẩn FDA, mang lại hiệu quả tối ưu.</p>
                        </div>
                        <div className="hidden md:block w-32 h-1.5 bg-ocean-gradient rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {technologies.map((tech, index) => (
                            <div key={index} className="group relative bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500">
                                <div className="h-60 overflow-hidden relative">
                                    <img src={tech.img} alt={tech.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-dark shadow-sm">
                                        {tech.tag}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="p-8 relative">
                                    <div className="absolute -top-8 right-6 w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-lg transform rotate-12 group-hover:rotate-0 transition-all duration-500 border border-gray-50">
                                        <StarIcon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-brand-dark mb-3 group-hover:text-brand-primary transition-colors">{tech.name}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{tech.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* 7. Our Sanctuary - Bright & Airy Bento Grid */}
            <section className="py-32 bg-brand-secondary/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-serif font-bold text-brand-dark">Không Gian Chữa Lành</h2>
                        <p className="text-gray-600 mt-6 text-xl max-w-2xl mx-auto">Một ốc đảo bình yên giữa lòng thành phố.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-[800px] md:h-[600px]">
                         {/* Large Item */}
                         <div className="md:col-span-2 md:row-span-2 relative rounded-[2.5rem] overflow-hidden group shadow-xl cursor-pointer border-4 border-white">
                            <img src="https://picsum.photos/seed/spa-room-1/800/800" alt="Phòng trị liệu VIP" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                            <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-bold text-brand-dark">Phòng VIP Riêng Tư</h3>
                            </div>
                         </div>
                         
                         {/* Small Items */}
                         <div className="relative rounded-[2.5rem] overflow-hidden group shadow-lg cursor-pointer border-2 border-white">
                             <img src="https://picsum.photos/seed/spa-lobby/400/400" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <span className="text-white font-bold text-lg">Sảnh Chờ</span>
                             </div>
                         </div>
                         <div className="relative rounded-[2.5rem] overflow-hidden group shadow-lg cursor-pointer border-2 border-white">
                             <img src="https://picsum.photos/seed/spa-tea/400/400" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <span className="text-white font-bold text-lg">Tiệc Trà</span>
                             </div>
                         </div>
                         <div className="md:col-span-2 relative rounded-[2.5rem] overflow-hidden group shadow-lg cursor-pointer bg-ocean-gradient flex items-center justify-center text-center p-8 border-4 border-white">
                             <div className="relative z-10">
                                 <SparklesIcon className="w-12 h-12 text-white mx-auto mb-4 animate-pulse" />
                                 <h3 className="text-3xl font-serif font-bold text-white mb-2">Trải nghiệm 5 giác quan</h3>
                                 <p className="text-cyan-50 font-medium text-lg">Hương thơm - Âm nhạc - Ánh sáng - Vị giác - Xúc giác</p>
                             </div>
                             <div className="absolute inset-0 bg-[url('/img/general/spa-pattern.png')] opacity-10 mix-blend-overlay"></div>
                         </div>
                    </div>
                </div>
            </section>

            {/* 8. Partners - Marquee Style - Light */}
            <section className="py-20 bg-white border-y border-gray-100 overflow-hidden">
                 <div className="container mx-auto px-4 text-center mb-10">
                    <p className="text-gray-400 uppercase tracking-[0.3em] font-bold text-xs">Đối tác chiến lược</p>
                 </div>
                 <div className="flex overflow-hidden space-x-16 group">
                    <div className="flex space-x-16 animate-marquee whitespace-nowrap">
                        {[...partners, ...partners].map((p, i) => (
                            <span key={i} className="text-4xl font-serif font-bold text-gray-300 hover:text-brand-primary transition-colors cursor-default">{p}</span>
                        ))}
                    </div>
                 </div>
            </section>

            {/* 9. Team - Minimalist High-End */}
            <div className="bg-gray-50 py-32 relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark">Đội Ngũ Chuyên Gia</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="group cursor-pointer">
                                <div className="relative overflow-hidden rounded-[2rem] mb-6 shadow-lg aspect-[4/5] border-4 border-white">
                                    <img 
                                        src={member.image} 
                                        alt={member.name} 
                                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                                        <p className="text-white italic font-serif text-lg">"{member.quote}"</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h4>
                                    <p className="text-brand-accent font-bold text-xs uppercase tracking-widest">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 10. Massive CTA - Final Impression - Vibrant */}
            <div className="relative py-48 overflow-hidden">
                <div className="absolute inset-0 bg-ocean-gradient">
                     <div className="absolute inset-0 bg-[url('/img/general/spa-pattern.png')] opacity-10 mix-blend-overlay"></div>
                     {/* Vibrant Orbs */}
                     <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/20 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <StarIcon className="w-16 h-16 text-yellow-300 mx-auto mb-10 animate-spin-slow drop-shadow-lg" />
                    <h2 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-white mb-12 leading-tight drop-shadow-xl">
                        Trải Nghiệm <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100">Sự Khác Biệt</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-8">
                        <Link 
                            to="/booking" 
                            className="inline-flex items-center justify-center gap-3 bg-white text-brand-dark font-extrabold py-5 px-16 rounded-full text-xl hover:bg-cyan-50 transition-all shadow-2xl hover:-translate-y-2 hover:shadow-white/50 group"
                        >
                            Đặt Lịch Ngay <ArrowRightIcon className="w-6 h-6 transition-transform group-hover:translate-x-1"/>
                        </Link>
                         <Link 
                            to="/services" 
                            className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-white/40 backdrop-blur-sm text-white font-bold py-5 px-16 rounded-full text-xl hover:bg-white/10 transition-all hover:-translate-y-2"
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