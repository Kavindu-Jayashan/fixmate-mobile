import React from "react";
import { View, ActivityIndicator } from "react-native";

interface Props {
  color?: string;
}

export default function LoadingSpinner({ color = "#f66b0e" }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}
