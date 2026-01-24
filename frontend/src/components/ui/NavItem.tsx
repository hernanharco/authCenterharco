import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const NavItem = ({ icon: Icon, label, isActive, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
      ${isActive 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-indigo-400'} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);