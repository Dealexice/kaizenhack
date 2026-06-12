'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import TopBar from '@/components/TopBar';
import SourcesPanel from '@/components/SourcesPanel';
import ChatPanel from '@/components/ChatPanel';
import GrowthPanel from '@/components/GrowthPanel';
import { getModule, getModuleSources, getUserKPoints } from '@/lib/firestore';

export default function ModulePage() {
  return (
    <AuthGuard>
      <ModuleWorkspace />
    </AuthGuard>
  );
}

function ModuleWorkspace() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [moduleData, setModuleData] = useState(null);
  const [sources, setSources] = useState([]);
  const [allChunks, setAllChunks] = useState([]);
  const [kPoints, setKPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reflect'); // mobile tabs
  const [highlightedChunk, setHighlightedChunk] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [practiceTasks, setPracticeTasks] = useState([]);

  useEffect(() => {
    if (user && moduleId) loadModule();
  }, [user, moduleId]);

  async function loadModule() {
    setLoading(true);
    try {
      const [mod, srcs, pts] = await Promise.all([
        getModule(moduleId),
        getModuleSources(moduleId),
        getUserKPoints(user.uid),
      ]);
      if (!mod) {
        router.push('/dashboard');
        return;
      }
      setModuleData(mod);
      setSources(srcs);
      setKPoints(pts);

      // Flatten all chunks from sources
      const chunks = [];
      for (const src of srcs) {
        if (src.chunks && Array.isArray(src.chunks)) {
          chunks.push(...src.chunks);
        }
      }
      setAllChunks(chunks);
    } catch (err) {
      console.error('Failed to load module:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCitationClick(chunkId) {
    setHighlightedChunk(chunkId);
    setActiveTab('sources'); // switch to sources on mobile
    setTimeout(() => setHighlightedChunk(null), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="w-8 h-8 border-3 border-[#E12726] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F7] overflow-hidden">
      <TopBar
        moduleData={moduleData}
        kPoints={kPoints}
      />

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-b border-[#E5E5E7] bg-white">
        {['sources', 'reflect', 'growth'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors cursor-pointer ${
              activeTab === tab
                ? 'text-[#E12726] border-b-2 border-[#E12726]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'reflect' ? 'Reflect' : tab === 'sources' ? 'Sources' : 'Growth'}
          </button>
        ))}
      </div>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sources Panel — Left */}
        <div
          className={`${
            activeTab === 'sources' ? 'flex' : 'hidden'
          } md:flex w-full md:w-72 lg:w-80 flex-col border-r border-[#E5E5E7] bg-white`}
        >
          <SourcesPanel
            moduleId={moduleId}
            sources={sources}
            onSourcesChange={loadModule}
            highlightedChunk={highlightedChunk}
          />
        </div>

        {/* Chat Panel — Centre */}
        <div
          className={`${
            activeTab === 'reflect' ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col bg-white`}
        >
          <ChatPanel
            moduleId={moduleId}
            allChunks={allChunks}
            onCitationClick={handleCitationClick}
          />
        </div>

        {/* Growth Panel — Right */}
        <div
          className={`${
            activeTab === 'growth' ? 'flex' : 'hidden'
          } md:flex w-full md:w-72 lg:w-80 flex-col border-l border-[#E5E5E7] bg-white`}
        >
          <GrowthPanel
            moduleId={moduleId}
            userId={user?.uid}
            allChunks={allChunks}
            diagnosis={diagnosis}
            setDiagnosis={setDiagnosis}
            practiceTasks={practiceTasks}
            setPracticeTasks={setPracticeTasks}
            kPoints={kPoints}
            setKPoints={setKPoints}
          />
        </div>
      </div>
    </div>
  );
}
