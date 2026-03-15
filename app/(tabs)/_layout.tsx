import { Image, Text, View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { icons } from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: any;
  title: string;
}) => (
  <View className="items-center justify-center mt-2 w-16">
    <View
      className={`w-10 h-10 rounded-full items-center justify-center ${
        focused ? "bg-accent" : ""
      }`}
    >
      <Image
        source={icon}
        tintColor={focused ? "#fff" : "#9CA4AB"}
        className="w-5 h-5"
        resizeMode="contain"
      />
    </View>
    <Text
      className={`text-[10px] mt-1 ${
        focused ? "text-accent font-semibold" : "text-light-300"
      }`}
    >
      {title}
    </Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#112b3c",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          position: "absolute",
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} title="Search" />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="Bookings" />
          ),
        }}
      />
      <Tabs.Screen
        name="wanted"
        options={{
          title: "Wanted",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.star} title="Wanted" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
