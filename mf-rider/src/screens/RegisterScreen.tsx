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

interface Props {
  onGoToLogin: () => void;
}

const mfRidesHero = require("../assets/mf1.png");

export function RegisterScreen({ onGoToLogin }: Props) {
  const { register, isSubmitting } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMessage(null);

    const cleanPhone = phoneNumber.replace(/\D/g, "");

    if (!fullName.trim() || !cleanPhone || !password) {
      setErrorMessage(
        "Please fill in your name, phone number, and password."
      );
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        phoneNumber: `+91${cleanPhone}`,
        email: email.trim() ? email.trim() : undefined,
        password,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 10);
    setPhoneNumber(digits);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        {/* BACKGROUND DECORATION */}
        <View style={styles.topCircle} />
        <View style={styles.bottomCircle} />

        {/* ========================================================= */}
        {/* HERO SECTION                                             */}
        {/* ========================================================= */}

        <View style={styles.heroSection}>
          {/* MF RIDES BRAND */}
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <Text style={styles.brandLogoText}>MF</Text>
            </View>

            <View style={styles.brandTextBlock}>
              <Text style={styles.brandName}>RIDES</Text>
              <Text style={styles.brandTagline}>Every ride. Every time.</Text>
            </View>

            <View style={styles.secureBadge}>
              <View style={styles.secureDot} />
              <Text style={styles.secureText}>SECURE</Text>
            </View>
          </View>

          {/* HERO: TEXT LEFT + CAR/BIKE VISUAL RIGHT */}
          <View style={styles.heroContent}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>WELCOME TO MF-RIDES</Text>
              <Text style={styles.title}>Create your</Text>
              <Text style={styles.titleGold}>journey account.</Text>
              <Text style={styles.subtitle}>
                Join MF-Rides and enjoy safe rides,
                {"\n"}
                simple bookings and rewards.
              </Text>
            </View>

            <View style={styles.heroVisual}>
              <Image
                source={mfRidesHero}
                style={styles.heroVisualImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* FORM CARD                                                */}
        {/* ========================================================= */}

        <View style={styles.formCard}>
          {/* ERROR */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>!</Text>
              </View>

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* ===================================================== */}
          {/* FULL NAME                                             */}
          {/* ===================================================== */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>FULL NAME</Text>

            <View style={styles.inputBox}>
              <View style={styles.inputIcon}>
                <Text style={styles.inputIconText}>●</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9A9BA2"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* ===================================================== */}
          {/* MOBILE NUMBER                                         */}
          {/* ===================================================== */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>MOBILE NUMBER</Text>

            <View style={styles.phoneBox}>
              {/* FIXED INDIA CODE */}
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>

                <Text style={styles.codeText}>
                  +91
                </Text>
              </View>

              <View style={styles.codeDivider} />

              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#9A9BA2"
                keyboardType="numeric"
                maxLength={10}
                editable={!isSubmitting}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.helperText}>
              Enter your 10-digit mobile number
            </Text>
          </View>

          {/* ===================================================== */}
          {/* EMAIL                                                  */}
          {/* ===================================================== */}

          <View style={styles.fieldContainer}>
            <View style={styles.optionalRow}>
              <Text style={styles.label}>
                EMAIL ADDRESS
              </Text>

              <Text style={styles.optional}>
                OPTIONAL
              </Text>
            </View>

            <View style={styles.inputBox}>
              <View style={styles.inputIcon}>
                <Text style={styles.inputIconText}>
                  @
                </Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9A9BA2"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* ===================================================== */}
          {/* PASSWORD                                               */}
          {/* ===================================================== */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              PASSWORD
            </Text>

            <View style={styles.inputBox}>
              <View style={styles.inputIcon}>
                <Text style={styles.inputIconText}>
                  ◆
                </Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor="#9A9BA2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!isSubmitting}
              />
            </View>

            <Text style={styles.helperText}>
              Use at least 8 characters
            </Text>
          </View>

          {/* ===================================================== */}
          {/* CREATE ACCOUNT                                        */}
          {/* ===================================================== */}

          <Pressable
            style={[
              styles.primaryButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  Create my account
                </Text>

                <View style={styles.buttonArrow}>
                  <Text style={styles.buttonArrowText}>
                    →
                  </Text>
                </View>
              </>
            )}
          </Pressable>

          {/* ===================================================== */}
          {/* GOOGLE SIGN UP                                        */}
          {/* ===================================================== */}

          <View style={styles.orRow}>
            <View style={styles.orLine} />

            <Text style={styles.orText}>
              OR
            </Text>

            <View style={styles.orLine} />
          </View>

          <Pressable
            style={styles.googleButton}
            disabled={isSubmitting}
          >
            <Text style={styles.googleIcon}>
              G
            </Text>

            <Text style={styles.googleText}>
              Sign up with Google
            </Text>
          </Pressable>

          {/* ===================================================== */}
          {/* LOGIN                                                  */}
          {/* ===================================================== */}

          <Pressable
            style={styles.loginButton}
            onPress={onGoToLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Text style={styles.loginLink}>
              Log in
            </Text>
          </Pressable>
        </View>

        {/* ========================================================= */}
        {/* BENEFITS                                                  */}
        {/* ========================================================= */}

        <View style={styles.benefitsCard}>
          <Benefit text="Verified partners" />
          <Benefit text="Secure rides" />
          <Benefit text="MF Rewards" />
        </View>

        {/* ========================================================= */}
        {/* MF RIDES FOOTER                                           */}
        {/* ========================================================= */}

        <View style={styles.mfFooter}>
          <View style={styles.footerBrandRow}>
            <View style={styles.footerLine} />

            <Text style={styles.footerBrand}>
              MF RIDES
            </Text>

            <View style={styles.footerLine} />
          </View>

          <Text style={styles.footerTagline}>
            Every ride. Every time.
          </Text>

          <Text style={styles.footerProtected}>
            ✓ Your information is protected by MF-Rides
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ================================================================ */
/* BENEFIT COMPONENT                                                */
/* ================================================================ */

function Benefit({ text }: { text: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Text style={styles.benefitCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.benefitText}>
        {text}
      </Text>
    </View>
  );
}

/* ================================================================ */
/* STYLES                                                           */
/* ================================================================ */

const styles = StyleSheet.create({
  /* ROOT */

  flex: {
    flex: 1,
    backgroundColor: "#FCFAF5",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    overflow: "hidden",
  },

  topCircle: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FFF0CE",
    top: -160,
    right: -100,
  },

  bottomCircle: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#F4E7D7",
    bottom: -100,
    left: -100,
  },

  /* ============================================================ */
  /* HERO                                                         */
  /* ============================================================ */

  heroSection: {
    marginBottom: 18,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
  },

  brandLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E3A321",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  brandLogoText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },

  brandTextBlock: {
    justifyContent: "center",
  },

  brandName: {
    color: "#171B2A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
  },

  brandTagline: {
    color: "#C88A1D",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 2,
  },

  secureBadge: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF5DD",
    borderWidth: 1,
    borderColor: "#F0D9A2",
  },

  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1B9A60",
    marginRight: 5,
  },

  secureText: {
    color: "#8A651E",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 190,
  },

  heroCopy: {
    flex: 1,
    paddingRight: 8,
    zIndex: 2,
  },

  heroVisual: {
    width: "50%",
    height: 215,
    overflow: "hidden",
    borderRadius: 24,
    marginLeft: 8,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  heroVisualImage: {
    width: "100%",
    height: "100%",
  },

  eyebrow: {
    color: "#B97813",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  title: {
    color: "#171B2A",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
  },

  titleGold: {
    color: "#C88A1D",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
  },

  subtitle: {
    color: "#747780",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },

  /* ============================================================ */
  /* FORM CARD                                                     */
  /* ============================================================ */

  formCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 26,
  padding: 22,
  borderWidth: 1,
  borderColor: "#E9E1D4",
  shadowColor: "#000000",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  shadowOffset: {
    width: 0,
    height: 8,
  },
  elevation: 3,
  marginTop: 4,
},

  /* ============================================================ */
  /* ERROR                                                         */
  /* ============================================================ */

  errorBanner: {
    backgroundColor: "#FFF0F0",
    borderRadius: 13,
    padding: 10,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD8D8",
  },

  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E85D67",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  errorIconText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  errorText: {
    flex: 1,
    color: "#C73E49",
    fontSize: 11,
    fontWeight: "700",
  },

  /* ============================================================ */
  /* FIELDS                                                        */
  /* ============================================================ */

  fieldContainer: {
    marginBottom: 14,
  },

  label: {
    color: "#4D4E55",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginBottom: 6,
  },

  inputBox: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E5E1D9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF1CF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  inputIconText: {
    color: "#B97913",
    fontSize: 12,
    fontWeight: "900",
  },

  input: {
    flex: 1,
    color: "#202431",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
    borderWidth: 0,

    // React Native Web compatible values
    outlineWidth: 0,
    outlineColor: "transparent",
  },

  /* ============================================================ */
  /* PHONE                                                         */
  /* ============================================================ */

  phoneBox: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E5E1D9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    width: 70,
  },

  flag: {
    fontSize: 15,
    marginRight: 5,
  },

  codeText: {
    color: "#34353C",
    fontSize: 12,
    fontWeight: "900",
  },

  codeDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#DDD8CF",
    marginRight: 10,
  },

  phoneInput: {
    flex: 1,
    color: "#202431",
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
    letterSpacing: 1,
    borderWidth: 0,

    outlineWidth: 0,
    outlineColor: "transparent",
  },

  helperText: {
    color: "#9A9BA2",
    fontSize: 8,
    marginTop: 5,
  },

  optionalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optional: {
    color: "#A27B35",
    fontSize: 7,
    fontWeight: "900",
    marginBottom: 6,
  },

  /* ============================================================ */
  /* PRIMARY BUTTON                                                */
  /* ============================================================ */

  primaryButton: {
    height: 55,
    borderRadius: 16,
    backgroundColor: "#E0A020",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 3,

    shadowColor: "#B87812",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.22,
    shadowRadius: 11,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  buttonArrow: {
    position: "absolute",
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonArrowText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  /* ============================================================ */
  /* GOOGLE                                                        */
  /* ============================================================ */

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E3DA",
  },

  orText: {
    color: "#777A83",
    fontSize: 9,
    fontWeight: "800",
    marginHorizontal: 12,
  },

  googleButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1D9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  googleIcon: {
    position: "absolute",
    left: 18,
    color: "#4285F4",
    fontSize: 19,
    fontWeight: "900",
  },

  googleText: {
    color: "#202431",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ============================================================ */
  /* LOGIN                                                         */
  /* ============================================================ */

  loginButton: {
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  loginText: {
    color: "#7B7D84",
    fontSize: 10,
  },

  loginLink: {
    color: "#B97813",
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 4,
  },

  /* ============================================================ */
  /* BENEFITS                                                      */
  /* ============================================================ */

  benefitsCard: {
    marginTop: 13,
    minHeight: 58,
    borderRadius: 17,
    backgroundColor: "#FFF7E8",
    borderWidth: 1,
    borderColor: "#F0E0C3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },

  benefit: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  benefitIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E6F6EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },

  benefitCheck: {
    color: "#188B5D",
    fontSize: 10,
    fontWeight: "900",
  },

  benefitText: {
    color: "#6E675B",
    fontSize: 7,
    fontWeight: "700",
    textAlign: "center",
  },

  /* ============================================================ */
  /* MF RIDES FOOTER                                               */
  /* ============================================================ */

  mfFooter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingBottom: 10,
  },

  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  footerLine: {
    width: 35,
    height: 2,
    backgroundColor: "#D99A22",
    marginHorizontal: 10,
  },

  footerBrand: {
    color: "#171B2A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
  },

  footerTagline: {
    color: "#C88A1D",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 4,
  },

  footerProtected: {
    color: "#92939A",
    fontSize: 7,
    marginTop: 7,
  },
});