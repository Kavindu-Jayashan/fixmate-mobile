import { FlatList, Image, Text, View, TextInput } from "react-native";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import SearchBar from "@/components/searchBar";
import {useRouter} from "expo-router";

export default function Index() {
    const router = useRouter();

    const services = [
        { id: '1', name: "Carpenter", img: images.carpenter },
        { id: '2', name: "Electrician", img: images.electric },
        { id: '3', name: "Cleaning", img: images.cleaning },
        { id: '4', name: "Colorwash", img: images.colorwash },
        { id: '5', name: "Landscaping", img: images.landscaping },
        { id: '6', name: "Masonry", img: images.mason },
        { id: '7', name: "Welding", img: images.welding },
        { id: '8', name: "Construction", img: images.construction },
        { id: '9', name: "Cushioning", img: images.cushioning },
        { id: '10', name: "Mechanic", img: images.mechanic },
        { id: '11', name: "Plumbing", img: images.plumbing },
        { id: '12', name: "Repairing", img: images.repairing },
        { id: '13', name: "Roofing", img: images.roofing },
        { id: '14', name: "Tiles", img: images.tile },
    ];


    const Header = () => (
        <View className="mt-10 px-5">
            <View className="justify-center items-center mb-8">
                <Image source={icons.logo} className="w-[400px] h-[100px] " resizeMode="contain" />
            </View>

            <Text className="text-5xl font-bold text-light-100">Reliable Services,</Text>
            <Text className="text-5xl font-bold text-accent">Zero Friction.</Text>
            <Text className="text-white/80 text-lg mt-2">
                Find verified professionals for every job — instantly.
            </Text>

            {/* Basic Search Bar UI */}
            {/*<View className="bg-white/10 flex-row items-center p-4 rounded-2xl mt-6 border border-white/20">*/}
            {/*    <Text className="text-white/50">Search for services...</Text>*/}
            {/*</View>*/}
            <SearchBar placeholder="Search for Services" onPress={() => router.push("/search") } />

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
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
                ListHeaderComponent={Header}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <View className="w-[48%] bg-white/5 rounded-3xl p-5 mb-4 items-center border border-white/5">
                        <Image source={item.img} className="w-24 h-24" resizeMode="contain" />
                        <Text className="text-light-100 font-medium mt-3 text-center">
                            {item.name}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}