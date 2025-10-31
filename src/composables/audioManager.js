class AudioManager {
  constructor() {
    this.channels = {
      tts: { priority: 100, audio: null, defaultVolume: 1 },
      greeting: { priority: 70, audio: null, defaultVolume: 1 },
      sfx: { priority: 60, audio: null, defaultVolume: 1 },
      bgm: { priority: 10, audio: null, defaultVolume: 0.6, loop: true },
    };
    this.currentlyPlaying = new Map(); // channel -> HTMLAudioElement
    this.audioContextUnlocked = false;
    this.originalBgmVolume = this.channels.bgm.defaultVolume;
    this.unlockHandler = this.unlockAudioContext.bind(this);
    window.addEventListener("click", this.unlockHandler, { once: true });
    window.addEventListener("touchstart", this.unlockHandler, { once: true });
  }

  _isActive(channel) {
    const el = this.channels[channel]?.audio;
    return !!(el && !el.paused && !el.ended && el.currentTime > 0);
  }

  _anyHigherPriorityActive(targetChannel) {
    const targetPri = this.channels[targetChannel].priority;
    for (const name of Object.keys(this.channels)) {
      if (name === "bgm") continue; // BGM 例外：不作為阻擋者
      if (name === targetChannel) continue;
      const info = this.channels[name];
      if (!info) continue;
      if (info.priority > targetPri && this._isActive(name)) {
        return true;
      }
    }
    return false;
  }

  unlockAudioContext() {
    // 瀏覽器行為：互動後才允許音訊播放
    this.audioContextUnlocked = true;
  }

  _ensureAudio(channel) {
    const ch = this.channels[channel];
    if (!ch) throw new Error(`Unknown channel: ${channel}`);
    if (!ch.audio) {
      ch.audio = new Audio();
      ch.audio.preload = "auto";
      ch.audio.loop = Boolean(ch.loop);
      ch.audio.volume = ch.defaultVolume;
      ch.audio.addEventListener("ended", () => {
        if (channel === "tts") {
          // TTS 結束 → 恢復 BGM
          this.fadeTo("bgm", this.originalBgmVolume, 300);
        }
        this.currentlyPlaying.delete(channel);
      });
    }
    return ch.audio;
  }

  pause(channel) {
    const ch = this.channels[channel];
    if (ch?.audio && !ch.audio.paused) ch.audio.pause();
  }

  stop(channel) {
    const ch = this.channels[channel];
    if (ch?.audio) {
      ch.audio.pause();
      ch.audio.currentTime = 0;
      this.currentlyPlaying.delete(channel);
      if (channel === "tts") {
        this.fadeTo("bgm", this.originalBgmVolume, 300);
      }
    }
  }

  stopAll(except = null) {
    Object.keys(this.channels).forEach((c) => {
      if (c !== except) this.stop(c);
    });
  }

  async play({
    channel,
    src,
    volume,
    loop,
    duckOthers = true,
    fadeInMs = 150,
    onStart,
    onEnd,
  }) {
    if (!this.audioContextUnlocked) {
      // 仍可嘗試播放，但可能被瀏覽器阻擋；已掛互動解鎖 once 事件
      console.warn(
        "Audio context not unlocked yet; waiting for first user gesture."
      );
    }

    const chInfo = this.channels[channel];
    if (!chInfo) throw new Error(`Unknown channel: ${channel}`);

    // 若有更高優先權的頻道在播放，低優先權的這次播放直接略過（不出聲）
    if (this._anyHigherPriorityActive(channel)) {
      // 回呼仍可執行（如果你想顯示 UI 狀態），但不發聲
      if (onEnd) onEnd();
      return Promise.resolve(null);
    }

    const audio = this._ensureAudio(channel);
    if (typeof loop === "boolean") audio.loop = loop;
    if (typeof volume === "number") audio.volume = volume;
    audio.src = src;

    // 仲裁：若有更低優先權的頻道在播，需處理衝突
    this._arbitrateBeforePlay(channel);

    // ducking：TTS 播放時壓低 BGM
    if (channel === "tts" && duckOthers) {
      this._duckBgm(true);
    }
    if (onStart) audio.onplay = () => onStart();

    // 用淡入避免爆音
    await audio.play().catch((e) => console.warn("Audio play blocked:", e));
    if (fadeInMs > 0) this._fadeIn(audio, fadeInMs);

    // 結束回調
    if (onEnd) audio.onended = () => onEnd();

    this.currentlyPlaying.set(channel, audio);
    return audio;
  }

  // ✅ 改良版：播放前仲裁
  _arbitrateBeforePlay(targetChannel) {
    const targetPriority = this.channels[targetChannel].priority;
    // 暫停所有「優先權 <= 目標」且非 BGM 的頻道（避免同級/更低級重疊）
    for (const [ch, audioEl] of this.currentlyPlaying.entries()) {
      if (!audioEl) continue;
      if (ch === "bgm") continue;
      const pri = this.channels[ch]?.priority ?? 0;
      if (pri <= targetPriority && ch !== targetChannel) {
        this.pause(ch);
      }
    }
  }

  _duckBgm(enable) {
    const bgm = this._ensureAudio("bgm");
    if (!bgm) return;
    if (enable) {
      this.originalBgmVolume = bgm.volume || this.channels.bgm.defaultVolume;
      this.fadeTo("bgm", 0.15, 200);
    } else {
      this.fadeTo("bgm", this.originalBgmVolume, 200);
    }
  }

  fadeTo(channel, targetVolume, durationMs = 200) {
    const ch = this.channels[channel];
    if (!ch?.audio) return;
    const audio = ch.audio;
    const start = audio.volume;
    const diff = targetVolume - start;
    if (diff === 0) return;

    const steps = Math.max(1, Math.floor(durationMs / 16));
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      audio.volume = start + (diff * i) / steps;
      if (i >= steps) clearInterval(timer);
    }, 16);
  }

  _fadeIn(audio, durationMs) {
    const target = audio.volume || 1;
    audio.volume = 0;
    const steps = Math.max(1, Math.floor(durationMs / 16));
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      audio.volume = (target * i) / steps;
      if (i >= steps) clearInterval(timer);
    }, 16);
  }
}

export const audioManager = new AudioManager();
