import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { mockConversations, type MockConversation } from "./data/mockMessages";
import { theme } from "@jokko/tokens";

const HAPTIC_DEBOUNCE_MS = 1500;
const NEW_MESSAGE_PREVIEWS = [
  "À quelle heure demain ?",
  "Merci beaucoup !",
  "On se rappelle.",
  "Parfait 👍",
  "Vous faites livraison ?"
] as const;

export function InboxBreathing() {
  const [conversations, setConversations] = useState<MockConversation[]>(mockConversations);
  const [pulseTarget, setPulseTarget] = useState<string | null>(null);
  const lastHapticRef = useRef(0);

  const simulateNewMessage = () => {
    const preview = NEW_MESSAGE_PREVIEWS[Math.floor(Math.random() * NEW_MESSAGE_PREVIEWS.length)];
    const now = Date.now();

    const targetId = conversations[0].id;
    setConversations((prev) => {
      const [first, ...rest] = prev;
      return [
        { ...first, lastMessage: preview, unread: first.unread + 1, time: "à l'instant" },
        ...rest
      ];
    });

    setPulseTarget(targetId);
    setTimeout(() => setPulseTarget(null), 1400);

    if (now - lastHapticRef.current > HAPTIC_DEBOUNCE_MS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastHapticRef.current = now;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.list}>
        {conversations.map((c, idx) => (
          <ConversationRow
            key={c.id}
            conv={c}
            shouldBreath={idx === 0 && pulseTarget === c.id}
          />
        ))}
      </View>

      <Pressable style={styles.fab} onPress={simulateNewMessage}>
        <Text style={styles.fabText}>Simuler un nouveau message</Text>
      </Pressable>

      <Text style={styles.hint}>
        Tap le bouton. Regarde la row du haut respirer. Haptic léger (debounce 1.5 s). Border-left pulse 2 cycles.
      </Text>
    </View>
  );
}

function ConversationRow({ conv, shouldBreath }: { conv: MockConversation; shouldBreath: boolean }) {
  const breath = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!shouldBreath) return;
    breath.value = withSequence(
      withSpring(1, { damping: 10, stiffness: 220 }),
      withSpring(0, { damping: 14, stiffness: 180 })
    );
    pulse.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 380 }),
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 380 })
    );
  }, [shouldBreath, breath, pulse]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(breath.value, [0, 1], [0, -2]) }]
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 0.8])
  }));

  const hasUnread = conv.unread > 0;
  const avatarBg = avatarColor(conv.name);

  return (
    <Pressable onPress={() => Haptics.selectionAsync()}>
      <Animated.View style={[styles.row, rowStyle]}>
        <Animated.View style={[styles.borderAccent, borderStyle]} />
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{conv.avatar}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowName} numberOfLines={1}>{conv.name}</Text>
            <Text style={[styles.rowTime, hasUnread && styles.rowTimeUnread]}>{conv.time}</Text>
          </View>
          <View style={styles.rowFooter}>
            <Text
              style={[styles.rowMessage, hasUnread && styles.rowMessageUnread]}
              numberOfLines={1}
            >
              {conv.lastMessage}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{conv.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function avatarColor(name: string): string {
  const palette = ["#E8B4BC", "#B4C7E8", "#B4E8C0", "#E8D4B4", "#D4B4E8", "#B4E3E8"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surface.default },
  list: { flex: 1, paddingTop: theme.spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.surface.default,
    position: "relative"
  },
  borderAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.accent.primary
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  avatarText: { fontSize: 15, fontWeight: "600", color: theme.ink[900] },
  rowBody: { flex: 1, minWidth: 0 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3, gap: 8 },
  rowName: { flex: 1, fontSize: 16, fontWeight: "600", color: theme.ink[900], letterSpacing: -0.2 },
  rowTime: { fontSize: 12, color: theme.ink[500] },
  rowTimeUnread: { color: theme.accent.primary, fontWeight: "600" },
  rowFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowMessage: { flex: 1, fontSize: 14, color: theme.ink[500], lineHeight: 19 },
  rowMessageUnread: { color: theme.ink[700] },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: theme.accent.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  fab: {
    margin: theme.spacing.lg,
    backgroundColor: theme.ink[900],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: "center"
  },
  fabText: { color: theme.ink[100], fontSize: 15, fontWeight: "600" },
  hint: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    fontSize: 12,
    color: theme.ink[500],
    textAlign: "center"
  }
});
