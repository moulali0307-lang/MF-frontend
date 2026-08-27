import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

/*
|--------------------------------------------------------------------------
| MF-RIDES ADMIN APP
|--------------------------------------------------------------------------
| Existing backend endpoints are preserved.
| Intro image:
|   mf-admin/assets/mf2.png
|
| Browser:
|   http://localhost:4000/api
|
| Mobile:
|   EXPO_PUBLIC_API_URL=http://YOUR-LAPTOP-IP:4000/api
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";

type AuthScreen =
  | "login"
  | "create"
  | "forgot"
  | "registerOtp"
  | "loginOtp"
  | "resetPassword"
  | "dashboard";

type DashboardPage =
  | "Dashboard"
  | "Rides"
  | "Drivers"
  | "Riders"
  | "Partners"
  | "Bookings"
  | "Payments"
  | "Reports"
  | "Analytics"
  | "Vehicles"
  | "Zones"
  | "Alerts"
  | "Settings"
  | "Support";

const W = Dimensions.get("window").width;

export default function App() {
  /*
  |--------------------------------------------------------------------------
  | CINEMATIC INTRO
  |--------------------------------------------------------------------------
  | mf2.png fills the whole browser/app screen.
  | After the intro, the normal admin login appears.
  */
 const [showIntro, setShowIntro] = useState(() => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem("mf_admin_intro_seen") !== "1";
      } catch {
        return true;
      }
    }

    return true;
  });

  const introOpacity = useRef(
    new Animated.Value(1),
  ).current;

  const introScale = useRef(
    new Animated.Value(1),
  ).current;

    useEffect(() => {
    if (!showIntro) {
      return;
    }

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(introOpacity, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),

        Animated.timing(introScale, {
          toValue: 1.03,
          duration: 650,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowIntro(false);

        if (Platform.OS === "web") {
          try {
            localStorage.setItem(
              "mf_admin_intro_seen",
              "1",
            );
          } catch {
            // Ignore storage errors.
          }
        }
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [
    showIntro,
    introOpacity,
    introScale,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SCREEN STATE
  |--------------------------------------------------------------------------
  */
  const [authScreen, setAuthScreen] =
    useState<AuthScreen>("login");

  const [dashboardPage, setDashboardPage] =
    useState<DashboardPage>(() => {
      if (Platform.OS === "web") {
        try {
          const savedPage =
            localStorage.getItem(
              "mf_admin_dashboard_page",
            );

          if (savedPage) {
            return savedPage as DashboardPage;
          }
        } catch {
          // Ignore storage errors.
        }
      }

      return "Dashboard";
    });
  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(
          "mf_admin_dashboard_page",
          dashboardPage,
        );
      } catch {
        // Ignore storage errors.
      }
    }
  }, [dashboardPage]);

  const [searchQuery, setSearchQuery] = useState("");

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | COMMON AUTH STATE
  |--------------------------------------------------------------------------
  */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CREATE ADMIN
  |--------------------------------------------------------------------------
  */
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | OTP
  |--------------------------------------------------------------------------
  */
  const [otp, setOtp] = useState("");

  const [resendSeconds, setResendSeconds] = useState(0);
  useEffect(() => {
    if (authScreen !== "loginOtp" || resendSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendSeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authScreen, resendSeconds]);

  /*
  |--------------------------------------------------------------------------
  | RESET PASSWORD
  |--------------------------------------------------------------------------
  */
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] =
    useState("");
  const [showResetPassword, setShowResetPassword] =
    useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */
  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const goToLogin = () => {
    clearMessages();
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setResetPassword("");
    setResetConfirmPassword("");
    setAuthScreen("login");
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem("mf_admin_token");
      } catch {
        // Ignore browser storage errors.
      }
    }

    setDashboardPage("Dashboard");
    setPassword("");
    setOtp("");
    setMessage("");
    setError("");
    setAuthScreen("login");
  };

  /*
  |--------------------------------------------------------------------------
  | API REQUEST
  |--------------------------------------------------------------------------
  */
  const apiRequest = async (
    endpoint: string,
    body: Record<string, unknown>,
  ) => {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          data?.data?.message ||
          "Something went wrong",
      );
    }

    return data;
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE ADMIN
  |--------------------------------------------------------------------------
  */
  const handleCreateAccount = async () => {
    clearMessages();

    if (!name.trim()) {
      setError("Please enter admin name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter admin email.");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Please enter phone number.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/auth/admin/register", {
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password,
        confirmPassword,
      });

      setOtp("");
      setMessage(
        "Admin account created. OTP has been sent to your email.",
      );
      setAuthScreen("registerOtp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create admin account.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REGISTRATION OTP
  |--------------------------------------------------------------------------
  */
  const handleVerifyRegistrationOtp = async () => {
    clearMessages();

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/auth/admin/register/verify-otp",
        {
          email: email.trim().toLowerCase(),
          code: otp.trim(),
        },
      );

      setMessage(
        "Admin account verified successfully. You can now login.",
      );

      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setAuthScreen("login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or expired OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ADMIN LOGIN -> SEND OTP
  |--------------------------------------------------------------------------
  */
  const handleLogin = async () => {
    clearMessages();

    if (!email.trim()) {
      setError("Please enter admin email.");
      return;
    }

    if (!password) {
      setError("Please enter password.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/auth/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      setOtp("");
      setResendSeconds(60);
      setMessage("OTP sent to your admin email.");
      setAuthScreen("loginOtp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid admin email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGIN OTP -> DASHBOARD
  |--------------------------------------------------------------------------
  */
  const handleResendLoginOtp = async () => {
    if (resendSeconds > 0 || loading) {
      return;
    }

    clearMessages();

    if (!email.trim() || !password) {
      setError("Please go back to login and enter your credentials.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/auth/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      setOtp("");
      setResendSeconds(60);
      setMessage("A new OTP has been sent to your admin email.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend OTP.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyLoginOtp = async () => {
    clearMessages();

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiRequest(
        "/auth/admin/login/verify-otp",
        {
          email: email.trim().toLowerCase(),
          code: otp.trim(),
        },
      );

      const token =
        result?.data?.token ||
        result?.token;

      if (token && Platform.OS === "web") {
        try {
          localStorage.setItem(
            "mf_admin_token",
            token,
          );
        } catch {
          // Ignore browser storage errors.
        }
      }

      setMessage("Admin login successful.");
      setOtp("");
      setPassword("");

      /*
       * IMPORTANT:
       * Successful OTP now opens the new dashboard.
       */
      setDashboardPage("Dashboard");
      setAuthScreen("dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or expired OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FORGOT PASSWORD
  |--------------------------------------------------------------------------
  */
  const handleForgotPassword = async () => {
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your admin email.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/auth/admin/forgot-password",
        {
          email: email.trim().toLowerCase(),
        },
      );

      setOtp("");
      setResetPassword("");
      setResetConfirmPassword("");

      setMessage(
        "Password reset OTP has been sent to your email.",
      );

      setAuthScreen("resetPassword");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send password reset OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET PASSWORD
  |--------------------------------------------------------------------------
  */
  const handleResetPassword = async () => {
    clearMessages();

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    if (resetPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/auth/admin/reset-password",
        {
          email: email.trim().toLowerCase(),
          code: otp.trim(),
          password: resetPassword,
          confirmPassword: resetConfirmPassword,
        },
      );

      setMessage(
        "Password reset successful. Please login with your new password.",
      );

      setPassword("");
      setResetPassword("");
      setResetConfirmPassword("");
      setOtp("");
      setAuthScreen("login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const webInputStyle =
    Platform.OS === "web"
      ? ({ outline: "none" } as any)
      : undefined;

  /*
  |--------------------------------------------------------------------------
  | AUTH CARD HEADER
  |--------------------------------------------------------------------------
  */
  const renderAuthHeader = (
    small: string,
    title: string,
    subtitle: string,
  ) => (
    <>
      <View style={styles.adminIcon}>
        <Text style={styles.adminIconText}>MF</Text>
      </View>

      <Text style={styles.welcomeText}>{small}</Text>

      <Text style={styles.loginTitle}>{title}</Text>

      <Text style={styles.loginSubtitle}>
        {subtitle}
      </Text>
    </>
  );

  /*
  |--------------------------------------------------------------------------
  | MESSAGE AREA
  |--------------------------------------------------------------------------
  */
  const renderMessages = () => (
    <>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {message ? (
        <Text style={styles.successText}>{message}</Text>
      ) : null}
    </>
  );

  /*
  |--------------------------------------------------------------------------
  | PASSWORD INPUT
  |--------------------------------------------------------------------------
  */
  const renderPasswordInput = (
    value: string,
    onChangeText: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    placeholder: string,
  ) => (
    <View style={styles.inputBox}>
      <Text style={styles.inputIcon}>●</Text>

      <TextInput
        style={[
          styles.input,
          webInputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#697286"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
      />

      <Pressable
        onPress={() => setVisible(!visible)}
        style={styles.showButton}
      >
        <Text style={styles.showText}>
          {visible ? "HIDE" : "SHOW"}
        </Text>
      </Pressable>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */
  const renderLogin = () => (
    <View style={styles.loginCard}>
      {renderAuthHeader(
        "WELCOME BACK",
        "Admin Login",
        "Sign in to access your MF-Rides control panel.",
      )}

      <Text style={styles.label}>ADMIN EMAIL</Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>@</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="Enter admin email"
          placeholderTextColor="#697286"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Text style={styles.label}>PASSWORD</Text>

      {renderPasswordInput(
        password,
        setPassword,
        showPassword,
        setShowPassword,
        "Enter your password",
      )}

      <View style={styles.authLinksRow}>
        <Pressable
          onPress={() => {
            clearMessages();
            setAuthScreen("forgot");
          }}
        >
          <Text style={styles.linkText}>
            Forgot password?
          </Text>
        </Pressable>
      </View>

      {renderMessages()}

      <View style={styles.securityRow}>
        <View style={styles.securityDot} />
        <Text style={styles.securityText}>
          Secure administrator access
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.loginButton,
          pressed && styles.loginButtonPressed,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0F1C" />
        ) : (
          <>
            <Text style={styles.loginButtonText}>
              SIGN IN TO ADMIN
            </Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      <View style={styles.createAccountRow}>
        <Text style={styles.createAccountText}>
          Don't have an admin account?
        </Text>

        <Pressable
          onPress={() => {
            clearMessages();
            setAuthScreen("create");
          }}
        >
          <Text style={styles.linkText}>
            Create Admin Account
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        MF-RIDES ADMIN • PRIVATE ACCESS ONLY
      </Text>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | CREATE ADMIN
  |--------------------------------------------------------------------------
  */
  const renderCreate = () => (
    <View style={styles.loginCard}>
      {renderAuthHeader(
        "GET STARTED",
        "Create Admin",
        "Create your private MF-Rides administrator account.",
      )}

      <Text style={styles.label}>ADMIN NAME</Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>◉</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="Enter your name"
          placeholderTextColor="#697286"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <Text style={styles.label}>ADMIN EMAIL</Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>@</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="Enter admin email"
          placeholderTextColor="#697286"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Text style={styles.label}>PHONE NUMBER</Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>☎</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="+919876543210"
          placeholderTextColor="#697286"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <Text style={styles.label}>PASSWORD</Text>

      {renderPasswordInput(
        password,
        setPassword,
        showPassword,
        setShowPassword,
        "Create password",
      )}

      <Text style={styles.label}>
        CONFIRM PASSWORD
      </Text>

      {renderPasswordInput(
        confirmPassword,
        setConfirmPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        "Confirm password",
      )}

      {renderMessages()}

      <Pressable
        style={({ pressed }) => [
          styles.loginButton,
          pressed && styles.loginButtonPressed,
        ]}
        onPress={handleCreateAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0F1C" />
        ) : (
          <>
            <Text style={styles.loginButtonText}>
              CREATE ADMIN ACCOUNT
            </Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      

      <View style={styles.backRow}>
        <Text style={styles.createAccountText}>
          Already have an account?
        </Text>

        <Pressable onPress={goToLogin}>
          <Text style={styles.linkText}>
            Back to Login
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        MF-RIDES ADMIN • PRIVATE ACCESS ONLY
      </Text>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | OTP CARD
  |--------------------------------------------------------------------------
  */
  const renderOtp = (
    isLoginOtp: boolean,
  ) => (
    <View style={styles.loginCard}>
      {renderAuthHeader(
        isLoginOtp
          ? "SECURITY VERIFICATION"
          : "EMAIL VERIFICATION",
        isLoginOtp
          ? "Verify Login"
          : "Verify Admin",
        isLoginOtp
          ? `We sent a 6-digit security OTP to ${email}.`
          : `Enter the 6-digit OTP sent to ${email}.`,
      )}

      <Text style={styles.label}>
        {isLoginOtp
          ? "LOGIN OTP"
          : "VERIFICATION OTP"}
      </Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>#</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#697286"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      {renderMessages()}

      <Pressable
        style={({ pressed }) => [
          styles.loginButton,
          pressed && styles.loginButtonPressed,
        ]}
        onPress={
          isLoginOtp
            ? handleVerifyLoginOtp
            : handleVerifyRegistrationOtp
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0F1C" />
        ) : (
          <>
            <Text style={styles.loginButtonText}>
              {isLoginOtp
                ? "VERIFY & LOGIN"
                : "VERIFY OTP"}
            </Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      {isLoginOtp ? (
        <View style={styles.resendRow}>
          {resendSeconds > 0 ? (
            <Text style={styles.resendDisabledText}>
              Resend OTP in {resendSeconds}s
            </Text>
          ) : (
            <Pressable
              onPress={handleResendLoginOtp}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Resend OTP
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      <View style={styles.backRow}>
        <Pressable onPress={goToLogin}>
          <Text style={styles.linkText}>
            Back to Login
          </Text>
        </Pressable>
      </View>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | FORGOT PASSWORD
  |--------------------------------------------------------------------------
  */
  const renderForgot = () => (
    <View style={styles.loginCard}>
      {renderAuthHeader(
        "ACCOUNT RECOVERY",
        "Forgot Password?",
        "Enter your admin email and we'll send you a password reset OTP.",
      )}

      <Text style={styles.label}>ADMIN EMAIL</Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>@</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="Enter admin email"
          placeholderTextColor="#697286"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {renderMessages()}

      <Pressable
        style={({ pressed }) => [
          styles.loginButton,
          pressed && styles.loginButtonPressed,
        ]}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0F1C" />
        ) : (
          <>
            <Text style={styles.loginButtonText}>
              SEND RESET OTP
            </Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      <View style={styles.backRow}>
        <Pressable onPress={goToLogin}>
          <Text style={styles.linkText}>
            Back to Login
          </Text>
        </Pressable>
      </View>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | RESET PASSWORD
  |--------------------------------------------------------------------------
  */
  const renderResetPassword = () => (
    <View style={styles.loginCard}>
      {renderAuthHeader(
        "ACCOUNT RECOVERY",
        "Reset Password",
        "Enter the OTP and create a new admin password.",
      )}

      <Text style={styles.label}>RESET OTP</Text>

      <View style={styles.inputBox}>
        <Text style={styles.inputIcon}>#</Text>

        <TextInput
          style={[
            styles.input,
            webInputStyle,
          ]}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#697286"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <Text style={styles.label}>NEW PASSWORD</Text>

      {renderPasswordInput(
        resetPassword,
        setResetPassword,
        showResetPassword,
        setShowResetPassword,
        "Create new password",
      )}

      <Text style={styles.label}>
        CONFIRM PASSWORD
      </Text>

      {renderPasswordInput(
        resetConfirmPassword,
        setResetConfirmPassword,
        showResetConfirmPassword,
        setShowResetConfirmPassword,
        "Confirm new password",
      )}

      {renderMessages()}

      <Pressable
        style={({ pressed }) => [
          styles.loginButton,
          pressed && styles.loginButtonPressed,
        ]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0F1C" />
        ) : (
          <>
            <Text style={styles.loginButtonText}>
              RESET PASSWORD
            </Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      <View style={styles.backRow}>
        <Pressable onPress={goToLogin}>
          <Text style={styles.linkText}>
            Back to Login
          </Text>
        </Pressable>
      </View>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD DATA
  |--------------------------------------------------------------------------
  */
  const navItems: Array<{
    name: DashboardPage;
    icon: string;
  }> = [
    { name: "Dashboard", icon: "⌂" },
    { name: "Rides", icon: "↗" },
    { name: "Drivers", icon: "◉" },
    { name: "Riders", icon: "♙" },
    { name: "Partners", icon: "◆" },
    { name: "Bookings", icon: "▣" },
    { name: "Payments", icon: "₹" },
    { name: "Reports", icon: "▤" },
    { name: "Analytics", icon: "⌁" },
    { name: "Vehicles", icon: "▰" },
    { name: "Zones", icon: "◎" },
    { name: "Alerts", icon: "!" },
    { name: "Settings", icon: "⚙" },
    { name: "Support", icon: "?" },
  ];

    const handleDashboardSearch = (value: string) => {
    setSearchQuery(value);

    const query = value.trim().toLowerCase();

    if (!query) {
      return;
    }

    const matchedItem = navItems.find((item) =>
      item.name.toLowerCase().includes(query)
    );

    if (matchedItem) {
      setDashboardPage(matchedItem.name);
    }
  };

  const renderMetricCard = (
    icon: string,
    label: string,
    value: string,
    change: string,
  ) => (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>
          {label}
        </Text>
        <View style={styles.metricIcon}>
          <Text style={styles.metricIconText}>
            {icon}
          </Text>
        </View>
      </View>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <Text style={styles.metricChange}>
        ↗ {change}
      </Text>
    </View>
  );

  const renderBarChart = () => {
    const values = [
      34, 46, 38, 58, 52, 72, 63,
      78, 70, 91, 76, 96,
    ];

    return (
      <View style={styles.chartArea}>
        <View style={styles.chartGridLine} />
        <View style={[styles.chartGridLine, { top: "33%" }]} />
        <View style={[styles.chartGridLine, { top: "66%" }]} />

        <View style={styles.barRow}>
          {values.map((height, index) => (
            <View
              key={index}
              style={styles.barColumn}
            >
              <View
                style={[
                  styles.chartBar,
                  { height: `${height}%` },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.chartLabels}>
          {[
            "M",
            "T",
            "W",
            "T",
            "F",
            "S",
            "S",
          ].map((day, index) => (
            <Text
              key={index}
              style={styles.chartLabel}
            >
              {day}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderRideStatus = () => (
    <View style={styles.statusCard}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Ride Status
          </Text>
          <Text style={styles.panelSubtitle}>
            Current platform activity
          </Text>
        </View>
        <Text style={styles.panelMore}>•••</Text>
      </View>

      <View style={styles.statusBody}>
        <View style={styles.donut}>
          <View style={styles.donutInner}>
            <Text style={styles.donutValue}>
              15.2K
            </Text>
            <Text style={styles.donutText}>
              TOTAL
            </Text>
          </View>
        </View>

        <View style={styles.statusLegend}>
          <View style={styles.legendRow}>
            <View style={styles.legendDotGreen} />
            <Text style={styles.legendText}>
              Completed
            </Text>
            <Text style={styles.legendValue}>
              68%
            </Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendDotGold} />
            <Text style={styles.legendText}>
              Ongoing
            </Text>
            <Text style={styles.legendValue}>
              21%
            </Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendDotRed} />
            <Text style={styles.legendText}>
              Cancelled
            </Text>
            <Text style={styles.legendValue}>
              11%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderActivity = () => (
    <View style={styles.activityCard}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Recent Activity
          </Text>
          <Text style={styles.panelSubtitle}>
            Latest platform events
          </Text>
        </View>
        <Text style={styles.panelMore}>•••</Text>
      </View>

      {[
        ["●", "New ride completed", "2 min ago"],
        ["₹", "Payment received", "8 min ago"],
        ["+", "New partner joined", "15 min ago"],
        ["!", "Ride cancelled", "32 min ago"],
        ["◉", "New rider registered", "1 hr ago"],
      ].map((item, index) => (
        <View
          key={index}
          style={styles.activityRow}
        >
          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>
              {item[0]}
            </Text>
          </View>

          <Text style={styles.activityName}>
            {item[1]}
          </Text>

          <Text style={styles.activityTime}>
            {item[2]}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTopDrivers = () => (
    <View style={styles.tableCard}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Top Drivers
          </Text>
          <Text style={styles.panelSubtitle}>
            Best performing partners
          </Text>
        </View>
        <Text style={styles.panelMore}>View all</Text>
      </View>

      {[
        ["Robert Fox", "980 rides", "4.9 ★"],
        ["James Brown", "870 rides", "4.8 ★"],
        ["William Davis", "760 rides", "4.7 ★"],
        ["Richard Miller", "660 rides", "4.6 ★"],
      ].map((driver, index) => (
        <View
          key={index}
          style={styles.driverRow}
        >
          <View style={styles.rankCircle}>
            <Text style={styles.rankText}>
              {index + 1}
            </Text>
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {driver[0]}
            </Text>
            <Text style={styles.driverRides}>
              {driver[1]}
            </Text>
          </View>

          <Text style={styles.driverRating}>
            {driver[2]}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderMap = () => (
    <View style={styles.mapCard}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Live Ride Map
          </Text>
          <Text style={styles.panelSubtitle}>
            Active rides right now
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            LIVE
          </Text>
        </View>
      </View>

      <View style={styles.fakeMap}>
        <View style={styles.mapRoadOne} />
        <View style={styles.mapRoadTwo} />
        <View style={styles.mapRoadThree} />

        {[
          ["22%", "32%", "🚕"],
          ["64%", "23%", "🚗"],
          ["43%", "57%", "🚕"],
          ["76%", "66%", "🚙"],
          ["28%", "73%", "🚕"],
          ["57%", "43%", "🚗"],
        ].map((car, index) => (
          <View
            key={index}
            style={[
              styles.mapVehicle,
              {
                left: car[0] as any,
                top: car[1] as any,
              },
            ]}
          >
            <Text style={styles.mapVehicleText}>
              {car[2]}
            </Text>
          </View>
        ))}

        <View style={styles.mapCenter}>
          <View style={styles.mapCenterDot} />
        </View>

        <Text style={styles.mapPlaceOne}>
          Hitech City
        </Text>
        <Text style={styles.mapPlaceTwo}>
          Gachibowli
        </Text>
        <Text style={styles.mapPlaceThree}>
          Jubilee Hills
        </Text>
        <Text style={styles.mapPlaceFour}>
          Ameerpet
        </Text>
      </View>
    </View>
  );

  const renderRequests = () => (
    <View style={styles.requestsCard}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Live Ride Requests
          </Text>
          <Text style={styles.panelSubtitle}>
            Waiting for drivers
          </Text>
        </View>

        <Text style={styles.panelMore}>
          View all
        </Text>
      </View>

      {[
        ["Hitech City", "Gachibowli", "₹380"],
        ["Madhapur", "Jubilee Hills", "₹420"],
        ["Ameerpet", "Secunderabad", "₹300"],
        ["Kukatpally", "Hitech City", "₹350"],
      ].map((ride, index) => (
        <View
          key={index}
          style={styles.requestRow}
        >
          <View style={styles.requestRoute}>
            <Text style={styles.requestFrom}>
              {ride[0]}
            </Text>
            <Text style={styles.requestArrow}>
              →
            </Text>
            <Text style={styles.requestTo}>
              {ride[1]}
            </Text>
          </View>

          <Text style={styles.requestPrice}>
            {ride[2]}
          </Text>

          <Pressable style={styles.acceptButton}>
            <Text style={styles.acceptText}>
              Accept
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );

  const renderHeatmap = () => (
    <View style={styles.heatCard}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Ride Heatmap
          </Text>
          <Text style={styles.panelSubtitle}>
            High demand locations
          </Text>
        </View>
      </View>

      <View style={styles.heatmap}>
        {[
          ["18%", "28%", 0.75],
          ["42%", "20%", 0.45],
          ["68%", "32%", 0.95],
          ["30%", "56%", 0.55],
          ["58%", "60%", 0.9],
          ["78%", "72%", 0.65],
          ["18%", "76%", 0.35],
        ].map((spot, index) => (
          <View
            key={index}
            style={[
              styles.heatSpot,
              {
                left: spot[0] as any,
                top: spot[1] as any,
                opacity: spot[2] as number,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.heatLegend}>
        <Text style={styles.heatLegendText}>
          LOW
        </Text>
        <View style={styles.heatLegendBar} />
        <Text style={styles.heatLegendText}>
          HIGH
        </Text>
      </View>
    </View>
  );

  const renderDashboardHome = () => (
    <>
      <View style={styles.metricGrid}>
        {renderMetricCard(
          "↗",
          "LIVE RIDES",
          "1,245",
          "+9.4%",
        )}
        {renderMetricCard(
          "▣",
          "TOTAL BOOKINGS",
          "16,890",
          "+15.6%",
        )}
        {renderMetricCard(
          "●",
          "ACTIVE DRIVERS",
          "2,980",
          "+10.2%",
        )}
        {renderMetricCard(
          "₹",
          "TOTAL EARNINGS",
          "₹26,75,340",
          "+18.3%",
        )}
        {renderMetricCard(
          "✓",
          "TODAY'S PAYOUTS",
          "₹8,45,600",
          "+12.7%",
        )}
      </View>

      <View style={styles.dashboardRow}>
        {renderMap()}
        {renderRequests()}
      </View>

      <View style={styles.dashboardRow}>
        <View style={styles.chartCard}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>
                Earnings Overview
              </Text>
              <Text style={styles.panelSubtitle}>
                Weekly revenue performance
              </Text>
            </View>

            <View style={styles.weekBadge}>
              <Text style={styles.weekText}>
                This Week ▾
              </Text>
            </View>
          </View>

          {renderBarChart()}
        </View>

        {renderHeatmap()}
      </View>

      <View style={styles.dashboardRow}>
        {renderRideStatus()}
        {renderTopDrivers()}
        {renderActivity()}
      </View>
    </>
  );

  /*
  |--------------------------------------------------------------------------
  | SIMPLE INNER PAGES
  |--------------------------------------------------------------------------
  | These keep the dashboard navigation professional without
  | changing your backend API.
  */
  const renderInnerPage = () => {
    const pageInfo: Record<
      Exclude<DashboardPage, "Dashboard">,
      {
        eyebrow: string;
        title: string;
        text: string;
        icon: string;
      }
    > = {
      Rides: {
        eyebrow: "LIVE OPERATIONS",
        title: "Rides Management",
        text: "Monitor active, completed and cancelled rides across MF-RIDES.",
        icon: "↗",
      },
      Drivers: {
        eyebrow: "DRIVER NETWORK",
        title: "Drivers",
        text: "Manage driver availability, performance and partner activity.",
        icon: "◉",
      },
      Riders: {
        eyebrow: "CUSTOMER NETWORK",
        title: "Riders",
        text: "View rider activity, accounts and ride history.",
        icon: "♙",
      },
      Partners: {
        eyebrow: "PARTNER NETWORK",
        title: "Partners",
        text: "Manage partner companies and driver relationships.",
        icon: "◆",
      },
      Bookings: {
        eyebrow: "RESERVATIONS",
        title: "Bookings",
        text: "Review current and upcoming ride bookings.",
        icon: "▣",
      },
      Payments: {
        eyebrow: "FINANCE",
        title: "Payments",
        text: "Monitor collections, payouts and payment activity.",
        icon: "₹",
      },
      Reports: {
        eyebrow: "BUSINESS INTELLIGENCE",
        title: "Reports",
        text: "Generate operational and financial reports.",
        icon: "▤",
      },
      Analytics: {
        eyebrow: "PERFORMANCE",
        title: "Analytics",
        text: "Track platform growth, ride trends and revenue.",
        icon: "⌁",
      },
      Vehicles: {
        eyebrow: "FLEET MANAGEMENT",
        title: "Vehicles",
        text: "Manage registered vehicles and vehicle status.",
        icon: "▰",
      },
      Zones: {
        eyebrow: "SERVICE AREAS",
        title: "Zones",
        text: "Configure ride zones and service coverage.",
        icon: "◎",
      },
      Alerts: {
        eyebrow: "SYSTEM MONITORING",
        title: "Alerts",
        text: "Review important platform notifications and alerts.",
        icon: "!",
      },
      Settings: {
        eyebrow: "ADMINISTRATION",
        title: "Settings",
        text: "Configure your MF-RIDES admin control center.",
        icon: "⚙",
      },
      Support: {
        eyebrow: "HELP CENTER",
        title: "Support",
        text: "Manage support operations and administrator assistance.",
        icon: "?",
      },
    };

    const info =
      pageInfo[
        dashboardPage as Exclude<
          DashboardPage,
          "Dashboard"
        >
      ];

    return (
      <View style={styles.innerPage}>
        <View style={styles.innerHero}>
          <View style={styles.innerIcon}>
            <Text style={styles.innerIconText}>
              {info.icon}
            </Text>
          </View>

          <Text style={styles.innerEyebrow}>
            {info.eyebrow}
          </Text>

          <Text style={styles.innerTitle}>
            {info.title}
          </Text>

          <Text style={styles.innerText}>
            {info.text}
          </Text>
        </View>

        <View style={styles.placeholderGrid}>
          {[
            ["Total", "15,230"],
            ["Active", "2,840"],
            ["Today", "1,245"],
            ["Growth", "+12.4%"],
          ].map((item, index) => (
            <View
              key={index}
              style={styles.placeholderCard}
            >
              <Text style={styles.placeholderLabel}>
                {item[0]}
              </Text>
              <Text style={styles.placeholderValue}>
                {item[1]}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.emptyPanel}>
          <Text style={styles.emptyPanelTitle}>
            {info.title} workspace
          </Text>

          <Text style={styles.emptyPanelText}>
            This section is ready for the real
            backend data and actions.
          </Text>
        </View>
      </View>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  */
  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <View style={styles.sidebarLogo}>
            <Text style={styles.sidebarLogoText}>
              MF
            </Text>
          </View>

          <View>
            <Text style={styles.sidebarTitle}>
              MF-RIDES
            </Text>
            <Text style={styles.sidebarSubtitle}>
              ADMIN CONTROL CENTER
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.sidebarScroll
          }
        >
          <Text style={styles.sidebarSectionTitle}>
            MAIN MENU
          </Text>

          {navItems.map((item) => {
            const active =
              dashboardPage === item.name;

            return (
              <Pressable
                key={item.name}
                onPress={() =>
                  setDashboardPage(item.name)
                }
                style={[
                  styles.navItem,
                  active && styles.navItemActive,
                ]}
              >
                <View
                  style={[
                    styles.navIcon,
                    active &&
                      styles.navIconActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.navIconText,
                      active &&
                        styles.navIconTextActive,
                    ]}
                  >
                    {item.icon}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.navText,
                    active &&
                      styles.navTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sidebarUser}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              A
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              Admin
            </Text>
            <Text style={styles.userRole}>
              Super Admin
            </Text>
          </View>

          <Pressable
            onPress={handleLogout}
            style={styles.sidebarLogout}
          >
            <Text style={styles.sidebarLogoutText}>
              ↪
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.dashboardMain}
        contentContainerStyle={
          styles.dashboardContent
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBarRight}>
  <View style={styles.searchBox}>
    <Text style={styles.searchIcon}>
      ⌕
    </Text>

    <Text style={styles.searchText}>
      Search here...
    </Text>
  </View>

  <View style={styles.notification}>
    <Text style={styles.notificationText}>
      ♧
    </Text>

    <View style={styles.notificationDot} />
  </View>

  <Pressable
    onPress={() => {
      setAdminMenuOpen(true);
    }}
    style={styles.adminProfileButton}
  >
    <View style={styles.topAvatar}>
      <Text style={styles.topAvatarText}>
        A
      </Text>
    </View>

    <Text style={styles.topAdminText}>
      {adminMenuOpen ? "Admin ▲" : "Admin ▼"}
    </Text>
  </Pressable>

  {adminMenuOpen && (
    <View style={styles.adminDropdown}>
      <Pressable
        style={styles.adminDropdownItem}
        onPress={() => {
          setAdminMenuOpen(false);
          
        }}
      >
        <Text style={styles.adminDropdownText}>
          Profile
        </Text>
      </Pressable>

      <Pressable
        style={styles.adminDropdownItem}
        onPress={() => {
          setAdminMenuOpen(false);
          setDashboardPage("Settings");
        }}
      >
        <Text style={styles.adminDropdownText}>
          Settings
        </Text>
      </Pressable>

      <Pressable
        style={styles.adminDropdownItem}
        onPress={() => {
          setAdminMenuOpen(false);
          handleLogout();
        }}
      >
        <Text style={styles.adminDropdownLogout}>
          Logout
        </Text>
      </Pressable>
    </View>
  )}

  <Pressable
    onPress={handleLogout}
    style={styles.topLogout}
  >
    <Text style={styles.topLogoutText}>
      LOGOUT
    </Text>
  </Pressable>
</View>

        {dashboardPage === "Dashboard" ? (
          <>
            <View style={styles.dashboardHeading}>
              <Text style={styles.headingEyebrow}>
                WELCOME BACK, ADMIN
              </Text>

              <Text style={styles.headingTitle}>
                Dashboard Overview
              </Text>

              <Text style={styles.headingText}>
                Control your entire MF-RIDES
                platform from one secure center.
              </Text>
            </View>

            {renderDashboardHome()}
          </>
        ) : (
          renderInnerPage()
        )}
      </ScrollView>
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {authScreen === "dashboard" ? (
        renderDashboard()
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.authScrollContent
            }
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.authPage}>
              <View style={styles.authBrand}>
                <View style={styles.authBrandLogo}>
                  <Text style={styles.authBrandLogoText}>
                    MF
                  </Text>
                </View>

                <Text style={styles.authBrandTitle}>
                  MF-RIDES
                </Text>

                <Text style={styles.authBrandSubtitle}>
                  ADMIN CONTROL CENTER
                </Text>

                <View style={styles.authGoldLine} />

                <Text style={styles.authBrandDescription}>
                  Manage rides, riders, drivers,
                  partners and payments from one
                  secure administration platform.
                </Text>

                <View style={styles.brandFeature}>
                  <View style={styles.brandFeatureIcon}>
                    <Text style={styles.brandFeatureIconText}>
                      ✓
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.brandFeatureTitle}>
                      Secure Control
                    </Text>
                    <Text style={styles.brandFeatureText}>
                      Private admin access
                    </Text>
                  </View>
                </View>

                <View style={styles.brandFeature}>
                  <View style={styles.brandFeatureIcon}>
                    <Text style={styles.brandFeatureIconText}>
                      ⚡
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.brandFeatureTitle}>
                      Live Management
                    </Text>
                    <Text style={styles.brandFeatureText}>
                      Monitor your platform
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.authRight}>
                {authScreen === "login" &&
                  renderLogin()}

                {authScreen === "create" &&
                  renderCreate()}

                {authScreen === "registerOtp" &&
                  renderOtp(false)}

                {authScreen === "loginOtp" &&
                  renderOtp(true)}

                {authScreen === "forgot" &&
                  renderForgot()}

                {authScreen === "resetPassword" &&
                  renderResetPassword()}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {showIntro && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.introOverlay,
            {
              opacity: introOpacity,
              transform: [
                { scale: introScale },
              ],
            },
          ]}
        >
          <Image
            source={require("./assets/mf2.png")}
            resizeMode="cover"
            style={styles.introImage}
          />

          <View style={styles.introShade} />

          <View style={styles.introLoading}>
            <View style={styles.introLoaderRing} />
            <Text style={styles.introLoadingText}>
              GET READY TO TAKE CONTROL
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B15",
  },

  flex: {
    flex: 1,
  },

  /*
  |--------------------------------------------------------------------------
  | INTRO
  |--------------------------------------------------------------------------
  */

  introOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: "#050812",
  },

  introImage: {
    width: "100%",
    height: "100%",
  },

  introShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(3,7,16,0.28)",
  },

  introLoading: {
    position: "absolute",
    bottom: 55,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  introLoaderRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: "#E9A91A",
    borderTopColor: "rgba(255,255,255,0.25)",
    marginBottom: 14,
  },

  introLoadingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
  },

  /*
  |--------------------------------------------------------------------------
  | AUTH PAGE
  |--------------------------------------------------------------------------
  */

  authScrollContent: {
    flexGrow: 1,
  },

  authPage: {
    flex: 1,
    minHeight: 760,
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
    flexDirection:
      W < 900 ? "column" : "row",
    paddingHorizontal:
      W < 900 ? 22 : 70,
    paddingVertical:
      W < 900 ? 30 : 55,
    gap: W < 900 ? 30 : 70,
  },

  authBrand: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal:
      W < 900 ? 5 : 25,
    paddingVertical:
      W < 900 ? 20 : 0,
  },

  authBrandLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#E9A91A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  authBrandLogoText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },

  authBrandTitle: {
    color: "#FFFFFF",
    fontSize: W < 700 ? 38 : 50,
    fontWeight: "900",
    letterSpacing: 5,
  },

  authBrandSubtitle: {
    color: "#E9A91A",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 8,
  },

  authGoldLine: {
    width: 85,
    height: 4,
    borderRadius: 10,
    backgroundColor: "#E9A91A",
    marginVertical: 25,
  },

  authBrandDescription: {
    color: "#8C94A7",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 500,
  },

  brandFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },

  brandFeatureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E9A91A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  brandFeatureIconText: {
    color: "#E9A91A",
    fontSize: 17,
    fontWeight: "900",
  },

  brandFeatureTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  brandFeatureText: {
    color: "#70788B",
    fontSize: 12,
    marginTop: 3,
  },

  authRight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loginCard: {
    width: "100%",
    maxWidth: 510,
    backgroundColor: "#121A2C",
    borderWidth: 1,
    borderColor: "#26324A",
    borderRadius: 26,
    padding: W < 600 ? 25 : 38,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 18,
    },
    elevation: 12,
  },

  adminIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: "#E9A91A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  adminIconText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  welcomeText: {
    color: "#E9A91A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
  },

  loginTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 7,
  },

  loginSubtitle: {
    color: "#858DA0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  label: {
    color: "#D6DBE5",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 8,
  },

  inputBox: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303C55",
    backgroundColor: "#0C1323",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  inputIcon: {
    width: 28,
    color: "#E9A91A",
    fontSize: 15,
    fontWeight: "900",
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 14,
  },

  showButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  showText: {
    color: "#E9A91A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  authLinksRow: {
    alignItems: "flex-end",
    marginTop: 10,
  },

  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },

  securityDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: "#43C879",
    marginRight: 8,
  },

  securityText: {
    color: "#727B8E",
    fontSize: 11,
  },

  loginButton: {
    minHeight: 57,
    borderRadius: 15,
    backgroundColor: "#E9A91A",
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  loginButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  loginButtonText: {
    color: "#0A0F1C",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },

  arrow: {
    color: "#0A0F1C",
    fontSize: 21,
    fontWeight: "900",
    marginLeft: 11,
  },

  createAccountRow: {
    alignItems: "center",
    marginTop: 20,
    gap: 5,
  },

  backRow: {
    alignItems: "center",
    marginTop: 20,
    gap: 5,
  },
  resendRow: {
    alignItems: "center",
    marginTop: 14,
    marginBottom: 4,
  },

  resendDisabledText: {
    color: "#7F8798",
    fontSize: 12,
    fontWeight: "600",
  },
  createAccountText: {
    color: "#747D90",
    fontSize: 11,
    textAlign: "center",
  },

  linkText: {
    color: "#E9A91A",
    fontSize: 12,
    fontWeight: "900",
  },

  errorText: {
    color: "#FF6B6B",
    fontSize: 11,
    marginTop: 11,
    textAlign: "center",
  },

  successText: {
    color: "#43C879",
    fontSize: 11,
    marginTop: 11,
    textAlign: "center",
  },

  footerText: {
    color: "#50596B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 22,
  },

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD SHELL
  |--------------------------------------------------------------------------
  */

  dashboardContainer: {
    flex: 1,
    flexDirection:
      W < 900 ? "column" : "row",
    backgroundColor: "#060A13",
  },

  sidebar: {
    width: W < 900 ? "100%" : 235,
    maxHeight:
      W < 900 ? 115 : undefined,
    backgroundColor: "#080D17",
    borderRightWidth:
      W < 900 ? 0 : 1,
    borderBottomWidth:
      W < 900 ? 1 : 0,
    borderColor: "#182234",
    paddingTop: 22,
    paddingHorizontal: 16,
  },

  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    marginBottom: 22,
  },

  sidebarLogo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#E9A91A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  sidebarLogoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  sidebarTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sidebarSubtitle: {
    color: "#E9A91A",
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 2,
  },

  sidebarScroll: {
    paddingBottom: 10,
  },

  sidebarSectionTitle: {
    color: "#4E596D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginHorizontal: 9,
    marginBottom: 8,
  },

  navItem: {
    height: 39,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: "#E9A91A",
  },

  navIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  navIconActive: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  navIconText: {
    color: "#8C96A9",
    fontSize: 14,
    fontWeight: "800",
  },

  navIconTextActive: {
    color: "#10151F",
  },

  navText: {
    color: "#9AA3B4",
    fontSize: 11,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#10151F",
    fontWeight: "900",
  },

  sidebarUser: {
    minHeight: 65,
    borderTopWidth: 1,
    borderColor: "#182234",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1C2941",
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatarText: {
    color: "#E9A91A",
    fontSize: 12,
    fontWeight: "900",
  },

  userInfo: {
    flex: 1,
    marginLeft: 9,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  userRole: {
    color: "#606B7D",
    fontSize: 9,
    marginTop: 2,
  },

  sidebarLogout: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#111A2B",
    alignItems: "center",
    justifyContent: "center",
  },

  sidebarLogoutText: {
    color: "#E9A91A",
    fontSize: 14,
  },

  dashboardMain: {
    flex: 1,
  },

  dashboardContent: {
    padding:
      W < 900 ? 18 : 28,
    paddingBottom: 50,
  },

  topBar: {
    minHeight: 60,
    flexDirection:
      W < 700 ? "column" : "row",
    alignItems:
      W < 700 ? "flex-start" : "center",
    justifyContent: "space-between",
    gap: 15,
  },

  topBarSmall: {
    color: "#596479",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  topBarTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },

  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  searchBox: {
    width: W < 600 ? 145 : 200,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1D283B",
    backgroundColor: "#0B111E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  searchIcon: {
    color: "#6D778A",
    fontSize: 15,
    marginRight: 7,
  },

  searchText: {
    color: "#505A6C",
    fontSize: 9,
  },

  searchInput: {
  flex: 1,
  color: "#E8ECF4",
  fontSize: 9,
  paddingVertical: 0,
  paddingHorizontal: 0,
  },

  notification: {
    width: 33,
    height: 33,
    borderRadius: 9,
    backgroundColor: "#0B111E",
    borderWidth: 1,
    borderColor: "#1D283B",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationText: {
    color: "#9BA5B8",
    fontSize: 15,
  },

  notificationDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#E9A91A",
    right: 7,
    top: 6,
  },

  topAvatar: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#1B2941",
    alignItems: "center",
    justifyContent: "center",
  },

  topAvatarText: {
    color: "#E9A91A",
    fontSize: 12,
    fontWeight: "900",
  },
  adminProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminDropdown: {
    position: "absolute",
    top: 42,
    right: 45,
    width: 130,
    backgroundColor: "#0B111E",
    borderWidth: 1,
    borderColor: "#1B2639",
    borderRadius: 8,
    paddingVertical: 5,
    zIndex: 1000,
    elevation: 10,
  },

  adminDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

 adminDropdownText: {
   color: "#E8ECF4",
   fontSize: 9,
   fontWeight: "700",
},

 adminDropdownLogout: {
   color: "#E9A91A",
   fontSize: 9,
   fontWeight: "700",
 },
  topAdminText: {
    color: "#A5AEBE",
    fontSize: 10,
    fontWeight: "700",
  },

  topLogout: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9B7011",
    justifyContent: "center",
  },

  topLogoutText: {
    color: "#E9A91A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  dashboardHeading: {
    marginTop: 25,
    marginBottom: 22,
  },

  headingEyebrow: {
    color: "#E9A91A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  headingTitle: {
    color: "#FFFFFF",
    fontSize: W < 600 ? 28 : 34,
    fontWeight: "900",
    marginTop: 5,
  },

  headingText: {
    color: "#687388",
    fontSize: 12,
    marginTop: 6,
  },

  /*
  |--------------------------------------------------------------------------
  | METRICS
  |--------------------------------------------------------------------------
  */

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metricCard: {
    flexGrow: 1,
    flexBasis:
      W < 700 ? "45%" : "17%",
    minWidth:
      W < 700 ? 145 : 145,
    minHeight: 112,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0C1320",
    padding: 14,
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color: "#7A8599",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  metricIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: "#151F31",
    alignItems: "center",
    justifyContent: "center",
  },

  metricIconText: {
    color: "#E9A91A",
    fontSize: 12,
    fontWeight: "900",
  },

  metricValue: {
    color: "#FFFFFF",
    fontSize: W < 700 ? 20 : 22,
    fontWeight: "900",
    marginTop: 15,
  },

  metricChange: {
    color: "#49C67C",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 6,
  },

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD PANELS
  |--------------------------------------------------------------------------
  */

  dashboardRow: {
    flexDirection:
      W < 850 ? "column" : "row",
    gap: 12,
    marginTop: 12,
  },

  mapCard: {
    flex: 1.5,
    minHeight: 285,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  requestsCard: {
    flex: 1,
    minHeight: 285,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  chartCard: {
    flex: 1.45,
    minHeight: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  heatCard: {
    flex: 1,
    minHeight: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  statusCard: {
    flex: 1,
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  tableCard: {
    flex: 1,
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  activityCard: {
    flex: 1,
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    padding: 15,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  panelTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  panelSubtitle: {
    color: "#59657A",
    fontSize: 8,
    marginTop: 3,
  },

  panelMore: {
    color: "#717C90",
    fontSize: 8,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E211A",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#46C87A",
    marginRight: 5,
  },

  liveText: {
    color: "#46C87A",
    fontSize: 7,
    fontWeight: "900",
  },

  /*
  |--------------------------------------------------------------------------
  | FAKE MAP
  |--------------------------------------------------------------------------
  */

  fakeMap: {
    flex: 1,
    minHeight: 215,
    borderRadius: 9,
    backgroundColor: "#101A2A",
    overflow: "hidden",
    position: "relative",
  },

  mapRoadOne: {
    position: "absolute",
    width: "135%",
    height: 1,
    backgroundColor: "#25344B",
    transform: [{ rotate: "28deg" }],
    top: "43%",
    left: "-20%",
  },

  mapRoadTwo: {
    position: "absolute",
    width: "130%",
    height: 1,
    backgroundColor: "#25344B",
    transform: [{ rotate: "-22deg" }],
    top: "55%",
    left: "-10%",
  },

  mapRoadThree: {
    position: "absolute",
    width: "120%",
    height: 1,
    backgroundColor: "#1D2B40",
    transform: [{ rotate: "62deg" }],
    top: "38%",
    left: "-5%",
  },

  mapVehicle: {
    position: "absolute",
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#17243A",
    alignItems: "center",
    justifyContent: "center",
  },

  mapVehicleText: {
    fontSize: 13,
  },

  mapCenter: {
    position: "absolute",
    left: "49%",
    top: "47%",
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#2E8EDC",
    alignItems: "center",
    justifyContent: "center",
  },

  mapCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#2E9DF2",
  },

  mapPlaceOne: {
    position: "absolute",
    left: "8%",
    top: "20%",
    color: "#536278",
    fontSize: 7,
  },

  mapPlaceTwo: {
    position: "absolute",
    right: "13%",
    top: "18%",
    color: "#536278",
    fontSize: 7,
  },

  mapPlaceThree: {
    position: "absolute",
    right: "21%",
    bottom: "19%",
    color: "#536278",
    fontSize: 7,
  },

  mapPlaceFour: {
    position: "absolute",
    left: "15%",
    bottom: "18%",
    color: "#536278",
    fontSize: 7,
  },

  /*
  |--------------------------------------------------------------------------
  | REQUESTS
  |--------------------------------------------------------------------------
  */

  requestRow: {
    minHeight: 43,
    borderTopWidth: 1,
    borderColor: "#172236",
    flexDirection: "row",
    alignItems: "center",
  },

  requestRoute: {
    flex: 1,
  },

  requestFrom: {
    color: "#D6DCE6",
    fontSize: 8,
    fontWeight: "800",
  },

  requestArrow: {
    position: "absolute",
    left: 72,
    top: 0,
    color: "#586579",
    fontSize: 8,
  },

  requestTo: {
    color: "#677387",
    fontSize: 7,
    marginTop: 2,
  },

  requestPrice: {
    color: "#E9A91A",
    fontSize: 9,
    fontWeight: "900",
    marginRight: 8,
  },

  acceptButton: {
    backgroundColor: "#13271E",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  acceptText: {
    color: "#4AC67C",
    fontSize: 7,
    fontWeight: "900",
  },

  /*
  |--------------------------------------------------------------------------
  | BAR CHART
  |--------------------------------------------------------------------------
  */

  weekBadge: {
    backgroundColor: "#101A2B",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  weekText: {
    color: "#8A95A8",
    fontSize: 7,
  },

  chartArea: {
    flex: 1,
    minHeight: 190,
    position: "relative",
  },

  chartGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "0%",
    borderTopWidth: 1,
    borderColor: "#162135",
  },

  barRow: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 8,
    bottom: 25,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 3,
  },

  chartBar: {
    width: "62%",
    maxWidth: 24,
    minHeight: 8,
    backgroundColor: "#E9A91A",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    opacity: 0.82,
  },

  chartLabels: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  chartLabel: {
    color: "#59657A",
    fontSize: 7,
  },

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  statusBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  donut: {
    width: 105,
    height: 105,
    borderRadius: 53,
    borderWidth: 13,
    borderColor: "#2AB79B",
    borderTopColor: "#E9A91A",
    borderRightColor: "#375B8B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  donutInner: {
    alignItems: "center",
  },

  donutValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  donutText: {
    color: "#5D687C",
    fontSize: 7,
    fontWeight: "800",
    marginTop: 2,
  },

  statusLegend: {
    flex: 1,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  legendDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#2AB79B",
    marginRight: 7,
  },

  legendDotGold: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#E9A91A",
    marginRight: 7,
  },

  legendDotRed: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#E25555",
    marginRight: 7,
  },

  legendText: {
    flex: 1,
    color: "#7B869A",
    fontSize: 8,
  },

  legendValue: {
    color: "#D8DDE6",
    fontSize: 8,
    fontWeight: "900",
  },

  /*
  |--------------------------------------------------------------------------
  | DRIVERS
  |--------------------------------------------------------------------------
  */

  driverRow: {
    minHeight: 37,
    borderTopWidth: 1,
    borderColor: "#172236",
    flexDirection: "row",
    alignItems: "center",
  },

  rankCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#17243A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  rankText: {
    color: "#E9A91A",
    fontSize: 8,
    fontWeight: "900",
  },

  driverInfo: {
    flex: 1,
  },

  driverName: {
    color: "#D9DEE8",
    fontSize: 8,
    fontWeight: "800",
  },

  driverRides: {
    color: "#59657A",
    fontSize: 7,
    marginTop: 2,
  },

  driverRating: {
    color: "#E9A91A",
    fontSize: 8,
    fontWeight: "900",
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVITY
  |--------------------------------------------------------------------------
  */

  activityRow: {
    minHeight: 34,
    borderTopWidth: 1,
    borderColor: "#172236",
    flexDirection: "row",
    alignItems: "center",
  },

  activityIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: "#16243A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  activityIconText: {
    color: "#E9A91A",
    fontSize: 9,
    fontWeight: "900",
  },

  activityName: {
    flex: 1,
    color: "#8791A3",
    fontSize: 8,
  },

  activityTime: {
    color: "#505B6E",
    fontSize: 7,
  },

  /*
  |--------------------------------------------------------------------------
  | HEATMAP
  |--------------------------------------------------------------------------
  */

  heatmap: {
    flex: 1,
    minHeight: 180,
    backgroundColor: "#101A2A",
    borderRadius: 9,
    overflow: "hidden",
    position: "relative",
  },

  heatSpot: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E9A91A",
    shadowColor: "#E9A91A",
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },

  heatLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },

  heatLegendText: {
    color: "#586478",
    fontSize: 6,
    fontWeight: "900",
  },

  heatLegendBar: {
    width: 100,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#E9A91A",
  },

  /*
  |--------------------------------------------------------------------------
  | INNER PAGES
  |--------------------------------------------------------------------------
  */

  innerPage: {
    flex: 1,
    marginTop: 25,
  },

  innerHero: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1C283C",
    backgroundColor: "#0C1320",
    padding: W < 600 ? 22 : 35,
  },

  innerIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: "#E9A91A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  innerIconText: {
    color: "#0A0F1C",
    fontSize: 23,
    fontWeight: "900",
  },

  innerEyebrow: {
    color: "#E9A91A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  innerTitle: {
    color: "#FFFFFF",
    fontSize: W < 600 ? 28 : 38,
    fontWeight: "900",
    marginTop: 6,
  },

  innerText: {
    color: "#6D788B",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 650,
  },

  placeholderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  placeholderCard: {
    flex: 1,
    minWidth: 145,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0C1320",
    padding: 18,
  },

  placeholderLabel: {
    color: "#677287",
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  placeholderValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 12,
  },

  emptyPanel: {
    minHeight: 230,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B2639",
    backgroundColor: "#0B121F",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPanelTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  emptyPanelText: {
    color: "#657186",
    fontSize: 10,
    marginTop: 7,
  },
});