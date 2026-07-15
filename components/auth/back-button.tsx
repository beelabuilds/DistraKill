import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Radius, Spacing } from "@/constants/auth-theme";
import { useAuthTheme } from "@/hooks/use-auth-theme";

type BackButtonProps = {
  fallbackHref?: Href;
};

export function BackButton({ fallbackHref = "/welcome" }: BackButtonProps) {
  const router = useRouter();
  const theme = useAuthTheme();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="chevron-back" size={20} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
    marginBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
