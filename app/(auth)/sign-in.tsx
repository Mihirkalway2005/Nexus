import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { themes } from "@/constants/colors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/spacing";

WebBrowser.maybeCompleteAuthSession();

const C = themes.dark;

export default function SignIn() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  // Google OAuth
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [oauthLoading, setOauthLoading] = useState(false);

  // Email OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingOtp, setPendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = useCallback(async () => {
    setOauthLoading(true);
    setError("");
    try {
      const redirectUrl = Linking.createURL("/");
      const { createdSessionId, setActive: saOauth } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId) {
        await saOauth!({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Google sign-in failed.");
    } finally {
      setOauthLoading(false);
    }
  }, [startOAuthFlow]);

  const handleSendOtp = async () => {
    if (!isLoaded || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await signIn!.create({ identifier: email.trim() });
      await signIn!.prepareFirstFactor({ strategy: "email_code", emailAddressId: signIn!.supportedFirstFactors!.find((f: any) => f.strategy === "email_code")?.emailAddressId! });
      setPendingOtp(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isLoaded || !otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn!.attemptFirstFactor({ strategy: "email_code", code: otp.trim() });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.inner}>
        {/* Wordmark */}
        <View style={styles.wordmark}>
          <Text style={styles.wordmarkText}>Nexus</Text>
          <Text style={styles.tagline}>Your academic life, quietly in sync.</Text>
        </View>

        {/* Google OAuth — primary */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          disabled={oauthLoading}
          activeOpacity={0.85}
        >
          {oauthLoading ? (
            <ActivityIndicator color={C.textInverse} />
          ) : (
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email OTP — fallback */}
        {!pendingOtp ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="university@email.com"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSendOtp}
              disabled={loading || !email.trim()}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.otpHint}>Enter the 6-digit code sent to {email}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor={C.textMuted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPendingOtp(false)}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
          <Text style={styles.switchLink}>
            No account? <Text style={styles.switchLinkAccent}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: "center", gap: spacing.md },
  wordmark: { alignItems: "center", marginBottom: spacing.xl },
  wordmarkText: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: C.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: fontSize.sm, color: C.textMuted, marginTop: spacing.xs },
  googleBtn: {
    backgroundColor: C.textPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  googleBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: C.textInverse },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: fontSize.xs, color: C.textMuted },
  input: {
    backgroundColor: C.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: C.textPrimary,
  },
  otpInput: { textAlign: "center", fontSize: fontSize.xl, letterSpacing: 8 },
  otpHint: { fontSize: fontSize.sm, color: C.textSecondary, textAlign: "center" },
  primaryBtn: {
    backgroundColor: C.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: C.accentText },
  error: { fontSize: fontSize.sm, color: C.danger, textAlign: "center" },
  backLink: { fontSize: fontSize.sm, color: C.textMuted, textAlign: "center" },
  switchLink: { fontSize: fontSize.sm, color: C.textMuted, textAlign: "center", marginTop: spacing.sm },
  switchLinkAccent: { color: C.accent, fontWeight: fontWeight.semibold },
});
