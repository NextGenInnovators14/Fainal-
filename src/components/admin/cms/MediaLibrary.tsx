import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { MediaItem, MediaType } from '../../../types';
import { useModalBackHandler } from '../../../utils/useModalBackHandler';
import { compressImageFile, estimateDataUrlSizeKb } from '../../../utils/imageUtils';
import { 
  FolderOpen, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Copy, 
  Eye, 
  ExternalLink, 
  Image as ImageIcon, 
  Video, 
  Film, 
  FileText, 
  Layers, 
  Check, 
  X,
  Sparkles,
  Tag,
  Grid,
  List
} from 'lucide-react';

export const MediaLibrary: React.FC = () => {
  const { mediaLibrary, addMediaItem, addMediaItemsBulk, deleteMediaItem, updateMediaItem, showToast } = useApp();
  
  const [activeTypeFilter, setActiveTypeFilter] = useState<MediaType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New Media Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  useModalBackHandler(isAddModalOpen, () => setIsAddModalOpen(false));
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<MediaType>('image');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('General Assets');
  const [newTags, setNewTags] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  useModalBackHandler(isBulkModalOpen, () => setIsBulkModalOpen(false));
  const [bulkFiles, setBulkFiles] = useState<{ name: string; url: string; type: MediaType }[]>([]);

  // Preview Lightbox State
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  useModalBackHandler(Boolean(previewItem), () => setPreviewItem(null));

  // Derive unique categories
  const categories = ['all', ...Array.from(new Set(mediaLibrary.map(m => m.category).filter(Boolean)))];

  // Filter items
  const filteredItems = mediaLibrary.filter(item => {
    const matchesType = activeTypeFilter === 'all' || item.type === activeTypeFilter;
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesCat && matchesSearch;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Media URL copied to clipboard!', 'success');
  };

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      showToast('Please provide a title and media URL', 'error');
      return;
    }

    const tagsArray = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newItem: MediaItem = {
      id: `med-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim(),
      type: newType,
      category: newCategory.trim() || 'General Assets',
      tags: tagsArray.length ? tagsArray : ['CMS'],
      fileSize: 'Web Link',
      uploadedAt: new Date().toISOString(),
      description: newDescription.trim()
    };

    addMediaItem(newItem);
    showToast('Media item added to library!', 'success');
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewTags('');
    setNewDescription('');
  };

  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const handleBulkFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkProcessing(true);
    const fileList: { name: string; url: string; type: MediaType }[] = [];
    const oversized: string[] = [];

    try {
      for (const file of Array.from(files) as File[]) {
        let type: MediaType = 'image';
        if (file.type.includes('pdf')) type = 'document';
        else if (file.type.includes('video')) type = 'video';

        // Images get resized + compressed so they actually save. PDFs and
        // videos can't be shrunk this way — we still accept them, but warn
        // if a single file is large enough to risk failing the save.
        const url = type === 'image' ? await compressImageFile(file) : await readFileAsDataUrl(file);
        if (type !== 'image' && estimateDataUrlSizeKb(url) > 4000) {
          oversized.push(file.name);
          continue;
        }

        fileList.push({ name: file.name.replace(/\.[^/.]+$/, ''), url, type });
      }

      if (oversized.length) {
        showToast(`Skipped ${oversized.length} file(s) too large to save reliably: ${oversized.join(', ')}`, 'warning');
      }
      setBulkFiles(prev => [...prev, ...fileList]);
    } catch {
      showToast('Some files could not be processed — try again', 'error');
    } finally {
      setIsBulkProcessing(false);
      e.target.value = '';
    }
  };

  const handleApplyBulkUpload = () => {
    if (bulkFiles.length === 0) return;

    const items: MediaItem[] = bulkFiles.map((f, idx) => ({
      id: `med-bulk-${Date.now()}-${idx}`,
      title: f.name,
      url: f.url,
      type: f.type,
      category: 'Bulk Uploads',
      tags: ['Bulk', f.type],
      fileSize: 'Local File',
      uploadedAt: new Date().toISOString()
    }));

    addMediaItemsBulk(items);
    showToast(`Successfully imported ${items.length} media files!`, 'success');
    setIsBulkModalOpen(false);
    setBulkFiles([]);
  };

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'floorplan': return <Layers className="w-4 h-4 text-[#1E4FA8]" />;
      case 'video': return <Video className="w-4 h-4 text-rose-600" />;
      case 'shorts': return <Film className="w-4 h-4 text-purple-600" />;
      case 'document': return <FileText className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div id="media-library-manager" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-100 text-[#1E4FA8] rounded-full uppercase tracking-wider">
              CMS • Media Vault
            </span>
            <span className="text-xs text-slate-400">• {mediaLibrary.length} Total Assets</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Central Media Library
          </h2>
          <p className="text-xs text-slate-500">
            Upload, tag, and organize property photos, architectural blueprints, YouTube walkthroughs, reels, and PDF brochures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="cms-bulk-upload-btn"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Bulk Upload (20+ Files)
          </button>

          <button
            id="cms-add-media-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#F2621E] hover:bg-[#d85517] rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Media Link / File
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => setActiveTypeFilter('image')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeTypeFilter === 'image' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Photos & Images</span>
            <ImageIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {mediaLibrary.filter(m => m.type === 'image').length}
          </p>
        </div>

        <div 
          onClick={() => setActiveTypeFilter('floorplan')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeTypeFilter === 'floorplan' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Blueprints / Plans</span>
            <Layers className="w-4 h-4 text-[#1E4FA8]" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {mediaLibrary.filter(m => m.type === 'floorplan').length}
          </p>
        </div>

        <div 
          onClick={() => setActiveTypeFilter('video')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeTypeFilter === 'video' ? 'border-rose-500 bg-rose-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Video Walkthroughs</span>
            <Video className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {mediaLibrary.filter(m => m.type === 'video').length}
          </p>
        </div>

        <div 
          onClick={() => setActiveTypeFilter('shorts')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeTypeFilter === 'shorts' ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Shorts / Reels (9:16)</span>
            <Film className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {mediaLibrary.filter(m => m.type === 'shorts').length}
          </p>
        </div>

        <div 
          onClick={() => setActiveTypeFilter('document')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeTypeFilter === 'document' ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">PDFs & Brochures</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {mediaLibrary.filter(m => m.type === 'document').length}
          </p>
        </div>
      </div>

      {/* Filters and Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Type tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Types ({mediaLibrary.length})
          </button>
          <button
            onClick={() => setActiveTypeFilter('image')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTypeFilter === 'image' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveTypeFilter('floorplan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTypeFilter === 'floorplan' ? 'bg-[#1E4FA8] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Floor Plans
          </button>
          <button
            onClick={() => setActiveTypeFilter('video')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTypeFilter === 'video' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Walkthroughs
          </button>
          <button
            onClick={() => setActiveTypeFilter('shorts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTypeFilter === 'shorts' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Shorts / Reels
          </button>
          <button
            onClick={() => setActiveTypeFilter('document')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTypeFilter === 'document' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Brochures
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F2621E]/20"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 font-medium"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Media Items Display */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No media items found</h4>
          <p className="text-xs text-slate-500">Try changing your search or filter tags, or upload new files.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              {/* Media Thumbnail / Preview Area */}
              <div className="aspect-video w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                {item.type === 'image' || item.type === 'floorplan' ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : item.type === 'video' ? (
                  <div className="text-center p-4">
                    <Video className="w-10 h-10 text-rose-500 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-300 font-medium">Video Walkthrough</span>
                  </div>
                ) : item.type === 'shorts' ? (
                  <div className="text-center p-4">
                    <Film className="w-10 h-10 text-purple-400 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-300 font-medium">9:16 Reel / Short</span>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <FileText className="w-10 h-10 text-amber-400 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-300 font-medium">PDF Document</span>
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/70 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-1">
                  {getTypeIcon(item.type)}
                  <span className="capitalize">{item.type}</span>
                </div>

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-transform hover:scale-110"
                    title="Full Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(item.url)}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-transform hover:scale-110"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${item.title}" from library?`)) {
                        deleteMediaItem(item.id);
                        showToast('Media item deleted', 'info');
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-transform hover:scale-110"
                    title="Delete Media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-orange-600 truncate max-w-[150px]">
                      {item.category}
                    </span>
                    <span>{item.fileSize || 'Web'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{item.tags.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5">Media Title</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Category / Tag</th>
                  <th className="p-3.5">Uploaded</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.type === 'image' || item.type === 'floorplan' ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          getTypeIcon(item.type)
                        )}
                      </div>
                      <span className="line-clamp-1">{item.title}</span>
                    </td>
                    <td className="p-3.5 capitalize text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(item.type)}
                        {item.type}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleCopyUrl(item.url)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete media item?')) deleteMediaItem(item.id);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-[11px]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD NEW MEDIA MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#F2621E]" />
                Add New Media Item
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Media Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom 3 BHK View"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F2621E]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MediaType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    <option value="image">Photo / Image</option>
                    <option value="floorplan">Blueprint / Floor Plan</option>
                    <option value="video">YouTube / Vimeo Video</option>
                    <option value="shorts">Reels / Short Video (9:16)</option>
                    <option value="document">PDF Brochure / Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Project</label>
                  <input
                    type="text"
                    placeholder="e.g. Project: Adroit Utopia"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Media URL (HTTPS) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or https://youtube.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F2621E]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Living Room, Luxury, CIDCO, 3 BHK"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes about this asset or usage instructions"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#F2621E] hover:bg-[#d85517] rounded-xl shadow-sm"
                >
                  Save to Media Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#1E4FA8]" />
                Bulk Upload Media (20+ Files at Once)
              </h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${isBulkProcessing ? 'border-slate-200 opacity-60 cursor-wait' : 'border-slate-300 hover:border-[#1E4FA8] hover:bg-blue-50/20 cursor-pointer'}`}>
                <input
                  type="file"
                  multiple
                  accept="image/*, application/pdf, video/*"
                  onChange={handleBulkFileInput}
                  disabled={isBulkProcessing}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1E4FA8] flex items-center justify-center mb-2">
                  <Upload className={`w-6 h-6 ${isBulkProcessing ? 'animate-pulse' : ''}`} />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {isBulkProcessing ? 'Optimizing images…' : 'Select Multiple Photos / PDFs'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isBulkProcessing ? 'Please wait, this only takes a moment' : 'Hold Shift/Ctrl to select 10 to 30 files together — photos are auto-compressed'}
                </p>
              </label>

              {bulkFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Selected {bulkFiles.length} files for upload:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {bulkFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                        <span className="truncate max-w-xs font-medium">{f.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyBulkUpload}
                  disabled={bulkFiles.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E4FA8] hover:bg-[#163c80] disabled:opacity-50 rounded-xl shadow-sm"
                >
                  Import {bulkFiles.length} Files to Library
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 text-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">{previewItem.title}</h3>
                <span className="text-xs text-slate-400 font-semibold">{previewItem.category}</span>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-black/40 min-h-[300px]">
              {previewItem.type === 'image' || previewItem.type === 'floorplan' ? (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.title} 
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : previewItem.type === 'video' || previewItem.type === 'shorts' ? (
                <div className="text-center space-y-3">
                  <Video className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-white">Video Link: {previewItem.url}</p>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                  >
                    Open in Player / New Tab <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <FileText className="w-16 h-16 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-white">PDF Document Asset</p>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                  >
                    Download PDF Brochure <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">{previewItem.url}</span>
              <button
                onClick={() => handleCopyUrl(previewItem.url)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
