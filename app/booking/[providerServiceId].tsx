import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { PublicServiceCard } from "@/types";
import MapPicker from "@/components/MapPicker";

export default function BookingScreen() {
  const { providerServiceId } = useLocalSearchParams<{ providerServiceId: string }>();
  const router = useRouter();

  const [service, setService] = useState<PublicServiceCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [pricingType, setPricingType] = useState<"HOURLY" | "FIXED">("HOURLY");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setlocation] = useState<{ lat: number; lng: number } | null>(null);

  async function fetchAddressFromCoords(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          "User-Agent": "FixmateMobileApp/1.0"
        }
      });
      if (!res.ok) return;

      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.address) {
          const { road, suburb, neighbourhood, city: addrCity, town, village, state, county } = data.address;
          
          const primaryAddress = road || suburb || neighbourhood || "";
          const primaryCity = addrCity || town || village || county || "";
          const primaryProvince = state || "";
          
          if (primaryAddress) setAddressLine1(primaryAddress);
          if (primaryCity) setCity(primaryCity);
          if (primaryProvince) setProvince(primaryProvince);
        }
      } catch (e) {
        console.error("Geocoding JSON parse error:", e);
      }
    } catch (error) {
      console.error("Geocoding network error:", error);
    }
  }

  function handleLocationChange(loc: { lat: number; lng: number }) {
    setlocation(loc);
    fetchAddressFromCoords(loc.lat, loc.lng);
  }

  useEffect(() => {
    if (providerServiceId) fetchService();
  }, [providerServiceId]);

  async function fetchService() {
    try {
      setLoading(true);
      const res = await api.get(`/api/user/service/${providerServiceId}`);
      setService(res.data);
      if (!res.data.fixedPriceAvailable) {
        setPricingType("HOURLY");
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load service details" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlots(date: string) {
    if (!date) return;
    try {
      setSlotsLoading(true);
      const res = await api.get(
        `/api/user/services/${providerServiceId}/available-slots?date=${date}`
      );
      setAvailableSlots(Array.isArray(res.data) ? res.data : []);
      setSelectedTime("");
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleDateChange(text: string) {
    setSelectedDate(text);
    // Auto fetch slots when a valid date like YYYY-MM-DD is entered
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      fetchSlots(text);
    }
  }

  async function handleBook() {
    if (!selectedDate || !selectedTime) {
      Toast.show({ type: "error", text1: "Please select a date and time" });
      return;
    }

    const scheduledAt = `${selectedDate}T${selectedTime}:00+05:30`;

    try {
      setSubmitting(true);
      const payload: any = {
        providerServiceId: Number(providerServiceId),
        scheduledAt,
        pricingType,
        latitude: location?.lat,
        longitude: location?.lng
      };
      if (description.trim()) payload.description = description;
      if (addressLine1.trim()) payload.addressLine1 = addressLine1;
      if (city.trim()) payload.city = city;
      if (province.trim()) payload.province = province;
      if (phone.trim()) payload.phone = phone;

      await api.post("/api/customer/bookings", payload);
      Toast.show({ type: "success", text1: "Booking confirmed! 🎉" });
      router.back();
    } catch (error: any) {
      const status = error.response?.status;
      let msg = "Booking failed";
      try {
        const data = error.response?.data;
        if (typeof data === "string") msg = data;
        else if (data?.message) msg = data.message;
      } catch {}

      if (status === 409) msg = "This time slot is already booked ❌";
      else if (status === 400 && msg.includes("own service"))
        msg = "You cannot book your own service";

      Toast.show({ type: "error", text1: msg });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#f66b0e" />
      </View>
    );
  }

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <Text className="text-light-300 text-lg">Service not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const inputClass =
    "bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3";

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Back */}
        <TouchableOpacity className="px-5 pt-2 pb-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="px-5 mb-6">
          <Text className="text-light-100 text-2xl font-bold">
            Book a Professional
          </Text>
          <Text className="text-light-300 text-sm mt-1">
            Choose date & time, add notes, then confirm
          </Text>
        </View>

        {/* Service info */}
        <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-4 mb-5">
          <Text className="text-light-100 font-bold text-lg">
            {service.serviceTitle}
          </Text>
          <Text className="text-light-300 text-sm mt-1">
            {service.providerName}
          </Text>
          <View className="flex-row items-center gap-3 mt-2">
            <Text className="text-accent text-sm font-semibold">
              {service.fixedPriceAvailable
                ? `Fixed: Rs. ${service.fixedPrice}`
                : service.hourlyRate
                ? `Rs. ${service.hourlyRate}/hr`
                : "—"}
            </Text>
            <Text className="text-yellow-400 text-sm">
              ★ {service.rating?.toFixed(1) || "N/A"}
            </Text>
          </View>
        </View>

        {/* Pricing type */}
        {service.fixedPriceAvailable && (
          <View className="mx-5 mb-4">
            <Text className="text-light-300 text-xs font-semibold mb-2">
              PRICING TYPE
            </Text>
            <View className="flex-row gap-3">
              {(["HOURLY", "FIXED"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setPricingType(type)}
                  className={`flex-1 h-11 rounded-2xl items-center justify-center border ${
                    pricingType === type
                      ? "bg-accent border-accent"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      pricingType === type ? "text-white" : "text-light-300"
                    }`}
                  >
                    {type === "HOURLY" ? "Hourly Rate" : "Fixed Price"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Booking form */}
        <View className="mx-5">
          {/* Date */}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            DATE (YYYY-MM-DD)
          </Text>
          <TextInput
            className={inputClass}
            placeholder="e.g. 2026-03-15"
            placeholderTextColor="#9CA4AB"
            value={selectedDate}
            onChangeText={handleDateChange}
          />

          {/* Time slots */}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            AVAILABLE TIME SLOTS
          </Text>
          {slotsLoading ? (
            <ActivityIndicator color="#f66b0e" className="my-3" />
          ) : availableSlots.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setSelectedTime(slot)}
                  className={`px-4 py-2 rounded-xl border ${
                    selectedTime === slot
                      ? "bg-accent border-accent"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedTime === slot ? "text-white" : "text-light-300"
                    }`}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : selectedDate ? (
            <Text className="text-light-300/60 text-sm mb-4">
              {/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
                ? "No available slots for this date"
                : "Enter a valid date to see slots"}
            </Text>
          ) : (
            <Text className="text-light-300/60 text-sm mb-4">
              Select a date first to see available times
            </Text>
          )}

          {/* Description */}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            DESCRIPTION (OPTIONAL)
          </Text>
          <TextInput
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-light-100 mb-3 min-h-[80px]"
            placeholder="Describe the issue or work needed..."
            placeholderTextColor="#9CA4AB"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          {/*Map*/}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            Select Location on Map
          </Text>
          <MapPicker value={location} onChange={handleLocationChange}/>

          {/* Address */}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            ADDRESS
          </Text>
          <TextInput
            className={inputClass}
            placeholder="Address line 1"
            placeholderTextColor="#9CA4AB"
            value={addressLine1}
            onChangeText={setAddressLine1}
          />
          <View className="flex-row gap-3">
            <TextInput
              className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3 flex-1"
              placeholder="City"
              placeholderTextColor="#9CA4AB"
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3 flex-1"
              placeholder="Province"
              placeholderTextColor="#9CA4AB"
              value={province}
              onChangeText={setProvince}
            />
          </View>
          <TextInput
            className={inputClass}
            placeholder="Phone number"
            placeholderTextColor="#9CA4AB"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Book button */}
          <TouchableOpacity
            onPress={handleBook}
            disabled={submitting}
            className="bg-accent rounded-2xl h-12 items-center justify-center mt-2 shadow-lg"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Confirm Booking
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
