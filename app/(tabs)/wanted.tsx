import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import WantedJobCard from "@/components/WantedJobCard";
import type { WantedPost } from "@/types";

export default function WantedTabScreen() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const isProvider = role === "SERVICE_PROVIDER";
  const isCustomer = role === "CUSTOMER";

  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Create post form
  const [profession, setProfession] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [requiredCount, setRequiredCount] = useState("1");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchPosts();
  }, [isAuthenticated]);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await api.get("/api/wanted");
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch wanted posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }

  async function handleApply(postId: number) {
    try {
      await api.post(`/api/wanted/${postId}/apply`);
      Toast.show({ type: "success", text1: "Successfully signed up for work!" });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, applied: true, currentJoined: p.currentJoined + 1 } : p
        )
      );
    } catch (error: any) {
      const msg = error.response?.data || "Failed to apply";
      Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Something went wrong" });
    }
  }

  async function handleCreate() {
    if (!profession || !description || !location) {
      Toast.show({ type: "error", text1: "Please fill all required fields" });
      return;
    }
    try {
      setCreating(true);
      await api.post("/api/wanted", {
        profession,
        description,
        location,
        requiredCount: Number(requiredCount) || 1,
      });
      Toast.show({ type: "success", text1: "Notice posted!" });
      setModalOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to create notice" });
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setProfession("");
    setDescription("");
    setLocation("");
    setRequiredCount("1");
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-primary items-center justify-center px-6">
        <Text className="text-light-100 text-xl font-bold mb-2">Login Required</Text>
        <Text className="text-light-300 text-sm text-center mb-6">
          Sign in to view wanted jobs
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-2xl px-8 py-3"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-white font-semibold">Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inputClass = "bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3";

  return (
    <View className="flex-1 bg-primary">
      {/* Header */}
      <View className="px-5 pt-14 pb-4">
        <Text className="text-accent text-3xl font-bold">Wanted Jobs</Text>
        <Text className="text-light-300 text-sm mt-1">
          {isProvider ? "Find work opportunities" : "Post job notices"}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f66b0e" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f66b0e" />
          }
          renderItem={({ item }) => (
            <WantedJobCard post={item} isProvider={isProvider} onApply={handleApply} />
          )}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-light-300 text-base">No active notices</Text>
              <Text className="text-light-300/60 text-sm mt-2">
                {isCustomer ? "Tap + to post a job notice" : "Check back later for opportunities"}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB for customers */}
      {isCustomer && (
        <TouchableOpacity
          className="absolute bottom-24 right-5 w-14 h-14 bg-accent rounded-2xl items-center justify-center shadow-xl"
          onPress={() => setModalOpen(true)}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      )}

      {/* Create modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-primary rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-light-100 text-xl font-bold">Post a Notice</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text className="text-light-300 text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-light-300 text-xs font-semibold mb-2">PROFESSION / CATEGORY</Text>
              <TextInput className={inputClass} placeholder="e.g. Plumber" placeholderTextColor="#9CA4AB" value={profession} onChangeText={setProfession} />

              <Text className="text-light-300 text-xs font-semibold mb-2">DESCRIPTION</Text>
              <TextInput className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-light-100 mb-3 min-h-[80px]" placeholder="Describe the work needed..." placeholderTextColor="#9CA4AB" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />

              <Text className="text-light-300 text-xs font-semibold mb-2">LOCATION</Text>
              <TextInput className={inputClass} placeholder="e.g. Galle" placeholderTextColor="#9CA4AB" value={location} onChangeText={setLocation} />

              <Text className="text-light-300 text-xs font-semibold mb-2">MAX WORKERS NEEDED</Text>
              <TextInput className={inputClass} placeholder="1" placeholderTextColor="#9CA4AB" value={requiredCount} onChangeText={setRequiredCount} keyboardType="numeric" />

              <TouchableOpacity
                onPress={handleCreate}
                disabled={creating}
                className="bg-accent rounded-2xl h-12 items-center justify-center mt-2 mb-6"
                style={{ opacity: creating ? 0.6 : 1 }}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Post Notice</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
