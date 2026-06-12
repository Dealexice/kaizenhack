'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import KCLLogo from '@/components/KCLLogo';
import KPointsBadge from '@/components/KPointsBadge';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function TopBar({ moduleData, kPoints }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-[#E12726] text-white shadow-md flex-shrink-0">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <KCLLogo size={28} className="rounded flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Zen Learn</div>
            <div className="text-xs text-white/70 truncate">
              {moduleData?.code && (
                <span className="mr-1.5">{moduleData.code}</span>
              )}
              {moduleData?.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <KPointsBadge points={kPoints} />
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.displayName?.[0] || user?.email?.[0] || '?'}
          </div>
          <button
            onClick={signOut}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
