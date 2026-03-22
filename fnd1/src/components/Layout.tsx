import React, { useState, ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home,
  LayoutDashboard, 
  PlusCircle, 
  ShieldCheck, 
  History,
  Menu,
  X,
  Bell,
  Edit3,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useBlockchain } from '../context/BlockchainContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { currentRole, setCurrentRole, notifications, walletAddress, network, connectWallet } = useBlockchain();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`[Layout] Current Role: ${currentRole}`);
  }, [currentRole]);

  const roles: UserRole[] = [
    'Government Authority',
    'Contractor',
    'Inspector',
    'Regulator'
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Government Authority':
        return { label: '🏛️ Authority', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'Contractor':
        return { label: '🔨 Contractor', class: 'bg-pink-50 text-pink-700 border-pink-100' };
      case 'Inspector':
        return { label: '🔍 Inspector', class: 'bg-orange-50 text-orange-700 border-orange-100' };
      case 'Regulator':
        return { label: '📋 Regulator', class: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      default:
        return { label: '📋 Regulator', class: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    }
  };

  const NavItem = ({ icon, label, to, active, collapsed }: { icon: ReactNode, label: string, to: string, active: boolean, collapsed: boolean }) => (
    <Link 
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-neutral-500 hover:bg-neutral-100'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-neutral-400 group-hover:text-indigo-600'}`}>
        {icon}
      </div>
      {!collapsed && <span className="font-semibold text-sm">{label}</span>}
    </Link>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans text-neutral-900">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-neutral-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col sticky top-0 h-screen`}>
        <div className="p-6 flex items-center gap-3 border-b border-neutral-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">ChainProcure</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<Home size={20} />} 
            label="Gateway" 
            to="/" 
            active={location.pathname === '/'} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            to="/dashboard" 
            active={location.pathname === '/dashboard'} 
            collapsed={!isSidebarOpen}
          />
          {currentRole === 'Government Authority' && (
            <NavItem 
              icon={<PlusCircle size={20} />} 
              label="Create Project" 
              to="/create" 
              active={location.pathname === '/create'} 
              collapsed={!isSidebarOpen}
            />
          )}
          <NavItem 
            icon={<History size={20} />} 
            label="Audit Explorer" 
            to="/audit" 
            active={location.pathname === '/audit'} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<ShieldCheck size={20} />} 
            label="Inspectors" 
            to="/inspectors" 
            active={location.pathname === '/inspectors'} 
            collapsed={!isSidebarOpen}
          />
          {currentRole === 'Government Authority' && (
            <NavItem 
              icon={<Edit3 size={20} />} 
              label="Contractors" 
              to="/contractors" 
              active={location.pathname === '/contractors'} 
              collapsed={!isSidebarOpen}
            />
          )}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="bg-indigo-50 rounded-xl p-4">
            {isSidebarOpen ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Current Identity</p>
                <div className="relative group">
                  <button className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${getRoleBadge(currentRole).class}`}>
                    {getRoleBadge(currentRole).label}
                    <ChevronRight size={12} className="rotate-90" />
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {roles.map(role => (
                      <button 
                        key={role}
                        onClick={() => setCurrentRole(role)}
                        className={`w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-neutral-50 transition-colors ${currentRole === role ? 'text-indigo-600 bg-indigo-50' : 'text-neutral-500'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {currentRole[0]}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-semibold capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {walletAddress ? (
              <div className="hidden md:flex flex-col items-end px-3 py-1 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {network || 'Connected'}
                </p>
                <p className="text-xs font-mono text-neutral-600">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                </p>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <LogOut size={14} className="rotate-180" />
                Connect Wallet
              </button>
            )}
            <div className="relative">
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{currentRole}</p>
                <p className="text-xs text-neutral-500">Active Session</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-600">
                {currentRole[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Notifications */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                n.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                n.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-blue-50 border-blue-100 text-blue-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                n.type === 'success' ? 'bg-emerald-500' :
                n.type === 'error' ? 'bg-red-500' :
                n.type === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              }`} />
              <p className="text-sm font-bold">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
