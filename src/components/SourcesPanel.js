'use client';

import { useState, useRef } from 'react';
import { addSource } from '@/lib/firestore';
import { chunkText } from '@/lib/chunker';
import { MATHS_SAMPLES } from '@/lib/samples';
import {
  Plus,
  FileText,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Library,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Loader2,
} from 'lucide-react';

const SOURCE_TYPES = [
  { value: 'learning_outcome', label: 'Learning Outcomes', icon: BookOpen, color: '#0072CE' },
  { value: 'mark_scheme', label: 'Mark Scheme', icon: ClipboardList, color: '#A71930' },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#D97706' },
  { value: 'resource', label: 'Module Resource', icon: Library, color: '#1E8E3E' },
];

export default function SourcesPanel({
  moduleId,
  sources,
  onSourcesChange,
  highlightedChunk,
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('feedback');
  const [pasteText, setPasteText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [expandedSource, setExpandedSource] = useState(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [sampleProgress, setSampleProgress] = useState('');
  const fileInputRef = useRef(null);

  // Group sources by type
  const grouped = {};
  for (const type of SOURCE_TYPES) {
    grouped[type.value] = sources.filter((s) => s.type === type.value);
  }

  async function handleFileUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      let text = '';

      if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        text = data.text;
      } else {
        text = await file.text();
      }

      const name = sourceName.trim() || file.name;
      const sourceId = `src_${Date.now()}`;
      const chunks = chunkText(text, {
        sourceId,
        sourceType: selectedType,
        sourceName: name,
      });

      // Save source with chunks to Firestore (no Storage upload)
      await addSource(moduleId, {
        type: selectedType,
        name,
        fileName: file.name,
        fileUrl: null,
        text,
        chunks,
      });

      setShowUpload(false);
      setSourceName('');
      setPasteText('');
      onSourcesChange();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setUploading(true);
    try {
      const name = sourceName.trim() || `${selectedType} — pasted text`;
      const sourceId = `src_${Date.now()}`;
      const chunks = chunkText(pasteText, {
        sourceId,
        sourceType: selectedType,
        sourceName: name,
      });

      await addSource(moduleId, {
        type: selectedType,
        name,
        fileName: null,
        fileUrl: null,
        text: pasteText,
        chunks,
      });

      setShowUpload(false);
      setSourceName('');
      setPasteText('');
      onSourcesChange();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function loadMathsSamples() {
    setLoadingSamples(true);
    let loaded = 0;
    try {
      for (const sample of MATHS_SAMPLES) {
        // Check if already loaded
        const alreadyExists = sources.some(
          (s) => s.name === sample.name || s.fileName === sample.fileName
        );
        if (alreadyExists) {
          loaded++;
          continue;
        }

        setSampleProgress(`Loading ${sample.name}... (${loaded + 1}/${MATHS_SAMPLES.length})`);

        // Fetch PDF from public/samples/
        const res = await fetch(`/samples/${encodeURIComponent(sample.fileName)}`);
        if (!res.ok) {
          console.warn(`Failed to fetch ${sample.fileName}`);
          loaded++;
          continue;
        }

        const blob = await res.blob();
        const formData = new FormData();
        formData.append('file', blob, sample.fileName);
        const parseRes = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        const parseData = await parseRes.json();
        if (!parseRes.ok) {
          console.warn(`Failed to parse ${sample.fileName}:`, parseData.error);
          loaded++;
          continue;
        }

        const sourceId = `src_${Date.now()}_${loaded}`;
        const chunks = chunkText(parseData.text, {
          sourceId,
          sourceType: sample.type,
          sourceName: sample.name,
        });

        await addSource(moduleId, {
          type: sample.type,
          name: sample.name,
          fileName: sample.fileName,
          fileUrl: null,
          text: parseData.text,
          chunks,
        });

        loaded++;
      }

      setSampleProgress('');
      onSourcesChange();
    } catch (err) {
      console.error('Failed to load samples:', err);
      alert('Failed to load sample resources: ' + err.message);
    } finally {
      setLoadingSamples(false);
      setSampleProgress('');
    }
  }

  const hasSamples = sources.some((s) =>
    MATHS_SAMPLES.some((m) => m.name === s.name || m.fileName === s.fileName)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#E5E5E7]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-sm text-[#1A1A1A]">Sources</h2>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[#A71930] hover:text-[#A71930] transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add source
        </button>

        {/* Load Maths Samples */}
        {!hasSamples && (
          <button
            onClick={loadMathsSamples}
            disabled={loadingSamples}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-[#0072CE]/10 border border-[#0072CE]/30 rounded-lg text-sm text-[#0072CE] font-medium hover:bg-[#0072CE]/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingSamples ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FolderOpen size={16} />
            )}
            {loadingSamples ? 'Loading samples...' : 'Load Maths samples'}
          </button>
        )}
        {sampleProgress && (
          <p className="text-[10px] text-[#0072CE] mt-1 text-center">
            {sampleProgress}
          </p>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="p-4 border-b border-[#E5E5E7] bg-[#F5F5F7] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Add new source</span>
            <button
              onClick={() => setShowUpload(false)}
              className="p-1 hover:bg-gray-200 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <input
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Source name (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A71930] focus:border-transparent outline-none"
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A71930] focus:border-transparent outline-none bg-white cursor-pointer"
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* File upload */}
          <div
            className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#0072CE] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} className="mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">
              Drop PDF or click to upload
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </div>

          <div className="text-center text-xs text-gray-400">or paste text</div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your feedback, mark scheme, or learning outcomes here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A71930] focus:border-transparent outline-none resize-none"
          />

          <button
            onClick={handlePasteSubmit}
            disabled={uploading || !pasteText.trim()}
            className="w-full py-2 bg-[#0072CE] hover:bg-[#005BA1] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? 'Saving...' : 'Save pasted text'}
          </button>
        </div>
      )}

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">
              Saved resources will appear here.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Click &ldquo;Add source&rdquo; above or load the Maths samples.
            </p>
          </div>
        ) : (
          SOURCE_TYPES.map((type) => {
            const items = grouped[type.value];
            if (!items || items.length === 0) return null;
            const Icon = type.icon;
            return (
              <div key={type.value}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={14} style={{ color: type.color }} />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {type.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((src) => (
                    <div key={src.id}>
                      <button
                        onClick={() =>
                          setExpandedSource(
                            expandedSource === src.id ? null : src.id
                          )
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[#F5F5F7] transition-colors cursor-pointer group"
                      >
                        {expandedSource === src.id ? (
                          <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                        )}
                        <span className="truncate flex-1">{src.name}</span>
                      </button>
                      {expandedSource === src.id && (
                        <div className="ml-7 mr-2 mb-2 max-h-60 overflow-y-auto">
                          {src.chunks?.map((chunk) => (
                            <div
                              key={chunk.chunkId}
                              id={`chunk-${chunk.chunkId}`}
                              className={`p-2 mb-1 rounded text-xs text-gray-600 leading-relaxed ${
                                highlightedChunk === chunk.chunkId
                                  ? 'citation-highlight bg-[#0072CE]/10'
                                  : 'bg-[#F5F5F7]'
                              }`}
                            >
                              {chunk.text.slice(0, 300)}
                              {chunk.text.length > 300 && '...'}
                            </div>
                          )) || (
                            <p className="text-xs text-gray-400 p-2">
                              {src.text?.slice(0, 200)}...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
