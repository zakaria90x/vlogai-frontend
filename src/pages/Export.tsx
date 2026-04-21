import {
  Youtube, Instagram, Monitor, Smartphone, Linkedin,
  FileArchive, Download, CheckCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  format: string;
  color: string;
  bg: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: <Youtube size={22} />,
    format: 'MP4 1080p 16:9 + SEO auto',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    icon: <Youtube size={22} />,
    format: 'MP4 1080x1920 9:16',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    icon: <Instagram size={22} />,
    format: '9:16 captions auto',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <Smartphone size={22} />,
    format: '9:16 sous-titres brûlés',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin size={22} />,
    format: '1:1 ou 4:5 pro',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    id: 'raw',
    name: 'Fichiers bruts',
    icon: <FileArchive size={22} />,
    format: 'SRT, JSON, MP3, PNG',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
];

function PlatformCard({ platform }: { platform: Platform }) {
  const { addToast } = useStore();

  const handleExport = () => {
    addToast(`Export ${platform.name} en cours...`, 'info');
  };

  return (
    <div
      className="card p-5 flex flex-col gap-4 hover:border-subtle transition-all duration-200 group"
      style={{ borderColor: 'rgba(42,42,56,1)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${platform.color}40`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(42,42,56,1)')}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110"
          style={{ background: platform.bg, color: platform.color }}
        >
          {platform.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">{platform.name}</h3>
          <p className="text-xs text-muted mt-0.5 font-mono">{platform.format}</p>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95"
        style={{
          background: platform.bg,
          color: platform.color,
          border: `1px solid ${platform.color}30`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = `${platform.color}25`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = platform.bg;
        }}
      >
        <Download size={15} />
        Exporter
      </button>
    </div>
  );
}

export default function Export() {
  const { currentProject } = useStore();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-subtle px-4 md:px-6 py-4">
        <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Monitor size={18} className="text-accent" />
          Export
        </h1>
        <p className="text-xs text-muted mt-0.5">{currentProject.name} · Prêt pour l'export</p>
      </header>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Status */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <CheckCircle size={18} className="text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Projet prêt à l'export</p>
            <p className="text-xs text-muted">Tous les modules ont été appliqués · 14min 05s finales</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORMS.map((p) => (
            <PlatformCard key={p.id} platform={p} />
          ))}
        </div>

        {/* Batch export */}
        <div className="card p-5">
          <h2 className="font-semibold text-white text-sm mb-3">Export groupé</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                className="badge text-xs cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <Download size={16} />
            Tout exporter
          </button>
        </div>
      </div>
    </div>
  );
}
