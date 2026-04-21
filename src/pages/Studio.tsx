import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Upload, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Scissors, Film, Music, Files as Subtitles, Eye, Zap, Check, X,
  Loader2, Wand2, ChevronRight, Clapperboard, Mic,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// ── Build timeline tracks from video duration + active modules ────────────────
function buildTracks(duration: number, modules: ReturnType<typeof useStore>['activeModules']) {
  return {
    video: {
      segments: [
        { label: 'Intro', w: 10, color: '#a855f7' },
        { label: 'Scène 1', w: modules.smartCut ? 28 : 33, color: '#3b82f6' },
        ...(modules.smartCut ? [{ label: '[cut]', w: 5, color: '#ef444425' }] : []),
        { label: 'B-Roll', w: 20, color: '#06b6d4' },
        { label: 'Scène 2', w: modules.smartCut ? 22 : 27, color: '#3b82f6' },
        ...(modules.smartCut ? [{ label: '[cut]', w: 5, color: '#ef444425' }] : []),
        { label: 'Outro', w: 10, color: '#8b5cf6' },
      ],
      cutMarkers: modules.smartCut
        ? [Math.round((duration * 0.38 / duration) * 100), Math.round((duration * 0.67 / duration) * 100)]
        : [],
    },
    audio: {
      segments: modules.subtitles
        ? [
            { label: 'Parole détectée', w: 45, color: '#22c55e' },
            { label: 'Silence', w: 10, color: '#ffffff10' },
            { label: 'Parole détectée', w: 38, color: '#22c55e' },
            { label: '', w: 7, color: 'transparent' },
          ]
        : [{ label: 'Audio', w: 80, color: '#22c55e' }, { label: '', w: 20, color: 'transparent' }],
      cutMarkers: [],
    },
    music: {
      segments: modules.moodSync
        ? [
            { label: 'Lo-fi Beat', w: 52, color: '#f59e0b' },
            { label: 'Epic Rise', w: 48, color: '#ef4444' },
          ]
        : [{ label: 'MoodSync désactivé', w: 100, color: '#ffffff08' }],
      cutMarkers: [],
    },
    subs: {
      segments: modules.subtitles
        ? [
            { label: 'FR', w: 40, color: '#ec4899' },
            { label: '', w: 5, color: 'transparent' },
            { label: 'EN', w: 55, color: '#ec4899' },
          ]
        : [{ label: 'Sous-titres désactivés', w: 100, color: '#ffffff08' }],
      cutMarkers: [],
    },
  };
}

// ── Build subtitle cues proportional to real video duration ──────────────────
function buildSubCues(duration: number, transcription: string | null) {
  if (!duration) return [];
  if (transcription) {
    const words = transcription.split(/\s+/).filter(Boolean);
    const chunkSize = Math.max(6, Math.floor(words.length / 6));
    return Array.from({ length: 6 }, (_, i) => ({
      start: (duration / 6) * i,
      end: (duration / 6) * (i + 1),
      text: words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ') || '...',
    }));
  }
  const step = duration / 5;
  return [
    { start: 0, end: step, text: 'Début de la vidéo...' },
    { start: step, end: step * 2, text: 'Section centrale...' },
    { start: step * 2, end: step * 3, text: 'Transition...' },
    { start: step * 3, end: step * 4, text: 'Approche de la fin...' },
    { start: step * 4, end: duration + 1, text: 'Fin de la vidéo.' },
  ];
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="toggle-track shrink-0"
      style={{ background: enabled ? '#a855f7' : '#2a2a38' }}
      role="switch"
      aria-checked={enabled}
    >
      <span className="toggle-thumb" style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );
}

const TRACK_ICONS: Record<string, React.ReactNode> = {
  video: <Film size={12} />,
  audio: <Volume2 size={12} />,
  music: <Music size={12} />,
  subs: <Subtitles size={12} />,
};
const TRACK_LABELS: Record<string, string> = {
  video: 'Vidéo', audio: 'Audio', music: 'Musique', subs: 'Sous-titres',
};

const ICON_MAP: Record<string, React.ReactNode> = {
  scissors: <Scissors size={16} />,
  film: <Film size={16} />,
  music: <Music size={16} />,
  subtitles: <Subtitles size={16} />,
};

export default function Studio() {
  const {
    currentProject, activeModules, aiSuggestions, transcription,
    addRush, setProjectName, setProjectDuration, toggleModule,
    applySuggestion, dismissSuggestion,
    addToast, isAnalyzing, setIsAnalyzing, setAiSuggestions,
    setTranscription, isTranscribing, setIsTranscribing,
    isPlaying, setIsPlaying, resetProject,
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<File | null>(null);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [moodBeat, setMoodBeat] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const hasVideo = !!videoSrc;
  const duration = videoDuration;
  const playPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const tracks = useMemo(
    () => (hasVideo ? buildTracks(duration, activeModules) : null),
    [hasVideo, duration, activeModules],
  );
  const subCues = useMemo(() => buildSubCues(duration, transcription), [duration, transcription]);
  const currentSub = activeModules.subtitles && hasVideo
    ? subCues.find((s) => currentTime >= s.start && currentTime < s.end)
    : null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Video events ──────────────────────────────────────────────────────────
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setProjectDuration(videoRef.current.duration);
    }
  };
  const handleVideoEnd = () => setIsPlaying(false);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (v > 0) setMuted(false);
  };

  const toggleMute = () => setMuted((m) => { if (videoRef.current) videoRef.current.muted = !m; return !m; });

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play().catch(() => {}); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  }, [setIsPlaying]);

  const skipBack = () => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5); };
  const skipForward = () => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5); };
  const goToStart = () => { setCurrentTime(0); if (videoRef.current) videoRef.current.currentTime = 0; };

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying && el.paused) el.play().catch(() => {});
    if (!isPlaying && !el.paused) el.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (!activeModules.moodSync || !isPlaying) { setMoodBeat(false); return; }
    const id = setInterval(() => setMoodBeat((b) => !b), 600);
    return () => clearInterval(id);
  }, [activeModules.moodSync, isPlaying]);

  // ── File import → auto-transcribe ─────────────────────────────────────────
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setCurrentTime(0);
    setVideoDuration(0);
    setIsPlaying(false);
    setAnalyzed(false);
    setTranscribeError(null);
    videoFileRef.current = file;

    resetProject();
    const name = file.name.replace(/\.[^.]+$/, '');
    setProjectName(name);
    addRush(file.name);
    addToast(`Vidéo importée : ${file.name}`, 'success');
    e.target.value = '';

    // Persist to Supabase
    try {
      const { data } = await supabase.from('projects').insert({ name, rushes: [file.name] }).select().maybeSingle();
      if (data) setProjectId(data.id);
    } catch (_) {}

    // Auto-transcribe
    setIsTranscribing(true);
    addToast('Transcription IA en cours...', 'info');
    try {
      const result = await apiService.transcribe(file);
      const text = result.transcription ?? result.text ?? result.transcript ?? '';
      setTranscription(text);
      addToast('Transcription terminée', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de transcription';
      setTranscribeError(msg);
      addToast(`Transcription échouée : ${msg}`, 'error');
    } finally {
      setIsTranscribing(false);
    }
  }, [videoSrc, resetProject, setProjectName, addRush, addToast, setIsPlaying, setIsTranscribing, setTranscription]);

  // ── Analyze → get real suggestions ───────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!hasVideo) { addToast('Importez d\'abord une vidéo', 'error'); return; }

    setIsAnalyzing(true);
    try {
      const filename = videoFileRef.current?.name ?? currentProject.rushes[0] ?? 'video.mp4';
      const data = await apiService.getSuggestions(transcription ?? '', duration, filename);

      // Normalize API response — support array or { suggestions: [] }
      const raw: any[] = Array.isArray(data) ? data : (data.suggestions ?? []);
      const suggestions = raw.map((s: any, i: number) => ({
        id: s.id ?? `s${i}`,
        icon: s.icon ?? 'scissors',
        title: s.title ?? s.type ?? 'Suggestion',
        confidence: s.confidence ?? s.score ?? 80,
        description: s.description ?? s.message ?? '',
        status: 'pending' as const,
      }));

      if (suggestions.length === 0) {
        addToast('Aucune suggestion retournée par l\'API', 'info');
      } else {
        setAiSuggestions(suggestions);
        setAnalyzed(true);
        addToast(`Analyse terminée — ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} reçue${suggestions.length > 1 ? 's' : ''}`, 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur API';
      addToast(`Analyse échouée : ${msg}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [hasVideo, transcription, duration, currentProject.rushes, setIsAnalyzing, setAiSuggestions, addToast]);

  useEffect(() => {
    if (!projectId) return;
    supabase.from('projects').update({ module_settings: activeModules, updated_at: new Date().toISOString() }).eq('id', projectId).then(() => {});
  }, [activeModules, projectId]);

  const pendingSuggestions = aiSuggestions.filter((s) => s.status !== 'dismissed');
  const cutMarkerPcts = tracks?.video.cutMarkers ?? [];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-subtle px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold text-white truncate">{currentProject.name}</h1>
          <p className="text-xs text-muted font-mono">
            {isTranscribing
              ? 'Transcription en cours...'
              : transcription
                ? `Transcription prête · ${formatTime(duration)}`
                : hasVideo
                  ? `${currentProject.rushes.length} rush · ${formatTime(duration)}`
                  : 'Aucun rush — cliquez sur "Importer rush"'}
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-subtle hover:bg-s3 text-gray-300 hover:text-white text-sm font-medium transition-all duration-150 shrink-0"
        >
          <Upload size={15} />
          <span className="hidden sm:inline">Importer rush</span>
        </button>
        <input ref={fileRef} type="file" accept=".mp4,.mov,.mkv,.webm,.avi" className="hidden" onChange={handleFileImport} />
      </header>

      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

        {/* ── Transcription status bar ─────────────────────────────────────── */}
        {hasVideo && (isTranscribing || transcription || transcribeError) && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl text-sm"
            style={{
              background: transcribeError
                ? 'rgba(239,68,68,0.08)' : transcription
                  ? 'rgba(34,197,94,0.08)' : 'rgba(168,85,247,0.08)',
              border: `1px solid ${transcribeError ? 'rgba(239,68,68,0.25)' : transcription ? 'rgba(34,197,94,0.25)' : 'rgba(168,85,247,0.25)'}`,
            }}
          >
            {isTranscribing ? (
              <><Loader2 size={16} className="animate-spin text-accent shrink-0" /><span className="text-gray-300">Transcription audio en cours — Whisper AI...</span></>
            ) : transcribeError ? (
              <><X size={16} className="text-red-400 shrink-0" /><span className="text-red-300">{transcribeError}</span></>
            ) : (
              <>
                <Mic size={16} className="text-green-400 shrink-0" />
                <span className="text-green-300 line-clamp-1">
                  Transcription prête — {transcription?.split(' ').length ?? 0} mots détectés
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Video Player ─────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="relative bg-black aspect-video flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoSrc ?? undefined}
              className={`w-full h-full object-contain ${hasVideo ? 'block' : 'hidden'}`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnd}
              onClick={togglePlay}
              style={{ cursor: 'pointer' }}
            />

            {!hasVideo && (
              <>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #12102a 50%, #0d0d1a 100%)' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border-2 border-dashed"
                    style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.4)' }}
                  >
                    <Upload size={28} className="text-accent" />
                  </div>
                  <p className="text-muted text-sm text-center px-4">
                    Importer une vidéo pour commencer<br />
                    <span className="text-xs opacity-60">MP4 · MOV · MKV · WebM</span>
                  </p>
                </div>
              </>
            )}

            {/* Subtitle overlay */}
            {currentSub && (
              <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                <div className="px-4 py-1.5 rounded-lg text-white text-sm font-medium text-center max-w-lg"
                  style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                  {currentSub.text}
                </div>
              </div>
            )}

            {activeModules.eyeContact && hasVideo && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono text-green-300"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Eye size={10} className="text-green-400" />Eye Contact ON
              </div>
            )}

            {activeModules.moodSync && hasVideo && (
              <div className="absolute top-2 right-10 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono text-yellow-300 transition-all duration-200"
                style={{
                  background: moodBeat ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${moodBeat ? 'rgba(245,158,11,0.6)' : 'rgba(245,158,11,0.2)'}`,
                  boxShadow: moodBeat ? '0 0 8px rgba(245,158,11,0.4)' : 'none',
                }}>
                <Music size={10} className="text-yellow-400" />MoodSync
              </div>
            )}

            {hasVideo && (
              <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 font-mono text-xs text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}

            {hasVideo && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                  <Play size={24} className="text-white ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="px-4 pt-3 pb-4 bg-surface space-y-3">
            <div className="relative">
              <input
                type="range" min={0} max={duration || 1} step={0.1} value={currentTime}
                onChange={handleSeek} disabled={!hasVideo}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(to right, #a855f7 ${playPct}%, #2a2a38 0%)` }}
              />
              {cutMarkerPcts.map((pct) => (
                <div key={pct} className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-red-400 pointer-events-none"
                  style={{ left: `${pct}%` }} />
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={goToStart} disabled={!hasVideo} className="text-muted hover:text-white transition-colors disabled:opacity-40"><SkipBack size={18} /></button>
              <button onClick={skipBack} disabled={!hasVideo} className="text-muted hover:text-white transition-colors disabled:opacity-40 text-xs font-mono">-5s</button>
              <button onClick={togglePlay} disabled={!hasVideo}
                className="w-9 h-9 rounded-full bg-accent hover:bg-accent-h flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
              </button>
              <button onClick={skipForward} disabled={!hasVideo} className="text-muted hover:text-white transition-colors disabled:opacity-40 text-xs font-mono">+5s</button>
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = duration; }} disabled={!hasVideo} className="text-muted hover:text-white transition-colors disabled:opacity-40"><SkipForward size={18} /></button>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={toggleMute} className="text-muted hover:text-white transition-colors">
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #a855f7 ${(muted ? 0 : volume) * 100}%, #2a2a38 0%)` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Timeline ─────────────────────────────────────────────────────── */}
        <div className="card p-4 space-y-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clapperboard size={14} className="text-accent" />Timeline
            </h2>
            {analyzed && (
              <span className="badge bg-accent-d text-accent font-mono text-[10px]">
                {cutMarkerPcts.length + aiSuggestions.filter(s => s.status === 'applied').length} coupes IA
              </span>
            )}
          </div>

          {!hasVideo ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-subtle flex items-center justify-center">
                <Film size={20} className="text-muted" />
              </div>
              <p className="text-sm text-muted">La timeline apparaîtra après l'import d'une vidéo</p>
            </div>
          ) : (
            <>
              <div className="flex text-[10px] text-muted font-mono pl-20 select-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex-1 border-l border-subtle pl-0.5">
                    {formatTime((duration / 8) * i)}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {Object.entries(tracks!).map(([key, trackData]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-muted font-mono" style={{ width: 72 }}>
                      {TRACK_ICONS[key]}<span className="truncate">{TRACK_LABELS[key]}</span>
                    </div>
                    <div className="flex-1 h-8 rounded overflow-hidden flex relative" style={{ background: '#0a0a0f' }}>
                      {trackData.segments.map((seg, i) => (
                        <div key={i}
                          className="h-full flex items-center justify-center text-[10px] font-medium text-white/80 rounded-sm transition-all duration-500"
                          style={{
                            width: `${seg.w}%`,
                            background: seg.color !== 'transparent' ? seg.color + '35' : 'transparent',
                            borderLeft: seg.color !== 'transparent' && seg.color !== '#ffffff08' && seg.color !== '#ffffff10' && seg.color !== '#ef444425'
                              ? `2px solid ${seg.color}80` : 'none',
                            margin: '1px 0',
                          }}>
                          {seg.label && <span className="truncate px-1">{seg.label}</span>}
                        </div>
                      ))}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none"
                        style={{ left: `${playPct}%` }} />
                      {trackData.cutMarkers.map((pct) => (
                        <div key={pct} className="absolute top-0 bottom-0 w-0.5 bg-red-400/70 pointer-events-none"
                          style={{ left: `${pct}%` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Analyze button ───────────────────────────────────────────────── */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !hasVideo || isTranscribing}
          className="w-full py-4 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] glow-accent"
          style={{ background: isAnalyzing ? '#6b21a8' : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' }}
        >
          {isAnalyzing
            ? <><Loader2 size={20} className="animate-spin" />Analyse IA en cours...</>
            : isTranscribing
              ? <><Loader2 size={20} className="animate-spin" />Transcription en cours...</>
              : <><Wand2 size={20} />{hasVideo ? 'Analyser avec l\'IA' : 'Importez une vidéo pour analyser'}</>}
        </button>

        {/* ── Outils IA ────────────────────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Zap size={16} className="text-accent" />Outils IA
          </h2>
          {!hasVideo ? (
            <p className="text-sm text-muted text-center py-4">Les modules seront disponibles après l'import d'une vidéo</p>
          ) : (
            <div className="space-y-2">
              {([
                {
                  key: 'smartCut' as const,
                  icon: <Scissors size={16} className="text-accent" />,
                  title: 'Smart Cut',
                  sub: activeModules.smartCut ? `${cutMarkerPcts.length} coupes silences marquées` : 'Détecte et marque les silences',
                  badge: activeModules.smartCut ? `${cutMarkerPcts.length} coupes` : undefined,
                  badgeColor: '#ef4444',
                },
                {
                  key: 'subtitles' as const,
                  icon: <Subtitles size={16} className="text-blue-400" />,
                  title: 'Sous-titres',
                  sub: activeModules.subtitles
                    ? (transcription ? 'Overlay depuis transcription réelle' : 'Overlay actif — lecture en cours')
                    : 'Transcription auto, overlay sur la vidéo',
                  badge: activeModules.subtitles ? 'Actif' : undefined,
                  badgeColor: '#3b82f6',
                },
                {
                  key: 'moodSync' as const,
                  icon: <Music size={16} className="text-yellow-400" />,
                  title: 'MoodSync',
                  sub: activeModules.moodSync ? 'Piste musicale visible dans la timeline' : 'Musique adaptative',
                  badge: activeModules.moodSync ? (isPlaying ? 'Sync ●' : 'Activé') : undefined,
                  badgeColor: '#f59e0b',
                },
                {
                  key: 'eyeContact' as const,
                  icon: <Eye size={16} className="text-green-400" />,
                  title: 'Eye Contact',
                  sub: activeModules.eyeContact ? 'Badge affiché sur la vidéo' : 'Correction regard caméra',
                  badge: activeModules.eyeContact ? 'ON' : undefined,
                  badgeColor: '#22c55e',
                },
              ] as const).map(({ key, icon, title, sub, badge, badgeColor }) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-s2 hover:bg-s3 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{title}</p>
                      {badge && (
                        <span className="badge text-[10px] font-mono" style={{ background: `${badgeColor}20`, color: badgeColor }}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{sub}</p>
                  </div>
                  <Toggle enabled={activeModules[key]} onToggle={() => toggleModule(key)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Suggestions IA ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <ChevronRight size={16} className="text-accent" />Suggestions IA
            {pendingSuggestions.length > 0 && (
              <span className="badge bg-accent-d text-accent ml-1">
                {pendingSuggestions.filter((s) => s.status === 'pending').length}
              </span>
            )}
          </h2>

          {!hasVideo || !analyzed ? (
            <div className="card p-6 flex flex-col items-center gap-3 text-center">
              <Wand2 size={24} className="text-muted" />
              <p className="text-sm text-muted">
                {!hasVideo
                  ? 'Importez une vidéo puis lancez l\'analyse IA'
                  : isTranscribing
                    ? 'Attendez la fin de la transcription puis cliquez Analyser'
                    : 'Cliquez sur "Analyser avec l\'IA" pour générer des suggestions'}
              </p>
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Toutes les suggestions ont été traitées.</p>
          ) : (
            <div className="space-y-2">
              {pendingSuggestions.map((sg) => (
                <div key={sg.id} className="card p-4 flex items-start gap-3 transition-all duration-300"
                  style={{
                    borderColor: sg.status === 'applied' ? 'rgba(34,197,94,0.4)' : 'rgba(42,42,56,1)',
                    background: sg.status === 'applied' ? 'rgba(34,197,94,0.05)' : '#111118',
                  }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: sg.status === 'applied' ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.12)' }}>
                    <span className={sg.status === 'applied' ? 'text-success' : 'text-accent'}>
                      {ICON_MAP[sg.icon] ?? <Zap size={16} />}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{sg.title}</p>
                      <span className="badge font-mono"
                        style={{
                          background: sg.confidence >= 90 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: sg.confidence >= 90 ? '#22c55e' : '#f59e0b',
                        }}>
                        {sg.confidence}%
                      </span>
                      {sg.status === 'applied' && <span className="badge bg-success/15 text-success">Appliqué</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{sg.description}</p>
                  </div>
                  {sg.status === 'pending' && (
                    <div className="flex gap-1.5 shrink-0 mt-0.5">
                      <button onClick={() => { applySuggestion(sg.id); addToast(`Appliqué : ${sg.title}`, 'success'); }}
                        className="w-8 h-8 rounded-lg bg-success/15 hover:bg-success/25 text-success flex items-center justify-center transition-colors">
                        <Check size={15} />
                      </button>
                      <button onClick={() => dismissSuggestion(sg.id)}
                        className="w-8 h-8 rounded-lg bg-subtle hover:bg-s3 text-muted hover:text-white flex items-center justify-center transition-colors">
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
