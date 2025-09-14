export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  image?: string; // base64 string
  sources?: GroundingChunk[];
  error?: boolean;
  youtubeVideoId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}