'use client';

import React, { Component, ReactNode } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

class EffectErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function Effects() {
  return (
    <EffectComposer multisampling={2}>
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export default function PostEffects() {
  return (
    <EffectErrorBoundary>
      <Effects />
    </EffectErrorBoundary>
  );
}
