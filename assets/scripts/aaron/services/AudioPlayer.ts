import { Service } from '../core';
import { IAppLauncher, IAudioPlayer, IEventBus, INodePoolContainer } from '../interfaces';
import { EVENTS, PRESET, SERVICES } from '../macro';
import { MusicPlayer, SoundPlayer, AudioEntry } from '../foundation';

/**
 * 音频播放服务
 */
export class AudioPlayer extends Service implements IAudioPlayer {
  music: MusicPlayer;
  sound: SoundPlayer;

  initialize() {
    const root = this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).root;
    const nodePool = this.resolve<INodePoolContainer>(SERVICES.NODE_POOL);
    nodePool.registerByConstructor(AudioEntry, PRESET.MUSIC_ENTRY_OPTIONS);
    nodePool.registerByConstructor(AudioEntry, PRESET.SOUND_ENTRY_OPTIONS);

    this.music = new MusicPlayer('music');
    this.sound = new SoundPlayer('sound');
    root.insertChild(this.music, 1);
    root.insertChild(this.sound, 2);

    const eventBus = this.resolve<IEventBus>(SERVICES.EVENT_BUS);
    eventBus.app.on(EVENTS.APP.ENTER_FOREGROUND, this.resume, this);
    eventBus.app.on(EVENTS.APP.ENTER_BACKGROUND, this.pause, this);
    eventBus.app.on(EVENTS.APP.EXIT, this.clearEvents, this);
  }

  /** 清除事件监听 */
  private clearEvents() {
    this.music.stop();
    this.sound.stop();
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.off(undefined, this);
  }

  pause(): void {
    this.music.pause();
    this.sound.pause();
  }

  resume(): void {
    this.music.resume();
    this.sound.resume();
  }

  stop(): void {
    this.music.stop();
    this.sound.stop();
  }
}
