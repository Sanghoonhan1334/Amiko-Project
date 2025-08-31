declare namespace YT {
  class Player {
    constructor(
      elementId: string,
      config: {
        height: string | number;
        width: string | number;
        videoId: string;
        events: {
          onReady: (event: { target: unknown }) => void;
          onStateChange?: (event: { data: number }) => void;
        };
      }
    );
  }
}

