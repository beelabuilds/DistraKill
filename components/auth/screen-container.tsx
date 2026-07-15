import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthTheme } from "@/hooks/use-auth-theme";

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scrollable = false,
  contentStyle,
}: ScreenContainerProps) {
  const theme = useAuthTheme();

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { backgroundColor: theme.background },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentWidth}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, contentStyle]}>
      <View style={styles.contentWidth}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={[styles.backgroundGlow, { backgroundColor: theme.glow }]} />
      <View
        style={[styles.backgroundBlob, { backgroundColor: theme.surfaceSoft }]}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  staticContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  contentWidth: {
    alignSelf: "center",
    maxWidth: 560,
    width: "100%",
  },
  backgroundGlow: {
    borderRadius: 999,
    height: 180,
    position: "absolute",
    right: -60,
    top: -40,
    width: 180,
  },
  backgroundBlob: {
    borderRadius: 999,
    bottom: 12,
    height: 220,
    left: -100,
    position: "absolute",
    width: 220,
  },
});
