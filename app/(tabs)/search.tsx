import { FlatList, Text, View, TextInput } from 'react-native';
import React, { useState } from 'react';
import { images } from "@/constants/images";
import ServiceCard from "@/components/serviceCard";

const Search = () => {
    const [searchQuery, setSearchQuery] = useState('');

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

    // 1. Filter logic: This runs every time searchQuery changes
    const filteredServices = services.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View className="flex-1 bg-primary pt-10">
            {/* 2. The Search Input */}
            <View className="px-5 mb-5 mt-10">
                <Text className="text-accent text-3xl font-bold mb-4">Find a Service</Text>
                <TextInput
                    className="bg-white/10 p-4 rounded-xl text-white border border-white/20"
                    placeholder="Search e.g. 'Plumbing'..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery} // Updates state instantly
                />
            </View>

            {/* 3. The List */}
            <FlatList
                data={filteredServices} // Use the filtered list here
                renderItem={({ item }) => <ServiceCard {...item} />}
                keyExtractor={(item) => item.id}
                numColumns={2} // Keeps your grid look
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={() => (
                    <View className="items-center mt-20">
                        <Text className="text-white/50">No services found for "{searchQuery}"</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default Search;