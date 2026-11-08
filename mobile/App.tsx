import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseEnabled } from "./firebase";

type Message = { role: "user" | "assistant"; content: string };
type Model = { id: string; provider: string; name: string; installed?: boolean };
type SearchResult = { title: string; url: string; snippet: string };
type Tab = "chat" | "image" | "search" | "voice" | "account";
const API_URL = "http://10.0.2.2:8000";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>("chat");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [voiceText, setVoiceText] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  async function request(path: string, options: RequestInit = {}) {
    if (!token) throw new Error("Not authenticated");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!response.ok) throw new Error((await response.text()) || "Request failed");
    return response.json();
  }

  async function authenticate() {
    try {
      if (firebaseEnabled && firebaseAuth) {
        const credential = registering
          ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
          : await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await credential.user.getIdToken();
        const response = await fetch(`${API_URL}/auth/firebase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });
        if (!response.ok) throw new Error("Firebase backend exchange failed");
        setToken((await response.json()).token);
        return;
      }
      const response = await fetch(`${API_URL}/auth/${registering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error("Authentication failed");
      const nextToken = (await response.json()).token;
      setToken(nextToken);
    } catch {
      alert("Login/register failed. Email aur password check karein.");
    }
  }

  useEffect(() => {
    if (!token) return;
    request("/models").then((data) => {
      setModels(data.models);
      if (data.models.length > 0) setSelectedModel(data.models[0].id);
    }).catch(() => undefined);
    request("/billing/status").then((data) => setPlan(data.plan)).catch(() => undefined);
  }, [token]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading || !token) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const data = await request("/chat", { method: "POST", body: JSON.stringify({ messages: next, model: selectedModel }) });
      setMessages([...next, data.message]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Backend se connection nahi ho saka." }]);
    } finally {
      setLoading(false);
    }
  }

  async function generateImage() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setImage(null);
    try {
      setImage((await request("/images/generate", { method: "POST", body: JSON.stringify({ prompt: prompt.trim() }) })).image);
    } catch {
      alert("Image API available nahi hai.");
    } finally {
      setLoading(false);
    }
  }

  async function searchWeb() {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      setResults((await request("/search", { method: "POST", body: JSON.stringify({ query: query.trim() }) })).results);
    } catch {
      alert("Search service available nahi hai.");
    } finally {
      setLoading(false);
    }
  }

  async function speak() {
    if (!voiceText.trim() || loading) return;
    setLoading(true);
    try {
      const data = await request("/voice/speak", { method: "POST", body: JSON.stringify({ text: voiceText.trim() }) });
      alert(`Voice audio ready (${Math.round(data.audio_base64.length / 1024)} KB). TTS_API_URL configure karein.`);
    } catch {
      alert("TTS API configure nahi hai.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try { await request("/auth/logout", { method: "POST" }); } catch { /* local logout still clears the session */ }
    setToken(null);
    setMessages([]);
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.auth}>
          <Text style={styles.title}>Flix Grim</Text>
          <Text style={styles.subtitle}>Chat, search, voice aur images — ek app mein</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9ca3af" autoCapitalize="none" keyboardType="email-address" style={styles.authInput} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password (8+ chars)" placeholderTextColor="#9ca3af" secureTextEntry style={styles.authInput} />
          <Pressable onPress={authenticate} style={styles.button}><Text style={styles.buttonText}>{registering ? "Register" : "Login"}</Text></Pressable>
          <Pressable onPress={() => setRegistering(!registering)}><Text style={styles.link}>{registering ? "Already have an account? Login" : "Create an account"}</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Flix Grim</Text>
      <View style={styles.tabs}>
        {(["chat", "image", "search", "voice", "account"] as Tab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={styles.tabText}>{item === "account" ? "More" : item[0].toUpperCase() + item.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      {tab === "chat" && (
        <>
          <FlatList horizontal data={models} keyExtractor={(item) => item.id} contentContainerStyle={styles.modelList} renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedModel(item.id)} style={[styles.modelChip, selectedModel === item.id && styles.selectedModel]}>
              <Text style={styles.modelText}>{item.name}</Text>
            </Pressable>
          )} />
          <FlatList data={messages} keyExtractor={(_, index) => String(index)} contentContainerStyle={styles.list} renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" && styles.userBubble]}><Text style={styles.message}>{item.content}</Text></View>
          )} />
          <View style={styles.composer}><TextInput value={input} onChangeText={setInput} placeholder="Message likhein..." placeholderTextColor="#9ca3af" multiline style={styles.input} /><Pressable onPress={sendMessage} style={styles.button} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}</Pressable></View>
        </>
      )}
      {tab === "image" && <View style={styles.panel}><Text style={styles.sectionTitle}>Create an image</Text><TextInput value={prompt} onChangeText={setPrompt} placeholder="Describe your image..." placeholderTextColor="#9ca3af" multiline style={styles.promptInput} /><Pressable onPress={generateImage} style={styles.button} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate</Text>}</Pressable>{image && <Image source={{ uri: image }} style={styles.generatedImage} />}</View>}
      {tab === "search" && <View style={styles.panel}><Text style={styles.sectionTitle}>Web search</Text><View style={styles.composer}><TextInput value={query} onChangeText={setQuery} placeholder="Search the web..." placeholderTextColor="#9ca3af" style={styles.input} /><Pressable onPress={searchWeb} style={styles.button}><Text style={styles.buttonText}>Search</Text></Pressable></View><FlatList data={results} keyExtractor={(item, index) => `${item.url}-${index}`} renderItem={({ item }) => <Pressable style={styles.result} onPress={() => item.url && Linking.openURL(item.url)}><Text style={styles.resultTitle}>{item.title}</Text><Text style={styles.message}>{item.snippet}</Text></Pressable>} /></View>}
      {tab === "voice" && <View style={styles.panel}><Text style={styles.sectionTitle}>Voice assistant</Text><TextInput value={voiceText} onChangeText={setVoiceText} placeholder="Text to speak..." placeholderTextColor="#9ca3af" multiline style={styles.promptInput} /><Pressable onPress={speak} style={styles.button} disabled={loading}><Text style={styles.buttonText}>Generate voice</Text></Pressable><Text style={styles.hint}>TTS/STT provider ko backend ke TTS_API_URL aur STT_API_URL se connect karein.</Text></View>}
      {tab === "account" && <View style={styles.panel}><Text style={styles.sectionTitle}>Account & billing</Text><Text style={styles.message}>Plan: {plan}</Text><Text style={styles.hint}>Session token protected hai. Logout ke baad token revoke ho jayega.</Text><Pressable onPress={logout} style={styles.button}><Text style={styles.buttonText}>Logout</Text></Pressable></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#111827" },
  auth: { flex: 1, justifyContent: "center", padding: 24, gap: 14 },
  authInput: { color: "#fff", backgroundColor: "#1f2937", borderRadius: 14, padding: 14 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", padding: 20 },
  subtitle: { color: "#9ca3af", paddingHorizontal: 20 },
  link: { color: "#5eead4", textAlign: "center", marginTop: 8 },
  tabs: { flexDirection: "row", marginHorizontal: 10, marginBottom: 8, gap: 5 },
  tab: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: "#1f2937", alignItems: "center" },
  activeTab: { backgroundColor: "#0f766e" },
  tabText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  modelList: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  modelChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, backgroundColor: "#374151" },
  selectedModel: { backgroundColor: "#0f766e" },
  disabledModel: { opacity: 0.45 },
  modelText: { color: "#fff", fontSize: 12 },
  panel: { flex: 1, padding: 16, gap: 14 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  promptInput: { minHeight: 110, color: "#fff", backgroundColor: "#1f2937", borderRadius: 14, padding: 14, textAlignVertical: "top" },
  generatedImage: { width: "100%", aspectRatio: 1, borderRadius: 16 },
  list: { padding: 16, gap: 12 },
  bubble: { alignSelf: "flex-start", maxWidth: "88%", padding: 12, borderRadius: 16, backgroundColor: "#374151" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#0f766e" },
  message: { color: "#fff", fontSize: 15, lineHeight: 22 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12 },
  input: { flex: 1, maxHeight: 120, color: "#fff", backgroundColor: "#1f2937", borderRadius: 14, padding: 12 },
  button: { backgroundColor: "#14b8a6", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  result: { padding: 14, backgroundColor: "#1f2937", borderRadius: 14, gap: 6 },
  resultTitle: { color: "#5eead4", fontWeight: "700" },
  hint: { color: "#9ca3af", lineHeight: 20 },
});
