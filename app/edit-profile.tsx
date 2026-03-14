import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

// ─── Section collapse wrapper ─────────────────────────
function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mx-5 mb-4">
      <TouchableOpacity
        className="bg-secondary/40 border border-white/8 rounded-3xl p-4 flex-row items-center justify-between"
        onPress={onToggle}
      >
        <Text className="text-light-100 font-semibold text-base">{title}</Text>
        <Text className="text-light-300 text-lg">{expanded ? "▾" : "›"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View className="bg-secondary/30 border border-white/8 rounded-3xl p-5 mt-2">
          {children}
        </View>
      )}
    </View>
  );
}

export default function EditProfileScreen() {
  const { role } = useAuth();
  const router = useRouter();
  const isProvider = role === "SERVICE_PROVIDER";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active section
  const [expandedSection, setExpandedSection] = useState<string | null>("basic");

  // ─── Basic Info ──────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // ─── Address ─────────────────────────────────────────
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [hasAddress, setHasAddress] = useState(false);

  // ─── Professional Info (provider only) ───────────────
  const [skill, setSkill] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");

  // ─── Profile Picture ────────────────────────────────
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  // ─── Verification Docs (provider only) ──────────────
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const endpoint = isProvider ? "/api/provider/profile" : "/api/customer/me";
      const res = await api.get(endpoint);
      const data = res.data;

      if (isProvider) {
        const parts = (data.fullName || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setSkill(data.skill || "");
        setExperience(data.experience || "");
        setDescription(data.description || "");
      } else {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
      }
      setPhone(data.phone || "");

      // Load address
      try {
        const addrEndpoint = isProvider ? "/api/provider/address" : "/api/customer/address";
        const addrRes = await api.get(addrEndpoint);
        if (addrRes.data) {
          setHasAddress(true);
          setAddressLine1(addrRes.data.addressLine1 || "");
          setAddressLine2(addrRes.data.addressLine2 || "");
          setProvince(addrRes.data.province || "");
          setCity(addrRes.data.city || "");
        }
      } catch {
        setHasAddress(false);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  }

  // ─── Save handlers ──────────────────────────────────
  async function handleSaveBasicInfo() {
    if (!firstName || !lastName) {
      Toast.show({ type: "error", text1: "First name and last name are required" });
      return;
    }
    try {
      setSubmitting(true);
      const endpoint = isProvider ? "/api/provider/profile" : "/api/customer/me";
      await api.put(endpoint, { firstName, lastName, phone });
      Toast.show({ type: "success", text1: "Profile updated!" });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Update failed";
      Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Failed" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveAddress() {
    try {
      setSubmitting(true);
      const payload = { addressLine1, addressLine2, province, city };
      const base = isProvider ? "/api/provider/address" : "/api/customer/address";

      if (hasAddress) {
        await api.put(base, payload);
      } else {
        await api.post(base, payload);
        setHasAddress(true);
      }
      Toast.show({ type: "success", text1: "Address saved!" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to save address" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveProfessionalInfo() {
    try {
      setSubmitting(true);
      await api.put("/api/provider/professional-info", { skill, experience, description });
      Toast.show({ type: "success", text1: "Professional info saved!" });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed";
      Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Failed" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePickProfileImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setProfilePicUri(asset.uri);

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      await api.post("/api/user/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Toast.show({ type: "success", text1: "Profile picture updated!" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to upload picture" });
    }
  }

  async function handleUploadDocument(type: "id-front" | "id-back" | "pdf") {
    try {
      if (type === "pdf") {
        const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
        if (result.canceled) return;

        setUploadingDoc(true);
        const formData = new FormData();
        formData.append("pdf", {
          uri: result.assets[0].uri,
          name: result.assets[0].name || "work.pdf",
          type: "application/pdf",
        } as any);

        await api.put("/api/provider/verification/pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Toast.show({ type: "success", text1: "Work document uploaded!" });
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (result.canceled) return;

        setUploadingDoc(true);
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          name: `${type}.jpg`,
          type: "image/jpeg",
        } as any);

        await api.put(`/api/provider/verification/${type}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Toast.show({ type: "success", text1: `ID ${type === "id-front" ? "front" : "back"} uploaded!` });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Upload failed" });
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleRequestVerification() {
    Alert.alert(
      "Request Verification",
      "Are you sure? Your profile will be reviewed by admin.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              await api.post("/api/provider/verify");
              Toast.show({ type: "success", text1: "Verification requested!" });
            } catch {
              Toast.show({ type: "error", text1: "Verification request failed" });
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#f66b0e" />
      </View>
    );
  }

  const inputClass =
    "bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3";
  const multilineClass =
    "bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-light-100 mb-3 min-h-[80px]";

  function toggle(section: string) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-5 pt-2 flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-accent font-semibold mr-4">← Back</Text>
          </TouchableOpacity>
          <Text className="text-light-100 text-xl font-bold">Edit Profile</Text>
        </View>

        {/* Profile Picture */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handlePickProfileImage}>
            <View className="w-24 h-24 rounded-full bg-accent/20 items-center justify-center overflow-hidden border-2 border-accent/30">
              {profilePicUri ? (
                <Image
                  source={{ uri: profilePicUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-accent text-3xl font-bold">
                  {firstName?.charAt(0) || "?"}
                </Text>
              )}
            </View>
            <View className="bg-accent rounded-full w-8 h-8 items-center justify-center absolute bottom-0 right-0">
              <Text className="text-white text-sm">📷</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-light-300 text-xs mt-2">Tap to change photo</Text>
        </View>

        {/* ─── Basic Info ──────────────────────────────── */}
        <Section title="👤 Basic Information" expanded={expandedSection === "basic"} onToggle={() => toggle("basic")}>
          <Text className="text-light-300 text-xs font-semibold mb-2">FIRST NAME</Text>
          <TextInput className={inputClass} placeholder="First Name" placeholderTextColor="#9CA4AB" value={firstName} onChangeText={setFirstName} />

          <Text className="text-light-300 text-xs font-semibold mb-2">LAST NAME</Text>
          <TextInput className={inputClass} placeholder="Last Name" placeholderTextColor="#9CA4AB" value={lastName} onChangeText={setLastName} />

          <Text className="text-light-300 text-xs font-semibold mb-2">PHONE</Text>
          <TextInput className={inputClass} placeholder="Phone Number" placeholderTextColor="#9CA4AB" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <SaveButton onPress={handleSaveBasicInfo} loading={submitting} />
        </Section>

        {/* ─── Address ─────────────────────────────────── */}
        <Section title="📍 Address" expanded={expandedSection === "address"} onToggle={() => toggle("address")}>
          <Text className="text-light-300 text-xs font-semibold mb-2">ADDRESS LINE 1</Text>
          <TextInput className={inputClass} placeholder="Street address" placeholderTextColor="#9CA4AB" value={addressLine1} onChangeText={setAddressLine1} />

          <Text className="text-light-300 text-xs font-semibold mb-2">ADDRESS LINE 2</Text>
          <TextInput className={inputClass} placeholder="Apartment, suite, etc." placeholderTextColor="#9CA4AB" value={addressLine2} onChangeText={setAddressLine2} />

          <Text className="text-light-300 text-xs font-semibold mb-2">PROVINCE</Text>
          <TextInput className={inputClass} placeholder="Province" placeholderTextColor="#9CA4AB" value={province} onChangeText={setProvince} />

          <Text className="text-light-300 text-xs font-semibold mb-2">CITY</Text>
          <TextInput className={inputClass} placeholder="City" placeholderTextColor="#9CA4AB" value={city} onChangeText={setCity} />

          <SaveButton onPress={handleSaveAddress} loading={submitting} />
        </Section>

        {/* ─── Professional Info (provider only) ───────── */}
        {isProvider && (
          <Section title="💼 Professional Info" expanded={expandedSection === "professional"} onToggle={() => toggle("professional")}>
            <Text className="text-light-300 text-xs font-semibold mb-2">SKILL / PROFESSION</Text>
            <TextInput className={inputClass} placeholder="e.g. Plumber, Electrician" placeholderTextColor="#9CA4AB" value={skill} onChangeText={setSkill} />

            <Text className="text-light-300 text-xs font-semibold mb-2">EXPERIENCE</Text>
            <TextInput className={inputClass} placeholder="e.g. 5 years" placeholderTextColor="#9CA4AB" value={experience} onChangeText={setExperience} />

            <Text className="text-light-300 text-xs font-semibold mb-2">DESCRIPTION</Text>
            <TextInput className={multilineClass} placeholder="Describe your expertise..." placeholderTextColor="#9CA4AB" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />

            <SaveButton onPress={handleSaveProfessionalInfo} loading={submitting} />
          </Section>
        )}

        {/* ─── Verification Documents (provider only) ─── */}
        {isProvider && (
          <Section title="📄 Verification Documents" expanded={expandedSection === "docs"} onToggle={() => toggle("docs")}>
            <Text className="text-light-300 text-sm mb-4">
              Upload your ID and work proof documents for admin verification.
            </Text>

            <DocUploadButton
              title="Upload ID Front"
              loading={uploadingDoc}
              onPress={() => handleUploadDocument("id-front")}
            />
            <DocUploadButton
              title="Upload ID Back"
              loading={uploadingDoc}
              onPress={() => handleUploadDocument("id-back")}
            />
            <DocUploadButton
              title="Upload Work Proof (PDF)"
              loading={uploadingDoc}
              onPress={() => handleUploadDocument("pdf")}
            />

            <TouchableOpacity
              className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl h-12 items-center justify-center mt-3"
              onPress={handleRequestVerification}
            >
              <Text className="text-emerald-400 font-semibold">
                Request Verification ✓
              </Text>
            </TouchableOpacity>
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SaveButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity
      className="bg-accent rounded-2xl h-12 items-center justify-center mt-2"
      onPress={onPress}
      disabled={loading}
      style={{ opacity: loading ? 0.6 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold text-base">Save Changes</Text>
      )}
    </TouchableOpacity>
  );
}

function DocUploadButton({
  title,
  loading,
  onPress,
}: {
  title: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-white/5 border border-white/10 rounded-2xl h-12 items-center justify-center mb-2"
      onPress={onPress}
      disabled={loading}
      style={{ opacity: loading ? 0.6 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color="#f66b0e" size="small" />
      ) : (
        <Text className="text-accent font-medium">{title}</Text>
      )}
    </TouchableOpacity>
  );
}
