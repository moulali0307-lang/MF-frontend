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

// 2030-ready visual asset: replace this URL with the licensed MF Rides vehicle asset
// when the final production brand pack is available.
const PARTNER_CAR_IMAGE_URL =
  "https://images.rawpixel.com/image_png_social_landscape/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvcC0zZC1wc2QzZDItY2FyLWpqLTAwNTEucG5n.png?s=8mo8-Z6lU0YxULFeraV8x_Gxb97cQKGV48M6sz--e9w";

// Partner Page 2 visual carousel assets. These are public photo URLs and can
// later be replaced with licensed MF Rides brand assets without changing the UI.
const PARTNER_HERO_IMAGES = [
  {
    type: "Car",
    title: "City rides",
    subtitle: "Move more people. Build more earnings.",
    uri: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85",
  },
  {
    type: "Bike",
    title: "Quick rides",
    subtitle: "Fast city trips and flexible earning opportunities.",
    uri: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=85",
  },
  {
    type: "Auto",
    title: "Everyday rides",
    subtitle: "Affordable mobility for every neighbourhood.",
    uri: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85",
  },
  {
    type: "Van",
    title: "Group travel",
    subtitle: "More seats. More routes. More opportunity.",
    uri: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=85",
  },
  {
    type: "Bus",
    title: "Intercity",
    subtitle: "Connect cities and discover longer journeys.",
    uri: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=85",
  },
  {
    type: "Tour",
    title: "Explore India",
    subtitle: "Turn every journey into a new opportunity.",
    uri: "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1400&q=85",
  },
];

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


interface JourneyChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
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

  // Page 1 remains the existing Partner dashboard. Page 2 is the new
  // premium travel/earning experience requested for the Partner app.
  const [showPartnerPageTwo, setShowPartnerPageTwo] = useState(false);
  const [partnerHeroSlide, setPartnerHeroSlide] = useState(0);

  // Journey planner flow: registration -> AI travel chat -> route plan.
  const [showJourneyFlow, setShowJourneyFlow] = useState(false);
  const [journeyStep, setJourneyStep] = useState<"register" | "chat" | "route">("register");
  const [journeyFullName, setJourneyFullName] = useState("");
  const [journeyPhone, setJourneyPhone] = useState("");
  const [journeyEmail, setJourneyEmail] = useState("");
  const [journeyFrom, setJourneyFrom] = useState("");
  const [journeyTo, setJourneyTo] = useState("");
  const [journeyBudget, setJourneyBudget] = useState("8000");
  const [journeyDays, setJourneyDays] = useState("3");
  const [journeyTravellers, setJourneyTravellers] = useState("1");
  const [journeyVehicle, setJourneyVehicle] = useState("Car");
  const [journeyPreference, setJourneyPreference] = useState("");
  const [journeyInput, setJourneyInput] = useState("");
  const [journeyMessages, setJourneyMessages] = useState<JourneyChatMessage[]>([]);

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
  // JOURNEY PLANNER
  // ============================================================

  function openJourneyPlanner() {
    setShowPartnerPageTwo(false);
    setShowJourneyFlow(true);
    setJourneyStep("register");
    setJourneyFullName(partnerName || "");
    setJourneyPhone(phoneNumber || "");
    setJourneyEmail("");
    setJourneyFrom("");
    setJourneyTo("");
    setJourneyBudget("8000");
    setJourneyDays("3");
    setJourneyTravellers("1");
    setJourneyVehicle("Car");
    setJourneyPreference("");
    setJourneyInput("");
    setJourneyMessages([]);
  }

  function continueJourneyRegistration() {
    if (!journeyFullName.trim()) {
      setMessage("Please enter your full name for the Journey plan.");
      return;
    }
    if (journeyPhone.replace(/\D/g, "").length < 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!journeyEmail.trim() || !journeyEmail.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }
    if (!journeyFrom.trim() || !journeyTo.trim()) {
      setMessage("Please enter both starting place and destination.");
      return;
    }

    setMessage("");
    setJourneyStep("chat");
    setJourneyMessages([
      {
        id: "welcome",
        sender: "ai",
        text: `Hi ${journeyFullName.trim()} 👋 I’m MF Journey AI. Tell me what you want from ${journeyFrom.trim()} to ${journeyTo.trim()} — budget, days, travellers and interests — and I’ll turn it into a complete journey path.`,
      },
    ]);
  }

  function addJourneyChatMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;

    setJourneyMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, sender: "user", text: clean },
      {
        id: `ai-${Date.now() + 1}`,
        sender: "ai",
        text: `Got it. I’ll include that in your ${journeyFrom || "origin"} → ${journeyTo || "destination"} plan. I’m considering your ₹${journeyBudget || "0"} budget, ${journeyDays || "1"} day trip and ${journeyTravellers || "1"} traveller(s). Press “Build Journey Path” when you’re ready.`,
      },
    ]);
    setJourneyInput("");
  }

  function buildJourneyPath() {
    const budget = Number(journeyBudget.replace(/[^0-9.]/g, "")) || 0;
    const days = Math.max(1, Number(journeyDays.replace(/[^0-9.]/g, "")) || 1);
    const travellers = Math.max(1, Number(journeyTravellers.replace(/[^0-9.]/g, "")) || 1);

    setJourneyMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, sender: "user", text: `Build my complete journey path for ${journeyFrom} → ${journeyTo}.` },
      { id: `ai-${Date.now() + 1}`, sender: "ai", text: `Journey path ready. I created a ${days}-day plan for ${travellers} traveller(s) within approximately ₹${budget.toLocaleString("en-IN")}.` },
    ]);
    setJourneyStep("route");
  }

  function closeJourneyPlanner() {
    setShowJourneyFlow(false);
    setJourneyStep("register");
    setJourneyMessages([]);
    setMessage("");
  }

  // ============================================================
  // PARTNER PAGE 2 HERO CAROUSEL
  // Changes the complete hero vehicle/scene every 10 seconds.
  // ============================================================

  useEffect(() => {
    if (!showPartnerPageTwo) {
      return;
    }

    const interval = setInterval(() => {
      setPartnerHeroSlide((current) =>
        (current + 1) % PARTNER_HERO_IMAGES.length,
      );
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [showPartnerPageTwo]);

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
                loading && styles.loadingButtonDisabled,
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
  // JOURNEY PLANNER — REGISTRATION / AI CHAT / ROUTE
  // ============================================================

  if (showJourneyFlow) {
    const budget = Number(journeyBudget.replace(/[^0-9.]/g, "")) || 0;
    const days = Math.max(1, Number(journeyDays.replace(/[^0-9.]/g, "")) || 1);
    const travellers = Math.max(1, Number(journeyTravellers.replace(/[^0-9.]/g, "")) || 1);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.journeyFlowContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.journeyFlowHeader}>
            <View>
              <Text style={styles.journeyFlowEyebrow}>MF RIDES • JOURNEY AI</Text>
              <Text style={styles.journeyFlowTitle}>Plan the whole journey.</Text>
              <Text style={styles.journeyFlowSubtitle}>From one place to another, turn your information into a complete route path.</Text>
            </View>
            <Pressable style={styles.journeyCloseButton} onPress={closeJourneyPlanner}>
              <Text style={styles.journeyCloseText}>✕ Close</Text>
            </Pressable>
          </View>

          <View style={styles.journeyProgressRow}>
            <View style={[styles.journeyProgressItem, journeyStep === "register" && styles.journeyProgressActive]}>
              <Text style={styles.journeyProgressNumber}>1</Text><Text style={styles.journeyProgressLabel}>Registration</Text>
            </View>
            <View style={styles.journeyProgressLine} />
            <View style={[styles.journeyProgressItem, journeyStep === "chat" && styles.journeyProgressActive]}>
              <Text style={styles.journeyProgressNumber}>2</Text><Text style={styles.journeyProgressLabel}>Travel Chat</Text>
            </View>
            <View style={styles.journeyProgressLine} />
            <View style={[styles.journeyProgressItem, journeyStep === "route" && styles.journeyProgressActive]}>
              <Text style={styles.journeyProgressNumber}>3</Text><Text style={styles.journeyProgressLabel}>Journey Path</Text>
            </View>
          </View>

          {journeyStep === "register" ? (
            <View style={styles.journeyPanel}>
              <View style={styles.journeyPanelIcon}><Text style={styles.journeyPanelIconText}>✦</Text></View>
              <Text style={styles.journeyPanelTitle}>Register your journey</Text>
              <Text style={styles.journeyPanelSubtitle}>Give MF Journey AI the basic information first. You can refine everything in the chat.</Text>

              <View style={styles.journeyFormGrid}>
                <View style={styles.journeyFieldHalf}>
                  <Text style={styles.journeyLabel}>FULL NAME</Text>
                  <TextInput value={journeyFullName} onChangeText={setJourneyFullName} placeholder="Your name" placeholderTextColor="#9B9DA7" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldHalf}>
                  <Text style={styles.journeyLabel}>MOBILE NUMBER</Text>
                  <TextInput value={journeyPhone} onChangeText={(v) => setJourneyPhone(v.replace(/[^0-9]/g, "").slice(0, 10))} keyboardType="number-pad" placeholder="10-digit mobile" placeholderTextColor="#9B9DA7" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldFull}>
                  <Text style={styles.journeyLabel}>EMAIL</Text>
                  <TextInput value={journeyEmail} onChangeText={setJourneyEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor="#9B9DA7" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldHalf}>
                  <Text style={styles.journeyLabel}>STARTING PLACE</Text>
                  <TextInput value={journeyFrom} onChangeText={setJourneyFrom} placeholder="e.g. Hyderabad" placeholderTextColor="#9B9DA7" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldHalf}>
                  <Text style={styles.journeyLabel}>DESTINATION</Text>
                  <TextInput value={journeyTo} onChangeText={setJourneyTo} placeholder="e.g. Goa" placeholderTextColor="#9B9DA7" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldQuarter}>
                  <Text style={styles.journeyLabel}>BUDGET ₹</Text>
                  <TextInput value={journeyBudget} onChangeText={setJourneyBudget} keyboardType="numeric" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldQuarter}>
                  <Text style={styles.journeyLabel}>DAYS</Text>
                  <TextInput value={journeyDays} onChangeText={setJourneyDays} keyboardType="numeric" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldQuarter}>
                  <Text style={styles.journeyLabel}>TRAVELLERS</Text>
                  <TextInput value={journeyTravellers} onChangeText={setJourneyTravellers} keyboardType="numeric" style={styles.journeyInput} />
                </View>
                <View style={styles.journeyFieldQuarter}>
                  <Text style={styles.journeyLabel}>VEHICLE</Text>
                  <TextInput value={journeyVehicle} onChangeText={setJourneyVehicle} placeholder="Car / Bike" placeholderTextColor="#9B9DA7" style={styles.journeyInput} />
                </View>
              </View>

              <Text style={styles.journeyLabel}>WHAT DO YOU WANT FROM THIS TRIP?</Text>
              <TextInput value={journeyPreference} onChangeText={setJourneyPreference} placeholder="Beaches, food, family, adventure, low-cost stay..." placeholderTextColor="#9B9DA7" style={[styles.journeyInput, styles.journeyLargeInput]} multiline />

              {message ? <Text style={styles.journeyError}>{message}</Text> : null}

              <Pressable style={styles.journeyPrimaryButton} onPress={continueJourneyRegistration}>
                <Text style={styles.journeyPrimaryButtonText}>Continue to Travel AI →</Text>
              </Pressable>
            </View>
          ) : null}

          {journeyStep === "chat" ? (
            <View style={styles.journeyChatLayout}>
              <View style={styles.journeyChatCard}>
                <View style={styles.journeyChatHeader}>
                  <View style={styles.journeyAiAvatar}><Text style={styles.journeyAiAvatarText}>AI</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.journeyChatTitle}>MF Journey AI</Text>
                    <Text style={styles.journeyChatStatus}>● Ready to plan your route</Text>
                  </View>
                  <View style={styles.ai24Pill}><Text style={styles.ai24Text}>24/7</Text></View>
                </View>

                <View style={styles.journeyRouteSummary}>
                  <Text style={styles.journeyRouteSummaryLabel}>YOUR START</Text><Text style={styles.journeyRouteSummaryValue}>{journeyFrom}</Text>
                  <Text style={styles.journeyRouteArrow}>↓</Text>
                  <Text style={styles.journeyRouteSummaryLabel}>YOUR DESTINATION</Text><Text style={styles.journeyRouteSummaryValue}>{journeyTo}</Text>
                </View>

                <View style={styles.journeyMessages}>
                  {journeyMessages.map((item) => (
                    <View key={item.id} style={[styles.journeyBubble, item.sender === "user" ? styles.journeyBubbleUser : styles.journeyBubbleAI]}>
                      <Text style={item.sender === "user" ? styles.journeyBubbleUserText : styles.journeyBubbleAIText}>{item.text}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.journeyQuickRow}>
                  {['Budget ₹8,000', 'Family friendly', 'Best food stops', 'Low-cost stay'].map((chip) => (
                    <Pressable key={chip} style={styles.journeyQuickChip} onPress={() => addJourneyChatMessage(chip)}>
                      <Text style={styles.journeyQuickChipText}>{chip}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.journeyChatInputRow}>
                  <TextInput value={journeyInput} onChangeText={setJourneyInput} placeholder="Tell AI anything about your journey..." placeholderTextColor="#9B9DA7" style={styles.journeyChatInput} onSubmitEditing={() => addJourneyChatMessage(journeyInput)} />
                  <Pressable style={styles.journeySendButton} onPress={() => addJourneyChatMessage(journeyInput)}>
                    <Text style={styles.journeySendText}>↑</Text>
                  </Pressable>
                </View>

                <Pressable style={styles.journeyPrimaryButton} onPress={buildJourneyPath}>
                  <Text style={styles.journeyPrimaryButtonText}>Build Journey Path & Route Map →</Text>
                </Pressable>
              </View>

              <View style={styles.journeyChatSideCard}>
                <Text style={styles.journeySideEyebrow}>AI WILL CONSIDER</Text>
                <Text style={styles.journeySideTitle}>Your complete travel picture</Text>
                <Text style={styles.journeySideItem}>✓ Budget: ₹{budget.toLocaleString("en-IN")}</Text>
                <Text style={styles.journeySideItem}>✓ Duration: {days} days</Text>
                <Text style={styles.journeySideItem}>✓ Travellers: {travellers}</Text>
                <Text style={styles.journeySideItem}>✓ Vehicle: {journeyVehicle}</Text>
                {journeyPreference ? <Text style={styles.journeySideItem}>✓ Interest: {journeyPreference}</Text> : null}
                <View style={styles.journeySideDivider} />
                <Text style={styles.journeySideSmall}>Next: route order, stops, travel distance, estimated time, budget split and day-by-day journey plan.</Text>
              </View>
            </View>
          ) : null}

          {journeyStep === "route" ? (
            <View>
              <View style={styles.routeResultHeader}>
                <View>
                  <Text style={styles.journeyFlowEyebrow}>JOURNEY PATH READY</Text>
                  <Text style={styles.routeResultTitle}>{journeyFrom} → {journeyTo}</Text>
                  <Text style={styles.routeResultSubtitle}>Your information has been converted into a complete journey overview.</Text>
                </View>
                <Pressable style={styles.routeEditButton} onPress={() => setJourneyStep("chat")}><Text style={styles.routeEditText}>← Edit with AI</Text></Pressable>
              </View>

              <View style={styles.routeMapCard}>
                <View style={styles.routeMapTopRow}>
                  <View><Text style={styles.routeMapEyebrow}>TOTAL JOURNEY PATH</Text><Text style={styles.routeMapTitle}>{journeyFrom} to {journeyTo}</Text></View>
                  <View style={styles.routeMapBadge}><Text style={styles.routeMapBadgeText}>AI PLANNED</Text></View>
                </View>

                <View style={styles.routeMapCanvas}>
                  <View style={styles.mapRoadOne} />
                  <View style={styles.mapRoadTwo} />
                  <View style={styles.mapRoadThree} />
                  <View style={styles.routePathLine} />
                  <View style={[styles.routeMapStop, styles.routeMapStart]}><Text style={styles.routeMapStopText}>A</Text></View>
                  <View style={[styles.routeMapStop, styles.routeMapMiddle]}><Text style={styles.routeMapStopText}>•</Text></View>
                  <View style={[styles.routeMapStop, styles.routeMapEnd]}><Text style={styles.routeMapStopText}>B</Text></View>
                  <Text style={[styles.mapPlaceLabel, styles.mapStartLabel]}>{journeyFrom}</Text>
                  <Text style={[styles.mapPlaceLabel, styles.mapMiddleLabel]}>Best stop</Text>
                  <Text style={[styles.mapPlaceLabel, styles.mapEndLabel]}>{journeyTo}</Text>
                  <View style={styles.mapCompass}><Text style={styles.mapCompassText}>N</Text></View>
                </View>

                <View style={styles.routeMetricsRow}>
                  <View style={styles.routeMetric}><Text style={styles.routeMetricIcon}>↔</Text><Text style={styles.routeMetricValue}>Route</Text><Text style={styles.routeMetricLabel}>Optimized path</Text></View>
                  <View style={styles.routeMetric}><Text style={styles.routeMetricIcon}>◷</Text><Text style={styles.routeMetricValue}>{days} Days</Text><Text style={styles.routeMetricLabel}>Trip duration</Text></View>
                  <View style={styles.routeMetric}><Text style={styles.routeMetricIcon}>₹</Text><Text style={styles.routeMetricValue}>₹{budget.toLocaleString("en-IN")}</Text><Text style={styles.routeMetricLabel}>Target budget</Text></View>
                  <View style={styles.routeMetric}><Text style={styles.routeMetricIcon}>♟</Text><Text style={styles.routeMetricValue}>{travellers}</Text><Text style={styles.routeMetricLabel}>Travellers</Text></View>
                </View>
              </View>

              <View style={styles.itineraryGrid}>
                <View style={styles.itineraryCard}>
                  <Text style={styles.itineraryDay}>DAY 1</Text><Text style={styles.itineraryTitle}>{journeyFrom} → Start journey</Text><Text style={styles.itineraryText}>Departure, route setup, first rest stop and arrival preparation.</Text>
                </View>
                <View style={styles.itineraryCard}>
                  <Text style={styles.itineraryDay}>DAY 2</Text><Text style={styles.itineraryTitle}>Explore the route</Text><Text style={styles.itineraryText}>Recommended attractions, food breaks and local travel based on your preferences.</Text>
                </View>
                <View style={styles.itineraryCard}>
                  <Text style={styles.itineraryDay}>DAY {days}</Text><Text style={styles.itineraryTitle}>{journeyTo} → Return / finish</Text><Text style={styles.itineraryText}>Final activities, budget check and return journey planning.</Text>
                </View>
              </View>

              <View style={styles.routeActionRow}>
                <Pressable style={styles.routeSecondaryButton} onPress={() => setJourneyStep("chat")}><Text style={styles.routeSecondaryText}>Ask AI to Change Plan</Text></Pressable>
                <Pressable style={styles.routePrimaryButton} onPress={() => { setShowJourneyFlow(false); setShowPartnerPageTwo(true); }}><Text style={styles.routePrimaryText}>Explore Partner Opportunities →</Text></Pressable>
              </View>

              <View style={styles.journeyDisclaimer}><Text style={styles.journeyDisclaimerText}>Prototype route view: live map distance, traffic, exact navigation and live travel pricing should be connected to your MF Rides maps/backend service before production.</Text></View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // PARTNER PAGE 2 — JOURNEY / OPPORTUNITIES
  // ============================================================

  if (showPartnerPageTwo) {
    const hero = PARTNER_HERO_IMAGES[partnerHeroSlide];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={styles.pageTwoContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageTwoHero}>
            <Image
              source={{ uri: hero.uri }}
              style={styles.pageTwoHeroImage}
              resizeMode="cover"
            />
            <View style={styles.pageTwoHeroOverlay} />

            <View style={styles.pageTwoTopBar}>
              <Pressable
                style={styles.pageTwoBackButton}
                onPress={() => setShowPartnerPageTwo(false)}
              >
                <Text style={styles.pageTwoBackIcon}>‹</Text>
                <Text style={styles.pageTwoBackText}>Partner Home</Text>
              </Pressable>

              <View style={styles.pageTwoBrandPill}>
                <Text style={styles.pageTwoBrand}>MF RIDES</Text>
                <Text style={styles.pageTwoBrandDot}>•</Text>
                <Text style={styles.pageTwoBrandLight}>PARTNER</Text>
              </View>
            </View>

            <View style={styles.pageTwoHeroCopy}>
              <View style={styles.pageTwoEyebrowPill}>
                <Text style={styles.pageTwoEyebrow}>2030 PARTNER JOURNEY</Text>
              </View>

              <Text style={styles.pageTwoHeroTitle}>{hero.title}</Text>
              <Text style={styles.pageTwoHeroSubtitle}>{hero.subtitle}</Text>

              <View style={styles.pageTwoStatsRow}>
                <View style={styles.pageTwoStatCard}>
                  <Text style={styles.pageTwoStatValue}>24/7</Text>
                  <Text style={styles.pageTwoStatLabel}>AI Support</Text>
                </View>
                <View style={styles.pageTwoStatCard}>
                  <Text style={styles.pageTwoStatValue}>6</Text>
                  <Text style={styles.pageTwoStatLabel}>Ride Types</Text>
                </View>
                <View style={styles.pageTwoStatCard}>
                  <Text style={styles.pageTwoStatValue}>∞</Text>
                  <Text style={styles.pageTwoStatLabel}>Opportunities</Text>
                </View>
              </View>
            </View>

            <View style={styles.pageTwoVehicleBadge}>
              <View style={styles.pageTwoVehicleDot} />
              <Text style={styles.pageTwoVehicleText}>{hero.type}</Text>
            </View>

            <View style={styles.pageTwoDots}>
              {PARTNER_HERO_IMAGES.map((item, index) => (
                <View
                  key={item.type}
                  style={[
                    styles.pageTwoDot,
                    index === partnerHeroSlide && styles.pageTwoDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.pageTwoIntroCard}>
            <View style={styles.pageTwoIntroIcon}>
              <Text style={styles.pageTwoIntroIconText}>✦</Text>
            </View>
            <View style={styles.pageTwoIntroCopy}>
              <Text style={styles.pageTwoIntroTitle}>More ways to earn with MF Rides</Text>
              <Text style={styles.pageTwoIntroText}>
                City rides, intercity journeys, group travel and future tour opportunities — all in one partner platform.
              </Text>
            </View>
          </View>

          <Text style={styles.pageTwoSectionTitle}>Choose your opportunity</Text>
          <Text style={styles.pageTwoSectionSubtitle}>Your vehicle. Your route. Your earning potential.</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pageTwoVehicleScroll}
          >
            {PARTNER_HERO_IMAGES.map((item, index) => (
              <Pressable
                key={item.type}
                style={[
                  styles.pageTwoVehicleCard,
                  index === partnerHeroSlide && styles.pageTwoVehicleCardActive,
                ]}
                onPress={() => setPartnerHeroSlide(index)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.pageTwoVehicleThumb}
                  resizeMode="cover"
                />
                <Text style={styles.pageTwoVehicleCardTitle}>{item.type}</Text>
                <Text style={styles.pageTwoVehicleCardText}>{item.title}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.pageTwoOpportunityGrid}>
            <View style={styles.pageTwoOpportunityCard}>
              <View style={styles.pageTwoOpportunityIcon}>
                <Text style={styles.pageTwoOpportunityIconText}>₹</Text>
              </View>
              <Text style={styles.pageTwoOpportunityTitle}>More Earnings</Text>
              <Text style={styles.pageTwoOpportunityText}>
                Discover more ride categories and longer-distance opportunities as they become available.
              </Text>
            </View>

            <View style={styles.pageTwoOpportunityCard}>
              <View style={styles.pageTwoOpportunityIcon}>
                <Text style={styles.pageTwoOpportunityIconText}>◆</Text>
              </View>
              <Text style={styles.pageTwoOpportunityTitle}>Smart Routes</Text>
              <Text style={styles.pageTwoOpportunityText}>
                Future AI assistance can help partners understand demand, routes and travel opportunities.
              </Text>
            </View>

            <View style={styles.pageTwoOpportunityCard}>
              <View style={styles.pageTwoOpportunityIcon}>
                <Text style={styles.pageTwoOpportunityIconText}>✦</Text>
              </View>
              <Text style={styles.pageTwoOpportunityTitle}>India Travel</Text>
              <Text style={styles.pageTwoOpportunityText}>
                Build toward a nationwide travel ecosystem connecting local rides with tours and intercity journeys.
              </Text>
            </View>

            <View style={styles.pageTwoOpportunityCard}>
              <View style={styles.pageTwoOpportunityIcon}>
                <Text style={styles.pageTwoOpportunityIconText}>?</Text>
              </View>
              <Text style={styles.pageTwoOpportunityTitle}>AI Partner Care</Text>
              <Text style={styles.pageTwoOpportunityText}>
                A future 24/7 AI assistant can help with common partner questions and escalate important issues to human support.
              </Text>
            </View>
          </View>

          <View style={styles.pageTwoBottomBanner}>
            <View style={styles.pageTwoBottomCopy}>
              <Text style={styles.pageTwoBottomEyebrow}>MF RIDES 2030</Text>
              <Text style={styles.pageTwoBottomTitle}>Drive today. Grow for tomorrow.</Text>
              <Text style={styles.pageTwoBottomText}>
                One trusted platform for rides, travel and partner opportunities.
              </Text>
            </View>
            <Pressable
              style={styles.pageTwoBackHomeButton}
              onPress={() => setShowPartnerPageTwo(false)}
            >
              <Text style={styles.pageTwoBackHomeText}>Back to Dashboard →</Text>
            </Pressable>
          </View>

          <View style={styles.pageTwoFooter}>
            <Text style={styles.footerBrand}>RIDE  •  TRAVEL  •  EXPLORE</Text>
            <View style={styles.footerLine} />
            <Text style={styles.footerSlogan}>Together We Move</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // ============================================================
  // PARTNER HOME — PAGE 1 (UNCHANGED)
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            PARTNER HEADER / HERO
        ========================================================= */}
        <View style={styles.homeHero}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.logo}>MF Rides</Text>

              <Text style={styles.title}>
                MF <Text style={styles.titleGold}>Partner</Text>
              </Text>

              <Text style={styles.subtitle}>
                Welcome, {partnerName} 👋
              </Text>

              <Text style={styles.heroTagline}>
                Stay online, get ride requests and grow with us.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.journeyButton}
                onPress={openJourneyPlanner}
              >
                <Text style={styles.journeyButtonText}>Journey →</Text>
              </Pressable>

              <Pressable
                style={styles.logoutButton}
                onPress={logout}
              >
                <Text style={styles.logoutIcon}>↪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroVisual}>
            <View style={[styles.cityShape, styles.cityOne]} />
            <View style={[styles.cityShape, styles.cityTwo]} />
            <View style={[styles.cityShape, styles.cityThree]} />
            <View style={[styles.cityShape, styles.cityFour]} />

            <View style={styles.roadOuter}>
              <View style={styles.roadInner}>
                <View style={styles.roadDash} />
                <View style={[styles.roadDash, { marginLeft: 42 }]} />
                <View style={[styles.roadDash, { marginLeft: 84 }]} />
              </View>
            </View>

            <View style={styles.heroPin}>
              <Text style={styles.heroPinText}>●</Text>
            </View>

            <View style={styles.carCircle}>
              <Image
                source={{ uri: PARTNER_CAR_IMAGE_URL }}
                style={styles.carImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.heroTrees}>
              <Text style={styles.treeEmoji}>🌳</Text>
              <Text style={styles.treeEmoji}>🌳</Text>
              <Text style={styles.treeEmoji}>🌳</Text>
            </View>

            <View style={styles.driveTextWrap}>
              <Text style={styles.driveText}>Drive</Text>
              <Text style={styles.driveText}>Earn</Text>
              <Text style={styles.driveText}>Grow</Text>
              <View style={styles.driveUnderline} />
            </View>
          </View>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {/* ========================================================
            ACTIVE RIDE
        ========================================================= */}
        {activeRide ? (
          <View style={styles.rideCard}>
            <View style={styles.cardTopAccent} />

            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.status}>{activeRide.status}</Text>
              </View>

              <Text style={styles.time}>
                {new Date(activeRide.requestedAt).toLocaleTimeString()}
              </Text>
            </View>

            <Text style={styles.passenger}>
              Passenger: {activeRide.passenger?.fullName ?? "Passenger"}
            </Text>

            <View style={styles.routeBlock}>
              <View style={styles.routeDotPickup}>
                <Text style={styles.routeDotText}>●</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeDotDestination}>
                <Text style={styles.routeDotText}>●</Text>
              </View>

              <View style={styles.routeContent}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.location}>{activeRide.pickupAddress}</Text>

                <Text style={[styles.locationLabel, styles.destinationLabel]}>
                  DESTINATION
                </Text>
                <Text style={styles.location}>
                  {activeRide.destinationAddress}
                </Text>
              </View>
            </View>

            {activeRide.status === "ACCEPTED" ? (
              <View style={styles.otpBox}>
                <Text style={styles.otpTitle}>🔐 Passenger OTP</Text>

                <Text style={styles.otpSubtitle}>
                  Ask the passenger for the 4-digit OTP shown in their MF Rider app.
                </Text>

                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 4-digit OTP"
                  placeholderTextColor="#9B9DA7"
                  value={otp}
                  onChangeText={(value) => {
                    const digits = value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 4);
                    setOtp(digits);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <Pressable
                  style={[
                    styles.acceptButton,
                    otp.length !== 4 && styles.disabledButton,
                  ]}
                  onPress={() => startRide(activeRide.id)}
                  disabled={loading || otp.length !== 4}
                >
                  <Text style={styles.acceptText}>
                    {loading ? "Verifying..." : "Verify OTP & Start Ride  →"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {activeRide.status === "STARTED" ? (
              <Pressable
                style={styles.acceptButton}
                onPress={() => completeRide(activeRide.id)}
                disabled={loading}
              >
                <Text style={styles.acceptText}>
                  {loading ? "Please wait..." : "Complete Ride  →"}
                </Text>
              </Pressable>
            ) : null}

            {activeRide.status === "COMPLETED" ? (
              <>
                <Text style={styles.emptyTitle}>🏁 Ride Completed</Text>

                <Pressable
                  style={styles.refreshButton}
                  onPress={finishActiveRide}
                >
                  <Text style={styles.refreshText}>
                    Back to Available Rides
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : (
          <>
            {/* ======================================================
                AVAILABILITY NOTICE
            ======================================================= */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Text style={styles.noticeIconText}>●</Text>
              </View>

              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>
                  {rides.length === 0
                    ? "No available ride requests."
                    : `${rides.length} ride request${rides.length > 1 ? "s" : ""} available.`}
                </Text>

                <Text style={styles.noticeText}>
                  {rides.length === 0
                    ? "We'll notify you when a new request comes in."
                    : "New rider requests are ready for you."}
                </Text>
              </View>
            </View>

            {/* ======================================================
                REFRESH
            ======================================================= */}
            <Pressable
              style={[styles.refreshButton, loading && styles.loadingButtonDisabled]}
              onPress={() => loadAvailableRides()}
              disabled={loading}
            >
              <Text style={styles.refreshIcon}>↻</Text>
              <Text style={styles.refreshText}>
                {loading ? "Loading..." : "Refresh Ride Requests"}
              </Text>
            </Pressable>

            {loading ? (
              <ActivityIndicator size="large" style={styles.loader} />
            ) : null}

            {/* ======================================================
                EMPTY STATE
            ======================================================= */}
            {!loading && rides.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyDecorLeft}>
                  <Text style={styles.pinEmoji}>●</Text>
                </View>

                <View style={styles.emptyDecorRight}>
                  <Text style={styles.sendEmoji}>➤</Text>
                </View>

                <View style={styles.emptyCarCircle}>
                  <Image
                    source={{ uri: PARTNER_CAR_IMAGE_URL }}
                    style={styles.emptyCarImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.sparkleLeft}>
                  <Text style={styles.sparkle}>✦</Text>
                </View>

                <View style={styles.sparkleRight}>
                  <Text style={styles.sparkle}>✦</Text>
                </View>

                <Text style={styles.emptyTitle}>No ride requests</Text>

                <Text style={styles.emptyText}>
                  New rider requests will appear here.
                </Text>

                <View style={styles.onlinePill}>
                  <Text style={styles.onlinePillText}>
                    Keep the app open and stay online!
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ======================================================
                AVAILABLE RIDE REQUESTS
            ======================================================= */}
            {rides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.cardTopAccent} />

                <View style={styles.statusRow}>
                  <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.status}>{ride.status}</Text>
                  </View>

                  <Text style={styles.time}>
                    {new Date(ride.requestedAt).toLocaleTimeString()}
                  </Text>
                </View>

                <Text style={styles.passenger}>
                  Passenger: {ride.passenger?.fullName ?? "Passenger"}
                </Text>

                <View style={styles.routeBlock}>
                  <View style={styles.routeDotPickup}>
                    <Text style={styles.routeDotText}>●</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeDotDestination}>
                    <Text style={styles.routeDotText}>●</Text>
                  </View>

                  <View style={styles.routeContent}>
                    <Text style={styles.locationLabel}>PICKUP</Text>
                    <Text style={styles.location}>{ride.pickupAddress}</Text>

                    <Text style={[styles.locationLabel, styles.destinationLabel]}>
                      DESTINATION
                    </Text>
                    <Text style={styles.location}>{ride.destinationAddress}</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.acceptButton}
                  onPress={() => acceptRide(ride.id)}
                  disabled={loading}
                >
                  <Text style={styles.acceptText}>
                    {loading ? "Please wait..." : "Accept Ride  →"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        {/* ============================================================
            FOOTER BRANDING
        ============================================================ */}
        <View style={styles.homeFooter}>
          <Text style={styles.footerBrand}>RIDE  •  TRAVEL  •  EXPLORE</Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerSlogan}>Together We Move</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


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

  loadingButtonDisabled: {
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
  // ============================================================
  // PARTNER HOME
  // ============================================================

  content: {
    padding: 0,
    paddingBottom: 34,
  },

  // ============================================================
  // JOURNEY PLANNER STYLES
  // ============================================================

  journeyFlowContent: {
    padding: 28,
    paddingBottom: 60,
  },

  journeyFlowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 22,
  },

  journeyFlowEyebrow: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  journeyFlowTitle: {
    color: colors.navy,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    marginTop: 7,
  },

  journeyFlowSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 700,
    marginTop: 5,
  },

  journeyCloseButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  journeyCloseText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "900",
  },

  journeyProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  journeyProgressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  journeyProgressActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },

  journeyProgressNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navy,
    color: "#FFFFFF",
    textAlign: "center",
    paddingTop: 4,
    fontSize: 11,
    fontWeight: "900",
    marginRight: 7,
  },

  journeyProgressLabel: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
  },

  journeyProgressLine: {
    flex: 1,
    maxWidth: 90,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },

  journeyPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    shadowColor: "#7C6C50",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  journeyPanelIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  journeyPanelIconText: {
    color: colors.goldDark,
    fontSize: 21,
    fontWeight: "900",
  },

  journeyPanelTitle: {
    color: colors.navy,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 13,
  },

  journeyPanelSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 15,
  },

  journeyFormGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  journeyFieldFull: {
    width: "100%",
  },

  journeyFieldHalf: {
    flexGrow: 1,
    flexBasis: 280,
  },

  journeyFieldQuarter: {
    flexGrow: 1,
    flexBasis: 170,
  },

  journeyLabel: {
    color: "#555967",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 13,
    marginBottom: 6,
  },

  journeyInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#FCFBF8",
    color: colors.navy,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    outlineStyle: "none",
  } as any,

  journeyLargeInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  journeyError: {
    color: "#B42318",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 12,
  },

  journeyPrimaryButton: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    paddingHorizontal: 18,
    shadowColor: colors.goldDark,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  journeyPrimaryButtonText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "900",
  },

  journeyChatLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-start",
  },

  journeyChatCard: {
    flexGrow: 1,
    flexBasis: 600,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: 22,
  },

  journeyChatSideCard: {
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: colors.navy,
    borderRadius: 24,
    padding: 22,
  },

  journeyChatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  journeyAiAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  journeyAiAvatarText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },

  journeyChatTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "900",
  },

  journeyChatStatus: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  ai24Pill: {
    backgroundColor: colors.goldSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  ai24Text: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: "900",
  },

  journeyRouteSummary: {
    marginTop: 18,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },

  journeyRouteSummaryLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  journeyRouteSummaryValue: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },

  journeyRouteArrow: {
    color: colors.goldDark,
    fontSize: 20,
    fontWeight: "900",
    marginVertical: 3,
  },

  journeyMessages: {
    minHeight: 240,
    paddingVertical: 15,
  },

  journeyBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    marginBottom: 9,
  },

  journeyBubbleAI: {
    alignSelf: "flex-start",
    backgroundColor: "#F4F6FA",
    borderBottomLeftRadius: 5,
  },

  journeyBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.navy,
    borderBottomRightRadius: 5,
  },

  journeyBubbleAIText: {
    color: colors.navy,
    fontSize: 12,
    lineHeight: 18,
  },

  journeyBubbleUserText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
  },

  journeyQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 10,
  },

  journeyQuickChip: {
    backgroundColor: colors.goldSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  journeyQuickChipText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: "900",
  },

  journeyChatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  journeyChatInput: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: "#FCFBF8",
    color: colors.navy,
    paddingHorizontal: 14,
    outlineStyle: "none",
  } as any,

  journeySendButton: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  journeySendText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  journeySideEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  journeySideTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 16,
  },

  journeySideItem: {
    color: "#E4E9F1",
    fontSize: 11,
    lineHeight: 19,
    marginTop: 5,
  },

  journeySideDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginVertical: 16,
  },

  journeySideSmall: {
    color: "#BFC8D6",
    fontSize: 10,
    lineHeight: 17,
  },

  routeResultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 15,
    marginBottom: 16,
  },

  routeResultTitle: {
    color: colors.navy,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 6,
  },

  routeResultSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },

  routeEditButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  routeEditText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
  },

  routeMapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  routeMapTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
  },

  routeMapEyebrow: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  routeMapTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },

  routeMapBadge: {
    backgroundColor: colors.goldSoft,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  routeMapBadgeText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: "900",
  },

  routeMapCanvas: {
    height: 330,
    backgroundColor: "#EEF4F2",
    position: "relative",
    overflow: "hidden",
  },

  mapRoadOne: {
    position: "absolute",
    width: "120%",
    height: 75,
    backgroundColor: "#FFFFFF",
    left: "-10%",
    top: 70,
    transform: [{ rotate: "-12deg" }],
    borderWidth: 1,
    borderColor: "#D8E0DC",
  },

  mapRoadTwo: {
    position: "absolute",
    width: "115%",
    height: 55,
    backgroundColor: "#FFFFFF",
    left: "-8%",
    top: 205,
    transform: [{ rotate: "14deg" }],
    borderWidth: 1,
    borderColor: "#D8E0DC",
  },

  mapRoadThree: {
    position: "absolute",
    width: "70%",
    height: 42,
    backgroundColor: "#FFFFFF",
    right: "-10%",
    top: 120,
    transform: [{ rotate: "60deg" }],
    borderWidth: 1,
    borderColor: "#D8E0DC",
  },

  routePathLine: {
    position: "absolute",
    left: "13%",
    top: 205,
    width: "74%",
    height: 8,
    backgroundColor: colors.gold,
    transform: [{ rotate: "-15deg" }],
    borderRadius: 4,
  },

  routeMapStop: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    elevation: 5,
  },

  routeMapStart: {
    left: "9%",
    bottom: 57,
    backgroundColor: colors.navy,
  },

  routeMapMiddle: {
    left: "47%",
    top: 113,
    backgroundColor: colors.gold,
  },

  routeMapEnd: {
    right: "9%",
    top: 53,
    backgroundColor: colors.green,
  },

  routeMapStopText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  mapPlaceLabel: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 6,
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
  },

  mapStartLabel: { left: "6%", bottom: 22 },
  mapMiddleLabel: { left: "44%", top: 158 },
  mapEndLabel: { right: "4%", top: 103 },

  mapCompass: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  mapCompassText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },

  routeMetricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  routeMetric: {
    flex: 1,
    minWidth: 150,
    padding: 17,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  routeMetricIcon: {
    color: colors.goldDark,
    fontSize: 17,
    fontWeight: "900",
  },

  routeMetricValue: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },

  routeMetricLabel: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3,
  },

  itineraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginTop: 16,
  },

  itineraryCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },

  itineraryDay: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  itineraryTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },

  itineraryText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 6,
  },

  routeActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 17,
  },

  routeSecondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 17,
    paddingVertical: 13,
  },

  routeSecondaryText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "900",
  },

  routePrimaryButton: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    paddingHorizontal: 17,
    paddingVertical: 13,
  },

  routePrimaryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  journeyDisclaimer: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.goldSoft,
  },

  journeyDisclaimerText: {
    color: colors.goldDark,
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
  },

  // ============================================================
  // PARTNER PAGE 2 STYLES
  // ============================================================

  pageTwoContent: {
    paddingBottom: 42,
  },

  pageTwoHero: {
    minHeight: 560,
    marginHorizontal: 0,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#10223D",
  },

  pageTwoHeroImage: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },

  pageTwoHeroOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12,27,48,0.52)",
  },

  pageTwoTopBar: {
    position: "relative",
    zIndex: 3,
    paddingHorizontal: 28,
    paddingTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  pageTwoBackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  pageTwoBackIcon: {
    color: colors.navy,
    fontSize: 25,
    lineHeight: 25,
    marginRight: 7,
  },

  pageTwoBackText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },

  pageTwoBrandPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },

  pageTwoBrand: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  pageTwoBrandDot: {
    color: colors.gold,
    marginHorizontal: 6,
    fontWeight: "900",
  },

  pageTwoBrandLight: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  pageTwoHeroCopy: {
    position: "relative",
    zIndex: 3,
    paddingHorizontal: 42,
    paddingTop: 86,
    maxWidth: 700,
  },

  pageTwoEyebrowPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,194,28,0.96)",
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  pageTwoEyebrow: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  pageTwoHeroTitle: {
    color: "#FFFFFF",
    fontSize: 58,
    lineHeight: 62,
    fontWeight: "900",
    marginTop: 18,
  },

  pageTwoHeroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 570,
    marginTop: 12,
  },

  pageTwoStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },

  pageTwoStatCard: {
    minWidth: 112,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  pageTwoStatValue: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "900",
  },

  pageTwoStatLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  pageTwoVehicleBadge: {
    position: "absolute",
    right: 34,
    bottom: 68,
    zIndex: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  pageTwoVehicleDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.gold,
    marginRight: 8,
  },

  pageTwoVehicleText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },

  pageTwoDots: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    zIndex: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  pageTwoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  pageTwoDotActive: {
    width: 25,
    backgroundColor: colors.gold,
  },

  pageTwoIntroCard: {
    marginHorizontal: 28,
    marginTop: -28,
    zIndex: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#758298",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  pageTwoIntroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  pageTwoIntroIconText: {
    color: colors.goldDark,
    fontSize: 22,
    fontWeight: "900",
  },

  pageTwoIntroCopy: {
    flex: 1,
  },

  pageTwoIntroTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "900",
  },

  pageTwoIntroText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  pageTwoSectionTitle: {
    color: colors.navy,
    fontSize: 27,
    fontWeight: "900",
    marginHorizontal: 28,
    marginTop: 34,
  },

  pageTwoSectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginHorizontal: 28,
    marginTop: 5,
  },

  pageTwoVehicleScroll: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    gap: 12,
  },

  pageTwoVehicleCard: {
    width: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },

  pageTwoVehicleCardActive: {
    borderColor: colors.gold,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },

  pageTwoVehicleThumb: {
    width: "100%",
    height: 88,
    backgroundColor: "#EEF2F5",
  },

  pageTwoVehicleCardTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "900",
    marginHorizontal: 12,
    marginTop: 10,
  },

  pageTwoVehicleCardText: {
    color: colors.muted,
    fontSize: 10,
    marginHorizontal: 12,
    marginTop: 3,
    marginBottom: 12,
  },

  pageTwoOpportunityGrid: {
    marginHorizontal: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  pageTwoOpportunityCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pageTwoOpportunityIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  pageTwoOpportunityIconText: {
    color: colors.goldDark,
    fontSize: 20,
    fontWeight: "900",
  },

  pageTwoOpportunityTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 14,
  },

  pageTwoOpportunityText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  pageTwoBottomBanner: {
    marginHorizontal: 28,
    marginTop: 26,
    borderRadius: 25,
    padding: 26,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  pageTwoBottomCopy: {
    flex: 1,
  },

  pageTwoBottomEyebrow: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  pageTwoBottomTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 7,
  },

  pageTwoBottomText: {
    color: "#CBD3DF",
    fontSize: 12,
    marginTop: 7,
  },

  pageTwoBackHomeButton: {
    backgroundColor: colors.gold,
    borderRadius: 17,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  pageTwoBackHomeText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },

  pageTwoFooter: {
    paddingTop: 40,
    alignItems: "center",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  journeyButton: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  journeyButtonText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "900",
  },

  homeHero: {
    minHeight: 430,
    backgroundColor: "#FFFDF8",
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: 28,
    paddingTop: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  heroGlowOne: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -75,
    top: -65,
    backgroundColor: "#FFF1C8",
    opacity: 0.72,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    left: -75,
    bottom: -85,
    backgroundColor: "#F4F0FF",
    opacity: 0.7,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    zIndex: 10,
  },

  headerCopy: {
    flex: 1,
    paddingRight: 14,
  },

  logo: {
    color: colors.goldDark,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    color: colors.navy,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    marginTop: 6,
  },

  titleGold: {
    color: "#E39A00",
  },

  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
  },

  heroTagline: {
    color: "#687387",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 340,
  },

  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5DED1",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#B59A68",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  logoutIcon: {
    color: "#E33B43",
    fontSize: 20,
    fontWeight: "900",
    marginRight: 7,
    transform: [{ rotate: "180deg" }],
  },

  logoutText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },

  heroVisual: {
    height: 235,
    marginTop: 10,
    position: "relative",
  },

  cityShape: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#E8F2F7",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  cityOne: {
    left: "49%",
    width: 38,
    height: 104,
  },

  cityTwo: {
    left: "59%",
    width: 29,
    height: 78,
  },

  cityThree: {
    left: "68%",
    width: 48,
    height: 126,
  },

  cityFour: {
    left: "79%",
    width: 34,
    height: 90,
  },

  roadOuter: {
    position: "absolute",
    left: "20%",
    right: "-10%",
    bottom: 21,
    height: 82,
    borderTopWidth: 15,
    borderTopColor: "#F9D477",
    borderRadius: 60,
    transform: [{ rotate: "-8deg" }],
  },

  roadInner: {
    position: "absolute",
    top: -8,
    left: "20%",
    width: "65%",
    height: 3,
    flexDirection: "row",
    alignItems: "center",
  },

  roadDash: {
    width: 27,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    marginRight: 15,
  },

  heroPin: {
    position: "absolute",
    right: "17%",
    top: 16,
    width: 67,
    height: 67,
    borderRadius: 34,
    backgroundColor: "#F5AA08",
    borderWidth: 7,
    borderColor: "#FFE8A5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D68E00",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },

  heroPinText: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    color: "#F5AA08",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 11,
  },

  carCircle: {
    position: "absolute",
    left: "49%",
    bottom: 26,
    width: 106,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E5DB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8091A2",
    shadowOpacity: 0.15,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  carEmoji: {
    fontSize: 46,
  },

  carImage: {
    width: 82,
    height: 50,
  },

  heroTrees: {
    position: "absolute",
    left: "16%",
    bottom: 25,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  treeEmoji: {
    fontSize: 27,
  },

  driveTextWrap: {
    position: "absolute",
    right: 8,
    top: 92,
    alignItems: "flex-start",
  },

  driveText: {
    color: "#E39A00",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    fontStyle: "italic",
  },

  driveUnderline: {
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E39A00",
    marginTop: 4,
    transform: [{ rotate: "-7deg" }],
  },

  noticeCard: {
    marginHorizontal: 28,
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF8E4",
    borderWidth: 1,
    borderColor: "#F5D58A",
    flexDirection: "row",
    alignItems: "center",
  },

  noticeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFE7A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  noticeIconText: {
    color: "#E49A00",
    fontSize: 18,
  },

  noticeCopy: {
    flex: 1,
  },

  noticeTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "900",
  },

  noticeText: {
    color: "#7D8492",
    fontSize: 12,
    marginTop: 4,
  },

  refreshButton: {
    minHeight: 62,
    marginHorizontal: 28,
    marginTop: 14,
    marginBottom: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#172033",
    shadowOpacity: 0.2,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },

  refreshIcon: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "400",
    marginRight: 10,
  },

  refreshText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  loader: {
    marginVertical: 24,
  },

  emptyBox: {
    marginHorizontal: 28,
    minHeight: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 27,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE6D9",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#B79B68",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },

  emptyDecorLeft: {
    position: "absolute",
    left: -22,
    top: 76,
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: "#F5FAFF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyDecorRight: {
    position: "absolute",
    right: -24,
    top: 44,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#FFF9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  pinEmoji: {
    color: "#F5AA08",
    fontSize: 31,
  },

  sendEmoji: {
    color: "#F5AA08",
    fontSize: 31,
    transform: [{ rotate: "-18deg" }],
  },

  emptyCarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#EEF7FF",
    borderWidth: 8,
    borderColor: "#F7FBFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 19,
  },

  emptyCar: {
    fontSize: 48,
  },

  emptyCarImage: {
    width: 76,
    height: 76,
  },

  sparkleLeft: {
    position: "absolute",
    left: "39%",
    top: 100,
  },

  sparkleRight: {
    position: "absolute",
    right: "38%",
    top: 110,
  },

  sparkle: {
    color: "#F5AA08",
    fontSize: 22,
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    color: "#808898",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },

  onlinePill: {
    marginTop: 17,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#EDF7FF",
  },

  onlinePillText: {
    color: "#1970C8",
    fontSize: 12,
    fontWeight: "900",
  },

  rideCard: {
    marginHorizontal: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9E2D6",
    shadowColor: "#8F7958",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
    overflow: "hidden",
  },

  cardTopAccent: {
    height: 4,
    backgroundColor: colors.gold,
    position: "absolute",
    top: 0,
    left: 22,
    right: 22,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5D9",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginRight: 6,
  },

  status: {
    color: colors.goldDark,
    fontSize: 10,
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
    fontWeight: "900",
    marginBottom: 17,
  },

  routeBlock: {
    minHeight: 135,
    position: "relative",
    paddingLeft: 30,
  },

  routeDotPickup: {
    position: "absolute",
    left: 1,
    top: 12,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#EAF7EF",
    alignItems: "center",
    justifyContent: "center",
  },

  routeDotDestination: {
    position: "absolute",
    left: 1,
    bottom: 12,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#FFF0CF",
    alignItems: "center",
    justifyContent: "center",
  },

  routeDotText: {
    color: colors.gold,
    fontSize: 8,
  },

  routeLine: {
    position: "absolute",
    left: 8,
    top: 29,
    bottom: 29,
    width: 2,
    backgroundColor: "#DAD7D0",
  },

  routeContent: {
    flex: 1,
  },

  locationLabel: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  destinationLabel: {
    marginTop: 18,
  },

  location: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 20,
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
    minHeight: 55,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    shadowColor: colors.goldDark,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  disabledButton: {
    opacity: 0.45,
  },

  acceptText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  homeFooter: {
    paddingTop: 46,
    paddingBottom: 10,
    alignItems: "center",
  },

  footerBrand: {
    color: "#8B95A4",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.4,
  },

  footerLine: {
    width: 70,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginTop: 9,
  },

  footerSlogan: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "800",
    fontStyle: "italic",
    marginTop: 10,
  },
});
