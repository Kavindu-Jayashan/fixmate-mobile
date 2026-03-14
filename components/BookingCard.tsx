import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { CustomerBooking, ProviderBooking } from "@/types";

const badgeColor: Record<string, { bg: string; text: string; border: string }> = {
  PENDING:         { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30" },
  ACCEPTED:        { bg: "bg-blue-500/15",    text: "text-blue-400",    border: "border-blue-500/30" },
  IN_PROGRESS:     { bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/30" },
  PAYMENT_PENDING: { bg: "bg-purple-500/15",  text: "text-purple-400",  border: "border-purple-500/30" },
  COMPLETED:       { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  REJECTED:        { bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/30" },
  CANCELLED:       { bg: "bg-zinc-500/15",    text: "text-zinc-400",    border: "border-zinc-500/30" },
};

interface BookingCardProps {
  booking: CustomerBooking | ProviderBooking;
  isProvider: boolean;
  onPress?: () => void;
  onRefresh?: () => void;
}

export default function BookingCard({
  booking,
  isProvider,
  onPress,
  onRefresh,
}: BookingCardProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const status = booking.status || "PENDING";
  const colors = badgeColor[status] || badgeColor.PENDING;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-LK", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—";
    return `Rs. ${Number(amount).toLocaleString("en-LK")}`;
  };

  async function handleAccept() {
    const b = booking as ProviderBooking;
    try {
      setActionLoading(true);
      await api.post(
        `/api/provider/bookings/${b.bookingId}/confirm`,
        null,
        { params: { providerServiceId: b.providerServiceId } }
      );
      Toast.show({ type: "success", text1: "Booking accepted!" });
      onRefresh?.();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to accept booking" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    const b = booking as ProviderBooking;
    Alert.alert("Reject Booking", "Are you sure you want to reject this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            setActionLoading(true);
            await api.post(
              `/api/provider/bookings/${b.bookingId}/reject`,
              { reason: "Rejected from mobile" },
              { params: { providerServiceId: b.providerServiceId } }
            );
            Toast.show({ type: "success", text1: "Booking rejected" });
            onRefresh?.();
          } catch {
            Toast.show({ type: "error", text1: "Failed to reject booking" });
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  async function handleStartJob() {
    const b = booking as ProviderBooking;
    Alert.alert("Start Job", "Begin working on this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: async () => {
          try {
            setActionLoading(true);
            await api.post(
              `/api/provider/bookings/${b.bookingId}/start`,
              null,
              { params: { providerServiceId: b.providerServiceId } }
            );
            Toast.show({ type: "success", text1: "Job started!" });
            onRefresh?.();
          } catch {
            Toast.show({ type: "error", text1: "Failed to start job" });
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  return (
    <TouchableOpacity
      className="bg-secondary/40 border border-white/8 rounded-3xl p-4 mb-3"
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Top row: title + status badge */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-light-100 font-semibold text-base" numberOfLines={1}>
            {booking.serviceTitle || "Service"}
          </Text>
          <Text className="text-light-300 text-xs mt-0.5">
            {isProvider
              ? (booking as ProviderBooking).customerName || "Customer"
              : (booking as CustomerBooking).providerName || "Provider"}
          </Text>
        </View>
        <View className={`${colors.bg} ${colors.border} border rounded-full px-3 py-1`}>
          <Text className={`${colors.text} text-[10px] font-semibold`}>
            {status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      {/* Info rows */}
      <View className="flex-row justify-between mt-1">
        <View>
          <Text className="text-light-300 text-xs">Scheduled</Text>
          <Text className="text-light-100 text-xs font-medium">
            {formatDate(booking.scheduledAt)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-light-300 text-xs">
            {booking.pricingType || "—"}
          </Text>
          <Text className="text-accent text-xs font-semibold">
            {formatAmount(booking.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Description (provider view) */}
      {isProvider && (booking as ProviderBooking).description && (
        <Text className="text-light-300 text-xs mt-2" numberOfLines={2}>
          {(booking as ProviderBooking).description}
        </Text>
      )}

      {/* Action buttons for provider */}
      {isProvider && !actionLoading && (
        <View className="flex-row gap-2 mt-3">
          {status === "PENDING" && (
            <>
              <TouchableOpacity
                className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl h-9 items-center justify-center"
                onPress={handleAccept}
              >
                <Text className="text-emerald-400 text-xs font-semibold">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-rose-500/20 border border-rose-500/30 rounded-2xl h-9 items-center justify-center"
                onPress={handleReject}
              >
                <Text className="text-rose-400 text-xs font-semibold">Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {status === "ACCEPTED" && (
            <TouchableOpacity
              className="flex-1 bg-accent/20 border border-accent/30 rounded-2xl h-9 items-center justify-center"
              onPress={handleStartJob}
            >
              <Text className="text-accent text-xs font-semibold">▶ Start Job</Text>
            </TouchableOpacity>
          )}
          {status === "IN_PROGRESS" && (
            <TouchableOpacity
              className="flex-1 bg-purple-500/20 border border-purple-500/30 rounded-2xl h-9 items-center justify-center"
              onPress={onPress}
            >
              <Text className="text-purple-400 text-xs font-semibold">Manage →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {actionLoading && (
        <View className="mt-3 items-center">
          <ActivityIndicator color="#f66b0e" size="small" />
        </View>
      )}
    </TouchableOpacity>
  );
}
