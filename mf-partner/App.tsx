import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const API_BASE_URL = "http://localhost:4000";

type RideStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

const ACTIVE_STATUSES: RideStatus[] = [
  "ACCEPTED",
  "STARTED",
];

interface Ride {
  id: string;
  status: RideStatus;
  passengerId: string;
  riderId: string | null;

  pickupAddress: string;
  destinationAddress: string;

  requestedAt: string;

  passenger?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
  };

  rider?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
  } | null;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      fullName: string;
      phoneNumber: string;
      role: string;
    };
    token: string;
  };
}

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [token, setToken] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [partnerName, setPartnerName] = useState("");

  const [rides, setRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] =
    useState<Ride | null>(null);

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [message, setMessage] = useState("");

  const activeRideRef =
    useRef<Ride | null>(null);

  useEffect(() => {
    activeRideRef.current = activeRide;
  }, [activeRide]);

  // ============================================================
  // LOAD PARTNER'S ACTIVE RIDE
  // ============================================================

  async function loadMyActiveRide(
    authToken = token,
  ) {
    if (!authToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rides/mine`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const payload = await response.json();

      console.log(
        "MY RIDES RESPONSE:",
        payload,
      );

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            "Unable to load my rides.",
        );
      }

      const myRides: Ride[] =
        payload.data?.rides ?? [];

      // Partner-side active ride only.
      const currentActiveRide =
        myRides.find(
          (ride) =>
            ride.riderId === partnerId &&
            ACTIVE_STATUSES.includes(
              ride.status,
            ),
        ) ?? null;

      if (currentActiveRide) {
        setActiveRide(currentActiveRide);

        setRides((current) =>
          current.filter(
            (ride) =>
              ride.id !== currentActiveRide.id,
          ),
        );

        return currentActiveRide;
      }

      return null;
    } catch (error) {
      console.error(
        "MY ACTIVE RIDE ERROR:",
        error,
      );

      return null;
    }
  }

  // ============================================================
  // CREATE PARTNER ACCOUNT
  // ============================================================

  async function registerPartner() {
    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (phoneNumber.trim().length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phoneNumber: `+91${phoneNumber.trim()}`,
            email: email.trim().toLowerCase(),
            password,
            role: "PARTNER",
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.message || "Unable to create Partner account.",
        );
      }

      const user = payload.data.user;
      const receivedToken = payload.data.token;

      if (user.role !== "PARTNER") {
        throw new Error("Partner account could not be created.");
      }

      setToken(receivedToken);
      setPartnerId(user.id);
      setPartnerName(user.fullName);
      setLoggedIn(true);
      setMessage("✅ Partner account created successfully!");

      setPassword("");
      setConfirmPassword("");

      await loadAvailableRides(receivedToken);
    } catch (error) {
      console.error("PARTNER REGISTER ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create Partner account.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function login() {
    if (
      !phoneNumber.trim() ||
      !password.trim()
    ) {
      setMessage(
        "Please enter phone number and password.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: `+91${phoneNumber.trim()}`,
            password,
          }),
        },
      );

      const payload: LoginResponse =
        await response.json();

      console.log(
        "LOGIN RESPONSE:",
        payload,
      );

      if (
        !response.ok ||
        !payload.success ||
        !payload.data
      ) {
        throw new Error(
          payload.message ||
            "Login failed.",
        );
      }

      const user = payload.data.user;
      const receivedToken =
        payload.data.token;

      if (user.role !== "PARTNER") {
        throw new Error(
          "This account is not a PARTNER account.",
        );
      }

      setToken(receivedToken);
      setPartnerId(user.id);
      setPartnerName(user.fullName);
      setLoggedIn(true);

      setMessage(
        "✅ Partner login successful!",
      );

      // --------------------------------------------------------
      // FIRST: restore existing accepted/started ride
      // --------------------------------------------------------

      let existingRide: Ride | null =
        null;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/rides/mine`,
          {
            method: "GET",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${receivedToken}`,
            },
          },
        );

        const myPayload =
          await response.json();

        console.log(
          "RESTORE ACTIVE RIDE RESPONSE:",
          myPayload,
        );

        if (
          response.ok &&
          myPayload.success
        ) {
          const myRides: Ride[] =
            myPayload.data?.rides ?? [];

          existingRide =
            myRides.find(
              (ride) =>
                ride.riderId === user.id &&
                ACTIVE_STATUSES.includes(
                  ride.status,
                ),
            ) ?? null;

          if (existingRide) {
            setActiveRide(existingRide);

            setMessage(
              existingRide.status ===
              "ACCEPTED"
                ? "🔐 Active ride restored. Enter passenger OTP to start."
                : "🚗 Active ride restored.",
            );
          }
        }
      } catch (error) {
        console.error(
          "RESTORE ACTIVE RIDE ERROR:",
          error,
        );
      }

      // --------------------------------------------------------
      // Only show available rides when no active ride exists
      // --------------------------------------------------------

      if (!existingRide) {
        await loadAvailableRides(
          receivedToken,
        );
      }
    } catch (error) {
      console.error(
        "PARTNER LOGIN ERROR:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to login.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD AVAILABLE RIDES
  // ============================================================

  async function loadAvailableRides(
    authToken = token,
  ) {
    if (!authToken) {
      setMessage(
        "Please login as a Partner first.",
      );
      return;
    }

    // Don't show available rides over an active ride.
    if (activeRideRef.current) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rides/available`,
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const payload =
        await response.json();

      console.log(
        "AVAILABLE RIDES RESPONSE:",
        payload,
      );

      if (
        !response.ok ||
        !payload.success
      ) {
        throw new Error(
          payload.message ||
            "Unable to load rides.",
        );
      }

      const availableRides: Ride[] =
        payload.data?.rides ?? [];

      setRides(availableRides);

      if (
        availableRides.length === 0
      ) {
        setMessage(
          "No available ride requests.",
        );
      } else {
        setMessage(
          `${availableRides.length} ride request(s) found.`,
        );
      }
    } catch (error) {
      console.error(
        "AVAILABLE RIDES ERROR:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load available rides.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // ACTIVE RIDE POLLING
  // ============================================================

  useEffect(() => {
    if (
      !loggedIn ||
      !token ||
      !activeRide
    ) {
      return;
    }

    const interval =
      setInterval(async () => {
        try {
          const response =
            await fetch(
              `${API_BASE_URL}/api/rides/${activeRide.id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization: `Bearer ${token}`,
                },
              },
            );

          const payload =
            await response.json();

          console.log(
            "ACTIVE RIDE STATUS:",
            payload,
          );

          if (
            response.ok &&
            payload.success &&
            payload.data?.ride
          ) {
            const updatedRide =
              payload.data.ride as Ride;

            if (
              ACTIVE_STATUSES.includes(
                updatedRide.status,
              )
            ) {
              setActiveRide(
                updatedRide,
              );
            } else {
              setActiveRide(
                updatedRide,
              );
            }
          }
        } catch (error) {
          console.error(
            "ACTIVE RIDE POLL ERROR:",
            error,
          );
        }
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    loggedIn,
    token,
    activeRide?.id,
  ]);

  // ============================================================
  // ACCEPT RIDE
  // ============================================================

  async function acceptRide(
    rideId: string,
  ) {
    if (!token) {
      setMessage(
        "Please login as a Partner first.",
      );
      return;
    }

    setLoading(true);
    setMessage(
      "Accepting ride...",
    );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/rides/${rideId}/accept`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

      const payload =
        await response.json();

      console.log(
        "ACCEPT RIDE RESPONSE:",
        payload,
      );

      if (
        !response.ok ||
        !payload.success
      ) {
        throw new Error(
          payload.message ||
            "Unable to accept ride.",
        );
      }

      const acceptedRide =
        payload.data?.ride as Ride;

      setRides((current) =>
        current.filter(
          (ride) =>
            ride.id !== rideId,
        ),
      );

      if (acceptedRide) {
        setActiveRide(
          acceptedRide,
        );
      }

      setOtp("");

      setMessage(
        "✅ Ride accepted. Ask the passenger for the 4-digit OTP.",
      );
    } catch (error) {
      console.error(
        "ACCEPT RIDE ERROR:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to accept ride.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // START RIDE WITH OTP
  // ============================================================

  async function startRide(
    rideId: string,
  ) {
    if (!token) {
      setMessage(
        "Please login as a Partner first.",
      );
      return;
    }

    const cleanOtp =
      otp.trim();

    if (
      !/^\d{4}$/.test(
        cleanOtp,
      )
    ) {
      setMessage(
        "Please enter the 4-digit passenger OTP.",
      );
      return;
    }

    setLoading(true);
    setMessage(
      "Verifying OTP...",
    );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/rides/${rideId}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              otp: cleanOtp,
            }),
          },
        );

      const payload =
        await response.json();

      console.log(
        "START RIDE RESPONSE:",
        payload,
      );

      if (
        !response.ok ||
        !payload.success
      ) {
        throw new Error(
          payload.message ||
            "Unable to start ride.",
        );
      }

      if (payload.data?.ride) {
        setActiveRide(
          payload.data.ride,
        );
      }

      setOtp("");

      setMessage(
        "🚗 OTP verified. Ride started!",
      );
    } catch (error) {
      console.error(
        "START RIDE ERROR:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start ride.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // COMPLETE RIDE
  // ============================================================

  async function completeRide(
    rideId: string,
  ) {
    if (!token) {
      setMessage(
        "Please login as a Partner first.",
      );
      return;
    }

    setLoading(true);
    setMessage(
      "Completing ride...",
    );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/rides/${rideId}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

      const payload =
        await response.json();

      console.log(
        "COMPLETE RIDE RESPONSE:",
        payload,
      );

      if (
        !response.ok ||
        !payload.success
      ) {
        throw new Error(
          payload.message ||
            "Unable to complete ride.",
        );
      }

      if (payload.data?.ride) {
        setActiveRide(
          payload.data.ride,
        );
      }

      setMessage(
        "🏁 Ride completed!",
      );
    } catch (error) {
      console.error(
        "COMPLETE RIDE ERROR:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete ride.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FINISH COMPLETED RIDE
  // ============================================================

  async function finishActiveRide() {
    setActiveRide(null);
    setOtp("");

    await loadAvailableRides();
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  function logout() {
    setToken("");
    setPartnerId("");
    setPartnerName("");
    setRides([]);
    setActiveRide(null);
    setOtp("");
    setLoggedIn(false);
    setMessage("");
    setPhoneNumber("");
    setPassword("");
  }

  // ============================================================
  // LOGIN SCREEN
  // ============================================================

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.loginContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroSection}>
            <Image
              source={require("./assets/partner-hero-full.png")}
              style={styles.heroBackground}
              resizeMode="cover"
            />

            <View style={styles.heroSecurePill}>
              <View style={styles.heroSecureDot} />
              <Text style={styles.heroSecureText}>SECURE</Text>
            </View>

            <View style={styles.heroTextBlock}>
                <Text style={styles.heroEyebrow}>
                  WELCOME TO MF-RIDES
                </Text>

                <Text style={styles.heroTitle}>
                  Partner
                </Text>

                <Text style={styles.heroTitleGold}>
                  journey starts here.
                </Text>

                <Text style={styles.heroSubtitle}>
                  Login to receive nearby ride requests,
                  {`\n`}
                  accept trips and earn with MF-Rides.
                </Text>

                <View style={styles.heroBenefits}>
                  <View style={styles.heroBenefit}>
                    <View style={styles.heroBenefitIcon}>
                      <Text style={styles.heroBenefitIconText}>₹</Text>
                    </View>
                    <Text style={styles.heroBenefitText}>
                      More{`\n`}Earnings
                    </Text>
                  </View>

                  <View style={styles.heroBenefit}>
                    <View style={styles.heroBenefitIcon}>
                      <Text style={styles.heroBenefitIconText}>●</Text>
                    </View>
                    <Text style={styles.heroBenefitText}>
                      Nearby{`\n`}Requests
                    </Text>
                  </View>

                  <View style={styles.heroBenefit}>
                    <View style={styles.heroBenefitIcon}>
                      <Text style={styles.heroBenefitIconText}>●●</Text>
                    </View>
                    <Text style={styles.heroBenefitText}>
                      Be Your{`\n`}Own Boss
                    </Text>
                  </View>
                </View>
              </View>
            </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardEyebrow}>
              {authMode === "login" ? "PARTNER ACCESS" : "JOIN MF-RIDES"}
            </Text>

            <Text style={styles.loginTitle}>
              {authMode === "login"
                ? "Welcome Partner 👋"
                : "Create Partner Account"}
            </Text>

            <Text style={styles.loginSubtitle}>
              {authMode === "login"
                ? "Sign in to manage nearby ride requests."
                : "Create your Partner account and start accepting rides."}
            </Text>

            {authMode === "register" ? (
              <>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.simpleField}>
                  <Text style={styles.fieldIcon}>●</Text>
                  <TextInput
                    style={styles.simpleInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9B9DA7"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.simpleField}>
                  <Text style={styles.fieldIcon}>@</Text>
                  <TextInput
                    style={styles.simpleInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#9B9DA7"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            ) : null}

            <Text style={styles.label}>MOBILE NUMBER</Text>

            <View style={styles.phoneField}>
              <View style={styles.countryCode}>
                <Text style={styles.countryFlag}>IN</Text>
                <Text style={styles.countryPlus}>+91</Text>
              </View>

              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#9B9DA7"
                value={phoneNumber}
                onChangeText={(value) =>
                  setPhoneNumber(
                    value.replace(/[^0-9]/g, "").slice(0, 10),
                  )
                }
                keyboardType="number-pad"
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.helperText}>
              +91 is already selected. Enter only your 10-digit number.
            </Text>

            <Text style={styles.label}>PASSWORD</Text>

            <View style={styles.passwordField}>
              <Text style={styles.fieldIcon}>◆</Text>

              <TextInput
                style={styles.passwordInput}
                placeholder={
                  authMode === "login"
                    ? "Enter your password"
                    : "Create password (8+ characters)"
                }
                placeholderTextColor="#9B9DA7"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {authMode === "register" ? (
              <>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>

                <View style={styles.passwordField}>
                  <Text style={styles.fieldIcon}>◆</Text>

                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9B9DA7"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            ) : null}

            <Pressable
              style={[
                styles.loginButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={
                authMode === "login"
                  ? login
                  : registerPartner
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    {authMode === "login"
                      ? "Partner Login"
                      : "Create Partner Account"}
                  </Text>
                  <View style={styles.buttonArrow}>
                    <Text style={styles.buttonArrowText}>→</Text>
                  </View>
                </>
              )}
            </Pressable>

            {authMode === "login" ? (
              <>
                <Pressable
                  style={styles.forgotButton}
                  onPress={() =>
                    setMessage(
                      "Password reset is not enabled yet. Please use your existing Partner password or create a new Partner account.",
                    )
                  }
                >
                  <Text style={styles.forgotText}>
                    Forgot password?
                  </Text>
                </Pressable>

                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>
                    New to MF-Rides?
                  </Text>
                  <Pressable
                    onPress={() => {
                      setAuthMode("register");
                      setMessage("");
                      setPassword("");
                    }}
                  >
                    <Text style={styles.switchLink}>
                      Create Partner Account
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  Already have a Partner account?
                </Text>
                <Pressable
                  onPress={() => {
                    setAuthMode("login");
                    setMessage("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <Text style={styles.switchLink}>
                    Login
                  </Text>
                </Pressable>
              </View>
            )}

            {message ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text>✓</Text>
              </View>
              <Text style={styles.featureTitle}>Verified</Text>
              <Text style={styles.featureText}>Partners</Text>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text>⌁</Text>
              </View>
              <Text style={styles.featureTitle}>Nearby</Text>
              <Text style={styles.featureText}>Ride requests</Text>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text>₹</Text>
              </View>
              <Text style={styles.featureTitle}>Simple</Text>
              <Text style={styles.featureText}>Partner earnings</Text>
            </View>
          </View>

          <Text style={styles.footerText}>
            Your account is protected with secure verification 🔒
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // PARTNER HOME
  // ============================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={styles.headerRow}
        >
          <View>
            <Text style={styles.logo}>
              MF Rides
            </Text>

            <Text style={styles.title}>
              MF Partner
            </Text>

            <Text
              style={styles.subtitle}
            >
              Welcome, {partnerName}
            </Text>
          </View>

          <Pressable
            style={
              styles.logoutButton
            }
            onPress={logout}
          >
            <Text
              style={styles.logoutText}
            >
              Logout
            </Text>
          </Pressable>
        </View>

        {message ? (
          <View
            style={styles.messageBox}
          >
            <Text
              style={
                styles.messageText
              }
            >
              {message}
            </Text>
          </View>
        ) : null}

        {/* ======================================================
            ACTIVE RIDE
        ======================================================= */}

        {activeRide ? (
          <View
            style={styles.rideCard}
          >
            <View
              style={styles.statusRow}
            >
              <Text
                style={styles.status}
              >
                {activeRide.status}
              </Text>

              <Text
                style={styles.time}
              >
                {new Date(
                  activeRide.requestedAt,
                ).toLocaleTimeString()}
              </Text>
            </View>

            <Text
              style={styles.passenger}
            >
              Passenger:{" "}
              {activeRide.passenger
                ?.fullName ??
                "Passenger"}
            </Text>

            <Text
              style={
                styles.locationLabel
              }
            >
              PICKUP
            </Text>

            <Text
              style={styles.location}
            >
              {activeRide.pickupAddress}
            </Text>

            <Text
              style={
                styles.locationLabel
              }
            >
              DESTINATION
            </Text>

            <Text
              style={styles.location}
            >
              {activeRide.destinationAddress}
            </Text>

            {/* ==================================================
                ACCEPTED + OTP
            =================================================== */}

            {activeRide.status ===
            "ACCEPTED" ? (
              <View
                style={styles.otpBox}
              >
                <Text
                  style={styles.otpTitle}
                >
                  🔐 Passenger OTP
                </Text>

                <Text
                  style={
                    styles.otpSubtitle
                  }
                >
                  Ask the passenger for
                  the 4-digit OTP shown in
                  their MF Rider app.
                </Text>

                <TextInput
                  style={
                    styles.otpInput
                  }
                  placeholder="Enter 4-digit OTP"
                  placeholderTextColor="#888"
                  value={otp}
                  onChangeText={(
                    value,
                  ) => {
                    const digits =
                      value
                        .replace(
                          /[^0-9]/g,
                          "",
                        )
                        .slice(0, 4);

                    setOtp(digits);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <Pressable
                  style={[
                    styles.acceptButton,
                    otp.length !== 4 &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    startRide(
                      activeRide.id,
                    )
                  }
                  disabled={
                    loading ||
                    otp.length !== 4
                  }
                >
                  <Text
                    style={
                      styles.acceptText
                    }
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify OTP & Start Ride"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* ==================================================
                STARTED
            =================================================== */}

            {activeRide.status ===
            "STARTED" ? (
              <Pressable
                style={
                  styles.acceptButton
                }
                onPress={() =>
                  completeRide(
                    activeRide.id,
                  )
                }
                disabled={loading}
              >
                <Text
                  style={
                    styles.acceptText
                  }
                >
                  {loading
                    ? "Please wait..."
                    : "Complete Ride"}
                </Text>
              </Pressable>
            ) : null}

            {/* ==================================================
                COMPLETED
            =================================================== */}

            {activeRide.status ===
            "COMPLETED" ? (
              <>
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  🏁 Ride Completed
                </Text>

                <Pressable
                  style={
                    styles.refreshButton
                  }
                  onPress={
                    finishActiveRide
                  }
                >
                  <Text
                    style={
                      styles.refreshText
                    }
                  >
                    Back to Available Rides
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : (
          <>
            {/* ==================================================
                AVAILABLE RIDES
            =================================================== */}

            <Pressable
              style={
                styles.refreshButton
              }
              onPress={() =>
                loadAvailableRides()
              }
              disabled={loading}
            >
              <Text
                style={
                  styles.refreshText
                }
              >
                {loading
                  ? "Loading..."
                  : "Refresh Ride Requests"}
              </Text>
            </Pressable>

            {loading ? (
              <ActivityIndicator
                size="large"
                style={styles.loader}
              />
            ) : null}

            {!loading &&
            rides.length === 0 ? (
              <View
                style={styles.emptyBox}
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No ride requests
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  New rider requests will
                  appear here.
                </Text>
              </View>
            ) : null}

            {rides.map((ride) => (
              <View
                key={ride.id}
                style={styles.rideCard}
              >
                <View
                  style={
                    styles.statusRow
                  }
                >
                  <Text
                    style={styles.status}
                  >
                    {ride.status}
                  </Text>

                  <Text
                    style={styles.time}
                  >
                    {new Date(
                      ride.requestedAt,
                    ).toLocaleTimeString()}
                  </Text>
                </View>

                <Text
                  style={
                    styles.passenger
                  }
                >
                  Passenger:{" "}
                  {ride.passenger
                    ?.fullName ??
                    "Passenger"}
                </Text>

                <Text
                  style={
                    styles.locationLabel
                  }
                >
                  PICKUP
                </Text>

                <Text
                  style={styles.location}
                >
                  {ride.pickupAddress}
                </Text>

                <Text
                  style={
                    styles.locationLabel
                  }
                >
                  DESTINATION
                </Text>

                <Text
                  style={styles.location}
                >
                  {ride.destinationAddress}
                </Text>

                <Pressable
                  style={
                    styles.acceptButton
                  }
                  onPress={() =>
                    acceptRide(
                      ride.id,
                    )
                  }
                  disabled={loading}
                >
                  <Text
                    style={
                      styles.acceptText
                    }
                  >
                    {loading
                      ? "Please wait..."
                      : "Accept Ride"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const colors = {
  background: "#FBF8F1",
  card: "#FFFFFF",
  gold: "#E3A321",
  goldDark: "#C98A13",
  goldSoft: "#FFF1C9",
  navy: "#172033",
  muted: "#747887",
  border: "#E7E0D4",
  soft: "#F6F2EA",
  green: "#159A62",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loginContent: {
    paddingTop: 0,
    paddingBottom: 36,
  },

  heroSection: {
    width: "100%",
    height: 500,
    backgroundColor: "#FFF4D5",
    overflow: "hidden",
    position: "relative",
  },

  heroBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },

  heroCopy: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 48,
    paddingTop: 32,
  },

  heroSecurePill: {
    position: "absolute",
    top: 32,
    right: 34,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 10,
    shadowColor: "#8D7B55",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  heroSecureDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#16A66A",
    marginRight: 8,
  },

  heroSecureText: {
    color: "#14213D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  heroTextBlock: {
    position: "absolute",
    left: 48,
    top: 118,
    width: 610,
    maxWidth: "50%",
  },

  heroEyebrow: {
    color: "#C47D00",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 8,
  },

  heroTitle: {
    color: "#14213D",
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "900",
  },

  heroTitleGold: {
    color: "#D28A00",
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "900",
  },

  heroSubtitle: {
    color: "#536174",
    fontSize: 18,
    lineHeight: 27,
    marginTop: 16,
    width: 470,
  },

  heroBenefits: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    gap: 34,
  },

  heroBenefit: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroBenefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFC21C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  heroBenefitIconText: {
    color: "#14213D",
    fontSize: 20,
    fontWeight: "900",
  },

  heroBenefitText: {
    color: "#14213D",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },

  loginCard: {
    marginHorizontal: 44,
    marginTop: -18,
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#B79B68",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  cardEyebrow: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  loginTitle: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 7,
  },

  loginSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 18,
  },

  label: {
    color: "#555967",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 7,
  },

  phoneField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: "#FCFBF8",
  },

  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: 32,
  },

  countryFlag: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
    marginRight: 6,
  },

  countryPlus: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "800",
  },

  phoneInput: {
    flex: 1,
    color: colors.navy,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    outlineStyle: "none",
  } as any,

  helperText: {
    color: "#9A9CA5",
    fontSize: 10,
    marginTop: 6,
  },

  passwordField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: "#FCFBF8",
  },

  fieldIcon: {
    color: colors.goldDark,
    fontSize: 12,
    marginLeft: 15,
    marginRight: 4,
  },

  passwordInput: {
    flex: 1,
    color: colors.navy,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 14,
    outlineStyle: "none",
  } as any,

  simpleField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: "#FCFBF8",
  },

  simpleInput: {
    flex: 1,
    color: colors.navy,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },

  forgotButton: {
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 5,
  },

  forgotText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: "800",
  },

  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 5,
  },

  switchText: {
    color: colors.muted,
    fontSize: 11,
  },

  switchLink: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: "900",
  },

  loginButton: {
    minHeight: 58,
    marginTop: 22,
    borderRadius: 17,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    shadowColor: colors.goldDark,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  buttonArrow: {
    position: "absolute",
    right: 7,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonArrowText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },

  messageBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },

  messageText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  featureRow: {
    marginTop: 22,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F0DFC0",
    borderRadius: 18,
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },

  featureItem: {
    flex: 1,
    alignItems: "center",
  },

  featureIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  featureTitle: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
  },

  featureText: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
  },

  featureDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5D5B5",
  },

  footerText: {
    color: "#8A8C94",
    fontSize: 10,
    textAlign: "center",
    marginTop: 18,
  },

  // ============================================================
  // PARTNER HOME
  // ============================================================

  content: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  logo: {
    color: colors.goldDark,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 5,
    marginBottom: 18,
  },

  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 14,
  },

  logoutText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "800",
  },

  refreshButton: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  refreshText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  loader: {
    marginVertical: 24,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 8,
    color: colors.muted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },

  rideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#B79B68",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  status: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  time: {
    color: "#8B8D96",
    fontSize: 11,
  },

  passenger: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },

  locationLabel: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 8,
  },

  location: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 21,
  },

  otpBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 17,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F0DFC0",
  },

  otpTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "900",
  },

  otpSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },

  otpInput: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
    color: colors.navy,
    outlineStyle: "none",
  } as any,

  acceptButton: {
    backgroundColor: colors.gold,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.45,
  },

  acceptText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});