import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { CustomerBooking, ProviderBooking, BookingStatus } from "@/types";

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

  // Type guards and safe accessors
  const getAmount = () => {
    if (isProvider) {
      return (booking as ProviderBooking).paymentAmount;
    }
    return (booking as CustomerBooking).amount;
  };

  const getPricingType = () => {
    if (isProvider) {
      return (booking as ProviderBooking).paymentType;
    }
    return (booking as CustomerBooking).pricingType;
  };

  const getServiceTitle = () => {
    if (isProvider) {
      return (booking as ProviderBooking).serviceTitle;
    }
    return (booking as CustomerBooking).serviceName;
  };

  const getCounterpartyName = () => {
    if (isProvider) {
      return (booking as ProviderBooking).customerName;
    }
    return (booking as CustomerBooking).providerName;
  };

  const getDescription = () => {
    if (isProvider) {
      return (booking as ProviderBooking).description;
    }
    return (booking as CustomerBooking).description;
  };

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

  const formatAmount = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "—";
    return `Rs. ${Number(val).toLocaleString("en-LK")}`;
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

  async function handleCustomerPayment() {
    try {
      setActionLoading(true);

      // 1. Fetch payment details to get paymentId and amount
      const paymentResponse = await api.get(`/api/customer/payments/${booking.bookingId}`);
      const { paymentId, amount } = paymentResponse.data;

      // 2. Prompt user to select payment method
      Alert.alert(
        "Make Payment",
        `Total Amount Due : Rs. ${amount}\n Select Your Payment Method : `,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Pay with Cash",
            onPress: async () => {
              try {
                setActionLoading(true);
                await api.post(`/api/customer/payments/pay-cash/${paymentId}`);
                Toast.show({ type: "success", text1: "Payment marked as Cash" });
                onRefresh?.();
              } catch (error) {
                Toast.show({ type: "error", text1: "Failed to process cash payment" });
              } finally {
                setActionLoading(false);
              }
            }
          },
          {
            text: "Pay Online (PayHere)",
            onPress: async () => {
              try {
                setActionLoading(true);
                const paymentResponse = await api.post(`/api/customer/payments/pay-here-sandbox/${paymentId}`);
                Toast.show({ type: "info", text1: "PayHere Checkout Initiated" });
                console.log("PayHere SandBox Response : ", paymentResponse.data);
                // TODO: redirect to PayHere via WebBrowser
                onRefresh?.();
              } catch (error) {
                Toast.show({ type: "error", text1: "Failed to initiate online payment" });
              } finally {
                setActionLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load payment details" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleProviderConfirmPayment() {
    Alert.alert("Confirm Payment", "Have You Received the full payment from the customer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            setActionLoading(true);
            // 1. Fetch payment id associated with this Booking
            const paymentResponse = await api.get(`/api/provider/payments/by-booking/${booking.bookingId}`);
            const { paymentId } = paymentResponse.data;

            // 2.Confirm the Payment
            await api.post(`/api/provider/payments/confirm/${paymentId}`);
            Toast.show({ type: "success", text1: "Payment Confirmed" });
            onRefresh?.();
          } catch (error) {
            Toast.show({ type: "error", text1: "Failed to Confirm Payment" });
          } finally {
            setActionLoading(false);
          }
        }
      }
    ]);
  }

  const amountVal = getAmount();
  const pricingType = getPricingType();
  const serviceTitle = getServiceTitle();
  const counterpartyName = getCounterpartyName();
  const description = getDescription();

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
            {serviceTitle || "Service"}
          </Text>
          <Text className="text-light-300 text-xs mt-0.5">
            {counterpartyName || "User"}
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
            {pricingType || "—"}
          </Text>
          <Text className="text-accent text-xs font-semibold">
            {formatAmount(amountVal)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {description && (
        <Text className="text-light-300 text-xs mt-2" numberOfLines={2}>
          {description}
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
          {status === "PAYMENT_PENDING" && (
            <TouchableOpacity 
              className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl h-9 items-center justify-center" 
              onPress={handleProviderConfirmPayment}
            >
              <Text className="text-emerald-400 text-xs font-semibold">Confirm Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action buttons for customer */}
      {!isProvider && !actionLoading && (
        <View className="flex-row gap-2 mt-3">
          {status === "PAYMENT_PENDING" && (
            <TouchableOpacity
              className="flex-1 bg-purple-500/20 border border-purple-500/30 rounded-2xl h-9 items-center justify-center"
              onPress={handleCustomerPayment}
            >
              <Text className="text-purple-400 text-xs font-semibold">Pay Now</Text>
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

