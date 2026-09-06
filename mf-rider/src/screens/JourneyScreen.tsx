import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../theme/colors";

type JourneyScreenProps = {
  onBack: () => void;
  onBookRide?: () => void;
};

type JourneyStep = "register" | "chat" | "route";

type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
};

const GOLD = colors.accent || "#F4A900";
const NAVY = "#14213D";
const BG = "#F8F5EE";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const GREEN = "#16834B";


type DestinationSuggestion = {
  name: string;
  country: string;
  area: string;
  tag: string;
};

const DESTINATION_SUGGESTIONS: DestinationSuggestion[] = [
  { name: "Hyderabad", country: "India", area: "Charminar • Hussain Sagar • Golconda", tag: "City" },
  { name: "Goa", country: "India", area: "Baga • Calangute • Panjim • South Goa", tag: "Beach" },
  { name: "Vijayawada", country: "India", area: "Kanaka Durga Temple • Prakasam Barrage", tag: "City" },
  { name: "Guntur", country: "India", area: "Amaravati • Uppalapadu • City", tag: "Nearby" },
  { name: "Bengaluru", country: "India", area: "MG Road • Cubbon Park • Lalbagh", tag: "City" },
  { name: "Mumbai", country: "India", area: "Gateway of India • Marine Drive • Colaba", tag: "City" },
  { name: "Delhi", country: "India", area: "India Gate • Red Fort • Qutub Minar", tag: "City" },
  { name: "Jaipur", country: "India", area: "Amber Fort • Hawa Mahal • City Palace", tag: "Heritage" },
  { name: "Kerala", country: "India", area: "Munnar • Alleppey • Kochi • Varkala", tag: "Nature" },
  { name: "Kashmir", country: "India", area: "Srinagar • Gulmarg • Pahalgam", tag: "Mountains" },
  { name: "Dubai", country: "UAE", area: "Burj Khalifa • Dubai Marina • Palm Jumeirah", tag: "International" },
  { name: "Singapore", country: "Singapore", area: "Marina Bay • Sentosa • Gardens by the Bay", tag: "International" },
  { name: "Bangkok", country: "Thailand", area: "Grand Palace • Wat Arun • Sukhumvit", tag: "International" },
  { name: "Bali", country: "Indonesia", area: "Ubud • Seminyak • Kuta • Nusa Dua", tag: "Beach" },
  { name: "Tokyo", country: "Japan", area: "Shibuya • Asakusa • Tokyo Skytree", tag: "International" },
  { name: "Paris", country: "France", area: "Eiffel Tower • Louvre • Montmartre", tag: "International" },
  { name: "London", country: "United Kingdom", area: "Big Ben • Tower Bridge • Buckingham Palace", tag: "International" },
  { name: "Rome", country: "Italy", area: "Colosseum • Vatican City • Trevi Fountain", tag: "Heritage" },
  { name: "Switzerland", country: "Switzerland", area: "Zurich • Interlaken • Lucerne • Zermatt", tag: "Mountains" },
  { name: "New York", country: "USA", area: "Times Square • Central Park • Statue of Liberty", tag: "International" },
  { name: "Los Angeles", country: "USA", area: "Hollywood • Santa Monica • Beverly Hills", tag: "International" },
  { name: "Sydney", country: "Australia", area: "Opera House • Harbour Bridge • Bondi Beach", tag: "International" },
  { name: "Toronto", country: "Canada", area: "CN Tower • Harbourfront • Niagara Falls", tag: "International" },
  { name: "Istanbul", country: "Türkiye", area: "Hagia Sophia • Blue Mosque • Bosphorus", tag: "Heritage" },
  { name: "Maldives", country: "Maldives", area: "Male • Maafushi • Island resorts", tag: "Beach" },
  { name: "Kathmandu", country: "Nepal", area: "Pashupatinath • Boudhanath • Patan", tag: "Heritage" },
  { name: "Sri Lanka", country: "Sri Lanka", area: "Colombo • Kandy • Ella • Galle", tag: "Nature" },
  { name: "Malaysia", country: "Malaysia", area: "Kuala Lumpur • Langkawi • Penang", tag: "International" },
  { name: "Seoul", country: "South Korea", area: "Myeongdong • Gyeongbokgung • Hongdae", tag: "International" },
  { name: "New Zealand", country: "New Zealand", area: "Queenstown • Auckland • Rotorua", tag: "Nature" },
];

const COUNTRY_DESTINATION_MAP: Record<string, string[]> = {
  india: ["Goa", "Hyderabad", "Jaipur", "Kerala", "Kashmir", "Mumbai", "Delhi"],
  uae: ["Dubai", "Abu Dhabi", "Sharjah"],
  thailand: ["Bangkok", "Phuket", "Krabi", "Chiang Mai"],
  japan: ["Tokyo", "Kyoto", "Osaka", "Hokkaido"],
  france: ["Paris", "Nice", "Lyon", "French Riviera"],
  italy: ["Rome", "Venice", "Florence", "Milan"],
  usa: ["New York", "Los Angeles", "Las Vegas", "San Francisco"],
  australia: ["Sydney", "Melbourne", "Gold Coast", "Cairns"],
  singapore: ["Singapore", "Sentosa", "Marina Bay"],
  indonesia: ["Bali", "Jakarta", "Lombok", "Yogyakarta"],
  nepal: ["Kathmandu", "Pokhara", "Chitwan"],
  maldives: ["Male", "Maafushi", "Hulhumale"],
  canada: ["Toronto", "Vancouver", "Banff", "Montreal"],
  switzerland: ["Zurich", "Interlaken", "Lucerne", "Zermatt"],
  "united kingdom": ["London", "Edinburgh", "Manchester", "Bath"],
  korea: ["Seoul", "Busan", "Jeju"],
  "south korea": ["Seoul", "Busan", "Jeju"],
  europe: ["Paris", "Rome", "London", "Switzerland"],
};

const getDestinationSuggestions = (query: string): DestinationSuggestion[] => {
  const q = query.trim().toLowerCase();
  if (!q) return DESTINATION_SUGGESTIONS.slice(0, 8);

  const countryMatches = DESTINATION_SUGGESTIONS.filter((item) =>
    item.country.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
  );

  if (countryMatches.length > 0) return countryMatches.slice(0, 8);

  return DESTINATION_SUGGESTIONS.filter((item) =>
    `${item.name} ${item.country} ${item.area} ${item.tag}`.toLowerCase().includes(q),
  ).slice(0, 8);
};

const getFamousPlacesForDestination = (destination: string): string[] => {
  const q = destination.trim().toLowerCase();
  const countryKey = Object.keys(COUNTRY_DESTINATION_MAP).find((key) => q.includes(key));
  if (countryKey) return COUNTRY_DESTINATION_MAP[countryKey].slice(0, 4);

  const match = DESTINATION_SUGGESTIONS.find((item) =>
    item.name.toLowerCase() === q || q.includes(item.name.toLowerCase()),
  );
  if (match) return match.area.split(" • ").slice(0, 4);

  return [destination || "Popular area", "Local landmark", "Local food street", "Best nearby attraction"];
};

export function JourneyScreen({ onBack, onBookRide }: JourneyScreenProps) {
  const [step, setStep] = useState<JourneyStep>("register");

  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [budget, setBudget] = useState("8000");
  const [days, setDays] = useState("3");
  const [travellers, setTravellers] = useState("2");
  const [interest, setInterest] = useState("Sightseeing");
  const [travelStyle, setTravelStyle] = useState("Easy & comfortable");
  const [stayType, setStayType] = useState("Any good stay");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [routePlaces, setRoutePlaces] = useState<string[]>([]);

  const destinationSuggestions = useMemo(
    () => getDestinationSuggestions(to),
    [to],
  );

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text:
        "Hi! I'm MF Journey AI. Tell me where you want to go, your budget, days and travel style. I'll turn it into a complete journey plan.",
    },
  ]);

  const [routeRequested, setRouteRequested] = useState(false);

  const tripBudget = Number(budget.replace(/[^0-9]/g, "")) || 0;
  const tripDays = Number(days.replace(/[^0-9]/g, "")) || 1;
  const people = Number(travellers.replace(/[^0-9]/g, "")) || 1;

  const budgetPlan = useMemo(() => {
    const transport = Math.round(tripBudget * 0.27);
    const stay = Math.round(tripBudget * 0.23);
    const food = Math.round(tripBudget * 0.18);
    const activities = Math.round(tripBudget * 0.12);
    const local = Math.round(tripBudget * 0.10);
    const buffer = Math.max(0, tripBudget - transport - stay - food - activities - local);

    return {
      transport,
      stay,
      food,
      activities,
      local,
      buffer,
    };
  }, [tripBudget]);

  const sendMessage = (text?: string) => {
    const value = (text ?? chatInput).trim();
    if (!value) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: value,
    };

    let aiText =
      "Got it. I can use that preference while building your journey.";

    const lower = value.toLowerCase();

    if (lower.includes("where") || lower.includes("famous") || lower.includes("places")) {
      const places = getFamousPlacesForDestination(to);
      aiText = `For ${to || "your destination"}, I can suggest ${places.join(", ")}. Pick what you like and I will include it in the journey.`;
    } else if (lower.includes("family")) {
      aiText =
        "Great. I'll prioritize family-friendly places, comfortable travel and safer stop suggestions.";
    } else if (lower.includes("food")) {
      aiText =
        "Perfect. I'll prioritize local food stops and keep the food estimate inside your total budget.";
    } else if (lower.includes("cheap") || lower.includes("budget")) {
      aiText =
        "Understood. I'll optimize transport, stays and activities for the lowest practical cost.";
    } else if (lower.includes("nature")) {
      aiText =
        "Nice choice. I'll give nature-focused stops and balance travel time with sightseeing.";
    }

    const aiMessage: ChatMessage = {
      id: `${Date.now()}-ai`,
      role: "ai",
      text: aiText,
    };

    setChatMessages((current) => [
      ...current,
      userMessage,
      aiMessage,
    ]);
    setChatInput("");
  };

  const startJourneyChat = () => {
    if (!from.trim() || !to.trim()) return;

    const places = getFamousPlacesForDestination(to);
    setRoutePlaces(places);
    setSelectedDestination(to.trim());

    setChatMessages([
      {
        id: "welcome",
        role: "ai",
        text:
          `Great, ${name.trim() || "traveller"}! I have ${from.trim()} → ${to.trim()} for ${people} traveller${people === 1 ? "" : "s"}, ${tripDays} day${tripDays === 1 ? "" : "s"} and a ₹${tripBudget.toLocaleString("en-IN")} budget. Let's make the best plan.`,
      },
      {
        id: "tip",
        role: "ai",
        text:
          "Before I build the route, you can simply tell me: “show famous places”, “make it cheap”, “family trip”, “more food”, “more nature”, or “easy travel”. I will adjust the plan for you.",
      },
    ]);

    setStep("chat");
  };

  const buildRoute = () => {
    const places = routePlaces.length > 0
      ? routePlaces
      : getFamousPlacesForDestination(selectedDestination || to);
    setRoutePlaces(places);
    setRouteRequested(true);
    setStep("route");
  };

  const routeStops = [
    from.trim() || "Your starting point",
    ...(routePlaces.length > 0 ? routePlaces.slice(0, 2) : ["Recommended stop", "Local food & experience"]),
    to.trim() || "Your destination",
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.brandBlock}>
            <Text style={styles.brand}>MF RIDES</Text>
            <Text style={styles.brandSub}>JOURNEY</Text>
          </View>

          <View style={styles.supportPill}>
            <Text style={styles.supportDot}>●</Text>
            <Text style={styles.supportText}>24/7 AI Care</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>MF RIDES • EXPLORE INDIA</Text>
          </View>

          <Text style={styles.heroTitle}>
            Your journey.
            {"\n"}
            <Text style={styles.heroAccent}>Your way.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            Tell MF Journey AI where you want to go and what you can spend.
            We'll turn your idea into a practical journey path.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>₹8K</Text>
              <Text style={styles.statLabel}>Example budget</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>AI</Text>
              <Text style={styles.statLabel}>Trip planning</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>AI support</Text>
            </View>
          </View>
        </View>

        <View style={styles.progress}>
          {[
            ["01", "Trip details"],
            ["02", "AI chat"],
            ["03", "Journey path"],
          ].map(([number, label], index) => {
            const active =
              (step === "register" && index === 0) ||
              (step === "chat" && index === 1) ||
              (step === "route" && index === 2);

            return (
              <React.Fragment key={number}>
                <View style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressCircle,
                      active && styles.progressCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.progressNumber,
                        active && styles.progressNumberActive,
                      ]}
                    >
                      {number}
                    </Text>
                  </View>
                  <Text style={styles.progressLabel}>{label}</Text>
                </View>
                {index < 2 ? <View style={styles.progressLine} /> : null}
              </React.Fragment>
            );
          })}
        </View>

        {step === "register" && (
          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}>
                <Text>✦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Plan your journey</Text>
                <Text style={styles.sectionSubtitle}>
                  Start with a few details. You can change everything later with AI.
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Your name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Travellers</Text>
                <TextInput
                  value={travellers}
                  onChangeText={setTravellers}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Starting place</Text>
                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="e.g. Hyderabad"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Destination</Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="e.g. Goa"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.destinationHelperCard}>
              <View style={styles.destinationHelperHeader}>
                <View style={styles.destinationHelperIcon}>
                  <Text style={styles.destinationHelperIconText}>⌖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destinationHelperTitle}>Not sure where to go?</Text>
                  <Text style={styles.destinationHelperText}>Type a city or country. MF Journey AI will suggest famous places.</Text>
                </View>
              </View>

              <View style={styles.destinationQuickRow}>
                {["India", "Dubai", "Japan", "Thailand", "Europe"].map((item) => (
                  <Pressable
                    key={item}
                    style={styles.destinationQuickChip}
                    onPress={() => {
                      setTo(item);
                      setShowDestinationSuggestions(true);
                    }}
                  >
                    <Text style={styles.destinationQuickChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              {(showDestinationSuggestions || to.trim().length > 0) && (
                <View style={styles.destinationSuggestionBox}>
                  {destinationSuggestions.map((item) => (
                    <Pressable
                      key={`${item.name}-${item.country}`}
                      style={styles.destinationSuggestion}
                      onPress={() => {
                        setTo(item.name);
                        setSelectedDestination(item.name);
                        setRoutePlaces(getFamousPlacesForDestination(item.name));
                        setShowDestinationSuggestions(false);
                      }}
                    >
                      <View style={styles.destinationPin}>
                        <Text style={styles.destinationPinText}>●</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.destinationSuggestionName}>{item.name}, {item.country}</Text>
                        <Text style={styles.destinationSuggestionArea}>{item.area}</Text>
                      </View>
                      <Text style={styles.destinationSuggestionTag}>{item.tag}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Total budget</Text>
                <View style={styles.moneyInput}>
                  <Text style={styles.moneySymbol}>₹</Text>
                  <TextInput
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="number-pad"
                    placeholder="8000"
                    placeholderTextColor="#94A3B8"
                    style={styles.moneyTextInput}
                  />
                </View>
              </View>

              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Number of days</Text>
                <TextInput
                  value={days}
                  onChangeText={setDays}
                  keyboardType="number-pad"
                  placeholder="3"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>What kind of trip do you want?</Text>

            <View style={styles.chips}>
              {[
                "Sightseeing",
                "Nature",
                "Family",
                "Food",
                "Adventure",
                "Relax",
              ].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setInterest(item)}
                  style={[
                    styles.chip,
                    interest === item && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      interest === item && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>How should AI plan your trip?</Text>
            <View style={styles.chips}>
              {["Easy & comfortable", "Fast travel", "Low cost", "Premium"].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setTravelStyle(item)}
                  style={[styles.chip, travelStyle === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, travelStyle === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Stay preference</Text>
            <View style={styles.chips}>
              {["Any good stay", "Budget stay", "Family stay", "Hotel"].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setStayType(item)}
                  style={[styles.chip, stayType === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, stayType === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.smartTipCard}>
              <Text style={styles.smartTipTitle}>✦ Simple travel assistant</Text>
              <Text style={styles.smartTipText}>You can simply type “I want to go to Japan for 5 days with family” and MF Journey AI will help fill the plan step by step.</Text>
            </View>

            <View style={styles.budgetPreview}>
              <View>
                <Text style={styles.previewEyebrow}>YOUR STARTING PLAN</Text>
                <Text style={styles.previewTitle}>
                  ₹{tripBudget.toLocaleString("en-IN")} • {tripDays} days • {people} people
                </Text>
                <Text style={styles.previewText}>
                  Interest: {interest} • {travelStyle} • {stayType}. AI will optimize the journey around these choices.
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                (!from.trim() || !to.trim()) && styles.buttonDisabled,
              ]}
              disabled={!from.trim() || !to.trim()}
              onPress={startJourneyChat}
            >
              <Text style={styles.primaryButtonText}>
                Continue to Journey AI  →
              </Text>
            </Pressable>
          </View>
        )}

        {step === "chat" && (
          <View style={styles.card}>
            <View style={styles.chatHeader}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>AI</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>MF Journey AI</Text>
                <Text style={styles.onlineText}>
                  ● Online • Planning your journey
                </Text>
              </View>
              <View style={styles.budgetBadge}>
                <Text style={styles.budgetBadgeText}>
                  ₹{tripBudget.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            <View style={styles.chatBox}>
              {chatMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.role === "user" && styles.messageRowUser,
                  ]}
                >
                  {message.role === "ai" && (
                    <View style={styles.miniAi}>
                      <Text style={styles.miniAiText}>AI</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.message,
                      message.role === "user"
                        ? styles.userMessage
                        : styles.aiMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.role === "user" && styles.userMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.quickTitle}>Quick preferences</Text>

            <View style={styles.quickRow}>
              {[
                "Keep it budget-friendly",
                "Add local food",
                "Family friendly",
                "More nature",
              ].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => sendMessage(item)}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.chatInputRow}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={() => sendMessage()}
                placeholder="Tell AI anything about your trip..."
                placeholderTextColor="#94A3B8"
                style={styles.chatInput}
              />
              <Pressable
                style={styles.sendButton}
                onPress={() => sendMessage()}
              >
                <Text style={styles.sendText}>↑</Text>
              </Pressable>
            </View>

            <View style={styles.aiNotice}>
              <Text style={styles.aiNoticeIcon}>✦</Text>
              <Text style={styles.aiNoticeText}>
                AI uses your information to prepare the journey. Final prices,
                availability and route conditions should be verified before booking.
              </Text>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={buildRoute}
            >
              <Text style={styles.primaryButtonText}>
                Build Journey Path & Route  →
              </Text>
            </Pressable>
          </View>
        )}

        {step === "route" && (
          <>
            <View style={styles.routeHeroCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeEyebrow}>YOUR MF JOURNEY PATH</Text>
                <Text style={styles.routeTitle}>
                  {from || "Start"} → {to || "Destination"}
                </Text>
                <Text style={styles.routeSubtitle}>
                  {tripDays} days • {people} traveller{people === 1 ? "" : "s"} • {interest}
                </Text>
              </View>

              <View style={styles.routeBudget}>
                <Text style={styles.routeBudgetLabel}>BUDGET</Text>
                <Text style={styles.routeBudgetValue}>
                  ₹{tripBudget.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            <View style={styles.mapCard}>
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Journey route</Text>
                  <Text style={styles.sectionSubtitle}>
                    Your complete trip path at a glance
                  </Text>
                </View>
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>ROUTE PLAN</Text>
                </View>
              </View>

              <View style={styles.mapCanvas}>
                <View style={styles.mapSky} />
                <View style={styles.mapHillOne} />
                <View style={styles.mapHillTwo} />

                <View style={styles.routeRoad}>
                  <View style={styles.routeDashOne} />
                  <View style={styles.routeDashTwo} />
                  <View style={styles.routeDashThree} />
                </View>

                {routeStops.map((stop, index) => (
                  <View
                    key={`${stop}-${index}`}
                    style={[
                      styles.stop,
                      index === 0 && styles.stopStart,
                      index === routeStops.length - 1 && styles.stopEnd,
                      { top: `${18 + index * 21}%` },
                    ]}
                  >
                    <View style={styles.pin}>
                      <Text style={styles.pinText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stopLabel}>
                      <Text style={styles.stopName}>{stop}</Text>
                      <Text style={styles.stopType}>
                        {index === 0
                          ? "START"
                          : index === routeStops.length - 1
                          ? "DESTINATION"
                          : "RECOMMENDED STOP"}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={styles.mapCloudOne} />
                <View style={styles.mapCloudTwo} />
              </View>

              <View style={styles.routeStats}>
                <View style={styles.routeStat}>
                  <Text style={styles.routeStatIcon}>⌁</Text>
                  <Text style={styles.routeStatValue}>
                    {Math.max(1, tripDays * 180)} km*
                  </Text>
                  <Text style={styles.routeStatLabel}>Estimated route</Text>
                </View>
                <View style={styles.routeStat}>
                  <Text style={styles.routeStatIcon}>◷</Text>
                  <Text style={styles.routeStatValue}>
                    {Math.max(2, tripDays * 4)} hrs*
                  </Text>
                  <Text style={styles.routeStatLabel}>Travel time</Text>
                </View>
                <View style={styles.routeStat}>
                  <Text style={styles.routeStatIcon}>₹</Text>
                  <Text style={styles.routeStatValue}>
                    ₹{budgetPlan.transport.toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.routeStatLabel}>Transport plan</Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                *Prototype estimates for the journey UI. Real distance, traffic,
                fares and availability should come from the production maps/backend services.
              </Text>
            </View>

            <View style={styles.recommendedPlacesCard}>
              <View style={styles.sectionHeading}>
                <View style={styles.headingIcon}>
                  <Text>★</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Famous places to explore</Text>
                  <Text style={styles.sectionSubtitle}>AI suggestions for {selectedDestination || to || "your destination"}</Text>
                </View>
              </View>
              <View style={styles.placeGrid}>
                {routePlaces.slice(0, 6).map((place, index) => (
                  <View style={styles.placeCard} key={`${place}-${index}`}>
                    <Text style={styles.placeNumber}>{index + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.placeName}>{place}</Text>
                      <Text style={styles.placeHint}>{index === 0 ? "Top suggestion" : "Worth visiting"}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.itineraryCard}>
              <View style={styles.sectionHeading}>
                <View style={styles.headingIcon}>
                  <Text>☼</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Suggested day plan</Text>
                  <Text style={styles.sectionSubtitle}>
                    Built around your budget and preferences
                  </Text>
                </View>
              </View>

              {Array.from({ length: Math.min(tripDays, 5) }).map((_, index) => (
                <View style={styles.dayRow} key={index}>
                  <View style={styles.dayNumber}>
                    <Text style={styles.dayNumberText}>D{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayTitle}>
                      {index === 0
                        ? `Travel from ${from || "your city"}`
                        : index === tripDays - 1
                        ? `Return from ${to || "destination"}`
                        : `Explore ${to || "your destination"}`}
                    </Text>
                    <Text style={styles.dayText}>
                      {index === 0
                        ? "Start early, follow the recommended route and keep a flexible food stop."
                        : index === tripDays - 1
                        ? "Keep return travel comfortable and reserve part of the budget as a buffer."
                        : `${interest} activities, local food and a relaxed sightseeing schedule.`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.budgetCard}>
              <View>
                <Text style={styles.sectionTitle}>₹{tripBudget.toLocaleString("en-IN")} budget plan</Text>
                <Text style={styles.sectionSubtitle}>
                  A starting allocation — AI can rebalance it.
                </Text>
              </View>

              {[
                ["Transport", budgetPlan.transport],
                ["Stay", budgetPlan.stay],
                ["Food", budgetPlan.food],
                ["Activities", budgetPlan.activities],
                ["Local travel", budgetPlan.local],
                ["Emergency buffer", budgetPlan.buffer],
              ].map(([label, value]) => (
                <View style={styles.budgetLine} key={String(label)}>
                  <Text style={styles.budgetLineLabel}>{label}</Text>
                  <Text style={styles.budgetLineValue}>
                    ₹{Number(value).toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}

              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Planned total</Text>
                <Text style={styles.totalValue}>
                  ₹{tripBudget.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            {onBookRide && (
              <Pressable
                style={styles.bookRideJourneyButton}
                onPress={onBookRide}
              >
                <Text style={styles.bookRideJourneyButtonText}>🚕 Book an MF Ride for this journey</Text>
              </Pressable>
            )}

            <View style={styles.actionGrid}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setStep("chat")}
              >
                <Text style={styles.secondaryButtonText}>← Edit with AI</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButtonSmall}
                onPress={() => {
                  setStep("register");
                  setRouteRequested(false);
                }}
              >
                <Text style={styles.primaryButtonText}>New Journey +</Text>
              </Pressable>
            </View>

            {routeRequested && (
              <View style={styles.successCard}>
                <Text style={styles.successIcon}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Journey path created</Text>
                  <Text style={styles.successText}>
                    Your next production step can connect this journey to live
                    maps, MF Rides booking, stays, activities and 24/7 support.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>MF RIDES</Text>
          <Text style={styles.footerText}>RIDE • TRAVEL • EXPLORE</Text>
          <Text style={styles.footerText}>
            Journey planning with MF Journey AI
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  topBar: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE7D8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    minWidth: 72,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F8F7F3",
    borderWidth: 1,
    borderColor: "#E9E3D7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  backIcon: {
    color: NAVY,
    fontSize: 26,
    lineHeight: 26,
    fontWeight: "700",
  },

  backText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "800",
  },

  brandBlock: {
    alignItems: "center",
  },

  brand: {
    color: GOLD,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandSub: {
    color: NAVY,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 2,
  },

  supportPill: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: "#F1FBF5",
    borderWidth: 1,
    borderColor: "#CBECD7",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  supportDot: {
    color: GREEN,
    fontSize: 10,
  },

  supportText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: "800",
  },

  hero: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 28,
    padding: 22,
    minHeight: 260,
    backgroundColor: NAVY,
    overflow: "hidden",
  },

  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F4B51B",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  heroBadgeText: {
    color: NAVY,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    color: WHITE,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    marginTop: 18,
  },

  heroAccent: {
    color: "#FFC52E",
  },

  heroDescription: {
    color: "#D9E1EF",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 620,
    marginTop: 10,
  },

  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },

  stat: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 100,
  },

  statNumber: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "900",
  },

  statLabel: {
    color: "#B9C5D8",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "700",
  },

  progress: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ECE5D8",
    flexDirection: "row",
    alignItems: "center",
  },

  progressItem: {
    alignItems: "center",
    gap: 5,
  },

  progressCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },

  progressCircleActive: {
    backgroundColor: GOLD,
  },

  progressNumber: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "900",
  },

  progressNumberActive: {
    color: NAVY,
  },

  progressLabel: {
    color: NAVY,
    fontSize: 9,
    fontWeight: "800",
  },

  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 7,
    backgroundColor: "#E8E2D6",
    marginBottom: 17,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E9E2D6",
    padding: 18,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 18,
  },

  headingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF2CA",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: NAVY,
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  fieldRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  fieldHalf: {
    flex: 1,
  },

  label: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDD7CA",
    backgroundColor: "#FCFBF8",
    paddingHorizontal: 13,
    color: NAVY,
    fontSize: 13,
  },

  moneyInput: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDD7CA",
    backgroundColor: "#FCFBF8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  moneySymbol: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "900",
    marginRight: 4,
  },

  moneyTextInput: {
    flex: 1,
    color: NAVY,
    fontSize: 13,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#F7F5F0",
    borderWidth: 1,
    borderColor: "#E6DFD2",
  },

  chipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },

  chipText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "800",
  },

  chipTextActive: {
    color: WHITE,
  },

  destinationHelperCard: {
    marginBottom: 15,
    borderRadius: 17,
    padding: 13,
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#DCE5F1",
  },

  destinationHelperHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  destinationHelperIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF1C7",
    alignItems: "center",
    justifyContent: "center",
  },

  destinationHelperIconText: {
    color: "#9B6700",
    fontSize: 19,
    fontWeight: "900",
  },

  destinationHelperTitle: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "900",
  },

  destinationHelperText: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  destinationQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  destinationQuickChip: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E0E6EE",
  },

  destinationQuickChipText: {
    color: NAVY,
    fontSize: 9,
    fontWeight: "800",
  },

  destinationSuggestionBox: {
    marginTop: 9,
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1E6ED",
    backgroundColor: WHITE,
  },

  destinationSuggestion: {
    minHeight: 54,
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },

  destinationPin: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#FFF3CD",
    alignItems: "center",
    justifyContent: "center",
  },

  destinationPinText: {
    color: GOLD,
    fontSize: 9,
  },

  destinationSuggestionName: {
    color: NAVY,
    fontSize: 10,
    fontWeight: "900",
  },

  destinationSuggestionArea: {
    color: MUTED,
    fontSize: 8,
    marginTop: 2,
  },

  destinationSuggestionTag: {
    color: "#8A5A00",
    backgroundColor: "#FFF5D9",
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 7,
    fontWeight: "900",
  },

  smartTipCard: {
    borderRadius: 15,
    padding: 12,
    marginBottom: 13,
    backgroundColor: "#F1F7FF",
    borderWidth: 1,
    borderColor: "#D8E7FA",
  },

  smartTipTitle: {
    color: "#1F65B7",
    fontSize: 10,
    fontWeight: "900",
  },

  smartTipText: {
    color: "#526B87",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  budgetPreview: {
    borderRadius: 17,
    padding: 15,
    backgroundColor: "#FFF9E7",
    borderWidth: 1,
    borderColor: "#F2D98D",
    marginBottom: 14,
  },

  previewEyebrow: {
    color: "#A36A00",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  previewTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },

  previewText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "900",
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 14,
  },

  aiAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },

  aiAvatarText: {
    color: "#FFC52E",
    fontSize: 13,
    fontWeight: "900",
  },

  onlineText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  budgetBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFF4CF",
  },

  budgetBadgeText: {
    color: "#9B6700",
    fontSize: 11,
    fontWeight: "900",
  },

  chatBox: {
    borderRadius: 18,
    backgroundColor: "#F7F8FA",
    padding: 12,
    minHeight: 170,
    borderWidth: 1,
    borderColor: "#E8EBEF",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    marginBottom: 10,
    maxWidth: "94%",
  },

  messageRowUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },

  miniAi: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },

  miniAiText: {
    color: GOLD,
    fontSize: 8,
    fontWeight: "900",
  },

  message: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  aiMessage: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  userMessage: {
    backgroundColor: NAVY,
  },

  messageText: {
    color: NAVY,
    fontSize: 12,
    lineHeight: 18,
  },

  userMessageText: {
    color: WHITE,
  },

  quickTitle: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 8,
  },

  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 13,
  },

  quickChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFF7DD",
    borderWidth: 1,
    borderColor: "#F1DB98",
  },

  quickChipText: {
    color: "#8A5A00",
    fontSize: 10,
    fontWeight: "800",
  },

  chatInputRow: {
    flexDirection: "row",
    gap: 8,
  },

  chatInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9DEE5",
    paddingHorizontal: 13,
    color: NAVY,
    backgroundColor: WHITE,
    fontSize: 12,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },

  sendText: {
    color: NAVY,
    fontSize: 23,
    fontWeight: "900",
  },

  aiNotice: {
    flexDirection: "row",
    gap: 8,
    padding: 11,
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: "#F1F7FF",
    borderWidth: 1,
    borderColor: "#D9E8FA",
  },

  aiNoticeIcon: {
    color: "#2878D7",
    fontWeight: "900",
  },

  aiNoticeText: {
    flex: 1,
    color: "#50657F",
    fontSize: 9,
    lineHeight: 14,
  },

  routeHeroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: NAVY,
    flexDirection: "row",
    gap: 14,
  },

  routeEyebrow: {
    color: "#FFC52E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  routeTitle: {
    color: WHITE,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },

  routeSubtitle: {
    color: "#C3CDDC",
    fontSize: 11,
    marginTop: 5,
  },

  routeBudget: {
    minWidth: 90,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.09)",
    padding: 10,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  routeBudgetLabel: {
    color: "#AAB6C9",
    fontSize: 8,
    fontWeight: "900",
  },

  routeBudgetValue: {
    color: "#FFC52E",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  mapCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E9E2D6",
    padding: 16,
  },

  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  livePill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFF3CB",
  },

  livePillText: {
    color: "#9B6700",
    fontSize: 8,
    fontWeight: "900",
  },

  mapCanvas: {
    height: 310,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#DDEFF7",
    position: "relative",
  },

  mapSky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "58%",
    backgroundColor: "#DFF3FA",
  },

  mapHillOne: {
    position: "absolute",
    left: -40,
    right: 80,
    bottom: 0,
    height: "54%",
    borderTopLeftRadius: 170,
    borderTopRightRadius: 160,
    backgroundColor: "#B9DDBB",
  },

  mapHillTwo: {
    position: "absolute",
    right: -60,
    bottom: -15,
    width: 230,
    height: 160,
    borderRadius: 110,
    backgroundColor: "#9BC8A5",
  },

  routeRoad: {
    position: "absolute",
    left: "48%",
    top: -20,
    width: 62,
    height: 360,
    backgroundColor: "#485466",
    transform: [{ rotate: "18deg" }],
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: "#F8C33A",
    borderRightColor: "#F8C33A",
  },

  routeDashOne: {
    position: "absolute",
    top: 18,
    left: 28,
    width: 5,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },

  routeDashTwo: {
    position: "absolute",
    top: 118,
    left: 28,
    width: 5,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },

  routeDashThree: {
    position: "absolute",
    top: 218,
    left: 28,
    width: 5,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },

  stop: {
    position: "absolute",
    left: "13%",
    right: "13%",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  stopStart: {
    left: "7%",
  },

  stopEnd: {
    left: "22%",
  },

  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
    borderWidth: 3,
    borderColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  pinText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "900",
  },

  stopLabel: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: "70%",
  },

  stopName: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "900",
  },

  stopType: {
    color: MUTED,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 2,
  },

  mapCloudOne: {
    position: "absolute",
    top: 35,
    right: 45,
    width: 74,
    height: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  mapCloudTwo: {
    position: "absolute",
    top: 80,
    left: 25,
    width: 55,
    height: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.65)",
  },

  routeStats: {
    flexDirection: "row",
    marginTop: 13,
    gap: 8,
  },

  routeStat: {
    flex: 1,
    padding: 11,
    borderRadius: 14,
    backgroundColor: "#F8F9FB",
    alignItems: "center",
  },

  routeStatIcon: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "900",
  },

  routeStatValue: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },

  routeStatLabel: {
    color: MUTED,
    fontSize: 8,
    marginTop: 2,
  },

  disclaimer: {
    color: "#8A94A4",
    fontSize: 8,
    lineHeight: 13,
    marginTop: 10,
  },

  recommendedPlacesCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 17,
    borderRadius: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E9E2D6",
  },

  placeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  placeCard: {
    width: "48%",
    minHeight: 54,
    padding: 9,
    borderRadius: 13,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#E8EBEF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  placeNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GOLD,
    color: NAVY,
    textAlign: "center",
    lineHeight: 26,
    fontSize: 9,
    fontWeight: "900",
  },

  placeName: {
    color: NAVY,
    fontSize: 10,
    fontWeight: "900",
  },

  placeHint: {
    color: MUTED,
    fontSize: 7,
    marginTop: 2,
  },

  itineraryCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 17,
    borderRadius: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E9E2D6",
  },

  dayRow: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEAE1",
  },

  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFF1C8",
    alignItems: "center",
    justifyContent: "center",
  },

  dayNumberText: {
    color: "#8F6100",
    fontSize: 11,
    fontWeight: "900",
  },

  dayTitle: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "900",
  },

  dayText: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  budgetCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 17,
    borderRadius: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E9E2D6",
  },

  budgetLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECE4",
  },

  budgetLineLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
  },

  budgetLineValue: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "900",
  },

  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 13,
  },

  totalLabel: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "900",
  },

  totalValue: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "900",
  },

  bookRideJourneyButton: {
    marginHorizontal: 16,
    marginTop: 14,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D99500",
  },

  bookRideJourneyButtonText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "900",
  },

  actionGrid: {
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D7D1C5",
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "900",
  },

  primaryButtonSmall: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },

  successCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#EFFAF3",
    borderWidth: 1,
    borderColor: "#CBEAD6",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  successIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GREEN,
    color: WHITE,
    textAlign: "center",
    lineHeight: 34,
    fontSize: 16,
    fontWeight: "900",
  },

  successTitle: {
    color: "#116B3D",
    fontSize: 12,
    fontWeight: "900",
  },

  successText: {
    color: "#4D765F",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  footer: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 10,
  },

  footerBrand: {
    color: GOLD,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },

  footerText: {
    color: MUTED,
    fontSize: 8,
    letterSpacing: 1.3,
    marginTop: 4,
  },
});

export default JourneyScreen;
