import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { theme } from "@jokko/tokens";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export function ComposeMorph() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasText = useSharedValue(0);
  const focus = useSharedValue(0);
  const attachOpen = useSharedValue(0);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);

  useEffect(() => {
    hasText.value = withTiming(text.trim().length > 0 ? 1 : 0, { duration: 160 });
  }, [text, hasText]);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, focus]);

  const toggleAttach = () => {
    const next = !attachMenuVisible;
    setAttachMenuVisible(next);
    attachOpen.value = withSpring(next ? 1 : 0, { damping: 18, stiffness: 240 });
    Haptics.selectionAsync();
  };

  const send = () => {
    if (!text.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setText("");
  };

  const pillStyle = useAnimatedStyle(() => ({
    borderColor: focus.value > 0.5 ? theme.accent.primary : theme.ink[300],
    shadowOpacity: focus.value * 0.08
  }));

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(attachOpen.value, [0, 1], [0, 45])}deg` }]
  }));

  const micStyle = useAnimatedStyle(() => ({
    opacity: 1 - hasText.value,
    transform: [{ scale: interpolate(hasText.value, [0, 1], [1, 0.6]) }]
  }));

  const sendStyle = useAnimatedStyle(() => ({
    opacity: hasText.value,
    transform: [
      { scale: interpolate(hasText.value, [0, 1], [0.4, 1]) },
      { translateX: interpolate(hasText.value, [0, 1], [8, 0]) }
    ]
  }));

  const attachMenuStyle = useAnimatedStyle(() => ({
    opacity: attachOpen.value,
    transform: [{ translateY: interpolate(attachOpen.value, [0, 1], [12, 0]) }]
  }));

  return (
    <View style={styles.root}>
      <View style={styles.chatArea}>
        <Text style={styles.dummy}>[zone de messages mockés]</Text>
      </View>

      {attachMenuVisible && (
        <Animated.View style={[styles.attachMenu, attachMenuStyle]} pointerEvents="box-none">
          <AttachOption icon="camera-outline" label="Photo" />
          <AttachOption icon="images-outline" label="Galerie" />
          <AttachOption icon="document-outline" label="Document" />
          <AttachOption icon="location-outline" label="Position" />
        </Animated.View>
      )}

      <View style={styles.bar}>
        <Pressable onPress={toggleAttach} hitSlop={8} style={styles.iconBtn}>
          <Animated.View style={plusStyle}>
            <Ionicons name="add" size={26} color={theme.ink[700]} />
          </Animated.View>
        </Pressable>

        <Animated.View style={[styles.pill, pillStyle]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message"
            placeholderTextColor={theme.ink[500]}
            multiline
          />
          <Animated.View style={[styles.trailing, micStyle]} pointerEvents={text.length > 0 ? "none" : "auto"}>
            <Pressable onPress={() => Haptics.selectionAsync()} hitSlop={6}>
              <Ionicons name="mic-outline" size={20} color={theme.ink[700]} />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.sendBtn, sendStyle]} pointerEvents={text.length > 0 ? "auto" : "none"}>
          <Pressable onPress={send} style={styles.sendBtnInner} hitSlop={8} accessibilityLabel="Envoyer">
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function AttachOption({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <Pressable style={styles.attachOption} onPress={() => Haptics.selectionAsync()}>
      <View style={styles.attachIconCircle}>
        <Ionicons name={icon} size={22} color={theme.ink[700]} />
      </View>
      <Text style={styles.attachLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surface.default },
  chatArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  dummy: { color: theme.ink[500], fontSize: 13 },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: 6,
    backgroundColor: theme.surface.default,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.ink[300]
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2
  },
  plusIcon: { fontSize: 26, color: theme.ink[700], fontWeight: "300", lineHeight: 28 },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.surface.raised,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 40,
    borderWidth: 1,
    borderColor: theme.ink[300],
    shadowColor: theme.accent.primary,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.ink[900],
    padding: 0,
    paddingTop: 4,
    paddingBottom: 4,
    maxHeight: 120,
    lineHeight: 20
  },
  trailing: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4
  },
  trailingIcon: { fontSize: 18 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    shadowColor: theme.accent.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  sendBtnInner: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  attachMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.surface.raised,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }
  },
  attachOption: { alignItems: "center", gap: 6 },
  attachIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.ink[100],
    alignItems: "center",
    justifyContent: "center"
  },
  attachIcon: { fontSize: 22 },
  attachLabel: { fontSize: 11, color: theme.ink[700] }
});
