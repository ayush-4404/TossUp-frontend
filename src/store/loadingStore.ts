import { create } from "zustand";

type LoadingMessage = {
  id: string;
  text: string;
};

interface LoadingState {
  pendingRequests: number;
  messages: LoadingMessage[];
  startRequest: () => void;
  finishRequest: () => void;
  showMessage: (id: string, text: string) => void;
  hideMessage: (id: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  pendingRequests: 0,
  messages: [],
  startRequest: () =>
    set((state) => ({
      pendingRequests: state.pendingRequests + 1,
    })),
  finishRequest: () =>
    set((state) => ({
      pendingRequests: Math.max(0, state.pendingRequests - 1),
    })),
  showMessage: (id, text) =>
    set((state) => ({
      messages: [...state.messages.filter((message) => message.id !== id), { id, text }],
    })),
  hideMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== id),
    })),
}));

const createLoaderMessageId = () => `loader-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const showGlobalLoadingMessage = (text: string) => {
  const id = createLoaderMessageId();
  useLoadingStore.getState().showMessage(id, text);
  return id;
};

export const hideGlobalLoadingMessage = (id: string) => {
  useLoadingStore.getState().hideMessage(id);
};
