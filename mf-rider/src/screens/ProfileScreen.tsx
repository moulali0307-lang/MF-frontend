import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

const COLORS = {
  bg: "#F8F6F1",
  white: "#FFFFFF",
  cream: "#FFF2D3",
  gold: "#E7A400",
  goldDark: "#B97800",
  navy: "#0C172A",
  text: "#152238",
  muted: "#717A89",
  line: "#E7E0D4",
  red: "#E64C4C",
};

const PROFILE_STORAGE_KEY = "mf-rider/profile";
const TOKEN_STORAGE_KEY = "mf-rider/auth-token";

export function ProfileScreen({
  onBack,
  onLogout,
}: Props) {
  const { user } = useAuth();

  const rider = user as any;

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(
    rider?.fullName || rider?.name || ""
  );

  const [age, setAge] = useState(
    rider?.age ? String(rider.age) : ""
  );

  const [phone, setPhone] = useState(
    rider?.phoneNumber ||
      rider?.phone ||
      ""
  );

  const [email, setEmail] = useState(
    rider?.email || ""
  );

  /*
   * SAVE PROFILE
   */
  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          name,
          age,
          phone,
          email,
        })
      );

      setEditing(false);

      Alert.alert(
        "Profile Updated",
        "Your profile details have been saved."
      );
    } catch (error) {
      console.log("Profile save error:", error);

      Alert.alert(
        "Error",
        "Unable to save profile."
      );
    }
  };

  /*
   * LOGOUT
   *
   * First clear the saved login token.
   * Then tell App.tsx to switch to LoginScreen.
   */
  const handleLogout = async () => {
    try {
      // Remove authentication token immediately.
      await AsyncStorage.removeItem(
        TOKEN_STORAGE_KEY
      );

      // Also remove saved profile data.
      await AsyncStorage.removeItem(
        PROFILE_STORAGE_KEY
      );

      // Tell App.tsx / AuthContext to logout.
      await onLogout();

    } catch (error) {
      console.log(
        "Logout error:",
        error
      );

      Alert.alert(
        "Logout Error",
        "Unable to logout. Please try again."
      );
    }
  };

  /*
   * LOGOUT CONFIRMATION
   */
  const confirmLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to logout?"
      );

      if (confirmed) {
        handleLogout();
      }

      return;
    }

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: handleLogout,
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ←
            </Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>
              My Profile
            </Text>

            <Text style={styles.headerSubtitle}>
              Manage your MF Rides account
            </Text>
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(name || "M")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <Text style={styles.profileName}>
            {name || "MF Rider"}
          </Text>

          <Text style={styles.profileEmail}>
            {email || "No email added"}
          </Text>
        </View>

        {/* DETAILS */}

        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>
                ACCOUNT DETAILS
              </Text>

              <Text style={styles.sectionTitle}>
                Personal Information
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setEditing(!editing)
              }
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>
                {editing
                  ? "Cancel"
                  : "Edit"}
              </Text>
            </Pressable>
          </View>

          {/* NAME */}

          <ProfileField
            label="FULL NAME"
            value={name}
            editing={editing}
            onChangeText={setName}
            placeholder="Enter your name"
          />

          {/* AGE */}

          <ProfileField
            label="AGE"
            value={age}
            editing={editing}
            onChangeText={(text) =>
              setAge(
                text.replace(
                  /[^0-9]/g,
                  ""
                )
              )
            }
            placeholder="Enter your age"
            keyboardType="numeric"
          />

          {/* PHONE */}

          <ProfileField
            label="PHONE NUMBER"
            value={phone}
            editing={editing}
            onChangeText={(text) =>
              setPhone(
                text.replace(
                  /[^0-9+]/g,
                  ""
                )
              )
            }
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          {/* EMAIL */}

          <ProfileField
            label="EMAIL"
            value={email}
            editing={editing}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
          />

          {/* SAVE */}

          {editing && (
            <Pressable
              onPress={saveProfile}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            </Pressable>
          )}
        </View>

        {/* SECURITY */}

        <View style={styles.securityCard}>
          <Text style={styles.securityIcon}>
            ✓
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>
              Account Security
            </Text>

            <Text style={styles.securityText}>
              Your MF Rides account information is
              protected.
            </Text>
          </View>
        </View>

        {/* LOGOUT */}

        <Pressable
          onPress={confirmLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutIcon}>
            ↪
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.logoutTitle}>
              Logout
            </Text>

            <Text style={styles.logoutSubtitle}>
              Sign out from this device
            </Text>
          </View>

          <Text style={styles.logoutArrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          MF RIDES • Ride. Travel. Explore.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/*
 * PROFILE FIELD
 */

function ProfileField({
  label,
  value,
  editing,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A3A8B0"
          keyboardType={keyboardType}
          autoCapitalize="none"
          style={styles.input}
        />
      ) : (
        <Text style={styles.fieldValue}>
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );
}

/*
 * STYLES
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal:
      Platform.OS === "web"
        ? 42
        : 18,
    paddingTop: 14,
    paddingBottom: 40,
  },

  header: {
    height: 76,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: COLORS.navy,
    fontSize: 26,
    fontWeight: "900",
  },

  headerTitle: {
    color: COLORS.navy,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },

  profileCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 26,
    paddingVertical: 30,
    alignItems: "center",
    marginBottom: 14,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.gold,
    borderWidth: 3,
    borderColor: "#FFD86A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: COLORS.navy,
    fontSize: 36,
    fontWeight: "900",
  },

  profileName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
  },

  profileEmail: {
    color: "#AAB3C1",
    fontSize: 11,
    marginTop: 4,
  },

  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionLabel: {
    color: COLORS.goldDark,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  sectionTitle: {
    color: COLORS.navy,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },

  editButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: "#EEDDB9",
  },

  editButtonText: {
    color: COLORS.goldDark,
    fontSize: 12,
    fontWeight: "900",
  },

  field: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  fieldLabel: {
    color: "#8B929E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  fieldValue: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: "800",
  },

  input: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDD5C8",
    backgroundColor: "#FBFAF7",
    paddingHorizontal: 14,
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "700",
  },

  saveButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  securityCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#EFFAF4",
    borderWidth: 1,
    borderColor: "#D6F0E1",
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D8F4E4",
    color: "#159A63",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 21,
    fontWeight: "900",
    marginRight: 12,
  },

  securityTitle: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "900",
  },

  securityText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  logoutButton: {
    marginTop: 14,
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: "#FFF0EF",
    borderWidth: 1,
    borderColor: "#F2C9C6",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  logoutIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFE0DE",
    color: COLORS.red,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    marginRight: 12,
  },

  logoutTitle: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: "900",
  },

  logoutSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 3,
  },

  logoutArrow: {
    color: COLORS.red,
    fontSize: 22,
    fontWeight: "900",
  },

  footer: {
    textAlign: "center",
    color: "#A2A8B1",
    fontSize: 9,
    marginTop: 18,
  },
});

export default ProfileScreen;