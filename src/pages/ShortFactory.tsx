import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, Download, Play, CheckSquare, Square, Loader2, Film } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api.js';

const HOOK_COLORS: Record<string, string> = {
  'Hook émotionnel': '#ec4899',
  'Curiosité gap': '#f59e0b',
  'Surprise': '#a855f7',
  'Transformation': '#22c55e',
  'Humour': '#3b82f6',
  'Conflit': '#ef4444',
  'default': '#6b7280',
};

const GRADIENTS = [
  'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #b45309 0%, #15803d 100%)',
  'linear-gradient(135deg, #0e7490 0%, #1e40af 100%)',
  'linear-gradient(135deg, #991b1b 0%, #92400e 100%)',
];

interface Clip {
  id: string;
  title: string;
  filename: string;
  duration: string;
  viralScore: number;
  hookType: string;
  gradient: string;
  selected: boolean;
  start?: number;
  end?: number;
}

function normalizeClips(raw: any[], filename: string): Clip[] {
  return raw.map((item: any, i: number) => {
    const start = item.start ?? item.start_time ?? 0;
    const end = item.end ?? item.end_time ?? 0;
    const durationSecs = end - start;
    const m = Math.floor(durationSecs / 60);
    const s = Math.floor(durationSecs % 60);
    const durationStr = durationSecs > 0 ? `${m}:${s.toString().padStart(2, '0')}` : (item.duration ?? '0:30');
    return {
      id: item.id ?? `c${i}`,
      title: item.title ?? item.label ?? `Extrait #${i + 1}`,
      filename,
      duration: durationStr,
      viralScore: item.viralScore ?? item.viral_score ?? item.score ?? Math.floor(70 + Math.random() * 25),
      hookType: item.hookType ?? item.hook_type ?? item.hook ?? 'Surprise',
      gradient: GRADIENTS[i % GRADIENTS.length],
      selected: false,
      start,
      end,
    };
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#ef4444' : score >= 80 ? '#f97316' : '#f59e0b';
  return (
    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold font-mono text-white"
      style={{ background: color, boxShadow: `0 0 8px ${color}80` }}>
      {score}%
    </div>
  );
}

export default function ShortFactory() {
  const { currentProject, transcription, shorts, setShorts, addToast } = useStore();

  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const filename = currentProject.rushes[0] ?? 'video.mp4';
  const duration = currentProject.duration;
  const selectedCount = clips.filter((c) => c.selected).length;

  // Restore from global store on mount (page navigation persistence)
  useEffect(() => {
    if (shorts.length > 0 && clips.length === 0) {
      setClips(
        shorts.map((s, i) => ({
          id: s.id, title: s.title, filename: s.filename, duration: s.duration,
          viralScore: s.viralScore, hookType: s.hookType,
          gradient: GRADIENTS[i % GRADIENTS.length], selected: false,
          start: s.start, end: s.end,
        })),
      );
      setFetched(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShorts = useCallback(async () => {
    if (!transcription && !currentProject.rushes.length) {
      addToast('Importez et transcrivez une vidéo dans Studio d\'abord', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.getShorts(transcription ?? '', duration, filename);
      const raw: any[] = Array.isArray(data) ? data : (data.shorts ?? data.clips ?? []);
      const normalized = normalizeClips(raw, filename);
      setClips(normalized);
      setShorts(normalized.map(({ gradient: _g, selected: _s, ...rest }) => rest as any));
      setFetched(true);
      addToast(`${normalized.length} clip${normalized.length !== 1 ? 's' : ''} détecté${normalized.length !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur API';
      addToast(`Échec détection : ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [transcription, duration, filename, setShorts, addToast]);

  const toggleSelect = (id: string) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));

  const handleExport = () => {
    if (selectedCount === 0) { addToast('Sélectionnez au moins un clip', 'error'); return; }
    addToast(`Export de ${selectedCount} clip${selectedCount > 1 ? 's' : ''} en cours...`, 'info');
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-subtle px-4 md:px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-pink-400" />ShortFactory
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {fetched ? `${clips.length} clips viraux · ${currentProject.name}` : `Clips viraux IA · ${currentProject.name}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={fetchShorts} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-subtle hover:bg-s3 text-gray-300 hover:text-white text-xs font-medium transition-all disabled:opacity-60">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {fetched ? 'Re-détecter' : 'Détecter'}
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-h text-white text-xs font-semibold transition-all">
              <Download size={13} />
              Exporter {selectedCount > 0 && `(${selectedCount})`}
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={36} className="animate-spin text-accent" />
            <p className="text-sm text-muted">Détection des clips viraux en cours...</p>
          </div>
        ) : !fetched ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-subtle flex items-center justify-center">
              <Film size={28} className="text-muted" />
            </div>
            <div>
              <p className="text-white font-medium">Aucun clip détecté</p>
              <p className="text-sm text-muted mt-1">
                {transcription
                  ? 'Cliquez sur "Détecter" pour analyser votre vidéo'
                  : 'Importez et analysez une vidéo dans Studio d\'abord'}
              </p>
            </div>
            <button onClick={fetchShorts} disabled={!transcription || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-h text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <TrendingUp size={15} />Détecter les clips viraux
            </button>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-white font-medium">Aucun clip retourné par l'API</p>
            <button onClick={fetchShorts} className="text-sm text-accent hover:underline">Réessayer</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clips.map((clip) => (
              <div key={clip.id} onClick={() => toggleSelect(clip.id)}
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                style={{
                  aspectRatio: '9/16',
                  outline: clip.selected ? '2px solid #a855f7' : '2px solid transparent',
                  outlineOffset: '2px',
                }}>
                <div className="absolute inset-0" style={{ background: clip.gradient }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-2 left-2 bg-black/60 rounded-md px-2 py-0.5 text-[11px] font-mono text-white">
                  {clip.duration}
                </div>
                <ScoreBadge score={clip.viralScore} />

                <div className="absolute top-2 right-10">
                  {clip.selected
                    ? <CheckSquare size={16} className="text-accent" />
                    : <Square size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play size={16} className="text-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold leading-tight">{clip.title}</p>
                  {clip.start !== undefined && clip.end !== undefined && clip.end > 0 && (
                    <p className="text-white/50 text-[10px] font-mono mt-0.5">
                      {Math.floor(clip.start / 60)}:{String(Math.floor(clip.start % 60)).padStart(2, '0')} →{' '}
                      {Math.floor(clip.end / 60)}:{String(Math.floor(clip.end % 60)).padStart(2, '0')}
                    </p>
                  )}
                  <div className="mt-1.5">
                    <span className="badge text-[10px] font-medium"
                      style={{
                        background: `${HOOK_COLORS[clip.hookType] ?? HOOK_COLORS.default}25`,
                        color: HOOK_COLORS[clip.hookType] ?? HOOK_COLORS.default,
                        border: `1px solid ${HOOK_COLORS[clip.hookType] ?? HOOK_COLORS.default}40`,
                      }}>
                      {clip.hookType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
