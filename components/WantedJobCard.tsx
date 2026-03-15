import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { WantedPost } from "@/types";

interface Props {
  post: WantedPost;
  isProvider: boolean;
  onApply?: (id: number) => void;
}

export default function WantedJobCard({ post, isProvider, onApply }: Props) {
  const dateStr = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "Unknown Date";

  return (
    <View className="bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-4">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-light-100 font-bold text-lg">{post.profession}</Text>
          <Text className="text-light-300 text-xs mt-1">
            by {post.customerName}
          </Text>
        </View>
        <View className="bg-accent/15 rounded-xl px-3 py-1.5">
          <Text className="text-accent font-bold text-sm">
            {post.status}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-light-200 text-sm mb-3" numberOfLines={3}>
        {post.description}
      </Text>

      {/* Meta row */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        <View className="bg-white/5 rounded-full px-3 py-1">
          <Text className="text-light-300 text-xs">📍 {post.location}</Text>
        </View>
        <View className="bg-white/5 rounded-full px-3 py-1">
          <Text className="text-light-300 text-xs">📅 {dateStr}</Text>
        </View>
        <View className="bg-white/5 rounded-full px-3 py-1">
          <Text className="text-light-300 text-xs">
            👷 {post.currentJoined}/{post.requiredCount} workers
          </Text>
        </View>
      </View>

      {/* Apply button (providers only) */}
      {isProvider && (
        <TouchableOpacity
          className={`rounded-2xl h-10 items-center justify-center ${
            post.applied ? "bg-white/10" : "bg-accent"
          }`}
          disabled={post.applied}
          onPress={() => !post.applied && onApply?.(post.id)}
        >
          <Text
            className={`font-semibold text-sm ${
              post.applied ? "text-light-300" : "text-white"
            }`}
          >
            {post.applied ? "✓ Applied" : "Sign Up for Work"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
