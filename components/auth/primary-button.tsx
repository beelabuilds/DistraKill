import { Radius, Spacing, Typography } from "@/constants/auth-theme";
import { useAuthTheme } from "@/hooks/use-auth-theme";
import { Ionicons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type PrimaryButtonProps = {
  label: string;
  loading?: boolean;
  onPress?: () => void | Promise<void>;
  tone?: "primary" | "secondary";
  href?: Href;
  icon?: keyof typeof Ionicons.glyphMap;
  showArrow?: boolean;
};

export function PrimaryButton({
  label,
  loading = false,
  onPress,
  tone = "primary",
  href,
  icon,
  showArrow = true,
}: PrimaryButtonProps) {
  const theme = useAuthTheme();
  const [pressed, setPressed] = useState(false);
  const contentColor = tone === "primary" ? theme.buttonText : theme.text;

  const button = (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={StyleSheet.flatten([
        styles.button,
        {
          backgroundColor:
            tone === "primary" ? theme.primary : "transparent",
          borderColor: theme.primary,
          borderWidth: tone === "primary" ? 1 : 1.5,
        },
        pressed && styles.pressed,
      ])}
    >
      {loading ? (
        <ActivityIndicator
          color={contentColor}
        />
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.leftContent}>
              {icon ? (
                <Ionicons name={icon} size={18} color={tone === "primary" ? contentColor : theme.primary} />
              ) : null}
              <Text
                style={[
                  styles.label,
                  { color: contentColor },
                ]}
              >
                {label}
              </Text>
            </View>
            {showArrow ? (
              <Ionicons name="chevron-forward" size={18} color={contentColor} />
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );

  if (href) {
    return (
      <Link asChild href={href}>
        {button}
      </Link>
    );
  }

  return button;
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  leftContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.button,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
