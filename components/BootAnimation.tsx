import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { Palette } from '@/constants/theme';
import { useValidators } from '@/hooks/use-validators';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CX = SCREEN_WIDTH / 2;
const CY = SCREEN_HEIGHT / 2;

// Reanimated wrappers for SVG elements
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// ─── Tangle Topology ──────────────────────────────────────────────────────────

interface Node {
  id: number;
  x: number;
  y: number;
  delayMs: number;
}

interface Edge {
  source: number;
  target: number;
}

// Generate a visually pleasing pseudo-random DAG (Directed Acyclic Graph)
const generateTangle = () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Center node (logo position)
  nodes.push({ id: 0, x: CX, y: CY - 30, delayMs: 1200 });

  // Concentric layers radiating outwards
  const layers = [
    { count: 3, radius: 50, baseDelay: 900 },
    { count: 5, radius: 110, baseDelay: 600 },
    { count: 8, radius: 180, baseDelay: 300 },
    { count: 12, radius: 260, baseDelay: 0 },
  ];

  let idCounter = 1;
  const nodesByLayer: Node[][] = [[nodes[0]]];

  layers.forEach((layer, layerIdx) => {
    const layerNodes: Node[] = [];
    const angleStep = (Math.PI * 2) / layer.count;
    // Add a slight rotation offset per layer to create a spiraling web effect
    const angleOffset = layerIdx * 0.5;

    for (let i = 0; i < layer.count; i++) {
      // Add some noise to radius and angle to make it organic
      const noiseR = (Math.random() - 0.5) * 30;
      const noiseA = (Math.random() - 0.5) * 0.3;
      const r = layer.radius + noiseR;
      const a = i * angleStep + angleOffset + noiseA;

      const node: Node = {
        id: idCounter++,
        x: CX + Math.cos(a) * r,
        y: CY - 30 + Math.sin(a) * r,
        delayMs: layer.baseDelay + Math.random() * 200,
      };
      layerNodes.push(node);
      nodes.push(node);
    }
    nodesByLayer.push(layerNodes);
  });

  // Connect nodes: Each node in layer N connects to 2 random nodes in layer N-1
  for (let l = 1; l < nodesByLayer.length; l++) {
    const currentLayer = nodesByLayer[l];
    const prevLayer = nodesByLayer[l - 1];

    currentLayer.forEach((node) => {
      // Connect to the geographically closest 2 nodes from the previous layer
      const sortedPrev = [...prevLayer].sort((a, b) => {
        const distA = Math.hypot(node.x - a.x, node.y - a.y);
        const distB = Math.hypot(node.x - b.x, node.y - b.y);
        return distA - distB;
      });

      edges.push({ source: node.id, target: sortedPrev[0].id });
      if (sortedPrev.length > 1) {
        edges.push({ source: node.id, target: sortedPrev[1].id });
      }
    });
  }

  return { nodes, edges };
};

const { nodes: INITIAL_NODES, edges: TANGLE_EDGES } = generateTangle();

// ─── Individual Node Component ────────────────────────────────────────────────
const TangleNode = ({ node, progress, convergeProgress }: { node: Node; progress: Animated.SharedValue<number>; convergeProgress: Animated.SharedValue<number> }) => {
  const animatedProps = useAnimatedProps(() => {
    // 1. Pop-in animation based on delay
    const start = node.delayMs / 1500; // normalized time 0-1
    const pop = interpolate(progress.value, [start, start + 0.2], [0, 1], Extrapolation.CLAMP);
    
    // 2. Converge animation (all nodes fly into the center)
    const currentX = interpolate(convergeProgress.value, [0, 1], [node.x, CX], Extrapolation.CLAMP);
    const currentY = interpolate(convergeProgress.value, [0, 1], [node.y, CY - 30], Extrapolation.CLAMP);
    
    // Nodes fade out as they converge, except the center node
    const opacity = node.id === 0 
      ? pop 
      : interpolate(convergeProgress.value, [0, 0.8], [pop, 0], Extrapolation.CLAMP);

    return {
      cx: currentX,
      cy: currentY,
      r: node.id === 0 ? 6 * pop : 3 * pop,
      opacity,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      fill={node.id === 0 ? Palette.blue : Palette.steel}
    />
  );
};

// ─── Individual Edge Component ────────────────────────────────────────────────
const TangleEdge = ({ edge, sourceNode, targetNode, progress, convergeProgress }: { edge: Edge; sourceNode: Node; targetNode: Node; progress: Animated.SharedValue<number>; convergeProgress: Animated.SharedValue<number> }) => {
  // Edge animation length
  const dist = Math.hypot(sourceNode.x - targetNode.x, sourceNode.y - targetNode.y);
  
  const animatedProps = useAnimatedProps(() => {
    // Draw line from source to target
    // Delay starts after the source node has popped in
    const start = (sourceNode.delayMs + 100) / 1500;
    const draw = interpolate(progress.value, [start, start + 0.3], [0, dist], Extrapolation.CLAMP);
    
    const currStartX = interpolate(convergeProgress.value, [0, 1], [sourceNode.x, CX], Extrapolation.CLAMP);
    const currStartY = interpolate(convergeProgress.value, [0, 1], [sourceNode.y, CY - 30], Extrapolation.CLAMP);
    const currEndX = interpolate(convergeProgress.value, [0, 1], [targetNode.x, CX], Extrapolation.CLAMP);
    const currEndY = interpolate(convergeProgress.value, [0, 1], [targetNode.y, CY - 30], Extrapolation.CLAMP);

    // Fade out edges during convergence
    const opacity = interpolate(convergeProgress.value, [0, 0.6], [0.3, 0], Extrapolation.CLAMP);

    return {
      x1: currStartX,
      y1: currStartY,
      x2: currEndX,
      y2: currEndY,
      strokeDasharray: `${draw} ${dist}`,
      strokeOpacity: opacity,
    };
  });

  return (
    <AnimatedLine
      animatedProps={animatedProps}
      stroke={Palette.blue}
      strokeWidth={1}
    />
  );
};

// ─── Main BootAnimation Component ─────────────────────────────────────────────

interface BootAnimationProps {
  onComplete: () => void;
}

export default function BootAnimation({ onComplete }: BootAnimationProps) {
  const [isRendered, setIsRendered] = useState(true);
  
  // Animation timelines
  const tangleProgress = useSharedValue(0);
  const convergeProgress = useSharedValue(0);
  const logoProgress = useSharedValue(0);
  const overallOpacity = useSharedValue(1);

  // Sync with actual app network state
  const { isLoading, isError } = useValidators();
  const isAppReady = !isLoading || isError;
  
  const [introFinished, setIntroFinished] = useState(false);
  const fastMode = useRef(false);

  useEffect(() => {
    // Normal slow sequence
    tangleProgress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }, (f1) => {
      if (!f1) return; // Cancelled by fastMode
      convergeProgress.value = withDelay(
        300,
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }, (f2) => {
          if (!f2) return; // Cancelled
          logoProgress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }, (f3) => {
            if (f3) runOnJS(setIntroFinished)(true);
          });
        })
      );
    });
  }, []);

  // Dynamic Acceleration Layer
  useEffect(() => {
    if (isAppReady && !introFinished && !fastMode.current) {
      fastMode.current = true;
      // Overwrite running animations with a rapid sequence
      tangleProgress.value = withTiming(1, { duration: 300 }, () => {
        convergeProgress.value = withTiming(1, { duration: 300 }, () => {
          logoProgress.value = withTiming(1, { duration: 400 }, () => {
            runOnJS(setIntroFinished)(true);
          });
        });
      });
    }
  }, [isAppReady, introFinished]);

  // Fade Out Handoff
  useEffect(() => {
    if (introFinished && isAppReady) {
      overallOpacity.value = withDelay(
        200,
        withTiming(0, { duration: 400, easing: Easing.linear }, () => {
          runOnJS(setIsRendered)(false);
          runOnJS(onComplete)();
        })
      );
    }
  }, [introFinished, isAppReady, onComplete]);

  if (!isRendered) return null;

  // Animated styles for the final Logo text
  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(logoProgress.value, [0, 0.5], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(logoProgress.value, [0, 1], [10, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Animated styles for the center glowing orb
  const orbStyle = useAnimatedStyle(() => {
    const scale = interpolate(logoProgress.value, [0, 0.5, 1], [1, 1.4, 1.2], Extrapolation.CLAMP);
    const opacity = interpolate(logoProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overallOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* 1. Tangle Network Visualization */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          {/* Edges */}
          {TANGLE_EDGES.map((edge, idx) => {
            const sourceNode = INITIAL_NODES.find((n) => n.id === edge.source)!;
            const targetNode = INITIAL_NODES.find((n) => n.id === edge.target)!;
            return (
              <TangleEdge
                key={`edge-${idx}`}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                progress={tangleProgress}
                convergeProgress={convergeProgress}
              />
            );
          })}
          {/* Nodes */}
          {INITIAL_NODES.map((node) => (
            <TangleNode
              key={`node-${node.id}`}
              node={node}
              progress={tangleProgress}
              convergeProgress={convergeProgress}
            />
          ))}
        </Svg>
      </View>

      {/* 2. Final Assembled Logo & Glow */}
      <View style={styles.logoContainer}>
        {/* Glow behind the orb */}
        <Animated.View style={[styles.glowOrb, orbStyle]} />
        <Animated.View style={[styles.solidOrb, orbStyle]} />
        
        <Animated.Text style={[styles.logoText, textStyle]}>
          OmniSphere
        </Animated.Text>
        <Animated.Text style={[styles.subText, textStyle]}>
          Powered by IOTA
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000', // True black as requested
    zIndex: 9999, // Ensure it sits on top of everything
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    top: CY - 30 - 40, // Center matches node 0
    left: CX - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.blue,
    opacity: 0.4,
    shadowColor: Palette.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  solidOrb: {
    position: 'absolute',
    top: CY - 30 - 12,
    left: CX - 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.blue,
  },
  logoText: {
    marginTop: 60,
    color: Palette.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subText: {
    color: Palette.steel,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
