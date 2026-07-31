import API from "./apiClient";

interface SendChatMessageParams {
  message: string;
  sessionId: string;
}

interface ChatMessageResponse {
  reply: string;
}

export const sendChatMessage = async ({
  message,
  sessionId,
}: SendChatMessageParams): Promise<ChatMessageResponse> => {
  const res = await API.post("/chat/history", {
    message,
    sessionId,
  });
  return res.data;
};

export const clearChatHistory = async ({
  sessionId,
}: {
  sessionId: string;
}): Promise<void> => {
  const res = await API.delete("/chat/history", {
    data: { sessionId },
  });
  return res.data;
};
