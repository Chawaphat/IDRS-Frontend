import React from 'react';
import {
    Users, Activity, Settings2, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Link, useLocation } from 'react-router-dom';
import { profileService } from '@/services/profileService';
import type { UserProfile } from '@/services/profileService';
import { useConfirmStore } from '@/store/confirmStore';
import { useToastStore } from '@/store/toastStore';

const NAV_ITEMS = [
    { id: 'patients', href: '/patients', label: 'Patients', icon: Users },
    { id: 'aiAnalysis', href: '/ai-analysis', label: 'AI Analysis', icon: Activity },
    { id: 'settings', href: '/settings', label: 'Settings', icon: Settings2 },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, signOut } = useAuthStore();
    const location = useLocation();
    const pathname = location.pathname;
    const [profile, setProfile] = React.useState<UserProfile | null>(null);

    React.useEffect(() => {
        if (user) {
            profileService.getMe().then(res => setProfile(res)).catch(console.error);
        }
    }, [user]);

    const askConfirm = useConfirmStore((state) => state.ask);
    const showToast = useToastStore((state) => state.show);

    const handleSignOut = () => {
        askConfirm({
            title: "Log Out",
            message: "Are you sure you want to log out of the system?",
            confirmText: "Log Out",
            cancelText: "Cancel",
            type: "warning",
            onConfirm: async () => {
                try {
                    await signOut();
                } catch (err: unknown) {
                    showToast("Network connection error. Cannot log out at this time.", 'error');
                }
            }
        });
    };

    const displayName = profile?.full_name 
        || (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : null)
        || user?.user_metadata?.full_name
        || user?.user_metadata?.name
        || user?.email?.split('@')[0]
        || 'Doctor';

    const initials = displayName.substring(0, 2).toUpperCase();
    const roleName = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Dentist';

    // Check if we are in the detailed patient charting view
    const isChartingView = pathname?.match(/^\/patients\/[^/]+\/charts\/[^/]+$/);

    if (isChartingView) {
        return (
            <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden selection:bg-teal-100 selection:text-teal-900">
            {/* Sidebar Navigation */}
            <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm relative z-20">
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">
                            IDRS Hub
                        </span>
                    </div>
                </div>

                <div className="px-4 py-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Main Menu</div>
                    <nav className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/');

                            return (
                                <Link
                                    key={item.id}
                                    to={item.href}
                                    className={`flex items-center gap-3 w-full h-11 px-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                        isActive
                                            ? "bg-teal-50 text-teal-700 shadow-sm"
                                            : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 transition-colors duration-200 ${
                                        isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                                    }`} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-4 flex flex-col gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm overflow-hidden shrink-0">
                                {initials}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-bold text-slate-900 break-words leading-tight">
                                    {displayName}
                                </span>
                                <span className="text-xs text-slate-500 font-medium mt-0.5">{roleName}</span>
                            </div>
                            <button 
                                onClick={handleSignOut}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Scrollable View Content */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
