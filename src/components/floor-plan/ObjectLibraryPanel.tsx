import React, { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, Box, Info } from 'lucide-react';
import { ObjectCatalogItem, ObjectCategory } from '../../types/floor-plan';
import { floorPlanApi } from '../../services/floor-plan.api';
import { sanitizeSvg } from '../../utils/sanitizeSvg';

interface ObjectLibraryPanelProps {
  onAddObject: (item: ObjectCatalogItem) => void;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'LIVING_ROOM', label: 'Living Room' },
  { key: 'BEDROOM', label: 'Bedroom' },
  { key: 'KITCHEN', label: 'Kitchen' },
  { key: 'BATHROOM', label: 'Bathroom' },
  { key: 'GENERAL', label: 'General' },
];

export const ObjectLibraryPanel: React.FC<ObjectLibraryPanelProps> = ({ onAddObject }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<ObjectCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await floorPlanApi.getCatalogItems({
          category: selectedCategory,
          search: searchQuery.trim() || undefined,
        });
        if (isMounted) {
          setItems(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat katalog objek.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchCatalog, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchQuery]);

  const handleDragStart = (e: React.DragEvent, item: ObjectCatalogItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perabot, pintu, jendela..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-[#181829] placeholder:text-slate-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-purple-200 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-[#71758E] hover:bg-slate-200 hover:text-[#181829]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Items Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Memuat katalog...</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Box className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Tidak ada objek ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-1">Coba ubah kata kunci atau kategori pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => onAddObject(item)}
                className="group relative flex flex-col items-center p-2.5 rounded-2xl border border-slate-100 hover:border-purple-300 bg-white hover:bg-purple-50/20 shadow-xs hover:shadow-md transition-all cursor-pointer select-none text-left"
                title={`${item.name} (${item.defaultWidth}×${item.defaultHeight} px) - Klik atau seret ke denah`}
              >
                {/* SVG Visual Representation Preview */}
                <div className="w-full h-20 rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-2 overflow-hidden border border-slate-100 group-hover:border-purple-200 transition-colors">
                  {item.svgContent ? (
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-105"
                      dangerouslySetInnerHTML={{ __html: sanitizeSvg(item.svgContent) }}
                    />
                  ) : (
                    <Box className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                {/* Details */}
                <div className="w-full">
                  <h4 className="text-[11px] font-bold text-[#181829] truncate group-hover:text-purple-700 transition-colors">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#71758E]">
                    <span className="font-mono">
                      {item.defaultWidth}×{item.defaultHeight}
                    </span>
                    <span className="p-1 rounded-md bg-purple-100/60 text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info Tip */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-[10px] text-[#71758E] flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
        <span>Klik atau seret objek ke dalam denah untuk menambahkan.</span>
      </div>
    </div>
  );
};

