export enum Speaker {
  Host = 'Host',
  Expert = 'Expert'
}

export interface ScriptLine {
  speaker: Speaker;
  text: string;
}

export enum AppState {
  Idle = 'idle',
  GeneratingScript = 'generating_script',
  ScriptReady = 'script_ready',
  GeneratingAudio = 'generating_audio',
  Playing = 'playing',
  Error = 'error'
}

export interface PodcastConfig {
  hostName: string;
  expertName: string;
  tone: 'Professional' | 'Casual' | 'Funny';
}
