import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ApiError, useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

interface Props {
  onGoToRegister: () => void;
  onLoginSuccess: () => void;
}

export function LoginScreen({
  onGoToRegister,
  onLoginSuccess,
}: Props) {
  const { login, isSubmitting } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handlePhoneChange(text: string) {
    const digitsOnly = text.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(digitsOnly);
    setErrorMessage(null);
  }

  async function handleSubmit() {
    setErrorMessage(null);

    const cleanPhone = phoneNumber.trim();

    if (!cleanPhone || !password) {
      setErrorMessage(
        "Please enter your phone number and password."
      );
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMessage(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      await login({
        phoneNumber: `+91${cleanPhone}`,
        password,
      });

      // Login successful
      onLoginSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>

          {/* =========================
              LEFT BRAND PANEL
          ========================== */}

          <View style={styles.leftPanel}>

            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/mf3.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.leftTitle}>
              MF RIDES
            </Text>

            <Text style={styles.leftHighlight}>
              Unlimited
            </Text>

            <Text style={styles.leftTitle}>
              journeys.
            </Text>

            <Text style={styles.leftDescription}>
              Ride, travel and explore with MF Rides.
              {"\n"}
              One app for your everyday journeys.
            </Text>

            <View style={styles.featureRow}>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  Safe Rides
                </Text>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  Easy Booking
                </Text>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  Secure Payments
                </Text>
              </View>

            </View>

            <Text style={styles.tagline}>
              RIDE • TRAVEL • EXPLORE
            </Text>

          </View>

          {/* =========================
              RIGHT LOGIN PANEL
          ========================== */}

          <View style={styles.rightPanel}>

            <View style={styles.loginHeader}>

              <Text style={styles.loginEyebrow}>
                WELCOME BACK
              </Text>

              <Text style={styles.loginTitle}>
                Login to MF Rides
              </Text>

              <Text style={styles.loginSubtitle}>
                Enter your details to continue your journey.
              </Text>

            </View>

            {/* ERROR */}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* PHONE */}

            <Text style={styles.label}>
              Mobile number
            </Text>

            <View style={styles.phoneBox}>

              <Text style={styles.countryCode}>
                +91
              </Text>

              <View style={styles.divider} />

              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#999999"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType={
                  Platform.OS === "web"
                    ? "numeric"
                    : "number-pad"
                }
                inputMode="numeric"
                maxLength={10}
                editable={!isSubmitting}
              />

            </View>

            {/* PASSWORD */}

            <View style={styles.passwordHeader}>

              <Text style={styles.label}>
                Password
              </Text>

              <Pressable
                onPress={() =>
                  setErrorMessage(
                    "Password recovery will be added next."
                  )
                }
              >
                <Text style={styles.forgot}>
                  Forgot password?
                </Text>
              </Pressable>

            </View>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage(null);
              }}
              secureTextEntry
              editable={!isSubmitting}
              autoComplete="password"
            />

            {/* LOGIN BUTTON */}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
                isSubmitting && styles.disabled,
              ]}
            >

              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    Login
                  </Text>

                  <Text style={styles.loginArrow}>
                    →
                  </Text>
                </>
              )}

            </Pressable>

            {/* REGISTER */}

            <View style={styles.registerRow}>

              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <Pressable
                onPress={onGoToRegister}
                disabled={isSubmitting}
              >
                <Text style={styles.registerLink}>
                  Create account
                </Text>
              </Pressable>

            </View>

            {/* SECURITY */}

            <View style={styles.securityBox}>

              <Text style={styles.securityIcon}>
                🔒
              </Text>

              <View style={{ flex: 1 }}>

                <Text style={styles.securityTitle}>
                  Secure Login
                </Text>

                <Text style={styles.securityText}>
                  Your account information is protected
                  with secure authentication.
                </Text>

              </View>

            </View>

          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F5EE",
  },

  scroll: {
    flexGrow: 1,
  },

  page: {
    flex: 1,
    minHeight: 700,
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: 24,
    flexDirection: "row",
    gap: 24,
  },

  /* =========================
     LEFT PANEL
  ========================== */

  leftPanel: {
    flex: 1,
    minHeight: 650,
    borderRadius: 30,
    backgroundColor: "#FFF0C9",
    padding: 42,
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8D8B7",
  },

  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E7A321",
    overflow: "hidden",
  },

  logo: {
    width: 138,
    height: 138,
  },

  leftTitle: {
    color: "#151A2B",
    fontSize: 46,
    lineHeight: 48,
    fontWeight: "900",
  },

  leftHighlight: {
    color: "#D99812",
    fontSize: 46,
    lineHeight: 48,
    fontWeight: "900",
  },

  leftDescription: {
    maxWidth: 430,
    marginTop: 18,
    color: "#686A72",
    fontSize: 15,
    lineHeight: 23,
  },

  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 28,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  featureIcon: {
    color: "#E3A321",
    fontWeight: "900",
    marginRight: 6,
  },

  featureText: {
    color: "#171B2A",
    fontSize: 11,
    fontWeight: "800",
  },

  tagline: {
    marginTop: 38,
    color: "#8C6A25",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 3,
  },

  /* =========================
     RIGHT PANEL
  ========================== */

  rightPanel: {
    flex: 0.82,
    minHeight: 650,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 42,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6DED1",
  },

  loginHeader: {
    marginBottom: 28,
  },

  loginEyebrow: {
    color: "#D99812",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 7,
  },

  loginTitle: {
    color: "#171B2A",
    fontSize: 31,
    fontWeight: "900",
  },

  loginSubtitle: {
    marginTop: 8,
    color: "#777982",
    fontSize: 14,
    lineHeight: 20,
  },

  errorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },

  errorText: {
    color: "#C0392B",
    fontSize: 12,
    fontWeight: "700",
  },

  label: {
    color: "#171B2A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },

  phoneBox: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E2DACD",
    borderRadius: 15,
    backgroundColor: "#FFFEFB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },

  countryCode: {
    paddingHorizontal: 15,
    color: "#171B2A",
    fontSize: 14,
    fontWeight: "900",
  },

  divider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2DACD",
  },

  phoneInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    color: "#171B2A",
    fontSize: 14,
  },

  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  forgot: {
    color: "#C88A1D",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
  },

  passwordInput: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E2DACD",
    borderRadius: 15,
    backgroundColor: "#FFFEFB",
    paddingHorizontal: 15,
    color: "#171B2A",
    fontSize: 14,
    marginBottom: 20,
  },

  loginButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: "#E3A321",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#C88A1D",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  disabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  loginArrow: {
    position: "absolute",
    right: 18,
    color: "#FFFFFF",
    fontSize: 22,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  registerText: {
    color: "#777982",
    fontSize: 12,
  },

  registerLink: {
    color: "#C88A1D",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },

  securityBox: {
    marginTop: 28,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8F6F0",
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    fontSize: 19,
    marginRight: 10,
  },

  securityTitle: {
    color: "#171B2A",
    fontSize: 11,
    fontWeight: "900",
  },

  securityText: {
    marginTop: 3,
    color: "#888A91",
    fontSize: 10,
    lineHeight: 15,
  },
});