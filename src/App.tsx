/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Leaf, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Heart, 
  Search, 
  Droplets, 
  Flame, 
  Scale, 
  AlertTriangle, 
  ShoppingCart, 
  Plus, 
  MessageCircle, 
  User, 
  Check, 
  ChevronRight,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe, HistoryItem } from './types';
import { INGREDIENTS, RECIPES, CATEGORY_MAP, SYMPTOMS_OPTIONS, CYCLE_OPTIONS } from './data';

// --- Sub-components ---

const Chip = ({ children, active, onClick, variant = 'primary' }: { children: React.ReactNode; active: boolean; onClick: () => void; variant?: 'primary' | 'secondary'; key?: React.Key }) => {
  const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-full border text-sm cursor-pointer m-1 transition-colors min-h-[34px]";
  const variants = {
    primary: active 
      ? "bg-green-100 text-green-700 border-transparent shadow-sm" 
      : "bg-white text-gray-700 border-gray-200 hover:border-green-300",
    secondary: active 
      ? "bg-orange-100 text-orange-700 border-transparent shadow-sm" 
      : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
};

const Tag = ({ children, className }: { children: React.ReactNode; className?: string; key?: React.Key }) => (
  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs m-0.5 ${className}`}>
    {children}
  </span>
);

const RecipeCard = ({ recipe, matchedCount, hasIngredients, onSelect }: { recipe: any; matchedCount: number; hasIngredients: string[]; onSelect: () => void; key?: React.Key }) => {
  const pct = Math.round((matchedCount / recipe.req.length) * 100);
  const colorClass = pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-orange-600' : 'text-gray-400';
  const bgProgressClass = pct === 100 ? 'bg-green-600' : pct >= 50 ? 'bg-orange-600' : 'bg-gray-400';

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">{recipe.name}</p>
          <div className="flex flex-wrap">
            {recipe.bs.map((b, i) => (
              <Tag key={i} className={recipe.bc[i]}>{b}</Tag>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
             {recipe.mth === '泡' ? <Droplets size={10} /> : <Flame size={10} />}
             {recipe.mth}
          </span>
          <p className={`text-xs mt-1 font-medium ${colorClass}`}>{matchedCount}/{recipe.req.length}味已有</p>
        </div>
      </div>
      <div className="h-[3px] bg-gray-100 rounded-full mb-2 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${bgProgressClass}`} />
      </div>
      <div className="flex flex-wrap leading-relaxed">
        {recipe.req.map((x, i) => (
          <span 
            key={i} 
            className={`inline-block px-2 py-0.5 rounded-xl text-xs m-0.5 ${hasIngredients.includes(x.n) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {x.n}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

// --- Views ---

export default function App() {
  const [curTab, setCurTab] = useState<'rec' | 'his' | 'pre' | 'sho'>('rec');
  const [curScreen, setCurScreen] = useState<'main' | 'det' | 'ord'>('main');
  const [prevScreen, setPrevScreen] = useState<'rec' | 'sho'>('rec');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // State
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState<{ ef: Set<string>, mt: Set<string> }>({ ef: new Set(), mt: new Set() });
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 1, recipeId: 9, name: '健脾消食方', date: '2026-04-01', days: 14, status: '已完成', rating: 4, symptoms: ['消化顺畅', '气色改善'] },
    { id: 2, recipeId: 4, name: '晚上安神茶', date: '2026-04-20', days: 7, status: '已完成', rating: 5, symptoms: ['睡眠改善'] },
    { id: 3, recipeId: 23, name: '清热方', date: '2026-05-05', days: 3, status: '饮用中', rating: 0, symptoms: [] }
  ]);
  const [shopQuery, setShopQuery] = useState('');
  const [orderCyc, setOrderCyc] = useState<keyof typeof CYCLE_OPTIONS>('trial');
  const [orderStep, setOrderStep] = useState(1);

  const matchedRecipes = useMemo(() => {
    if (selectedIngredients.size === 0) return [];
    return RECIPES.map(r => {
      const hasL = r.req.filter(req => selectedIngredients.has(req.n)).map(req => req.n);
      const missL = r.req.filter(req => !selectedIngredients.has(req.n)).map(req => req.n);
      return { ...r, matchedIngredients: hasL, missingIngredients: missL, count: hasL.length };
    })
    .filter(r => r.count > 0)
    .filter(r => preferences.ef.size === 0 || [...preferences.ef].some(e => r.ef.includes(e)))
    .filter(r => preferences.mt.size === 0 || preferences.mt.has(r.mth === '泡' ? '泡（快手）' : '煮（细熬）'))
    .sort((a, b) => b.count - a.count || a.missingIngredients.length - b.missingIngredients.length);
  }, [selectedIngredients, preferences]);

  const shopResults = useMemo(() => {
    if (!shopQuery) return [];
    const kws = (CATEGORY_MAP[shopQuery] || [shopQuery]).map(k => k.toLowerCase());
    return RECIPES.filter(r => kws.some(k => [r.name, ...r.bs, ...r.ef, r.caution].join(' ').toLowerCase().includes(k)));
  }, [shopQuery]);

  const toggleIngredient = (i: string) => {
    const next = new Set(selectedIngredients);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedIngredients(next);
  };

  const togglePreference = (key: 'ef' | 'mt', val: string) => {
    const next = { ...preferences };
    const set = new Set(next[key]);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    next[key] = set;
    setPreferences(next);
  };

  const toggleHistorySymptom = (hId: number, s: string) => {
    setHistory(prev => prev.map(h => {
      if (h.id !== hId) return h;
      const nextS = [...h.symptoms];
      if (nextS.includes(s)) return { ...h, symptoms: nextS.filter(x => x !== s) };
      return { ...h, symptoms: [...nextS, s] };
    }));
  };

  const setRating = (hId: number, r: number) => {
    setHistory(prev => prev.map(h => h.id === hId ? { ...h, rating: r } : h));
  };

  const getPrice = (r: Recipe, cyc: keyof typeof CYCLE_OPTIONS) => {
    const base = 15 + r.req.length * 8;
    if (cyc === 'trial') return base;
    if (cyc === 'month') return Math.round(base * 3.2);
    if (cyc === 'season') return Math.round(base * 7.5);
    return base;
  };

  const showDetail = (r: Recipe, from: 'rec' | 'sho') => {
    setSelectedRecipe(r);
    setPrevScreen(from);
    setCurScreen('det');
  };

  const startOrder = (r: Recipe) => {
    setSelectedRecipe(r);
    setOrderCyc('trial');
    setOrderStep(1);
    setCurScreen('ord');
  };

  const addToHistory = (r: Recipe) => {
    const today = new Date().toISOString().split('T')[0];
    const exists = history.find(h => h.name === r.name && h.status === '饮用中');
    if (!exists) {
      setHistory([{
        id: Date.now(),
        recipeId: r.id,
        name: r.name,
        date: today,
        days: 1,
        status: '饮用中',
        rating: 0,
        symptoms: []
      }, ...history]);
    }
    setCurScreen('main');
    setCurTab('his');
  };

  const titles = { rec: '推荐配方', his: '饮用历史', pre: '口味偏好', sho: '配方商城' };

  return (
    <div id="app" className="max-w-[430px] mx-auto bg-gray-50 flex flex-col min-h-screen relative overflow-hidden font-sans text-gray-800">
      {/* Header */}
      <div id="hdr" className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-20">
        {(curScreen !== 'main' || (curScreen === 'ord' && orderStep === 4)) && (
          <button 
            onClick={() => {
              if (curScreen === 'ord') {
                if (orderStep === 1 || orderStep === 4) {
                   setCurScreen('main');
                   setOrderStep(1);
                } else if (orderStep === 2) {
                   setOrderStep(1);
                }
              } else if (curScreen === 'det') {
                setCurScreen('main');
              }
            }} 
            className="p-1 -ml-1 text-gray-500"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="text-lg font-medium flex-1">
          {curScreen === 'main' ? titles[curTab] : curScreen === 'ord' ? (['', '订单确认', '微信授权', '处理中', '预订成功'][orderStep]) : selectedRecipe?.name}
        </h1>
        {curScreen === 'main' && (
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
            <Leaf size={16} className="text-green-600" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <AnimatePresence mode="wait">
          {curScreen === 'main' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {curTab === 'rec' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">选择你手边有的原料，有一味即可推荐相关配方</p>
                  <div className="mb-4">
                    {INGREDIENTS.map(i => (
                      <Chip key={i} active={selectedIngredients.has(i)} onClick={() => toggleIngredient(i)}>{i}</Chip>
                    ))}
                  </div>
                  {selectedIngredients.size === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Droplets size={32} />
                      </div>
                      <p className="text-sm">选择任意原料<br/>即可找到相关配方</p>
                    </div>
                  ) : matchedRecipes.length === 0 ? (
                    <p className="text-center py-10 text-gray-400 text-sm">暂无对应配方</p>
                  ) : (
                    <>
                      {matchedRecipes.filter(r => r.missingIngredients.length === 0).length > 0 && (
                         <>
                           <p className="text-xs text-gray-500 mb-2">原料完整（{matchedRecipes.filter(r => r.missingIngredients.length === 0).length}个）</p>
                           {matchedRecipes.filter(r => r.missingIngredients.length === 0).map(r => (
                             <RecipeCard 
                               key={r.id} 
                               recipe={r} 
                               matchedCount={r.count} 
                               hasIngredients={[...selectedIngredients]} 
                               onSelect={() => showDetail(r, 'rec')} 
                             />
                           ))}
                         </>
                      )}
                      {matchedRecipes.filter(r => r.missingIngredients.length > 0).length > 0 && (
                         <>
                           <p className="text-xs text-gray-500 mb-2 mt-4">配方部分匹配</p>
                           {matchedRecipes.filter(r => r.missingIngredients.length > 0).map(r => (
                             <RecipeCard 
                               key={r.id} 
                               recipe={r} 
                               matchedCount={r.count} 
                               hasIngredients={[...selectedIngredients]} 
                               onSelect={() => showDetail(r, 'rec')} 
                             />
                           ))}
                         </>
                      )}
                    </>
                  )}
                </div>
              )}

              {curTab === 'his' && (
                <div>
                  {history.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                      <Clock size={44} className="mx-auto mb-4 opacity-50" />
                      <p className="text-sm">暂无饮用记录</p>
                    </div>
                  ) : (
                    history.map(item => (
                      <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{item.date} 开始 · 已喝{item.days}天</p>
                          </div>
                          <Tag className={item.status === '饮用中' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {item.status}
                          </Tag>
                        </div>
                        <div className="mb-4">
                          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">效果反馈</p>
                          <div className="flex flex-wrap">
                            {SYMPTOMS_OPTIONS.map(s => (
                              <Chip 
                                key={s} 
                                active={item.symptoms.includes(s)} 
                                onClick={() => toggleHistorySymptom(item.id, s)}
                              >
                                {s}
                              </Chip>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
                          <span className="text-xs text-gray-500">综合评分</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star 
                                key={i} 
                                size={18} 
                                className={`cursor-pointer transition-colors ${i <= item.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-200'}`} 
                                onClick={() => setRating(item.id, i)}
                              />
                            ))}
                          </div>
                          {item.rating > 0 && <span className="text-[10px] text-gray-400">{item.rating}/5</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {curTab === 'pre' && (
                <div>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">设置偏好后，推荐结果自动过滤</p>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">功效方向（可多选）</p>
                  <div className="mb-6">
                    {['护眼明目','清热去火','助眠安神','健脾消食','止咳润肺','补气血','驱寒暖体','祛湿','皮肤护理','护嗓利咽','美容养颜'].map(e => (
                      <Chip key={e} active={preferences.ef.has(e)} onClick={() => togglePreference('ef', e)} variant="secondary">{e}</Chip>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">制作方式</p>
                  <div className="mb-6">
                    {['泡（快手）','煮（细熬）'].map(m => (
                      <Chip key={m} active={preferences.mt.has(m)} onClick={() => togglePreference('mt', m)} variant="secondary">{m}</Chip>
                    ))}
                  </div>
                  {(preferences.ef.size > 0 || preferences.mt.size > 0) && (
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl text-xs flex items-center gap-2">
                       <Check size={14} />
                       <span>偏好已设置，返回推荐页可看到过滤结果</span>
                    </div>
                  )}
                </div>
              )}

              {curTab === 'sho' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">告诉我你的问题，找到合适的配方后可直接预订食材包</p>
                  <div className="relative mb-4">
                    <input 
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="如：缓解疲劳、睡眠不好、眼睛干涩…"
                      value={shopQuery}
                      onChange={(e) => setShopQuery(e.target.value)}
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="mb-6">
                    {Object.keys(CATEGORY_MAP).map(k => (
                      <Chip key={k} active={shopQuery === k} onClick={() => setShopQuery(shopQuery === k ? '' : k)} variant="secondary">{k}</Chip>
                    ))}
                  </div>
                  <div id="sho-res">
                    {!shopQuery ? (
                      <div className="text-center py-10 text-gray-400">
                        <Search size={44} className="mx-auto mb-4 opacity-50" />
                        <p className="text-sm">输入你的问题或选择标签<br/>找到对症的配方</p>
                      </div>
                    ) : shopResults.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <p className="text-sm">未找到"{shopQuery}"相关配方</p>
                        <p className="text-xs mt-1">换个关键词试试</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">找到 {shopResults.length} 个配方</p>
                        {shopResults.map(r => (
                          <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 mb-1">{r.name}</p>
                                <div className="flex flex-wrap">
                                  {r.bs.map((b, i) => <Tag key={i} className={r.bc[i]}>{b}</Tag>)}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{r.req.length}味 · {r.mth}</p>
                              </div>
                              <button onClick={() => showDetail(r, 'sho')} className="text-blue-500 text-xs flex items-center p-1">
                                详情 <ChevronRight size={14} />
                              </button>
                            </div>
                            <button 
                              onClick={() => startOrder(r)}
                              className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 mt-2 shadow-sm hover:bg-green-700 active:scale-95 transition-all"
                            >
                              <MessageCircle size={16} /> 预订此配方食材包
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {curScreen === 'det' && selectedRecipe && (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {selectedRecipe.caution && (
                <div className="bg-orange-50 text-orange-600 p-3 rounded-xl text-xs mb-4 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <p>{selectedRecipe.caution}</p>
                </div>
              )}
              
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
                <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <Scale size={14} className="text-gray-400" /> 用料配比
                </p>
                <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-wider">单次 · 水量500～800ml · 1人份</p>
                <div className="space-y-3">
                  {selectedRecipe.req.map((x, i) => {
                    const has = selectedIngredients.has(x.n);
                    return (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                           <span className="font-medium">{x.n}</span>
                           <Tag className={has ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}>
                             {has ? '✓ 已有' : '需备料'}
                           </Tag>
                        </div>
                        <span className="text-gray-500 font-medium">{x.a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
                <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  {selectedRecipe.mth === '泡' ? <Droplets size={14} className="text-blue-400" /> : <Flame size={14} className="text-orange-400" />}
                  制作步骤
                </p>
                <div className="space-y-4">
                  {selectedRecipe.steps.map((s, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecipe.req.some(r => !selectedIngredients.has(r.n)) && prevScreen === 'rec' && (
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl text-xs mb-4 flex items-start gap-2">
                  <ShoppingCart size={14} className="mt-0.5 flex-shrink-0" />
                  <p>还需补充：<strong>{selectedRecipe.req.filter(r => !selectedIngredients.has(r.n)).map(r => r.n).join('、')}</strong></p>
                </div>
              )}

              <button 
                onClick={() => startOrder(selectedRecipe)}
                className="w-full bg-green-600 text-white rounded-xl py-4 text-base font-medium flex items-center justify-center gap-2 mt-6 shadow-sm shadow-green-200 active:scale-95 transition-all"
              >
                <MessageCircle size={18} /> 预订此配方食材包
              </button>

              {prevScreen === 'rec' && (
                <button 
                  onClick={() => { setCurTab('sho'); setCurScreen('main'); }}
                  className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 mt-3 active:bg-gray-50 transition-all"
                >
                  <Search size={16} /> 去商城按症状查其他配方
                </button>
              )}

              <button 
                onClick={() => addToHistory(selectedRecipe)}
                className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 mt-3 active:bg-gray-50 transition-all"
              >
                <Plus size={16} /> 加入饮用记录
              </button>
            </motion.div>
          )}

          {curScreen === 'ord' && selectedRecipe && (
            <motion.div 
              key="order"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col flex-1"
            >
              {orderStep === 1 && (
                <div>
                   <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">确认你的订单</p>
                   <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-xl text-gray-900 mb-1">{selectedRecipe.name}</p>
                          <p className="text-xs text-gray-400">
                            {selectedRecipe.req.slice(0, 3).map(x => x.n).join(' · ')}
                            {selectedRecipe.req.length > 3 ? ` 等${selectedRecipe.req.length}味` : ''}
                          </p>
                        </div>
                        <Tag className="bg-gray-100 text-gray-600 px-2 py-1">{selectedRecipe.mth}</Tag>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 mb-3">选择饮用周期</p>
                      <div className="flex gap-2 mb-6">
                        {(['trial', 'month', 'season'] as const).map(c => (
                          <div 
                            key={c} 
                            onClick={() => setOrderCyc(c)}
                            className={`flex-1 rounded-xl p-3 text-center border-2 transition-all cursor-pointer ${orderCyc === c ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}
                          >
                            <p className={`text-[10px] font-bold uppercase ${orderCyc === c ? 'text-green-600' : 'text-gray-400'}`}>{CYCLE_OPTIONS[c]}</p>
                            <p className="text-lg font-bold text-orange-500 mt-1">¥{getPrice(selectedRecipe, c)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-600">预估费用</span>
                        <span className="text-2xl font-bold text-orange-500">¥{getPrice(selectedRecipe, orderCyc)}</span>
                      </div>
                   </div>
                   <div className="bg-blue-50 text-blue-600 p-3 rounded-xl text-xs mb-6 flex items-start gap-2">
                     <MessageCircle size={14} className="mt-0.5 flex-shrink-0" />
                     <p>授权后将通过公众号发送预订通知，客服联系你确认配送</p>
                   </div>
                   <button 
                    onClick={() => setOrderStep(2)}
                    className="w-full bg-[#07C160] text-white rounded-xl py-4 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all"
                   >
                     <MessageCircle size={20} /> 微信授权并预订
                   </button>
                   <button 
                    onClick={() => setCurScreen('main')}
                    className="w-full text-gray-400 py-4 text-sm mt-2 hover:text-gray-600"
                   >
                     取消
                   </button>
                </div>
              )}

              {orderStep === 2 && (
                <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
                  <div className="bg-[#07C160] px-6 pt-16 pb-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Leaf size={32} className="text-[#07C160]" />
                    </div>
                    <p className="text-white text-xl font-bold mb-1">养生茶配方助手</p>
                    <p className="text-green-100 text-sm opacity-80">微信公众号</p>
                  </div>
                  <div className="flex-1 px-6 pt-10">
                    <p className="text-sm text-gray-500 text-center mb-8">申请获取以下权限</p>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      <div className="flex items-center gap-4 p-5 border-b border-gray-50">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <User size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 mb-0.5">获取你的昵称和头像</p>
                          <p className="text-xs text-gray-400">用于个性化预订通知</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <MessageCircle size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 mb-0.5">向你发送服务通知</p>
                          <p className="text-xs text-gray-400">预订确认、配送进度更新</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 text-center mt-6 leading-relaxed">
                      授权后不会获取微信好友关系及其他隐私信息
                    </p>
                  </div>
                  <div className="p-6 pb-12 space-y-3">
                    <button 
                      onClick={() => {
                        setOrderStep(3);
                        setTimeout(() => setOrderStep(4), 2000);
                      }}
                      className="w-full bg-[#07C160] text-white rounded-xl py-4 font-bold active:bg-green-700 transition-colors"
                    >
                      同意授权
                    </button>
                    <button onClick={() => setOrderStep(1)} className="w-full bg-white border border-gray-200 text-gray-600 rounded-xl py-4 font-semibold active:bg-gray-50 transition-colors">
                      拒绝
                    </button>
                  </div>
                </div>
              )}

              {orderStep === 3 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                   <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mb-6"></div>
                   <p className="text-lg font-bold text-gray-900 mb-2">正在处理</p>
                   <p className="text-sm text-gray-400">授权成功，正在提交预订并发送通知…</p>
                </div>
              )}

              {orderStep === 4 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                   <div className="text-center py-10">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
                        <Check size={32} className="text-white" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 mb-1">预订成功</p>
                      <p className="text-sm text-gray-400">微信通知已发送，请注意查收</p>
                   </div>
                   
                   <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">微信模板消息预览</p>
                   <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-6">
                      <div className="bg-[#07C160] px-4 py-3 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                          <Leaf size={14} className="text-white" />
                        </div>
                        <span className="text-white text-xs font-bold">养生茶配方助手</span>
                        <span className="ml-auto text-white/60 text-[10px]">刚刚</span>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-bold text-gray-800 pb-3 mb-3 border-b border-gray-50">预订成功通知</p>
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs">
                             <span className="text-gray-400">配方名称</span>
                             <span className="font-semibold">{selectedRecipe.name}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-gray-400">饮用周期</span>
                             <span className="text-gray-700">{CYCLE_OPTIONS[orderCyc]}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-gray-400">预估金额</span>
                             <span className="text-orange-500 font-bold">¥{getPrice(selectedRecipe, orderCyc)}</span>
                           </div>
                           <div className="flex justify-between text-xs pb-3">
                             <span className="text-gray-400">订单编号</span>
                             <span className="text-gray-400 font-mono">TCH{Date.now().toString().slice(-9)}</span>
                           </div>
                           <div className="pt-3 border-t border-gray-50">
                             <p className="text-[10px] text-gray-400 leading-relaxed italic">
                               客服将在24小时内联系你确认配送地址及支付方式
                             </p>
                           </div>
                        </div>
                      </div>
                   </div>
                   <button 
                    onClick={() => { setCurScreen('main'); setOrderStep(1); }}
                    className="w-full bg-green-600 text-white rounded-xl py-4 font-bold shadow-md shadow-green-100 active:scale-95 transition-all"
                   >
                     返回主页
                   </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {curScreen === 'main' && (
        <div className="bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-30 pb-safe">
          <button 
            onClick={() => setCurTab('rec')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${curTab === 'rec' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <Sparkles size={20} />
            <span className="text-[10px] font-medium">推荐</span>
          </button>
          <button 
            onClick={() => setCurTab('his')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${curTab === 'his' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <Clock size={20} />
            <span className="text-[10px] font-medium">历史</span>
          </button>
          <button 
            onClick={() => setCurTab('pre')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${curTab === 'pre' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <Heart size={20} />
            <span className="text-[10px] font-medium">偏好</span>
          </button>
          <button 
            onClick={() => setCurTab('sho')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${curTab === 'sho' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <Search size={20} />
            <span className="text-[10px] font-medium">商城</span>
          </button>
        </div>
      )}
    </div>
  );
}
