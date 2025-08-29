declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement,
        config: {
          height: string
          width: string
          videoId: string
          playerVars: {
            autoplay: number
            loop: number
            playlist: string
            mute: number
            volume: number
            controls: number
            showinfo: number
            rel: number
            modestbranding: number
            origin: string
            enablejsapi: number
            playsinline: number
          }
          events: {
            onReady: (event: { target: any }) => void
            onStateChange: (event: { data: number }) => void
            onError: (event: { data: number }) => void
          }
        }
      ) => any
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export {}
