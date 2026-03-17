"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, X, Package, Clock, Gauge, Hammer, ShoppingCart,
  ShieldCheck, Sparkles, Youtube, Image as ImageIcon, Tag,
  FileText, Dna, Zap
} from 'lucide-react';

interface ProductDNA {
  name: string;
  sku: string;
  price: string;
  category: string;
  mainImage: string;
  image2: string;
  image3: string;
  youtubeUrl: string;
  dryingTime: string;
  coverage: string;
  applicationMethod: string;
  slangKeywords: string[];
  description: string;
}

const CATEGORIES = [
  'צבעים',
  'ציפויים',
  'כלי עבודה',
  'ממסים',
  'דבקים',
  'אביזרים',
];

const DEFAULT_PRODUCT: ProductDNA = {
  name: '',
  sku: 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  price: '',
  category: '',
  mainImage: '',
  image2: '',
  image3: '',
  youtubeUrl: '',
  dryingTime: '',
  coverage: '',
  applicationMethod: '',
  slangKeywords: [],
  description: '',
};

export default function ProductDNAStudio() {
  const [product, setProduct] = useState<ProductDNA>(DEFAULT_PRODUCT);
  const [keywordInput, setKeywordInput] = useState('');

  const updateProduct = useCallback((field: keyof ProductDNA, value: string | string[]) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  }, []);

  const addKeyword = () => {
    if (keywordInput.trim() && !product.slangKeywords.includes(keywordInput.trim())) {
      updateProduct('slangKeywords', [...product.slangKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateProduct('slangKeywords', product.slangKeywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const handleCancel = () => {
    setProduct({ ...DEFAULT_PRODUCT, sku: 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase() });
  };

  const handleSave = () => {
    console.log('Saving product DNA:', product);
    // Here you would save to Supabase
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/30 ring-4 ring-blue-500/20">
            <Dna className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tight text-slate-900 uppercase">Product DNA Designer</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Saban OS - Logistics Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN - Form Area */}
        <div className="bg-slate-950 rounded-[40px] p-8 shadow-2xl border border-slate-800/50 overflow-hidden">
          <div className="space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="text-blue-500" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">פרטי מוצר</h2>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">שם המוצר הרשמי</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct('name', e.target.value)}
                  placeholder="לדוגמה: צבע אקרילי פרימיום..."
                  className="w-full bg-slate-900/80 border border-slate-800 p-5 rounded-3xl font-bold text-white outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-lg"
                />
              </div>

              {/* SKU & Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">מק"ט (SKU)</label>
                  <input
                    type="text"
                    value={product.sku}
                    disabled
                    className="w-full bg-slate-900/40 border border-slate-800/50 p-4 rounded-2xl font-mono text-slate-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">מחיר יחידה (ILS)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct('price', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900/80 border border-slate-800 p-4 pr-12 rounded-2xl font-black text-emerald-400 outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-700 text-lg"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">₪</span>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">קטגוריה</label>
                <select
                  value={product.category}
                  onChange={(e) => updateProduct('category', e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-bold text-white outline-none focus:ring-4 ring-blue-500/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950">בחר קטגוריה...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-950">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {/* Media Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="text-blue-500" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">מדיה ותמונות</h2>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">תמונה ראשית (URL)</label>
                <input
                  type="url"
                  value={product.mainImage}
                  onChange={(e) => updateProduct('mainImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-medium text-blue-400 outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">תמונה 2 (URL)</label>
                  <input
                    type="url"
                    value={product.image2}
                    onChange={(e) => updateProduct('image2', e.target.value)}
                    placeholder="URL..."
                    className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-medium text-blue-400 outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">תמונה 3 (URL)</label>
                  <input
                    type="url"
                    value={product.image3}
                    onChange={(e) => updateProduct('image3', e.target.value)}
                    placeholder="URL..."
                    className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-medium text-blue-400 outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2 flex items-center gap-2">
                  <Youtube size={14} className="text-red-500" /> קישור YouTube
                </label>
                <input
                  type="url"
                  value={product.youtubeUrl}
                  onChange={(e) => updateProduct('youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-medium text-red-400 outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {/* Technical DNA Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-blue-500" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">DNA טכני</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2 flex items-center gap-1">
                    <Clock size={12} /> זמן ייבוש
                  </label>
                  <input
                    type="text"
                    value={product.dryingTime}
                    onChange={(e) => updateProduct('dryingTime', e.target.value)}
                    placeholder="24 שעות"
                    className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-bold text-white outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2 flex items-center gap-1">
                    <Gauge size={12} /> כיסוי
                  </label>
                  <input
                    type="text"
                    value={product.coverage}
                    onChange={(e) => updateProduct('coverage', e.target.value)}
                    placeholder="12 מ״ר/ליטר"
                    className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-bold text-white outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2 flex items-center gap-1">
                    <Hammer size={12} /> שיטת מריחה
                  </label>
                  <input
                    type="text"
                    value={product.applicationMethod}
                    onChange={(e) => updateProduct('applicationMethod', e.target.value)}
                    placeholder="מברשת/רולר"
                    className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-bold text-white outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>
              </div>

              {/* Slang Keywords */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2 flex items-center gap-1">
                  <Tag size={12} /> מילות סלנג (לחיפוש חכם)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="הקלד והקש Enter..."
                    className="flex-1 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl font-medium text-white outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
                <AnimatePresence>
                  {product.slangKeywords.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 mt-3"
                    >
                      {product.slangKeywords.map((keyword, index) => (
                        <motion.span
                          key={keyword}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/30"
                        >
                          {keyword}
                          <button onClick={() => removeKeyword(keyword)} className="hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-blue-500" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">תיאור ומפרט טכני</h2>
              </div>
              <textarea
                rows={6}
                value={product.description}
                onChange={(e) => updateProduct('description', e.target.value)}
                placeholder="תיאור מלא של המוצר, מפרט טכני, שימושים מומלצים..."
                className="w-full bg-slate-900/80 border border-slate-800 p-5 rounded-3xl font-medium text-white outline-none focus:ring-4 ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm leading-relaxed resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-5 rounded-3xl font-black text-sm transition-all active:scale-[0.98] border border-slate-700"
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-5 rounded-3xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 border-b-4 border-blue-800"
              >
                <Save size={20} />
                Inject & Sync DNA
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Live Simulator */}
        <div className="flex justify-center items-start sticky top-8">
          <PhoneSimulator product={product} extractYouTubeId={extractYouTubeId} />
        </div>
      </div>
    </motion.div>
  );
}

// Phone Simulator Component
function PhoneSimulator({ 
  product, 
  extractYouTubeId 
}: { 
  product: ProductDNA; 
  extractYouTubeId: (url: string) => string | null;
}) {
  const youtubeId = extractYouTubeId(product.youtubeUrl);
  const hasImages = product.mainImage || product.image2 || product.image3;

  return (
    <div className="relative">
      {/* Phone Frame - Samsung Note 25 Style */}
      <div className="w-[340px] h-[720px] bg-slate-950 rounded-[50px] p-3 shadow-2xl shadow-black/50 ring-4 ring-slate-800/50 relative overflow-hidden">
        {/* Notch / Camera */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-slate-800 rounded-full ring-2 ring-slate-700" />
          <div className="w-2 h-2 bg-slate-800 rounded-full" />
        </div>

        {/* Screen Content */}
        <div className="w-full h-full bg-slate-900 rounded-[40px] overflow-hidden relative">
          <div className="h-full overflow-y-auto scrollbar-hide">
            {/* Image Collage */}
            <div className="relative h-72">
              {hasImages ? (
                <div className="grid grid-cols-3 gap-1 h-full p-1">
                  {/* Main Image - Takes 2/3 */}
                  <div className="col-span-2 relative rounded-3xl overflow-hidden bg-slate-800">
                    {product.mainImage ? (
                      <motion.img
                        key={product.mainImage}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={product.mainImage}
                        alt="Main"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = ''; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="text-slate-700" size={48} />
                      </div>
                    )}
                  </div>
                  {/* Side Images */}
                  <div className="flex flex-col gap-1">
                    <div className="flex-1 rounded-3xl overflow-hidden bg-slate-800">
                      {product.image2 ? (
                        <motion.img
                          key={product.image2}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={product.image2}
                          alt="Image 2"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = ''; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-slate-700" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 rounded-3xl overflow-hidden bg-slate-800">
                      {product.image3 ? (
                        <motion.img
                          key={product.image3}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={product.image3}
                          alt="Image 3"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = ''; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-slate-700" size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="text-slate-700 mx-auto mb-2" size={48} />
                    <p className="text-slate-600 text-xs font-bold">הוסף תמונות</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-5 space-y-4">
              {/* Name & SKU */}
              <div className="space-y-2">
                <motion.h3
                  key={product.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-black text-white italic leading-tight"
                >
                  {product.name || 'שם המוצר'}
                </motion.h3>
                <div className="flex items-center gap-3">
                  <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-mono">
                    {product.sku}
                  </span>
                  <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg">
                    <ShieldCheck size={12} />
                    <span className="text-[10px] font-black uppercase">DNA Verified</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              {product.price && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-black text-emerald-400"
                >
                  ₪{Number(product.price).toLocaleString()}
                </motion.div>
              )}

              {/* Tech Grid */}
              <div className="grid grid-cols-3 gap-2">
                <TechGridItem
                  icon={<Clock size={16} />}
                  label="ייבוש"
                  value={product.dryingTime}
                />
                <TechGridItem
                  icon={<Gauge size={16} />}
                  label="כיסוי"
                  value={product.coverage}
                />
                <TechGridItem
                  icon={<Hammer size={16} />}
                  label="מריחה"
                  value={product.applicationMethod}
                />
              </div>

              {/* YouTube Video */}
              <AnimatePresence>
                {youtubeId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-3xl overflow-hidden bg-slate-800 aspect-video"
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Advisor Box */}
              {product.description && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 overflow-hidden"
                >
                  {/* Glassmorphism Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="text-amber-400" size={16} />
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Saban Pro Advisor</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                      {product.description}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Bottom Spacing for Button */}
              <div className="h-20" />
            </div>
          </div>

          {/* Fixed Bottom Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-12">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 active:shadow-lg"
            >
              <ShoppingCart size={18} />
              ADD TO COMMAND
            </motion.button>
          </div>
        </div>

        {/* Side Buttons */}
        <div className="absolute right-[-3px] top-32 w-1 h-16 bg-slate-700 rounded-l-md" />
        <div className="absolute right-[-3px] top-52 w-1 h-10 bg-slate-700 rounded-l-md" />
        <div className="absolute left-[-3px] top-36 w-1 h-20 bg-slate-700 rounded-r-md" />
      </div>

      {/* Reflection Effect */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 bg-blue-500/20 blur-2xl rounded-full" />
    </div>
  );
}

// Tech Grid Item Component
function TechGridItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-800/80 rounded-2xl p-3 text-center border border-slate-700/50"
    >
      <div className="text-blue-400 mx-auto mb-1 flex justify-center">{icon}</div>
      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{label}</p>
      <p className="text-white font-black text-xs truncate">{value || '—'}</p>
    </motion.div>
  );
}
