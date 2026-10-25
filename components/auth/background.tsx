import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { Spacing } from "@/constants/auth-theme";

/**
 * ScatteredBackground
 * Full-page ambient decoration (orbital rings, stars, plus-signs, dots).
 */
export function ScatteredBackground({ color = "#8A5CF5" }: { color?: string }) {
    return (
        <View style={styles.wrapper} pointerEvents="none">
            <Svg
                width="100%"
                height="100%"
                viewBox="0 0 400 900"
                preserveAspectRatio="none"
            >
                {/* ===== Top-left Arc ===== */}
                <Path
                    d="M-50 180 A180 180 0 0 1 180 -50"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.15}
                    fill="none"
                />

                {/* ===== Hero Main Orbit Ring (Enclosing the Illustration Area) ===== */}
                <Circle
                    cx="200"
                    cy="180"
                    r="125"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.2}
                    fill="none"
                />

                {/* Orbit Nodes on Central Ring */}
                <Circle cx="120" cy="85" r="4" fill={color} opacity={0.8} />
                <Circle cx="312" cy="225" r="5" stroke={color} strokeWidth={1.5} fill="none" opacity={0.6} />

                {/* ===== Top Right Accents (Grid & Ring) ===== */}
                {[0, 1, 2, 3].flatMap((col) =>
                    [0, 1, 2].map((row) => (
                        <Circle
                            key={`grid-${col}-${row}`}
                            cx={330 + col * 10}
                            cy={180 + row * 10}
                            r="1"
                            fill={color}
                            opacity={0.25}
                        />
                    ))
                )}
                <Circle cx="340" cy="320" r="18" stroke={color} strokeWidth={2} opacity={0.35} fill="none" />

                {/* Four-Point Sparkles (Top/Ambient) */}
                <Path d="M295 100 L295 106 M292 103 L298 103" stroke={color} strokeWidth={1} opacity={0.4} />
                <Path d="M100 230 L100 236 M97 233 L103 233" stroke={color} strokeWidth={1} opacity={0.3} />

                {/* ===== Mid Region (Edges) ===== */}
                <Circle cx="18" cy="430" r="2" fill={color} opacity={0.3} />
                <Path d="M382 400 L382 410 M377 405 L387 405" stroke={color} strokeWidth={0.8} opacity={0.3} />

                {/* ===== Bottom-Left Concentric Circles ===== */}
                <Circle cx="40" cy="840" r="60" stroke={color} strokeWidth={1} opacity={0.12} fill="none" />
                <Circle cx="40" cy="840" r="45" stroke={color} strokeWidth={0.8} opacity={0.18} strokeDasharray="3 4" fill="none" />
            </Svg>
        </View>
    );
}

/**
 * HandDrawnHeader
 * Focal hero illustration with left-aligned book stack, coffee mug, and detailed plant.
 */
export function HandDrawnHeader({ color = "#FFFFFF" }: { color?: string }) {
    return (
        <View style={styles.doodleContainer}>
            <Svg width={320} height={260} viewBox="0 0 320 260">
                {/* Ground Line */}
                <Path d="M 60 185 L 260 185" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />

                {/* ==========================================
                    BOOK STACK (Left - Left-Aligned at X = 65)
                   ========================================== */}
                {/* Bottom Book (Widest) */}
                <Rect
                    x={65}
                    y={172}
                    width={80}
                    height={13}
                    rx={3}
                    ry={3}
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <Path d="M 73 178.5 L 137 178.5" stroke={color} strokeWidth={1} opacity={0.6} strokeLinecap="round" />

                {/* Middle Book */}
                <Rect
                    x={65}
                    y={158}
                    width={72}
                    height={14}
                    rx={3}
                    ry={3}
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* Top Book (Shortest) */}
                <Rect
                    x={65}
                    y={145}
                    width={62}
                    height={13}
                    rx={3}
                    ry={3}
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* Bookmark ribbon on the RIGHT SIDE of the SECOND (Middle) Book */}
                <Path
                    d="M 116 158 L 116 177 L 120 172 L 124 177 L 124 158 Z"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={color}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* ==========================================
                    COFFEE MUG WITH HEART & STEAM (Middle)
                   ========================================== */}
                <Path
                    d="M 170 155 L 173 180 Q 173 185 178 185 L 192 185 Q 197 185 197 180 L 200 155 Z"
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <Path d="M 200 160 C 208 160 208 178 198 178" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
                <Path
                    d="M 185 167 C 183 163 180 166 185 172 C 190 166 187 163 185 167 Z"
                    stroke={color}
                    strokeWidth={1.2}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <Path d="M 178 148 C 176 142 182 138 178 132" stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" />
                <Path d="M 188 148 C 186 142 192 138 188 132" stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" />

                {/* ==========================================
                    DETAILED POTTED PLANT (Right)
                   ========================================== */}
                {/* Pot Rim */}
                <Rect
                    x={212}
                    y={160}
                    width={34}
                    height={4}
                    rx={2}
                    ry={2}
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {/* Pot Body */}
                <Path
                    d="M 215 164 L 219 181 Q 220 185 224 185 L 234 185 Q 238 185 239 181 L 243 164"
                    stroke={color}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {/* Pot Decorative Details */}
                <Path d="M 218 171 L 240 171" stroke={color} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
                <Path d="M 220 177 L 238 177" stroke={color} strokeWidth={1} opacity={0.4} strokeLinecap="round" />

                {/* Main Stem */}
                <Path d="M 229 160 Q 229 140 227 122" stroke={color} strokeWidth={1.4} strokeLinecap="round" fill="none" />
                {/* Side Stems */}
                <Path d="M 228 145 Q 222 138 217 135" stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" />
                <Path d="M 228 138 Q 235 130 240 128" stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" />

                {/* Top Leaf Cluster */}
                <Path d="M 227 122 C 220 115 224 105 227 108 C 230 105 234 115 227 122 Z" stroke={color} strokeWidth={1.3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d="M 227 122 L 227 112" stroke={color} strokeWidth={1} opacity={0.6} />

                {/* Left Upper Leaf */}
                <Path d="M 228 135 C 215 130 212 118 222 120 C 228 122 228 132 228 135 Z" stroke={color} strokeWidth={1.3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d="M 228 135 C 222 130 220 124 220 124" stroke={color} strokeWidth={1} opacity={0.6} />

                {/* Left Lower Leaf */}
                <Path d="M 217 135 C 206 135 205 147 214 145 C 218 144 217 138 217 135 Z" stroke={color} strokeWidth={1.3} fill="none" strokeLinejoin="round" strokeLinecap="round" />

                {/* Right Leaf */}
                <Path d="M 240 128 C 252 122 253 134 242 136 C 238 137 239 130 240 128 Z" stroke={color} strokeWidth={1.3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d="M 230 138 Q 238 134 244 131" stroke={color} strokeWidth={1} opacity={0.6} />

                {/* Falling Leaf Accent */}
                <Path d="M 248 152 C 253 148 255 156 248 157 C 245 156 246 153 248 152 Z" stroke={color} strokeWidth={1} fill="none" opacity={0.7} strokeLinejoin="round" />

                {/* ==========================================
                    PAPER AIRPLANE & LOOPED TRAJECTORY
                   ========================================== */}
                <Path
                    d="M 125 140 C 120 90 170 80 175 110 C 180 140 140 130 160 90 C 180 50 210 50 230 40"
                    stroke={color}
                    strokeWidth={1.3}
                    strokeDasharray="3 4"
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.8}
                />
                <Path
                    d="M 230 40 L 275 22 L 250 58 L 240 43 Z"
                    stroke={color}
                    strokeWidth={1.6}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <Path d="M 240 43 L 275 22" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
                <Path d="M 230 40 L 250 58" stroke={color} strokeWidth={1.2} strokeLinecap="round" />

                {/* ==========================================
                    SPARKLES / ACCENT STARS (✦)
                   ========================================== */}
                <Path d="M 100 80 L 100 90 M 95 85 L 105 85" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
                <Path d="M 97 82 L 103 88 M 103 82 L 97 88" stroke={color} strokeWidth={0.8} strokeLinecap="round" opacity={0.5} />
                <Path d="M 180 40 L 180 48 M 176 44 L 184 44" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
                <Path d="M 275 80 L 275 88 M 271 84 L 279 84" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    doodleContainer: {
        height: 260,
        width: "100%",
        marginBottom: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
});