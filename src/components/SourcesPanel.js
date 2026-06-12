'use client';

import { useState, useRef } from 'react';
import { addSource, deleteSource, updateSource } from '@/lib/firestore';
import { chunkText } from '@/lib/chunker';
import { parseDocument, ACCEPTED_FILE_TYPES } from '@/lib/parseDocument';
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
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';

const SOURCE_TYPES = [
  { value: 'learning_outcome', label: 'Learning Outcomes', icon: BookOpen, color: '#0072CE' },
  { value: 'mark_scheme', label: 'Mark Scheme', icon: ClipboardList, color: '#E12726' },
  { value: 'feedback', label: 'Resources', icon: MessageSquare, color: '#D97706' },
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

  // States for Edit / Delete operations
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingSource, setEditingSource] = useState(null);
  const [editName, setEditName] = useState('');
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Sort all feedback sources by createdAt ascending to determine their chronological order
  const sortedFeedback = [...sources.filter(s => s.type === 'feedback')].sort((a, b) => {
    const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
    if (aTime !== bTime) {
      return aTime - bTime;
    }
    return (a.id || '').localeCompare(b.id || '');
  });

  const feedbackNumberMap = {};
  sortedFeedback.forEach((src, index) => {
    feedbackNumberMap[src.id] = index + 1;
  });

  const handleEditClick = (src) => {
    setEditingSource(src);
    setEditName(src.name);
    setEditText(src.text || '');
    setMenuOpenId(null);
  };

  const handleDeleteClick = async (src) => {
    if (window.confirm(`Are you sure you want to delete "${src.name}"?`)) {
      try {
        await deleteSource(moduleId, src.id);
        onSourcesChange();
      } catch (err) {
        console.error('Failed to delete source:', err);
        alert('Failed to delete source: ' + err.message);
      }
    }
    setMenuOpenId(null);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      const chunks = chunkText(editText, {
        sourceId: editingSource.id,
        sourceType: editingSource.type,
        sourceName: editName.trim(),
      });

      await updateSource(moduleId, editingSource.id, {
        name: editName.trim(),
        text: editText,
        chunks,
      });

      setEditingSource(null);
      onSourcesChange();
    } catch (err) {
      console.error('Failed to update source:', err);
      alert('Failed to update source: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Group sources by type
  const grouped = {};
  for (const type of SOURCE_TYPES) {
    grouped[type.value] = sources.filter((s) => s.type === type.value);
  }

  async function handleFileUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      // Parse document entirely client-side — file never leaves the browser
      const text = await parseDocument(file);

      const name = sourceName.trim() || file.name;
      const sourceId = `src_${Date.now()}`;
      const chunks = chunkText(text, {
        sourceId,
        sourceType: selectedType,
        sourceName: name,
      });

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

        // Fetch PDF from public/samples/ and parse client-side
        const res = await fetch(`/samples/${encodeURIComponent(sample.fileName)}`);
        if (!res.ok) {
          console.warn(`Failed to fetch ${sample.fileName}`);
          loaded++;
          continue;
        }

        const blob = await res.blob();
        const file = new File([blob], sample.fileName, { type: 'application/pdf' });
        let parsedText;
        try {
          parsedText = await parseDocument(file);
        } catch (parseErr) {
          console.warn(`Failed to parse ${sample.fileName}:`, parseErr);
          loaded++;
          continue;
        }

        const sourceId = `src_${Date.now()}_${loaded}`;
        const chunks = chunkText(parsedText, {
          sourceId,
          sourceType: sample.type,
          sourceName: sample.name,
        });

        await addSource(moduleId, {
          type: sample.type,
          name: sample.name,
          fileName: sample.fileName,
          fileUrl: null,
          text: parsedText,
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
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[#E12726] hover:text-[#E12726] transition-colors cursor-pointer"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none"
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none bg-white cursor-pointer"
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
              PDF, DOCX, XLSX, PPTX, TXT
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
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
            placeholder="Paste your resource text, mark scheme, or learning outcomes here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none resize-none"
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
                      <div className="relative flex items-center group w-full">
                        <button
                          onClick={() =>
                            setExpandedSource(
                              expandedSource === src.id ? null : src.id
                            )
                          }
                          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[#F5F5F7] transition-colors cursor-pointer ${
                            type.value === 'feedback' ? 'pr-10' : ''
                          }`}
                        >
                          {expandedSource === src.id ? (
                            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                          )}
                          <span className="truncate flex-1">
                            {type.value === 'feedback'
                              ? `Resource ${feedbackNumberMap[src.id] || ''}: ${src.name}`
                              : src.name}
                          </span>
                        </button>

                        {type.value === 'feedback' && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setMenuOpenId(menuOpenId === src.id ? null : src.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {menuOpenId === src.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-24">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleEditClick(src);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit2 size={12} />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteClick(src);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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

      {/* Backdrop for closing dropdown */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpenId(null)}
        />
      )}

      {/* Edit modal */}
      {editingSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E5E7] flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E5E5E7] flex justify-between items-center bg-[#F5F5F7]">
              <h3 className="font-semibold text-sm text-[#1A1A1A]">Edit Resource</h3>
              <button
                onClick={() => setEditingSource(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none"
                  placeholder="e.g. Midterm Coursework Resource"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Resource Content
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none resize-none font-mono"
                  placeholder="Paste your resource text here..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-[#E5E5E7] flex gap-3 justify-end bg-[#F5F5F7]">
              <button
                onClick={() => setEditingSource(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editName.trim()}
                className="px-4 py-2 bg-[#E12726] hover:bg-[#C41F1E] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
