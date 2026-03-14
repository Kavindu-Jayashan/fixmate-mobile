import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import api from "@/lib/api";
import ProviderCard from "@/components/ProviderCard";
import type { PublicServiceCard } from "@/types";

const SERVICE_OPTIONS = [
  "All services",
  "Landscaping",
  "Electrical",
  "Cleaners",
  "Plumbing",
  "Color Washing",
  "Masonry",
  "Vehicle Repair",
  "Tile Work",
  "Cushion Works",
  "Carpentry",
  "Welding",
  "TV Repair",
  "Equipment Repairing",
  "Roofing",
  "Contractors",
];

export default function SearchScreen() {
  const [providers, setProviders] = useState<PublicServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedService, setSelectedService] = useState("All services");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/user/services");
      setProviders(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const loc = locationQuery.toLowerCase().trim();
    const svc =
      selectedService === "All services"
        ? ""
        : selectedService.toLowerCase();

    return providers.filter((p) => {
      const nameMatch =
        !q ||
        p.providerName?.toLowerCase().includes(q) ||
        p.serviceTitle?.toLowerCase().includes(q);

      const locMatch =
        !loc ||
        p.location?.toLowerCase().includes(loc) ||
        p.city?.toLowerCase().includes(loc) ||
        p.district?.toLowerCase().includes(loc);

      const svcMatch =
        !svc ||
        p.serviceTitle?.toLowerCase().includes(svc) ||
        p.categoryName?.toLowerCase().includes(svc);

      return nameMatch && locMatch && svcMatch;
    });
  }, [providers, searchQuery, locationQuery, selectedService]);

  return (
    <View className="flex-1 bg-primary">
      {/* Header */}
      <View className="px-5 pt-14 pb-4">
        <Text className="text-accent text-3xl font-bold">Find Experts</Text>
        <Text className="text-light-300 text-sm mt-1">
          Search by name, service, or location
        </Text>
      </View>

      {/* Search bar */}
      <View className="px-5 mb-2">
        <TextInput
          className="bg-white/8 border border-white/10 rounded-2xl px-4 h-12 text-light-100"
          placeholder="Search providers or services..."
          placeholderTextColor="#9CA4AB"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter toggle */}
      <View className="px-5 flex-row items-center justify-between mb-3">
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center gap-2"
        >
          <Text className="text-accent text-sm font-semibold">
            {showFilters ? "▾ Hide Filters" : "▸ Filters"}
          </Text>
          {selectedService !== "All services" || locationQuery ? (
            <View className="bg-accent w-5 h-5 rounded-full items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {(selectedService !== "All services" ? 1 : 0) +
                  (locationQuery ? 1 : 0)}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <Text className="text-light-300 text-xs">
          {loading ? "..." : `${filtered.length} provider(s)`}
        </Text>
      </View>

      {/* Expanded filters */}
      {showFilters && (
        <View className="px-5 mb-4">
          {/* Location */}
          <TextInput
            className="bg-white/8 border border-white/10 rounded-2xl px-4 h-11 text-light-100 mb-3"
            placeholder="Filter by location (e.g. Galle, Matara)"
            placeholderTextColor="#9CA4AB"
            value={locationQuery}
            onChangeText={setLocationQuery}
          />

          {/* Service chips */}
          <FlatList
            data={SERVICE_OPTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedService(item)}
                className={`px-4 py-2 rounded-full border ${
                  selectedService === item
                    ? "bg-accent border-accent"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selectedService === item
                      ? "text-white"
                      : "text-light-300"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Clear button */}
          {(selectedService !== "All services" || locationQuery) && (
            <TouchableOpacity
              className="mt-3 self-start"
              onPress={() => {
                setSelectedService("All services");
                setLocationQuery("");
              }}
            >
              <Text className="text-accent text-xs font-semibold">
                ✕ Clear all filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f66b0e" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-red-400 text-sm text-center">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-accent rounded-2xl px-6 py-3"
            onPress={fetchProviders}
          >
            <Text className="text-white font-semibold text-sm">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.providerServiceId.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => <ProviderCard provider={item} />}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-light-300 text-base">No providers found</Text>
              <Text className="text-light-300/60 text-sm mt-2">
                Try a different search or filter
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}