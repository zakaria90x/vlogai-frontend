import { useState } from 'react';
import {
  Scissors, Music, Globe, Rocket, TrendingUp, FileText,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Cpu
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface ModuleDef {
  id: string;
  icon: React.ReactNode;
  name: string;
  category: string;
  description: string;
  models: string[];
  color: string;
  settings: { label: string; type: 'select' | 'range'; options?: string[]; min?: number; max?: number; default: string | number }[];
}

const MODULES: ModuleDef[] = [
  {
    id: 'smartcut',
    icon: <Scissors size={20} />,
    name: 'Smart Cut',
    category: 'Montage',
    description: 'Détecte et supprime automatiquement les silences, hésitations, faux départs et redondances dans votre vidéo.',
    models: ['Silero VAD', 'Pyannote Audio', 'FFmpeg AI'],
    color: '#a855f7',
    settings: [
      { label: 'Seuil silence (dB)', type: 'range', min: -60, max: -20, default: -40 },
      { label: 'Mode', type: 'select', options: ['Agressif', 'Équilibré', 'Doux'], default: 'Équilibré' },
    ],
  },
  {
    id: 'moodsync',
    icon: <Music size={20} />,
    name: 'MoodSync',
    category: 'Audio',
    description: 'Analyse l\'ambiance de vos scènes et synchronise automatiquement une musique adaptative aux beats.',
    models: ['Essentia AI', 'AudioLDM 2', 'Beat Tracker'],
    color: '#f59e0b',
    settings: [
      { label: 'Intensité', type: 'select', options: ['Subtile', 'Modérée', 'Forte'], default: 'Modérée' },
      { label: 'Genre', type: 'select', options: ['Auto', 'Lo-fi', 'Cinématique', 'Épique', 'Acoustique'], default: 'Auto' },
    ],
  },
  {
    id: 'globalsubs',
    icon: <Globe size={20} />,
    name: 'GlobalSubs',
    category: 'Sous-titres',
    description: 'Transcription et traduction automatique dans 30+ langues avec synchronisation précise et styles personnalisables.',
    models: ['Qwen3-ASR', 'WhisperX', 'Pyannote'],
    color: '#3b82f6',
    settings: [
      { label: 'Langue source', type: 'select', options: ['Auto', 'Français', 'Anglais', 'Espagnol', 'Japonais'], default: 'Auto' },
      { label: 'Langue cible', type: 'select', options: ['FR', 'EN', 'ES', 'JA', 'PT', 'DE', 'IT'], default: 'EN' },
      { label: 'Style', type: 'select', options: ['Classique', 'Karaoké', 'Cinéma', 'Minimal'], default: 'Classique' },
    ],
  },
  {
    id: 'launchpad',
    icon: <Rocket size={20} />,
    name: 'LaunchPad',
    category: 'SEO',
    description: 'Génère des titres, descriptions et miniatures optimisés pour maximiser le CTR et le référencement YouTube.',
    models: ['Llama 3.3 70B', 'DALL-E 3', 'CLIP ViT-L'],
    color: '#22c55e',
    settings: [
      { label: 'Plateforme', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'LinkedIn'], default: 'YouTube' },
      { label: 'Ton', type: 'select', options: ['Professionnel', 'Décontracté', 'Clickbait', 'Éducatif'], default: 'Décontracté' },
    ],
  },
  {
    id: 'shortfactory',
    icon: <TrendingUp size={20} />,
    name: 'ShortFactory',
    category: 'Viral',
    description: 'Détecte les moments les plus viraux de votre vidéo et génère des clips verticaux 9:16 prêts pour les réseaux.',
    models: ['Virality Score AI', 'CLIP ViT', 'Scene Detect'],
    color: '#ec4899',
    settings: [
      { label: 'Durée max', type: 'select', options: ['30s', '60s', '90s'], default: '60s' },
      { label: 'Format', type: 'select', options: ['9:16', '1:1', '4:5'], default: '9:16' },
      { label: 'Score min', type: 'range', min: 50, max: 95, default: 70 },
    ],
  },
  {
    id: 'transcription',
    icon: <FileText size={20} />,
    name: 'Transcription',
    category: 'Texte',
    description: 'Génère une transcription complète avec horodatage, identification des locuteurs et exportation en SRT/VTT/TXT.',
    models: ['WhisperX Large v3', 'Pyannote 3.0', 'NeMo ASR'],
    color: '#06b6d4',
    settings: [
      { label: 'Langue', type: 'select', options: ['Auto', 'FR', 'EN', 'ES', 'DE'], default: 'Auto' },
      { label: 'Format export', type: 'select', options: ['SRT', 'VTT', 'TXT', 'JSON'], default: 'SRT' },
    ],
  },
];

function ModuleCard({ mod }: { mod: ModuleDef }) {
  const [enabled, setEnabled] = useState(mod.id === 'smartcut' || mod.id === 'globalsubs');
  const [expanded, setExpanded] = useState(false);
  const { addToast } = useStore();
  const [settingValues, setSettingValues] = useState<Record<string, string | number>>(
    Object.fromEntries(mod.settings.map((s) => [s.label, s.default]))
  );

  return (
    <div
      className="card-s2 overflow-hidden transition-all duration-200"
      style={{ borderColor: expanded ? `${mod.color}40` : 'rgba(42,42,56,1)' }}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${mod.color}20`, color: mod.color }}
        >
          {mod.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm">{mod.name}</h3>
            <span
              className="badge text-[10px]"
              style={{ background: `${mod.color}20`, color: mod.color }}
            >
              {mod.category}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{mod.description}</p>
        </div>

        <button
          onClick={() => {
            setEnabled(!enabled);
            addToast(`${mod.name} ${!enabled ? 'activé' : 'désactivé'}`, 'info');
          }}
          className="shrink-0 mt-0.5"
        >
          {enabled
            ? <ToggleRight size={28} className="text-accent" />
            : <ToggleLeft size={28} className="text-muted" />
          }
        </button>
      </div>

      {/* Expandable footer */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-subtle text-xs text-muted hover:text-gray-300 hover:bg-s3 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Cpu size={12} />
          {mod.models.length} modèles IA
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-slide-up">
          {/* Models */}
          <div className="flex flex-wrap gap-1.5">
            {mod.models.map((m) => (
              <span key={m} className="badge bg-subtle text-gray-300 text-[10px] font-mono">
                {m}
              </span>
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-2.5">
            {mod.settings.map((setting) => (
              <div key={setting.label} className="flex items-center gap-3">
                <label className="text-xs text-muted w-28 shrink-0 font-mono">{setting.label}</label>
                {setting.type === 'select' ? (
                  <select
                    value={settingValues[setting.label]}
                    onChange={(e) => setSettingValues((v) => ({ ...v, [setting.label]: e.target.value }))}
                    className="flex-1 bg-subtle text-gray-300 text-xs rounded-lg px-2.5 py-1.5 border border-subtle focus:border-accent focus:outline-none transition-colors"
                  >
                    {setting.options!.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min={setting.min}
                      max={setting.max}
                      value={settingValues[setting.label] as number}
                      onChange={(e) => setSettingValues((v) => ({ ...v, [setting.label]: Number(e.target.value) }))}
                      className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${mod.color} ${((Number(settingValues[setting.label]) - (setting.min ?? 0)) / ((setting.max ?? 100) - (setting.min ?? 0))) * 100}%, #2a2a38 0%)`,
                      }}
                    />
                    <span className="text-xs text-muted font-mono w-8 text-right">{settingValues[setting.label]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Modules() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-subtle px-4 md:px-6 py-4">
        <h1 className="font-display text-xl font-bold text-white">Modules IA</h1>
        <p className="text-xs text-muted mt-0.5">Configurez et activez les modules d'intelligence artificielle</p>
      </header>

      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="space-y-3">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
      </div>
    </div>
  );
}
