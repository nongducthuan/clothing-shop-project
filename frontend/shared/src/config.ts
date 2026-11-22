export interface SharedConfig {
  apiUrl: string;
  imageUrl: string;
  socketUrl: string;
}

let cfg: SharedConfig | null = null;

export const configureShared = (c: SharedConfig): void => {
  cfg = c;
};

export const getConfig = (): SharedConfig => {
  if (!cfg) {
    return {
      apiUrl: "http://localhost:5000/api",
      imageUrl: "http://localhost:5000",
      socketUrl: "http://localhost:5000",
    };
  }
  return cfg;
};
