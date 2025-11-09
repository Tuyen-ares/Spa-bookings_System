
import React, { useState, useEffect } from 'react';
// FIX: Replaced missing icons with available ones to resolve import errors.
import {
    CogIcon,
    PaintBrushIcon,
    GridIcon,
    ListIcon,
    NewspaperIcon,
} from '../../shared/icons';

// Settings will be fetched from database via API
interface Settings {
    spaName: string;
    address: string;
    phone: string;
    vat: number;
    logoUrl: string;
    faviconUrl: string;
    bannerUrl: string;
    primaryColor: string;
    theme: string;
    smtpServer: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    paymentGatewayApiKey: string;
    paymentGatewaySecret: string;
    enableChatbot: boolean;
    enableLoyalty: boolean;
    enablePromotions: boolean;
    supportedLanguages: string[];
    defaultLanguage: string;
}

const defaultSettings: Settings = {
    spaName: '',
    address: '',
    phone: '',
    vat: 10,
    logoUrl: '',
    faviconUrl: '',
    bannerUrl: '',
    primaryColor: '#C7A17A',
    theme: 'auto',
    smtpServer: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    paymentGatewayApiKey: '',
    paymentGatewaySecret: '',
    enableChatbot: true,
    enableLoyalty: true,
    enablePromotions: true,
    supportedLanguages: ['vn'],
    defaultLanguage: 'vn',
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
    name: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}> = ({ name, checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="relative">
            <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </div>
    </label>
);

// Main Component
const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch settings from database
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                // TODO: Create API endpoint to fetch settings from database
                // For now, use default settings
                setSettings(defaultSettings);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                setSettings(defaultSettings);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLanguageToggle = (langCode: string) => {
        setSettings(prev => {
            const currentLangs = prev.supportedLanguages;
            if (currentLangs.includes(langCode)) {
                return { ...prev, supportedLanguages: currentLangs.filter(l => l !== langCode) };
            } else {
                return { ...prev, supportedLanguages: [...currentLangs, langCode] };
            }
        });
    }

    const handleSave = async () => {
        try {
            // TODO: Create API endpoint to save settings to database
            // await apiService.saveSettings(settings);
            console.log("Saving settings:", settings);
            setToast({ visible: true, message: "Cài đặt đã được lưu thành công!" });
            setTimeout(() => setToast({ visible: false, message: '' }), 3000);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setToast({ visible: true, message: "Lỗi khi lưu cài đặt. Vui lòng thử lại." });
            setTimeout(() => setToast({ visible: false, message: '' }), 3000);
        }
    };

    const tabs = [
        { id: 'general', label: 'Chung', icon: <CogIcon className="w-5 h-5" /> },
        { id: 'appearance', label: 'Giao diện', icon: <PaintBrushIcon className="w-5 h-5" /> },
        // FIX: Replaced Square3Stack3DIcon with GridIcon
        { id: 'integrations', label: 'Tích hợp', icon: <GridIcon className="w-5 h-5" /> },
        // FIX: Replaced PuzzlePieceIcon with ListIcon
        { id: 'modules', label: 'Module', icon: <ListIcon className="w-5 h-5" /> },
        // FIX: Replaced LanguageIcon with NewspaperIcon
        { id: 'language', label: 'Ngôn ngữ', icon: <NewspaperIcon className="w-5 h-5" /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium text-gray-700">Tên Spa</label><input type="text" name="spaName" value={settings.spaName} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Địa chỉ</label><input type="text" name="address" value={settings.address} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Số điện thoại</label><input type="text" name="phone" value={settings.phone} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Thuế VAT (%)</label><input type="number" name="vat" value={settings.vat} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="space-y-6">
                        <div><label className="block text-sm font-medium text-gray-700">Logo URL</label><input type="text" name="logoUrl" value={settings.logoUrl} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Favicon URL</label><input type="text" name="faviconUrl" value={settings.faviconUrl} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Banner URL</label><input type="text" name="bannerUrl" value={settings.bannerUrl} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Màu chủ đạo</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" name="primaryColor" value={settings.primaryColor} onChange={handleInputChange} className="h-10 w-10 p-1 border rounded" />
                                <input type="text" value={settings.primaryColor} onChange={handleInputChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Chủ đề (Theme)</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2"><input type="radio" name="theme" value="light" checked={settings.theme === 'light'} onChange={handleInputChange} /> Giao diện Sáng</label>
                                <label className="flex items-center gap-2"><input type="radio" name="theme" value="dark" checked={settings.theme === 'dark'} onChange={handleInputChange} /> Giao diện Tối</label>
                                <label className="flex items-center gap-2"><input type="radio" name="theme" value="auto" checked={settings.theme === 'auto'} onChange={handleInputChange} /> Tự động theo hệ thống</label>
                            </div>
                        </div>
                    </div>
                );
            case 'integrations':
                return (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Cấu hình SMTP (Gửi Email)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-gray-700">Máy chủ SMTP</label><input type="text" name="smtpServer" value={settings.smtpServer} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Cổng SMTP</label><input type="number" name="smtpPort" value={settings.smtpPort} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label><input type="text" name="smtpUser" value={settings.smtpUser} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Mật khẩu</label><input type="password" name="smtpPass" value={settings.smtpPass} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Cổng thanh toán</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-gray-700">API Key</label><input type="text" name="paymentGatewayApiKey" value={settings.paymentGatewayApiKey} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Secret Key</label><input type="password" name="paymentGatewaySecret" value={settings.paymentGatewaySecret} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded" /></div>
                            </div>
                        </div>
                    </div>
                );
            case 'modules':
                return (
                    <div className="space-y-4">
                        <ToggleSwitch name="enableChatbot" checked={settings.enableChatbot} onChange={handleInputChange} label="Bật/Tắt Chatbot AI" />
                        <ToggleSwitch name="enableLoyalty" checked={settings.enableLoyalty} onChange={handleInputChange} label="Bật/Tắt Hệ thống Loyalty (Điểm & Hạng)" />
                        <ToggleSwitch name="enablePromotions" checked={settings.enablePromotions} onChange={handleInputChange} label="Bật/Tắt Module Khuyến mãi" />
                    </div>
                );
            case 'language':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Ngôn ngữ được hỗ trợ</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.supportedLanguages.includes('vn')} onChange={() => handleLanguageToggle('vn')} /> Tiếng Việt (VN)</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.supportedLanguages.includes('en')} onChange={() => handleLanguageToggle('en')} /> Tiếng Anh (EN)</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.supportedLanguages.includes('jp')} onChange={() => handleLanguageToggle('jp')} /> Tiếng Nhật (JP)</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.supportedLanguages.includes('kr')} onChange={() => handleLanguageToggle('kr')} /> Tiếng Hàn (KR)</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngôn ngữ mặc định</label>
                            <select name="defaultLanguage" value={settings.defaultLanguage} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded">
                                {settings.supportedLanguages.map(lang => (
                                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="animate-fadeInUp">
            {toast.visible && (
                <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100]">
                    {toast.message}
                </div>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Cài đặt & Cá nhân hóa Hệ thống</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tab Navigation */}
                <aside className="lg:w-1/4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <nav className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left font-semibold transition-colors ${activeTab === tab.id
                                            ? 'bg-brand-primary text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Tab Content */}
                <main className="flex-1">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                                <p className="text-gray-500">Đang tải cài đặt...</p>
                            </div>
                        ) : (
                            <>
                                {renderContent()}
                                <div className="mt-8 border-t pt-6 text-right">
                                    <button onClick={handleSave} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-dark transition-colors">
                                        Lưu Thay Đổi
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;