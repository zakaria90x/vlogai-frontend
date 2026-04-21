import { useState, useCallback, useEffect } from 'react';
import { Rocket, Copy, RefreshCw, CheckCircle, Loader2, Tag, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api.js';

interface Thumbnail {
  id: number;
  style: string;
  ctr: number;
  gradient: string;
  emoji: string;
}

const THUMBNAILS: Thumbnail[] = [
  { id: 0, style: 'Style cinématique', ctr: 13.2, gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', emoji: '🎬' },
  { id: 1, style: 'Face close-up', ctr: 12.8, gradient: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)', emoji: '😮' },
  { id: 2, style: 'Paysage grand angle', ctr: 11.5, gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', emoji: '🗻' },
  { id: 3, style: 'Avant/Après', ctr: 9.3, gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)', emoji: '🔄' },
  { id: 4, style: 'Minimaliste', ctr: 8.7, gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)', emoji: '✨' },
];

const TAG_COLORS = [
  'rgba(168,85,247,0.15)/#a855f7',
  'rgba(59,130,246,0.15)/#3b82f6',
  'rgba(236,72,153,0.15)/#ec4899',
  'rgba(34,197,94,0.15)/#22c55e',
  'rgba(245,158,11,0.15)/#f59e0b',
  'rgba(6,182,212,0.15)/#06b6d4',
];

function CTRBar({ score }: { score: number }) {
  const color = score >= 12 ? '#22c55e' : score >= 10 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(score / 15) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

const DEFAULT_SEO = {
  title: '',
  description: '',
  tags: [] as string[],
  seoScore: 0,
};

export default function LaunchPad() {
  const { currentProject, transcription, seoData, setSeoData, selectedThumbnail, setSelectedThumbnail, addToast } = useStore();
  const [loading, setLoading] = useState(false);
  const [localSeo, setLocalSeo] = useState(seoData ?? DEFAULT_SEO);
  const [copied, setCopied] = useState<string | null>(null);

  // Sync from store when navigating back
  useEffect(() => {
    if (seoData) setLocalSeo(seoData);
  }, [seoData]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.generateSEO(
        currentProject.name,
        transcription ?? '',
        currentProject.duration,
      );

      // Normalize API response fields
      const normalized = {
        title: result.title ?? result.seo_title ?? currentProject.name,
        description: result.description ?? result.seo_description ?? result.body ?? '',
        tags: Array.isArray(result.tags) ? result.tags : (result.keywords ?? []),
        seoScore: result.seoScore ?? result.seo_score ?? result.score ?? 85,
      };

      setLocalSeo(normalized);
      setSeoData(normalized);
      addToast('SEO généré — optimisé pour YouTube', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur API';
      addToast(`Échec SEO : ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentProject.name, currentProject.duration, transcription, setSeoData, addToast]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    addToast('Copié dans le presse-papier', 'success');
    setTimeout(() => setCopied(null), 2000);
  };

  const removeTag = (tag: string) => {
    const updated = { ...localSeo, tags: localSeo.tags.filter((t) => t !== tag) };
    setLocalSeo(updated);
    setSeoData(updated);
  };

  const hasSeo = localSeo.title.length > 0;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-subtle px-4 md:px-6 py-4">
        <h1 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <Rocket size={18} className="text-green-400" />LaunchPad
        </h1>
        <p className="text-xs text-muted mt-0.5">
          {transcription ? 'Transcription disponible · Prêt pour génération' : 'SEO · Miniatures · Score CTR estimé'}
        </p>
      </header>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-70 active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" />Génération SEO en cours...</>
          ) : (
            <><Rocket size={18} />{hasSeo ? 'Regénérer SEO' : 'Générer miniatures & SEO'}</>
          )}
        </button>

        {!transcription && !hasSeo && (
          <div className="text-center py-2">
            <p className="text-xs text-muted">Importez une vidéo dans Studio pour un SEO basé sur la transcription réelle</p>
          </div>
        )}

        {/* Thumbnails */}
        <section>
          <h2 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <Star size={15} className="text-accent" />5 miniatures générées
          </h2>

          <div className="rounded-xl overflow-hidden mb-3 relative cursor-pointer"
            style={{ aspectRatio: '16/9', border: '2px solid #a855f7' }}
            onClick={() => setSelectedThumbnail((selectedThumbnail + 1) % THUMBNAILS.length)}>
            <div className="absolute inset-0" style={{ background: THUMBNAILS[selectedThumbnail].gradient }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <span className="text-5xl mb-3">{THUMBNAILS[selectedThumbnail].emoji}</span>
              <p className="text-white text-xl font-bold font-display leading-tight drop-shadow-lg">
                {hasSeo ? localSeo.title : currentProject.name}
              </p>
              <p className="text-white/70 text-sm mt-1">{THUMBNAILS[selectedThumbnail].style}</p>
            </div>
            <div className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">Sélectionnée</div>
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-mono px-2 py-0.5 rounded-full">
              CTR {THUMBNAILS[selectedThumbnail].ctr}%
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THUMBNAILS.filter((_, i) => i !== selectedThumbnail).slice(0, 4).map((thumb) => (
              <div key={thumb.id} onClick={() => setSelectedThumbnail(thumb.id)}
                className="relative rounded-lg overflow-hidden cursor-pointer hover:scale-[1.03] transition-all duration-200 active:scale-[0.97]"
                style={{ aspectRatio: '16/9', border: '1px solid rgba(42,42,56,0.8)' }}>
                <div className="absolute inset-0" style={{ background: thumb.gradient }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">{thumb.emoji}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                  <p className="text-white text-[9px] truncate font-medium">{thumb.style}</p>
                  <CTRBar score={thumb.ctr} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEO Section */}
        <section className="card p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Tag size={15} className="text-accent" />SEO YouTube Optimisé
          </h2>

          {!hasSeo && !loading ? (
            <div className="py-8 text-center text-muted text-sm">
              Cliquez sur "Générer miniatures & SEO" pour obtenir un titre, une description et des tags optimisés
            </div>
          ) : loading ? (
            <div className="py-8 flex flex-col items-center gap-3 text-muted">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span className="text-sm">Génération SEO en cours...</span>
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted font-mono">TITRE</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-success/15">
                      {localSeo.seoScore}/100
                    </span>
                    <div className="h-3 w-16 rounded-full bg-subtle overflow-hidden">
                      <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${localSeo.seoScore}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={localSeo.title}
                    onChange={(e) => setLocalSeo((p) => ({ ...p, title: e.target.value }))}
                    className="flex-1 bg-s2 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-subtle focus:border-accent focus:outline-none transition-colors" />
                  <button onClick={() => copyToClipboard(localSeo.title, 'title')}
                    className="w-10 h-10 rounded-lg bg-subtle hover:bg-s3 flex items-center justify-center text-muted hover:text-white transition-colors shrink-0">
                    {copied === 'title' ? <CheckCircle size={15} className="text-success" /> : <Copy size={15} />}
                  </button>
                  <button onClick={handleGenerate} disabled={loading}
                    className="w-10 h-10 rounded-lg bg-accent-d hover:bg-accent/20 flex items-center justify-center text-accent transition-colors shrink-0 disabled:opacity-60">
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <p className="text-[10px] text-muted font-mono">{localSeo.title.length}/70 caractères</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted font-mono">DESCRIPTION</label>
                  <button onClick={() => copyToClipboard(localSeo.description, 'desc')}
                    className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors">
                    {copied === 'desc' ? <CheckCircle size={12} className="text-success" /> : <Copy size={12} />}
                    Copier
                  </button>
                </div>
                <textarea value={localSeo.description}
                  onChange={(e) => setLocalSeo((p) => ({ ...p, description: e.target.value }))}
                  rows={7}
                  className="w-full bg-s2 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-subtle focus:border-accent focus:outline-none transition-colors resize-none leading-relaxed" />
              </div>

              {/* Tags */}
              {localSeo.tags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-muted font-mono">TAGS ({localSeo.tags.length})</label>
                  <div className="flex flex-wrap gap-1.5">
                    {localSeo.tags.map((tag, i) => {
                      const [bg, color] = TAG_COLORS[i % TAG_COLORS.length].split('/');
                      return (
                        <button key={tag} onClick={() => removeTag(tag)}
                          className="badge text-xs font-medium transition-all duration-150 hover:opacity-70 active:scale-95"
                          style={{ background: bg, color }}
                          title="Cliquer pour supprimer">
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted">Cliquez sur un tag pour le supprimer</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
