import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { ProviderBooking } from "@/types";

export default function ProviderBookingDetailScreen() {
  const { id, providerServiceId } = useLocalSearchParams<{
    id: string;
    providerServiceId: string;
  }>();
  const router = useRouter();

  const [booking, setBooking] = useState<ProviderBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [showFinalize, setShowFinalize] = useState(false);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  async function fetchBooking() {
    try {
      setLoading(true);
      const profileRes = await api.get("/api/provider/profile");
      const providerId = profileRes.data.providerId || profileRes.data.id;
      if (!providerId) throw new Error("Missing provider ID in profile response");
      const res = await api.get(`/api/provider/${providerId}/bookings`);
      const bookings: ProviderBooking[] = res.data || [];
      const found = bookings.find((b) => b.bookingId === Number(id));
      setBooking(found || null);
    } catch (err) {
      console.error("Failed to load booking:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, body?: any) {
    try {
      setActionLoading(true);
      await api.post(
        `/api/provider/bookings/${id}/${action}?providerServiceId=${providerServiceId}`,
        body
      );
      Toast.show({ type: "success", text1: `Booking ${action}ed successfully` });
      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data || "Action failed";
      Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Something went wrong" });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#f66b0e" />
      </View>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <Text className="text-light-300 text-lg">Booking not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const dateStr = new Date(booking.scheduledAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-accent font-semibold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-light-100 text-lg font-bold">Booking Details</Text>
          <View className="w-12" />
        </View>

        {/* Booking info */}
        <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-light-100 font-bold text-lg">{booking.serviceTitle}</Text>
            <View className="bg-yellow-500/20 rounded-full px-3 py-1">
              <Text className="text-yellow-400 text-xs font-bold">
                {booking.status.replace("_", " ")}
              </Text>
            </View>
          </View>

          <InfoRow label="Customer" value={booking.customerName} />
          <InfoRow label="Email" value={booking.customerEmail} />
          <InfoRow label="Date" value={dateStr} />
          <InfoRow label="Pricing" value={booking.pricingType} />
          {booking.phone && <InfoRow label="Phone" value={booking.phone} />}
          {booking.addressLine1 && <InfoRow label="Address" value={booking.addressLine1} />}
          {booking.city && <InfoRow label="City" value={booking.city} />}
          {booking.description && (
            <View className="mt-3">
              <Text className="text-light-300 text-xs font-semibold mb-1">NOTES</Text>
              <Text className="text-light-100 text-sm">{booking.description}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="mx-5">
          {booking.status === "PENDING" && (
            <>
              <TouchableOpacity
                className="bg-emerald-500 rounded-2xl h-12 items-center justify-center mb-3"
                onPress={() => handleAction("confirm")}
                disabled={actionLoading}
              >
                <Text className="text-white font-semibold">✓ Confirm Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-500/15 border border-red-500/20 rounded-2xl h-12 items-center justify-center"
                onPress={() => setShowReject(true)}
              >
                <Text className="text-red-400 font-semibold">✕ Reject Booking</Text>
              </TouchableOpacity>

              {showReject && (
                <View className="bg-secondary/40 border border-white/8 rounded-2xl p-4 mt-3">
                  <TextInput
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3"
                    placeholder="Reason for rejection"
                    placeholderTextColor="#9CA4AB"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                  />
                  <TouchableOpacity
                    className="bg-red-500 rounded-2xl h-10 items-center justify-center"
                    onPress={() => handleAction("reject", { reason: rejectReason })}
                    disabled={actionLoading}
                  >
                    <Text className="text-white font-semibold text-sm">Confirm Rejection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {booking.status === "CONFIRMED" && (
            <TouchableOpacity
              className="bg-blue-500 rounded-2xl h-12 items-center justify-center"
              onPress={() => handleAction("start")}
              disabled={actionLoading}
            >
              <Text className="text-white font-semibold">▶ Start Job</Text>
            </TouchableOpacity>
          )}

          {booking.status === "IN_PROGRESS" && (
            <>
              <TouchableOpacity
                className="bg-accent rounded-2xl h-12 items-center justify-center"
                onPress={() => setShowFinalize(true)}
              >
                <Text className="text-white font-semibold">✓ Finalize & Complete</Text>
              </TouchableOpacity>

              {showFinalize && (
                <View className="bg-secondary/40 border border-white/8 rounded-2xl p-4 mt-3">
                  <Text className="text-light-300 text-xs font-semibold mb-2">FINAL AMOUNT (Rs.)</Text>
                  <TextInput
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3"
                    placeholder="e.g. 3500"
                    placeholderTextColor="#9CA4AB"
                    value={finalAmount}
                    onChangeText={setFinalAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    className="bg-emerald-500 rounded-2xl h-10 items-center justify-center"
                    onPress={() =>
                      handleAction("finalize", {
                        finalAmount: Number(finalAmount),
                      })
                    }
                    disabled={actionLoading || !finalAmount}
                  >
                    <Text className="text-white font-semibold text-sm">Complete Job</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {actionLoading && (
            <ActivityIndicator color="#f66b0e" className="mt-4" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-white/5">
      <Text className="text-light-300 text-sm">{label}</Text>
      <Text className="text-light-100 text-sm font-medium flex-1 text-right ml-4" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
