import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  AuthProvider,
  useAuth,
} from "./src/context/AuthContext";

import HomeScreen from "./src/screens/HomeScreen";
import { BookRideScreen } from "./src/screens/BookRideScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { MoreServicesScreen } from "./src/screens/MoreServicesScreen";
import { BusBookingScreen } from "./src/screens/BusBookingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { TrainBookingScreen } from "./src/screens/TrainBookingScreen";
import MovieBookingScreen from "./src/screens/MovieBookingScreen";
import { RechargeScreen } from "./src/screens/RechargeScreen";
import JourneyScreen from "./src/screens/JourneyScreen";

import { colors } from "./src/theme/colors";

type AuthScreen =
  | "welcome"
  | "register"
  | "login";

type AppScreen =
  | "home"
  | "bookRide"
  | "moreServices"
  | "busBooking"
  | "trainBooking"
  | "movieBooking"
  | "recharge"
  | "profile"
  | "journey";

function RootNavigator() {
  const {
    user,
    isRestoring,
    logout,
  } = useAuth();

  const [authScreen, setAuthScreen] =
    useState<AuthScreen>("login");

  const [appScreen, setAppScreen] =
    useState<AppScreen>("home");

  if (isRestoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
        />
      </View>
    );
  }

  if (user) {
    if (appScreen === "profile") {
      return (
        <ProfileScreen
          onBack={() => setAppScreen("home")}
          onLogout={async () => {
            await logout();
            setAppScreen("home");
            setAuthScreen("login");
          }}
        />
      );
    }

    if (appScreen === "journey") {
      return (
        <JourneyScreen
          onBack={() => setAppScreen("home")}
          onBookRide={() => setAppScreen("bookRide")}
        />
      );
    }

    if (appScreen === "moreServices") {
      return (
        <MoreServicesScreen
          onBack={() => setAppScreen("home")}
          onBus={() => setAppScreen("busBooking")}
          onTrain={() => setAppScreen("trainBooking")}
          onMovies={() => setAppScreen("movieBooking")}
          onRecharge={() => setAppScreen("recharge")}
        />
      );
    }

    if (appScreen === "busBooking") {
      return (
        <BusBookingScreen
          onBack={() => setAppScreen("moreServices")}
        />
      );
    }

    if (appScreen === "bookRide") {
      return (
        <BookRideScreen
          onBack={() => setAppScreen("home")}
        />
      );
    }

    if (appScreen === "trainBooking") {
      return (
        <TrainBookingScreen
          onBack={() => setAppScreen("moreServices")}
        />
      );
    }

    if (appScreen === "movieBooking") {
      return (
        <MovieBookingScreen
          onBack={() => setAppScreen("moreServices")}
        />
      );
    }

    if (appScreen === "recharge") {
      return (
        <RechargeScreen
          onBack={() => setAppScreen("moreServices")}
        />
      );
    }

    return (
      <HomeScreen
        onBookRide={() => setAppScreen("bookRide")}
        onMoreServices={() => setAppScreen("moreServices")}
        onMenu={() => setAppScreen("profile")}
        onBus={() => setAppScreen("busBooking")}
        onTrain={() => setAppScreen("trainBooking")}
        onMovies={() => setAppScreen("movieBooking")}
        onRecharge={() => setAppScreen("recharge")}
        onJourney={() => setAppScreen("journey")}
      />
    );
  }

  switch (authScreen) {
    case "register":
      return (
        <RegisterScreen
          onGoToLogin={() => setAuthScreen("login")}
        />
      );

    case "login":
      return (
        <LoginScreen
          onGoToRegister={() => setAuthScreen("register")}
          onLoginSuccess={() => {}}
        />
      );

    case "welcome":
    default:
      return (
        <WelcomeScreen
          onGoToRegister={() => setAuthScreen("register")}
          onGoToLogin={() => setAuthScreen("login")}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
