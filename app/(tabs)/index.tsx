import { FlatList, Image, Text, View, TouchableOpacity } from "react-native";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import SearchBar from "@/components/searchBar";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  const services = [
    { id: "1", name: "Carpenter", img: images.carpenter, filter: "Carpentry" },
    { id: "2", name: "Electrician", img: images.electric, filter: "Electrical" },
    { id: "3", name: "Cleaning", img: images.cleaning, filter: "Cleaners" },
    { id: "4", name: "Colorwash", img: images.colorwash, filter: "Color Washing" },
    { id: "5", name: "Landscaping", img: images.landscaping, filter: "Landscaping" },
    { id: "6", name: "Masonry", img: images.mason, filter: "Masonry" },
    { id: "7", name: "Welding", img: images.welding, filter: "Welding" },
    { id: "8", name: "Construction", img: images.construction, filter: "Contractors" },
    { id: "9", name: "Cushioning", img: images.cushioning, filter: "Cushion Works" },
    { id: "10", name: "Mechanic", img: images.mechanic, filter: "Vehicle Repair" },
    { id: "11", name: "Plumbing", img: images.plumbing, filter: "Plumbing" },
    { id: "12", name: "Repairing", img: images.repairing, filter: "Equipment Repairing" },
    { id: "13", name: "Roofing", img: images.roofing, filter: "Roofing" },
    { id: "14", name: "Tiles", img: images.tile, filter: "Tile Work" },
  ];

  const Header = () => (
    <View className="mt-10 px-5">
      <View className="justify-center items-center mb-8">
        <Image
          source={icons.logo}
          className="w-[400px] h-[100px]"
          resizeMode="contain"
        />
      </View>

      <Text className="text-5xl font-bold text-light-100">
        Reliable Services,
      </Text>
      <Text className="text-5xl font-bold text-accent">Zero Friction.</Text>
      <Text className="text-white/80 text-lg mt-2">
        Find verified professionals for every job — instantly.
      </Text>

      <SearchBar
        placeholder="Search for Services"
        onPress={() => router.push("/search")}
      />

      {/* Feature badges */}
      <View className="flex-row flex-wrap gap-2 mt-4">
        <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
          <Text className="text-light-300 text-xs">✓ Verified pros</Text>
        </View>
        <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
          <Text className="text-light-300 text-xs">⚡ Fast booking</Text>
        </View>
        <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
          <Text className="text-light-300 text-xs">💰 Fair pricing</Text>
        </View>
      </View>

      <View className="mt-10 mb-4">
        <Text className="text-4xl text-white font-bold">Services</Text>
        <Text className="text-white/60 text-sm mt-1">
          Browse popular categories or search above.
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-primary">
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="w-[48%] bg-white/5 rounded-3xl p-5 mb-4 items-center border border-white/5 active:scale-95"
            activeOpacity={0.7}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/search",
                params: { service: item.filter },
              });
            }}
          >
            <Image
              source={item.img}
              className="w-24 h-24"
              resizeMode="contain"
            />
            <Text className="text-light-100 font-medium mt-3 text-center">
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}