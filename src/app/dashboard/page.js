'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import KCLLogo from '@/components/KCLLogo';
import KPointsBadge from '@/components/KPointsBadge';
import { getUserModules, createModule, deleteModule } from '@/lib/firestore';
import { getUserKPoints } from '@/lib/firestore';
import {
  Plus,
  BookOpen,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [kPoints, setKPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [mods, pts] = await Promise.all([
        getUserModules(user.uid),
        getUserKPoints(user.uid),
      ]);
      setModules(mods);
      setKPoints(pts);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createModule(user.uid, {
        name: newName.trim(),
        code: newCode.trim(),
      });
      setNewName('');
      setNewCode('');
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create module:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(moduleId) {
    if (!confirm('Delete this module and all its data?')) return;
    try {
      await deleteModule(moduleId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete module:', err);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Top Bar */}
      <header className="bg-[#E12726] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KCLLogo size={32} className="rounded" />
            <span className="text-lg font-semibold tracking-tight">
              Zen Learn
            </span>
          </div>
          <div className="flex items-center gap-4">
            <KPointsBadge points={kPoints} />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Welcome back
              {user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Your module notebooks
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E12726] hover:bg-[#C41F1E] text-white rounded-lg font-medium transition-colors text-sm cursor-pointer"
          >
            <Plus size={18} />
            New module
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#E12726] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E5E7] p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No modules yet
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Create your first module notebook to start uploading feedback,
              mark schemes, and learning outcomes.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E12726] hover:bg-[#C41F1E] text-white rounded-lg font-medium transition-colors text-sm cursor-pointer"
            >
              <Plus size={18} />
              Create your first module
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white rounded-xl border border-[#E5E5E7] hover:shadow-lg hover:border-[#E12726]/30 transition-all group cursor-pointer"
                onClick={() => router.push(`/module/${mod.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {mod.code && (
                        <span className="inline-block px-2 py-0.5 bg-[#E12726]/10 text-[#E12726] text-xs font-medium rounded mb-2">
                          {mod.code}
                        </span>
                      )}
                      <h3 className="font-semibold text-[#1A1A1A] truncate">
                        {mod.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(mod.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete module"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-[#0072CE] text-sm font-medium">
                    Open notebook
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Module Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E5E5E7] w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Create new module notebook
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none text-sm"
                  placeholder="e.g. Introduction to Electrical Engineering"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module code{' '}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none text-sm"
                  placeholder="e.g. 4CCYB020"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-[#E12726] hover:bg-[#C41F1E] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
