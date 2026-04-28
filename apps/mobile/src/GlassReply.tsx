import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue
} from "react-native-reanimated";
import { mockMessages, type MockMessage } from "./data/mockMessages";
import { theme } from "@jokko/tokens";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type Reaction = { id: string; icon: IoniconName; color: string; label: string };

const REACTIONS: readonly Reaction[] = [
  { id: "thumbs-up", icon: "thumbs-up", color: "#3B82F6", label: "Approuver" },
  { id: "heart", icon: "heart", color: "#EF4444", label: "Aimer" },
  { id: "check", icon: "checkmark-circle", color: "#10B981", label: "Validé" },
  { id: "alert", icon: "alert-circle", color: "#F59E0B", label: "Important" },
  { id: "help", icon: "help-circle", color: "#8B5CF6", label: "Question" },
  { id: "bookmark", icon: "bookmark", color: "#6366F1", label: "Garder" }
] as const;
const SCREEN_W = Dimensions.get("window").width;
const REACTION_WIDTH = 52;
const TRAY_WIDTH = REACTIONS.length * REACTION_WIDTH + 16;
const TRAY_HEIGHT = 56;
const TRAY_GAP = 12;

type LiftedInfo = {
  msg: MockMessage;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function GlassReply() {
  const [lifted, setLifted] = useState<LiftedInfo | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedByMsg, setSelectedByMsg] = useState<Record<string, Reaction>>({});

  const blurOpacity = useSharedValue(0);
  const trayProgress = useSharedValue(0);
  const liftScale = useSharedValue(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const active = lifted !== null;
    blurOpacity.value = withSpring(active ? 1 : 0, { damping: 18, stiffness: 200 });
    trayProgress.value = withSpring(active ? 1 : 0, { damping: 16, stiffness: 220 });
    liftScale.value = withSpring(active ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [lifted, blurOpacity, trayProgress, liftScale]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const dismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setLifted(null);
      setHoveredIdx(null);
      dismissTimerRef.current = null;
    }, 180);
  };

  const pickReaction = (msgId: string, reaction: Reaction) => {
    setSelectedByMsg((m) => ({ ...m, [msgId]: reaction }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dismiss();
  };

  const blurStyle = useAnimatedStyle(() => ({ opacity: blurOpacity.value }));

  const liftedIsMe = lifted?.msg.author === "me";
  const trayTop = lifted ? Math.max(24, lifted.y - TRAY_HEIGHT - TRAY_GAP) : 0;

  return (
    <View style={styles.root}>
      <View style={styles.chat}>
        {mockMessages.map((m) => (
          <Bubble
            key={m.id}
            msg={m}
            selectedReaction={selectedByMsg[m.id]}
            isLifted={lifted?.msg.id === m.id}
            onLift={(info) => {
              setLifted({ msg: m, ...info });
            }}
            onHover={(idx) => {
              if (hoveredIdx !== idx) {
                if (idx !== null) Haptics.selectionAsync();
                setHoveredIdx(idx);
              }
            }}
            onPick={(reaction) => pickReaction(m.id, reaction)}
          />
        ))}
      </View>

      <Animated.View
        style={[StyleSheet.absoluteFill, blurStyle]}
        pointerEvents={lifted ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
      </Animated.View>

      {lifted && (
        <>
          <LiftedClone
            info={lifted}
            isMe={liftedIsMe}
            selectedReaction={selectedByMsg[lifted.msg.id]}
            liftScale={liftScale}
          />
          <ReactionTrayOverlay
            top={trayTop}
            trayProgress={trayProgress}
            hoveredIdx={hoveredIdx}
            onPick={(reaction) => pickReaction(lifted.msg.id, reaction)}
          />
        </>
      )}

      <Text style={styles.hint}>
        Long-press (320 ms) sur une bulle → plateau de réactions.
      </Text>
    </View>
  );
}

type BubbleProps = {
  msg: MockMessage;
  selectedReaction?: Reaction;
  isLifted: boolean;
  onLift: (info: { x: number; y: number; width: number; height: number }) => void;
  onHover: (idx: number | null) => void;
  onPick: (reaction: Reaction) => void;
};

function Bubble({ msg, selectedReaction, isLifted, onLift, onHover, onPick }: BubbleProps) {
  const isMe = msg.author === "me";
  const viewRef = useRef<View>(null);

  const triggerLift = () => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      onLift({ x, y, width, height });
    });
  };

  const longPress = Gesture.LongPress()
    .minDuration(320)
    .maxDistance(20)
    .onStart(() => {
      runOnJS(triggerLift)();
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(320)
    .minDistance(14)
    .onUpdate((e) => {
      const trayLeft = (SCREEN_W - TRAY_WIDTH) / 2;
      const x = e.absoluteX - trayLeft - 8;
      const idx = Math.floor(x / REACTION_WIDTH);
      if (idx >= 0 && idx < REACTIONS.length) runOnJS(onHover)(idx);
      else runOnJS(onHover)(null);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) < 14 && Math.abs(e.translationY) < 14) {
        return;
      }
      const trayLeft = (SCREEN_W - TRAY_WIDTH) / 2;
      const x = e.absoluteX - trayLeft - 8;
      const idx = Math.floor(x / REACTION_WIDTH);
      if (idx >= 0 && idx < REACTIONS.length) runOnJS(onPick)(REACTIONS[idx]);
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <GestureDetector gesture={composed}>
        <View
          ref={viewRef}
          collapsable={false}
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
            isLifted && styles.bubbleHidden
          ]}
        >
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.body}</Text>
          <View style={styles.meta}>
            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{msg.time}</Text>
            {isMe && (
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.85)" />
            )}
          </View>
          {selectedReaction && (
            <View style={[styles.reactionChip, isMe ? styles.reactionChipMe : styles.reactionChipThem]}>
              <Ionicons name={selectedReaction.icon} size={14} color={selectedReaction.color} />
            </View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

type LiftedCloneProps = {
  info: LiftedInfo;
  isMe: boolean;
  selectedReaction?: Reaction;
  liftScale: SharedValue<number>;
};

function LiftedClone({ info, isMe, selectedReaction, liftScale }: LiftedCloneProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(liftScale.value, [0, 1], [1, 1.05]) }],
    shadowOpacity: liftScale.value * 0.35,
    shadowRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    elevation: interpolate(liftScale.value, [0, 1], [0, 24])
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.clone,
        {
          top: info.y,
          left: info.x,
          width: info.width,
          height: info.height
        }
      ]}
    >
      <Animated.View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          { width: info.width, height: info.height, maxWidth: info.width },
          style
        ]}
      >
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{info.msg.body}</Text>
        <View style={styles.meta}>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{info.msg.time}</Text>
          {isMe && (
            <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.85)" />
          )}
        </View>
        {selectedReaction && (
          <View style={[styles.reactionChip, isMe ? styles.reactionChipMe : styles.reactionChipThem]}>
            <Ionicons name={selectedReaction.icon} size={14} color={selectedReaction.color} />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

type TrayOverlayProps = {
  top: number;
  trayProgress: SharedValue<number>;
  hoveredIdx: number | null;
  onPick: (reaction: Reaction) => void;
};

function ReactionTrayOverlay({ top, trayProgress, hoveredIdx, onPick }: TrayOverlayProps) {
  const trayStyle = useAnimatedStyle(() => ({
    opacity: trayProgress.value,
    transform: [
      { translateY: interpolate(trayProgress.value, [0, 1], [16, 0]) },
      { scale: interpolate(trayProgress.value, [0, 1], [0.85, 1]) }
    ]
  }));

  return (
    <Animated.View style={[styles.trayWrap, { top }, trayStyle]} pointerEvents="box-none">
      <View style={styles.tray}>
        {REACTIONS.map((reaction, idx) => {
          const hovered = hoveredIdx === idx;
          return (
            <Pressable
              key={reaction.id}
              accessibilityLabel={reaction.label}
              onPress={() => {
                Haptics.selectionAsync();
                onPick(reaction);
              }}
              style={[styles.trayItem, hovered && styles.trayItemHovered]}
            >
              <Ionicons
                name={reaction.icon}
                size={hovered ? 30 : 24}
                color={reaction.color}
              />
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surface.sunken },
  chat: { flex: 1, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, gap: 8 },
  bubbleRow: { maxWidth: "100%" },
  bubbleRowMe: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 5,
    borderRadius: 14,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 }
  },
  bubbleHidden: { opacity: 0 },
  bubbleMe: { backgroundColor: theme.accent.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: theme.surface.raised, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: theme.ink[900], lineHeight: 20 },
  bubbleTextMe: { color: "#fff" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 1 },
  bubbleTime: { fontSize: 11, color: theme.ink[500] },
  bubbleTimeMe: { color: "rgba(255,255,255,0.78)" },
  readTicks: { fontSize: 11, color: "rgba(255,255,255,0.85)", letterSpacing: -1 },
  clone: {
    position: "absolute",
    zIndex: 999
  },
  trayWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000
  },
  tray: {
    flexDirection: "row",
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20
  },
  trayItem: {
    width: REACTION_WIDTH,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22
  },
  trayItemHovered: { backgroundColor: theme.ink[100], transform: [{ scale: 1.2 }] },
  trayEmoji: { fontSize: 28 },
  trayEmojiHovered: { fontSize: 34 },
  reactionChip: {
    position: "absolute",
    bottom: -12,
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  reactionChipMe: { right: 12 },
  reactionChipThem: { left: 12 },
  reactionChipText: { fontSize: 14 },
  hint: {
    position: "absolute",
    bottom: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    fontSize: 12,
    color: theme.ink[500],
    textAlign: "center"
  }
});
