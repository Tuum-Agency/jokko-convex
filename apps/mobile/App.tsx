import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@jokko/tokens";
import { GlassReply } from "./src/GlassReply";
import { InboxBreathing } from "./src/InboxBreathing";
import { ComposeMorph } from "./src/ComposeMorph";

type Screen = "menu" | "glass-reply" | "inbox-breathing" | "compose-morph";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="dark-content" />
          {screen === "menu" && <Menu onNavigate={setScreen} />}
          {screen === "glass-reply" && <Frame onBack={() => setScreen("menu")} title="Signature #1 · Glass Reply"><GlassReply /></Frame>}
          {screen === "inbox-breathing" && <Frame onBack={() => setScreen("menu")} title="Signature #2 · Inbox Breathing"><InboxBreathing /></Frame>}
          {screen === "compose-morph" && <Frame onBack={() => setScreen("menu")} title="Signature #3 · Compose Morph"><ComposeMorph /></Frame>}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

function Menu({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <View style={styles.menu}>
      <Text style={styles.title}>Jokko · Spike signatures</Text>
      <Text style={styles.subtitle}>Valider (ou reforger) les 3 signatures avant de coder l'app.</Text>
      <MenuButton label="Signature #1 · Glass Reply" hint="long-press bulle → lift + blur + réactions" onPress={() => onNavigate("glass-reply")} />
      <MenuButton label="Signature #2 · Inbox Breathing" hint="nouveau message → row respire" onPress={() => onNavigate("inbox-breathing")} />
      <MenuButton label="Signature #3 · Compose Morph" hint="field qui morph + send qui naît" onPress={() => onNavigate("compose-morph")} />
    </View>
  );
}

function MenuButton({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.6 }]}>
      <Text style={styles.menuBtnLabel}>{label}</Text>
      <Text style={styles.menuBtnHint}>{hint}</Text>
    </Pressable>
  );
}

function Frame({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.frame}>
      <View style={styles.frameHeader}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backRow} accessibilityLabel="Retour au menu">
          <Ionicons name="chevron-back" size={18} color={theme.accent.primary} />
          <Text style={styles.backBtn}>Menu</Text>
        </Pressable>
        <Text style={styles.frameTitle}>{title}</Text>
      </View>
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surface.default },
  safe: { flex: 1 },
  menu: { flex: 1, padding: theme.spacing.xl, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", color: theme.ink[900], marginBottom: theme.spacing.sm, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: theme.ink[500], marginBottom: theme.spacing.xxl, lineHeight: 22 },
  menuBtn: {
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.ink[300]
  },
  menuBtnLabel: { fontSize: 16, fontWeight: "600", color: theme.ink[900], marginBottom: 2 },
  menuBtnHint: { fontSize: 13, color: theme.ink[500] },
  frame: { flex: 1 },
  frameHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.ink[300]
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 2 },
  backBtn: { fontSize: 15, color: theme.accent.primary },
  frameTitle: { fontSize: 17, fontWeight: "600", color: theme.ink[900] },
  frameBody: { flex: 1 }
});
