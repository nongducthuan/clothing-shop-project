import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AiService, ChatMessageHistory } from '../../services/aiService';
import { getErrorMessage } from '../../utils/errorMessage';

export interface ChatPayload {
  message?: string;
  sessionId?: string;
  language?: string;
}

@Injectable()
export class StorefrontChatService {
  constructor(private readonly aiService: AiService) {}

  // Keep session history in the singleton provider so it survives across requests.
  private readonly activeChatSessions: Record<string, ChatMessageHistory[]> = {};

  async handleChat(
    payload: ChatPayload,
    acceptLanguage?: string,
    languageHeader?: string,
  ) {
    try {
      const { message, language } = payload;
      const lang = language || acceptLanguage || languageHeader || 'vi';
      if (!message) {
        throw new BadRequestException({ error: 'Message content is required.' });
      }
      const reply = await this.aiService.generateAiResponse(message, [], lang);
      return { reply };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[AI Engine Error]:', getErrorMessage(error) || error);
      throw new InternalServerErrorException({ error: 'Internal AI Engine error occurred.' });
    }
  }

  async handleChatWithHistory(
    payload: ChatPayload,
    acceptLanguage?: string,
    languageHeader?: string,
  ) {
    try {
      const { message, sessionId, language } = payload;
      const lang = language || acceptLanguage || languageHeader || 'vi';
      if (!message || !sessionId) {
        throw new BadRequestException({ error: 'Both message and sessionId are required.' });
      }

      if (!this.activeChatSessions[sessionId]) {
        this.activeChatSessions[sessionId] = [];
      }
      const history = this.activeChatSessions[sessionId];
      const reply = await this.aiService.generateAiResponse(message, history, lang);

      history.push({ role: 'user', content: message });
      history.push({ role: 'ai', content: reply });
      if (history.length > 8) {
        this.activeChatSessions[sessionId] = history.slice(-8);
      }
      return { reply };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[AI Engine Error]:', getErrorMessage(error) || error);
      throw new InternalServerErrorException({ error: 'Internal AI Engine error occurred.' });
    }
  }

  clearChatHistory(payload: ChatPayload) {
    const { sessionId } = payload;
    if (!sessionId) {
      throw new BadRequestException({ error: 'Session ID is required.' });
    }
    if (this.activeChatSessions[sessionId]) {
      delete this.activeChatSessions[sessionId];
    }
    return { message: 'Chat history cleared successfully.' };
  }
}
