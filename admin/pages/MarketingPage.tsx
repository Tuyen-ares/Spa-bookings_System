// admin/pages/MarketingPage.tsx
import React, { useState, useEffect } from 'react';
import type { User, Tier } from '../../types';
// FIX: Replaced missing icons `EnvelopeIcon`, `PaperAirplaneIcon`, `DevicePhoneMobileIcon`, `GlobeAltIcon`, `ChartPieIcon`, and `Cog8ToothIcon` with available icons from the shared icons file.
import {
    MegaphoneIcon, MailIcon, PaperAirplaneIcon,
    ChatBubbleBottomCenterTextIcon, PhoneIcon, BellIcon, PresentationChartLineIcon, CogIcon
} from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

// Toggle Switch Component
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}> = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="relative">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </div>
    </label>
);


export const MarketingPage: React.FC = () => {
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [channels, setChannels] = useState<string[]>(['email']);
    const [targetAudience, setTargetAudience] = useState<'all' | 'new_clients' | 'tier'>('all');
    const [selectedTier, setSelectedTier] = useState<number>(1);
    const [toast, setToast] = useState<{ visible: boolean, message: string, type: 'success' | 'error' } | null>(null);

    const [automations, setAutomations] = useState({
        remindInactive: true,
        sendBirthdayWishes: true,
    });

    const [users, setUsers] = useState<User[]>([]);
    const [wallets, setWallets] = useState<Record<string, { points: number }>>({});
    const [tiers, setTiers] = useState<Tier[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, tiersData] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getTiers(),
                ]);
                const clientUsers = usersData.filter(u => u.role === 'Client');
                setUsers(clientUsers);
                setTiers(tiersData);

                // Fetch wallets to calculate tier levels
                const walletsData: Record<string, { points: number }> = {};
                await Promise.all(
                    clientUsers.map(async (user) => {
                        try {
                            const wallet = await apiService.getUserWallet(user.id);
                            walletsData[user.id] = { points: wallet.points || 0 };
                        } catch (e) {
                            walletsData[user.id] = { points: 0 };
                        }
                    })
                );
                setWallets(walletsData);
            } catch (e) {
                console.error("Failed to fetch marketing data", e);
            }
        }
        fetchData();
    }, []);

    const templates = [
        { name: 'Nhắc lịch hẹn', content: 'Chào [[TEN_KHACH_HANG]], Anh Thơ Spa xin nhắc bạn có lịch hẹn vào [[THOI_GIAN]]. Mong sớm gặp bạn!' },
        { name: 'Ưu đãi sinh nhật', content: 'Chúc mừng sinh nhật [[TEN_KHACH_HANG]]! Anh Thơ Spa tặng bạn voucher giảm 20% cho tất cả dịch vụ trong tháng sinh nhật. Mã: SINHNHATVUI' },
        { name: 'Khuyến mãi mới', content: 'Chào [[TEN_KHACH_HANG]], đừng bỏ lỡ chương trình khuyến mãi hấp dẫn [[TEN_KHUYEN_MAI]] tại Anh Thơ Spa. Xem chi tiết tại...' }
    ];

    // TODO: Fetch campaign reports from database when campaign tracking is implemented
    const campaigns: Array<{ name: string; openRate: number; clickRate: number }> = [];

    const handleChannelChange = (channel: string) => {
        setChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };

    const handleSend = () => {
        if (!message.trim() || channels.length === 0) {
            setToast({ visible: true, message: 'Vui lòng nhập nội dung và chọn kênh gửi.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        let audienceCount = 0;
        if (targetAudience === 'all') {
            audienceCount = users.length;
        } else if (targetAudience === 'new_clients') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            audienceCount = users.filter(u => new Date(u.joinDate) > thirtyDaysAgo).length;
        } else {
            // Calculate tier level from wallet points since tierLevel is not in users table
            audienceCount = users.filter(u => {
                const userPoints = wallets[u.id]?.points || 0;
                // Find tier based on points (tiers are sorted by pointsRequired ascending)
                const sortedTiers = [...tiers].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
                let userTier = 1; // Default to tier 1
                for (let i = sortedTiers.length - 1; i >= 0; i--) {
                    if (userPoints >= (sortedTiers[i].pointsRequired || 0)) {
                        userTier = sortedTiers[i].level;
                        break;
                    }
                }
                return userTier === selectedTier;
            }).length;
        }

        console.log({ subject, message, channels, targetAudience, selectedTier, audienceCount });

        // TODO: Implement actual notification sending via API
        console.log('Sending notification:', { subject, message, channels, targetAudience, selectedTier, audienceCount });
        setToast({ visible: true, message: `Đã gửi thông báo đến ${audienceCount} khách hàng.`, type: 'success' });
        setTimeout(() => setToast(null), 5000);

        setMessage('');
        setSubject('');
    };

    const handleAutomationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setAutomations(prev => ({ ...prev, [name]: checked }));
        setToast({ visible: true, message: `Đã ${checked ? 'bật' : 'tắt'} tự động hóa.`, type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    const channelOptions = [
        { id: 'email', name: 'Email', icon: <MailIcon className="w-5 h-5" /> },
        { id: 'sms', name: 'SMS', icon: <PhoneIcon className="w-5 h-5" /> },
        // FIX: Replaced ChatBubbleOvalLeftEllipsisIcon with ChatBubbleBottomCenterTextIcon.
        { id: 'zalo', name: 'Zalo', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> },
        { id: 'app_push', name: 'App Push', icon: <MegaphoneIcon className="w-5 h-5" /> },
        // FIX: Replaced GlobeAltIcon with BellIcon as a substitute.
        { id: 'web_push', name: 'Web Push', icon: <BellIcon className="w-5 h-5" /> },
    ];

    return (
        <div>
            {toast && (
                <div className={`fixed top-24 right-6 p-4 rounded-lg shadow-lg z-[100] text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MegaphoneIcon className="w-8 h-8 text-brand-primary" />
                Trung tâm Thông báo & Tương tác
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Composer & Reports */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Soạn thảo tin nhắn</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mẫu tin nhắn nhanh</label>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(t => (
                                        <button key={t.name} onClick={() => setMessage(t.content)} className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề (Email, Zalo)</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="e.g., Ưu đãi đặc biệt cuối tuần!"
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung tin nhắn</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={8}
                                    placeholder="Chào [[TEN_KHACH_HANG]], Anh Thơ Spa..."
                                    className="w-full p-2 border rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">Sử dụng `[[TEN_KHACH_HANG]]` để cá nhân hóa tên khách hàng.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><PresentationChartLineIcon className="w-6 h-6 text-green-600" /> Báo cáo Hiệu quả Chiến dịch</h2>
                        <div className="space-y-4">
                            {campaigns.length > 0 ? campaigns.map(campaign => (
                                <div key={campaign.name}>
                                    <div className="flex justify-between items-baseline text-sm mb-1">
                                        <span className="font-medium text-gray-700">{campaign.name}</span>
                                        <span className="text-xs text-gray-500">Mở: {campaign.openRate}% / Nhấp: {campaign.clickRate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                                        <div className="bg-green-400 h-2.5 rounded-full" style={{ width: `${campaign.openRate}%` }}></div>
                                        <div className="absolute top-0 left-0 bg-green-600 h-2.5 rounded-full" style={{ width: `${campaign.clickRate}%` }}></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Chưa có dữ liệu chiến dịch nào.</p>
                                    <p className="text-sm mt-2">Dữ liệu sẽ được cập nhật khi bạn gửi thông báo.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Targeting & Automation */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">1. Lựa chọn đối tượng</h2>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"><input type="radio" name="audience" value="all" checked={targetAudience === 'all'} onChange={e => setTargetAudience(e.target.value as any)} /> Gửi cho tất cả khách hàng</label>
                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"><input type="radio" name="audience" value="new_clients" checked={targetAudience === 'new_clients'} onChange={e => setTargetAudience(e.target.value as any)} /> Khách hàng mới (30 ngày)</label>
                            <div>
                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <input type="radio" name="audience" value="tier" checked={targetAudience === 'tier'} onChange={e => setTargetAudience(e.target.value as any)} /> Gửi theo hạng thành viên
                                </label>
                                {targetAudience === 'tier' && (
                                    <select value={selectedTier} onChange={e => setSelectedTier(Number(e.target.value))} className="ml-6 mt-2 p-2 w-full border rounded-md">
                                        {tiers.map(tier => <option key={tier.level} value={tier.level}>{tier.name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">2. Lựa chọn kênh gửi</h2>
                        <div className="space-y-2">
                            {channelOptions.map(channel => (
                                <label key={channel.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${channels.includes(channel.id) ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <input type="checkbox" checked={channels.includes(channel.id)} onChange={() => handleChannelChange(channel.id)} className="rounded text-brand-primary" />
                                    {channel.icon}
                                    <span className="font-medium text-gray-700">{channel.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><CogIcon className="w-6 h-6 text-purple-600" /> Tự động hóa</h2>
                        <div className="space-y-3">
                            <ToggleSwitch
                                checked={automations.remindInactive}
                                onChange={e => handleAutomationChange({ target: { name: 'remindInactive', checked: e.target.checked } } as any)}
                                label="Tự động nhắc khách sau 7 ngày không quay lại"
                            />
                            <ToggleSwitch
                                checked={automations.sendBirthdayWishes}
                                onChange={e => handleAutomationChange({ target: { name: 'sendBirthdayWishes', checked: e.target.checked } } as any)}
                                label="Tự động gửi lời chúc mừng sinh nhật"
                            />
                        </div>
                    </div>

                    <div className="sticky top-24">
                        <button onClick={handleSend} className="w-full bg-brand-dark text-white font-bold py-4 px-4 rounded-lg hover:bg-brand-primary transition-colors duration-300 shadow-lg flex items-center justify-center gap-3">
                            <PaperAirplaneIcon className="w-6 h-6" />
                            Gửi ngay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
