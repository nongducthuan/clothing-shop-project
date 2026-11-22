declare module "aos" {
  const AOS: {
    refresh: () => void;
    init: (options?: Record<string, unknown>) => void;
  };

  export default AOS;
}
