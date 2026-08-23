import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  Crown,
  Music,
  Tv,
  Check,
} from 'lucide-react';
import { sound } from '../utils/audio';
import realMegaBasePoster from '../assets/images/mc_mega_base_1786521629515.jpg';

interface MegaBaseVideoPlayerProps {
  autoPlay?: boolean;
  isCompact?: boolean;
  onExpand?: () => void;
  showDetails?: boolean;
}

export const MegaBaseVideoPlayer: React.FC<MegaBaseVideoPlayerProps> = ({
  autoPlay = false,
  isCompact = false,
  onExpand,
  showDetails = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(34);
  const [activeChapter, setActiveChapter] = useState<string>('🚪 Entrance & Secret Door');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Real Gameplay Chapter milestones
  const chapters = [
    { time: 0, label: 'Entrance & Door', emoji: '🚪' },
    { time: 3.5, label: 'Piston Stairs', emoji: '🪜' },
    { time: 7.5, label: 'Bedroom & Books', emoji: '🛏️' },
    { time: 13.5, label: 'TV Lounge', emoji: '📺' },
    { time: 20, label: 'Throne Banquet', emoji: '👑' },
    { time: 32, label: 'Kitchen & Bar', emoji: '☕' },
    { time: 46, label: 'Redstone Machinery', emoji: '⚙️' },
  ];

  // Video source
  const videoSrc = '/videos/mc_mega_base_tour.mp4';
  const audioSrc = '/audio/abdul_deals_calm_song.mp3';

  // Safe play handling to prevent AbortError when play is interrupted by pause
  const safePlay = async () => {
    if (!videoRef.current) return;
    try {
      if (isMuted) {
        videoRef.current.muted = true;
      }
      const promise = videoRef.current.play();
      playPromiseRef.current = promise;
      await promise;
      if (isMountedRef.current) {
        setIsPlaying(true);
        if (audioRef.current && !isMuted) {
          audioRef.current.volume = volume;
          audioRef.current.play().catch(() => {});
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      // AbortError is normal when play is canceled by pause/seek/unmount
      if (err?.name === 'AbortError') {
        return;
      }
      // Autoplay or audio restriction: retry muted gracefully
      if (err?.name === 'NotAllowedError' && videoRef.current) {
        try {
          videoRef.current.muted = true;
          setIsMuted(true);
          const mutedPromise = videoRef.current.play();
          playPromiseRef.current = mutedPromise;
          await mutedPromise;
          if (isMountedRef.current) {
            setIsPlaying(true);
          }
        } catch {
          // Ignore secondary abort
        }
      }
    }
  };

  // Safe pause handling
  const safePause = async () => {
    if (!videoRef.current) return;
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    } catch {
      // Ignore pause errors
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    sound.playClick();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      safePlay();
    } else {
      safePause();
    }
  };

  // Toggle Mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPop();
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
      if (!newMuted && isPlaying) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  // Handle Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  // Time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 34;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);

    // Update active chapter based on real video time
    if (cur >= 46) {
      setActiveChapter('⚙️ Redstone Machine Vault');
    } else if (cur >= 32) {
      setActiveChapter('☕ Kitchen & Bar Booths');
    } else if (cur >= 20) {
      setActiveChapter('👑 Royal Throne Banquet Hall');
    } else if (cur >= 13.5) {
      setActiveChapter('📺 Lounge & Big TV');
    } else if (cur >= 7.5) {
      setActiveChapter('🛏️ Cozy Bedroom & Books');
    } else if (cur >= 3.5) {
      setActiveChapter('🪜 Redstone Piston Stairs');
    } else {
      setActiveChapter('🚪 Entrance & Secret Door');
    }

    // Keep audio in sync if using external audio track
    if (audioRef.current && Math.abs(audioRef.current.currentTime - cur) > 0.5) {
      audioRef.current.currentTime = cur;
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (videoRef.current) {
      const dur = videoRef.current.duration || 34;
      const targetTime = (val / 100) * dur;
      videoRef.current.currentTime = targetTime;
      if (audioRef.current) {
        audioRef.current.currentTime = targetTime;
      }
    }
  };

  // Jump to specific chapter
  const jumpToChapter = async (timeSec: number) => {
    sound.playPop();
    if (videoRef.current) {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      if (videoRef.current) {
        videoRef.current.currentTime = timeSec;
      }
      if (audioRef.current) {
        audioRef.current.currentTime = timeSec;
      }
      if (videoRef.current && videoRef.current.paused) {
        safePlay();
      }
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPop();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Auto-play attempt on mount and lifecycle cleanup
  useEffect(() => {
    isMountedRef.current = true;
    if (autoPlay) {
      safePlay();
    }
    return () => {
      isMountedRef.current = false;
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [autoPlay]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-black border-2 border-yellow-400/70 shadow-2xl group/player select-none ${
        isCompact ? 'aspect-video max-h-56' : 'aspect-video min-h-[220px]'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        poster={realMegaBasePoster}
        loop
        playsInline
        preload="auto"
        muted={isMuted}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="w-full h-full object-cover object-center cursor-pointer"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Synchronized Calm Music Audio Element (Backup & Volume Controller) */}
      <audio ref={audioRef} src={audioSrc} loop preload="auto" />

      {/* TOP HEADER OVERLAY: SAYING "ABDUL DEALS" AS REQUESTED */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-3 sm:p-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Top Gold Badge: "ABDUL DEALS" */}
          <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 px-3 py-1 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-yellow-500/30 vip-gold-bevel border border-yellow-200">
            <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span className="font-black uppercase tracking-wider font-mono text-2xs sm:text-xs">
              Abdul Deals
            </span>
          </div>

          <span className="bg-black/80 backdrop-blur-md text-yellow-300 px-2.5 py-0.5 rounded-full text-3xs font-black font-mono border border-yellow-400/40 hidden sm:inline-flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
            <span>Mega Pro Base Tour (20 AED)</span>
          </span>
        </div>

        {/* Calm Song Badge Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-black/85 backdrop-blur-md border border-yellow-400/50 px-2.5 py-1 rounded-full text-3xs font-black text-yellow-300 flex items-center gap-1.5 shadow-md">
            <Music className={`w-3 h-3 text-amber-400 ${isPlaying && !isMuted ? 'animate-bounce' : ''}`} />
            <span className="hidden xs:inline">🎵 Calm Ambient Song</span>
            {isMuted && <span className="text-rose-400 text-3xs font-bold">(Muted)</span>}
          </div>

          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 rounded-lg bg-black/80 hover:bg-yellow-400 hover:text-slate-950 text-yellow-300 border border-yellow-400/50 transition-all cursor-pointer shadow-md"
              title="Expand Full Tour"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Big Center Play / Pause Indicator (When Paused or on Hover) */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer z-10 transition-all"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-yellow-500/50 border-2 border-white hover:scale-110 active:scale-95 transition-all vip-gold-bevel">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-slate-950 text-slate-950 ml-1" />
          </div>
          <div className="mt-3 px-3 py-1 rounded-full bg-black/80 border border-yellow-400/60 text-yellow-300 text-3xs sm:text-2xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
            <span>Click To Play Base Walkthrough & Calm Music</span>
          </div>
        </div>
      )}

      {/* Chapter Marker Overlay (Active Room Name) */}
      <div className="absolute top-12 left-3 z-20 pointer-events-none hidden sm:block">
        <div className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-yellow-400/30 text-3xs font-bold text-yellow-200 flex items-center gap-1.5 shadow-md">
          <Tv className="w-3 h-3 text-yellow-400" />
          <span>Room: {activeChapter}</span>
        </div>
      </div>

      {/* BOTTOM CONTROLS BAR */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 pt-6 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar / Timeline */}
        <div className="relative mb-2 flex items-center group/scrub">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-yellow-950/80 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none"
          />
        </div>

        {/* Controls Layout */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Left: Play/Pause, Mute, Volume, Time */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black transition-all cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-black/80 hover:bg-yellow-400 hover:text-slate-950 text-yellow-300 border border-yellow-400/40 transition-all cursor-pointer"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Volume Slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-14 sm:w-20 h-1 bg-yellow-950 rounded-lg appearance-none cursor-pointer accent-yellow-400 hidden xs:block"
            />

            {/* Timecode */}
            <span className="text-3xs font-mono text-yellow-300/90 font-bold ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Center: Quick Chapter Buttons (In non-compact mode) */}
          {!isCompact && (
            <div className="hidden md:flex items-center gap-1">
              {chapters.map((ch) => (
                <button
                  key={ch.label}
                  onClick={() => jumpToChapter(ch.time)}
                  className={`px-2 py-0.5 rounded-md text-3xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    currentTime >= ch.time &&
                    (chapters[chapters.indexOf(ch) + 1] ? currentTime < chapters[chapters.indexOf(ch) + 1].time : true)
                      ? 'bg-yellow-400 text-slate-950 font-black'
                      : 'bg-black/60 text-yellow-300/80 hover:bg-yellow-400/20'
                  }`}
                >
                  <span>{ch.emoji}</span>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Right: Fullscreen */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-black/80 hover:bg-yellow-400 hover:text-slate-950 text-yellow-300 border border-yellow-400/40 transition-all cursor-pointer"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
