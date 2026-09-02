import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { fetchWallet } from "../api/wallet";

interface Props {
  onBack: () => void;
}

const operators = ["Jio", "Airtel", "Vi", "BSNL"];
const amounts = ["199", "299", "399", "499"];

/**
 * Wallet stores money in the smallest currency unit.
 * For INR:
 * ₹500 = 50000 paise
 */
function minorToRupees(value: number | string | bigint): number {
  return Number(value) / 100;
}

export function RechargeScreen({ onBack }: Props) {
  const { token } = useAuth();

  const [mobile, setMobile] = useState("");
  const [operator, setOperator] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState("INR");

  const [loadingWallet, setLoadingWallet] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const loadWallet = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoadingWallet(false);
        setWalletError("Please login to view your wallet.");
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoadingWallet(true);
        }

        setWalletError(null);

        const result = await fetchWallet(token);

        const wallet = result.wallet as {
          availableMinor?: number | string | bigint;
          balanceMinor?: number | string | bigint;
          balance?: number | string;
          currency?: string;
        };

        let balance = 0;

        if (wallet.availableMinor !== undefined) {
          balance = minorToRupees(wallet.availableMinor);
        } else if (wallet.balanceMinor !== undefined) {
          balance = minorToRupees(wallet.balanceMinor);
        } else if (wallet.balance !== undefined) {
          balance = Number(wallet.balance);
        }

        setWalletBalance(
          Number.isFinite(balance) ? balance : 0,
        );

        setWalletCurrency(wallet.currency || "INR");
      } catch (error) {
        console.error("WALLET LOAD ERROR:", error);

        setWalletError(
          error instanceof Error
            ? error.message
            : "Unable to load wallet.",
        );
      } finally {
        setLoadingWallet(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleRecharge = () => {
    if (mobile.length !== 10) {
      Alert.alert(
        "Mobile number required",
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    if (!operator) {
      Alert.alert(
        "Select operator",
        "Please select your mobile operator.",
      );
      return;
    }

    if (!amount) {
      Alert.alert(
        "Select amount",
        "Please select a recharge amount.",
      );
      return;
    }

    const rechargeAmount = Number(amount);

    if (
      !Number.isFinite(rechargeAmount) ||
      rechargeAmount <= 0
    ) {
      Alert.alert(
        "Invalid amount",
        "Please select a valid recharge amount.",
      );
      return;
    }

    if (
      walletBalance !== null &&
      rechargeAmount > walletBalance
    ) {
      Alert.alert(
        "Insufficient wallet balance",
        `Your wallet balance is ₹${walletBalance.toFixed(
          2,
        )}. Please add money to your wallet before continuing.`,
      );
      return;
    }

    Alert.alert(
      "Recharge Ready",
      `Mobile: +91 ${mobile}\nOperator: ${operator}\nAmount: ₹${amount}\n\nThe recharge payment API is not connected yet.`,
      [
        {
          text: "OK",
          style: "cancel",
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadWallet(true)}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Recharge
            </Text>

            <Text style={styles.headerSub}>
              Fast and simple mobile recharge
            </Text>
          </View>
        </View>

        {/* WALLET */}

        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <View>
              <Text style={styles.walletLabel}>
                WALLET BALANCE
              </Text>

              {loadingWallet ? (
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                  style={styles.walletLoader}
                />
              ) : (
                <Text style={styles.walletBalance}>
                  {walletCurrency === "INR"
                    ? "₹"
                    : walletCurrency}{" "}
                  {walletBalance !== null
                    ? walletBalance.toFixed(2)
                    : "0.00"}
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => loadWallet(true)}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>↻</Text>
            </Pressable>
          </View>

          {walletError ? (
            <Text style={styles.walletError}>
              {walletError}
            </Text>
          ) : (
            <Text style={styles.walletHelper}>
              Available balance for payments
            </Text>
          )}
        </View>

        {/* HERO */}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>⚡</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Recharge instantly
            </Text>

            <Text style={styles.heroText}>
              Enter your number, select your operator
              and choose a recharge plan.
            </Text>
          </View>
        </View>

        {/* MOBILE */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            MOBILE NUMBER
          </Text>

          <View style={styles.input}>
            <Text style={styles.country}>+91</Text>

            <TextInput
              value={mobile}
              onChangeText={(value) =>
                setMobile(
                  value.replace(/\D/g, "").slice(0, 10),
                )
              }
              keyboardType="phone-pad"
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#9A9EAA"
              style={styles.textInput}
            />
          </View>

          <Text style={styles.helper}>
            Enter the mobile number you want to recharge.
          </Text>
        </View>

        {/* OPERATOR */}

        <Text style={styles.sectionTitle}>
          SELECT OPERATOR
        </Text>

        <View style={styles.operatorGrid}>
          {operators.map((item) => {
            const selected = operator === item;

            return (
              <Pressable
                key={item}
                onPress={() => setOperator(item)}
                style={[
                  styles.operator,
                  selected && styles.operatorSelected,
                ]}
              >
                <View style={styles.operatorIcon}>
                  <Text style={styles.operatorIconText}>
                    {item.charAt(0)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.operatorText,
                    selected &&
                      styles.operatorTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* AMOUNT */}

        <Text style={styles.sectionTitle}>
          SELECT RECHARGE AMOUNT
        </Text>

        <View style={styles.amountGrid}>
          {amounts.map((item) => {
            const selected = amount === item;

            return (
              <Pressable
                key={item}
                onPress={() => setAmount(item)}
                style={[
                  styles.amount,
                  selected && styles.amountSelected,
                ]}
              >
                <Text
                  style={[
                    styles.amountText,
                    selected &&
                      styles.amountTextSelected,
                  ]}
                >
                  ₹{item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* CUSTOM AMOUNT */}

        <View style={styles.customCard}>
          <Text style={styles.customTitle}>
            Need another amount?
          </Text>

          <Text style={styles.customSub}>
            You can enter a custom recharge amount.
          </Text>

          <View style={styles.customInput}>
            <Text style={styles.rupee}>₹</Text>

            <TextInput
              value={
                amount && !amounts.includes(amount)
                  ? amount
                  : ""
              }
              placeholder="Custom amount"
              placeholderTextColor="#9A9EAA"
              keyboardType="number-pad"
              style={styles.customTextInput}
              onChangeText={(value) => {
                const clean =
                  value.replace(/\D/g, "");

                setAmount(clean || null);
              }}
            />
          </View>
        </View>

        {/* SUMMARY */}

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryTitle}>
              Recharge Summary
            </Text>

            <Text style={styles.summaryText}>
              {mobile
                ? `+91 ${mobile}`
                : "Mobile number not entered"}
            </Text>

            <Text style={styles.summaryText}>
              {operator || "Operator not selected"}
            </Text>
          </View>

          <Text style={styles.summaryPrice}>
            ₹{amount || "0"}
          </Text>
        </View>

        {/* RECHARGE BUTTON */}

        <Pressable
          onPress={handleRecharge}
          style={({ pressed }) => [
            styles.rechargeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.rechargeText}>
            Continue to Payment
          </Text>

          <Text style={styles.arrow}>→</Text>
        </Pressable>

        {/* SECURITY */}

        <View style={styles.security}>
          <Text style={styles.securityIcon}>✓</Text>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Safe & Secure
            </Text>

            <Text style={styles.securityText}>
              Your recharge details are protected.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F6F1",
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7E0D4",
  },

  backText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#152238",
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#152238",
  },

  headerSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#717489",
  },

  walletCard: {
    padding: 19,
    borderRadius: 22,
    backgroundColor: "#171C2B",
    marginBottom: 18,
  },

  walletTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  walletLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#BFC4D0",
  },

  walletBalance: {
    marginTop: 6,
    fontSize: 27,
    fontWeight: "900",
    color: "#E7A400",
  },

  walletLoader: {
    marginTop: 12,
    alignSelf: "flex-start",
  },

  walletHelper: {
    marginTop: 8,
    fontSize: 10,
    color: "#BFC4D0",
  },

  walletError: {
    marginTop: 8,
    fontSize: 10,
    color: "#FFB4B4",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#252B3C",
    alignItems: "center",
    justifyContent: "center",
  },

  refreshText: {
    color: "#E7A400",
    fontSize: 24,
    fontWeight: "800",
  },

  hero: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#ECF7DE",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 24,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  heroEmoji: {
    fontSize: 32,
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#152238",
  },

  heroText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#717489",
  },

  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    marginBottom: 20,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#E7A400",
  },

  input: {
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  country: {
    fontSize: 14,
    fontWeight: "900",
    color: "#152238",
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#DCD6CB",
  },

  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#152238",
  },

  helper: {
    marginTop: 8,
    fontSize: 10,
    color: "#8A8E9B",
  },

  operatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  operator: {
    width: "47%",
    minHeight: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 10,
  },

  operatorSelected: {
    backgroundColor: "#FFF0C5",
    borderColor: "#E7A400",
  },

  operatorIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#171C2B",
    alignItems: "center",
    justifyContent: "center",
  },

  operatorIconText: {
    color: "#E7A400",
    fontSize: 15,
    fontWeight: "900",
  },

  operatorText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#152238",
  },

  operatorTextSelected: {
    color: "#A66F00",
  },

  amountGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  amount: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    alignItems: "center",
    justifyContent: "center",
  },

  amountSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
  },

  amountText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#152238",
  },

  amountTextSelected: {
    color: "#FFFFFF",
  },

  customCard: {
    padding: 17,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    marginBottom: 20,
  },

  customTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#152238",
  },

  customSub: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 11,
    color: "#717489",
  },

  customInput: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  rupee: {
    fontSize: 17,
    fontWeight: "900",
    color: "#E7A400",
    marginRight: 8,
  },

  customTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#152238",
  },

  summary: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#171C2B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 5,
  },

  summaryText: {
    color: "#BFC4D0",
    fontSize: 10,
    marginTop: 2,
  },

  summaryPrice: {
    color: "#E7A400",
    fontSize: 22,
    fontWeight: "900",
  },

  rechargeButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#E7A400",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rechargeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  security: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECF7DE",
    color: "#4B8B21",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 18,
    fontWeight: "900",
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#152238",
  },

  securityText: {
    marginTop: 3,
    fontSize: 10,
    color: "#717489",
  },
});