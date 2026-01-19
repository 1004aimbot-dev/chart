import { Outlet, Link, useLocation } from 'react-router-dom';
import { Network, Users, UserCheck, LogOut, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import SearchModal from '../components/SearchModal';

export default function Layout() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const navItems = [
        { path: '/org', label: '조직도', icon: Network },
        { path: '/members', label: '인원구성', icon: Users },
        { path: '/attendance', label: '출석 체크', icon: UserCheck },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200">
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm border-b border-slate-800 z-20 relative">
                <h1 className="font-bold text-xl text-white font-serif tracking-wide">신광교회</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSearchOpen(true)} className="text-slate-400 hover:text-white transition-colors">
                        <Search className="w-6 h-6" />
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400 hover:text-white transition-colors">
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Sidebar / Mobile Menu */}
            <aside className={clsx(
                "bg-slate-900 w-full md:w-64 flex-shrink-0 border-r border-slate-800 fixed md:sticky top-0 h-screen transition-transform duration-300 z-10",
                "md:translate-x-0 pt-16 md:pt-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 hidden md:block">
                    <h1 className="font-bold text-2xl text-white font-serif tracking-wide">신광교회</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-wider uppercase">Church Management</p>
                </div>

                <div className="px-6 mb-4 hidden md:block">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-700 hover:text-slate-200 transition-colors border border-transparent hover:border-slate-600"
                    >
                        <Search size={16} />
                        성도 검색...
                    </button>
                </div>

                <nav className="px-4 py-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400 font-medium shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                                        : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-blue-400" : ""} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                    <Link to="/login" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg w-full transition-colors">
                        <LogOut size={20} />
                        로그아웃
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full bg-slate-950 custom-scrollbar">
                <div className="max-w-5xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
