import { create } from 'zustand';

interface AppState {
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  activeScene: number;
  setActiveScene: (scene: number) => void;
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
  mousePosition: { x: number; y: number };
  setMousePosition: (pos: { x: number; y: number }) => void;
  activeHotspot: string | null;
  setActiveHotspot: (hotspot: string | null) => void;
  isHovering: boolean;
  setIsHovering: (hovering: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  activeScene: 0,
  setActiveScene: (scene) => set({ activeScene: scene }),
  isLoaded: false,
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  mousePosition: { x: 0, y: 0 },
  setMousePosition: (pos) => set({ mousePosition: pos }),
  activeHotspot: null,
  setActiveHotspot: (hotspot) => set({ activeHotspot: hotspot }),
  isHovering: false,
  setIsHovering: (hovering) => set({ isHovering: hovering }),
}));
