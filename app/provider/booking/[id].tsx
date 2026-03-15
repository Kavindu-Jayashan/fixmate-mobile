import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { ProviderBooking } from "@/types";

// ─── Helpers ─────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calcHourlyAmount(seconds: number, hourlyRate: number): number {
  const hours = seconds / 3600;
  return Math.round(hours * hourlyRate * 100) / 100; // round to 2dp
}

// ─── Screen ──────────────────────────────────────────
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

  // Timer state for hourly jobs
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data fetching ─────────────────────────────────
  useEffect(() => {
    if (id) fetchBooking();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

      // Start timer if job is in progress + hourly
      if (found && found.status === "IN_PROGRESS" && found.paymentType === "HOURLY") {
        startTimer(found.startedAt);
      }
    } catch (err) {
      console.error("Failed to load booking:", err);
    } finally {
      setLoading(false);
    }
  }

  function startTimer(startedAt: string | null) {
    if (timerRef.current) clearInterval(timerRef.current);
    const startTime = startedAt ? new Date(startedAt).getTime() : Date.now();

    const tick = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }

  // ─── Actions ───────────────────────────────────────
  async function handleAction(action: string, body?: any) {
    try {
      setActionLoading(true);
      await api.post(
        `/api/provider/bookings/${id}/${action}?providerServiceId=${providerServiceId ?? booking?.providerServiceId}`,
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

  // Dual API Call: Finalize Booking then IMMEDIATELY Request Payment
  async function handleFinalizeAndRequestPayment() {
    if (!booking) return;
    try {
      setActionLoading(true);
      
      const isHourly = booking.paymentType === "HOURLY";
      let amountToRequest = Number(finalAmount);

      // 1. Finalize Booking (Sets Total Price on Backend, keeps status IN_PROGRESS)
      const finalizeBody = isHourly ? {
        hourlyRate: booking.hourlyRate,
        workedSeconds: elapsedSeconds > 0 ? elapsedSeconds : 1 // prevent 0
      } : {
        finalAmount: amountToRequest
      };

      await api.post(
        `/api/provider/bookings/${booking.bookingId}/finalize?providerServiceId=${providerServiceId ?? booking.providerServiceId}`,
        finalizeBody
      );

      // Use calculated amount for HOURLY if not overridden
      if (isHourly && (!finalAmount || finalAmount === "")) {
         amountToRequest = calcHourlyAmount(elapsedSeconds, booking.hourlyRate || 0);
      }

      // 2. Request Payment (Creates Payment record, sets status to PAYMENT_PENDING)
      await api.post(`/api/provider/payments/request`, {
        bookingId: booking.bookingId,
        amount: amountToRequest,
        workedSeconds: elapsedSeconds
      });

      Toast.show({ type: "success", text1: "Payment requested successfully!" });
      
      // Clear timer and refetch
      if (timerRef.current) clearInterval(timerRef.current);
      setShowFinalize(false);
      await fetchBooking();
      
    } catch (error: any) {
      console.error("Finalize Error:", error);
      const msg = error.response?.data?.message || "Failed to finalize job";
      Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Error finalizing job" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmPayment() {
    Alert.alert(
      "Confirm Payment",
      "Have you received the full cash payment from the customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              const paymentRes = await api.get(
                `/api/provider/payments/by-booking/${booking!.bookingId}`
              );
              const { paymentId } = paymentRes.data;
              await api.post(`/api/provider/payments/confirm/${paymentId}`);
              Toast.show({ type: "success", text1: "Payment confirmed! ✅" });
              await fetchBooking();
            } catch (error: any) {
              const msg = error.response?.data?.message || "Failed to confirm payment";
              Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Error confirming payment" });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  function handleCompleteJobPrompt() {
    // For hourly jobs, pre-fill with calculated amount
    if (
      booking &&
      booking.paymentType === "HOURLY" &&
      booking.hourlyRate &&
      elapsedSeconds > 0
    ) {
      const calculated = calcHourlyAmount(elapsedSeconds, booking.hourlyRate);
      setFinalAmount(String(calculated));
    }
    setShowFinalize(true);
  }

  // ─── Render helpers ────────────────────────────────
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

  const isHourly = booking.paymentType === "HOURLY";

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
                {booking.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>

          <InfoRow label="Customer" value={booking.customerName} />
          <InfoRow label="Date" value={dateStr} />
          <InfoRow label="Pricing" value={booking.paymentType} />
          {booking.hourlyRate && (
            <InfoRow label="Hourly Rate" value={`Rs. ${booking.hourlyRate}/hr`} />
          )}
          {booking.paymentAmount !== null && booking.paymentAmount !== undefined && (
            <InfoRow label="Total Amount" value={`Rs. ${booking.paymentAmount.toLocaleString()}`} />
          )}
          {booking.customerPhone && <InfoRow label="Customer Phone" value={booking.customerPhone} />}
          {booking.bookingPhone && <InfoRow label="Booking Phone" value={booking.bookingPhone} />}
          {booking.bookingAddress && <InfoRow label="Address" value={booking.bookingAddress} />}
          {booking.description && (
            <View className="mt-3">
              <Text className="text-light-300 text-xs font-semibold mb-1">NOTES</Text>
              <Text className="text-light-100 text-sm">{booking.description}</Text>
            </View>
          )}
        </View>

        {/* ─── Live Timer for Hourly IN_PROGRESS jobs ─── */}
        {booking.status === "IN_PROGRESS" && isHourly && (
          <View className="mx-5 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5 mb-5 items-center">
            <Text className="text-cyan-400 text-xs font-semibold mb-2">
              ⏱ JOB TIMER (HOURLY)
            </Text>
            <Text className="text-light-100 text-4xl font-bold font-mono tracking-widest">
              {formatElapsed(elapsedSeconds)}
            </Text>
            {booking.hourlyRate && (
              <View className="mt-3 bg-white/5 rounded-2xl px-4 py-2">
                <Text className="text-accent text-base font-semibold text-center">
                  Running Total: Rs.{" "}
                  {calcHourlyAmount(elapsedSeconds, booking.hourlyRate).toLocaleString()}
                </Text>
                <Text className="text-light-300 text-xs text-center mt-1">
                  @ Rs. {booking.hourlyRate}/hr
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── Actions ─── */}
        <View className="mx-5">
          {/* PENDING → Confirm / Reject */}
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

          {/* ACCEPTED → Start Job */}
          {booking.status === "ACCEPTED" && (
            <TouchableOpacity
              className="bg-blue-500 rounded-2xl h-12 items-center justify-center"
              onPress={() => handleAction("start")}
              disabled={actionLoading}
            >
              <Text className="text-white font-semibold">▶ Start Job</Text>
            </TouchableOpacity>
          )}

          {/* IN_PROGRESS → Finalize & Request Payment */}
          {booking.status === "IN_PROGRESS" && (
            <>
              {!showFinalize && (
                <TouchableOpacity
                  className="bg-accent rounded-2xl h-12 items-center justify-center"
                  onPress={handleCompleteJobPrompt}
                >
                  <Text className="text-white font-semibold">✓ Complete Job</Text>
                </TouchableOpacity>
              )}

              {showFinalize && (
                <View className="bg-secondary/40 border border-white/8 rounded-2xl p-4 border border-accent/30">
                  <Text className="text-light-300 text-xs font-semibold mb-2">
                    {isHourly ? "CONFIRM FINAL AMOUNT" : "FINAL AMOUNT TO CHARGE (Rs.)"}
                  </Text>
                  
                  {isHourly && booking.hourlyRate && elapsedSeconds > 0 && (
                    <Text className="text-light-300 text-xs mb-3 bg-white/5 p-3 rounded-xl border border-white/10">
                       <Text className="font-bold text-light-100">Calculated: Rs. {calcHourlyAmount(elapsedSeconds, booking.hourlyRate).toLocaleString()}</Text>
                       {"\n"}({formatElapsed(elapsedSeconds)} @ Rs. {booking.hourlyRate}/hr)
                    </Text>
                  )}

                  <TextInput
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-4"
                    placeholder="e.g. 3500"
                    placeholderTextColor="#9CA4AB"
                    value={finalAmount}
                    onChangeText={setFinalAmount}
                    keyboardType="numeric"
                  />
                  <View className="flex-row justify-end space-x-3">
                     <TouchableOpacity
                      className="bg-white/10 rounded-xl h-10 px-4 items-center justify-center mr-2"
                      onPress={() => setShowFinalize(false)}
                      disabled={actionLoading}
                    >
                      <Text className="text-light-100 font-semibold text-sm">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-accent rounded-xl h-10 px-5 items-center justify-center flex-1"
                      onPress={handleFinalizeAndRequestPayment}
                      disabled={actionLoading || (!isHourly && !finalAmount)}
                    >
                      <Text className="text-white font-bold text-sm">Request Payment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* PAYMENT_PENDING → Waiting for customer + Confirm Cash Payment */}
          {booking.status === "PAYMENT_PENDING" && (
            <View>
              <View className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-5 mb-4 items-center">
                <Text className="text-purple-400 text-base font-bold mb-1">
                  💰 Awaiting Payment
                </Text>
                <Text className="text-light-300 text-sm text-center">
                  Payment requested from the customer. Once they pay by Cash, confirm receipt below.
                </Text>
                {booking.paymentAmount !== null && booking.paymentAmount !== undefined && (
                  <Text className="text-accent text-2xl font-black tracking-tight mt-3">
                    Rs. {booking.paymentAmount.toLocaleString()}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className="bg-emerald-500 rounded-2xl h-12 items-center justify-center flex-row space-x-2"
                onPress={handleConfirmPayment}
                disabled={actionLoading}
              >
                <Text className="text-white font-bold">✓ Confirm Cash Received</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* COMPLETED → Success */}
          {booking.status === "COMPLETED" && (
            <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 items-center mt-2">
              <Text className="text-emerald-400 text-3xl mb-2">✅</Text>
              <Text className="text-emerald-400 text-lg font-bold">Job Completed</Text>
              {booking.paymentAmount !== null && booking.paymentAmount !== undefined && (
                <Text className="text-light-100 text-xl font-black tracking-tight mt-2">
                  Total: Rs. {booking.paymentAmount.toLocaleString()}
                </Text>
              )}
              {booking.paymentStatus === 'CONFIRMED' && (
                 <View className="bg-emerald-500/20 px-3 py-1 rounded-full mt-3">
                   <Text className="text-emerald-400 text-xs font-bold">PAYMENT CONFIRMED</Text>
                 </View>
              )}
            </View>
          )}

          {actionLoading && (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#f66b0e" size="large" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-light-300/10">
      <Text className="text-light-300 text-xs font-semibold">{label}</Text>
      <Text
        className="text-light-100 text-sm font-medium flex-1 text-right ml-4"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
