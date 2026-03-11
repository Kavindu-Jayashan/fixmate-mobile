import {Image, Text, View} from 'react-native';
import React from 'react';
import {Tabs} from "expo-router";
import {ImageBackground} from "react-native";
import {images} from "@/constants/images";
import {icons} from "@/constants/icons";

const TabIcon = ({focused, icon, title} : any) => {
    if(focused){
        return (
            <ImageBackground source={images.highlight} resizeMode="contain" className="w-20">
                <Image source={icon}
                tintColor="secondary"
                className="size-5 "/>
                <Text>{title}</Text>
            </ImageBackground>
        )
    }
    return (
        <View className="size-full justify-center items-center mt-4 rounded-full">
            <Image source={icon} tintColor='secondary' className='size-5'></Image>
        </View>
    )
}

const _layout = () => {
  return (
    <Tabs

        screenOptions={{
          tabBarShowLabel: false,
            tabBarItemStyle:{
              width:'100%',
                height:'100%',
                justifyContent:'center',
              alignItems:'center'
            },
          tabBarStyle:{
              backgroundColor:'bg-secondary',
              borderRadius: 50,
              marginHorizontal:20,
              marginBottom: 36,
              height:52,
              position:'absolute',
              overflow:'hidden',
              borderWidth:1,
              borderColor:'light-100',

          }
        }}
    >

        <Tabs.Screen

            name="index"
            options={{
                title:"Home",
                headerShown: false,

                tabBarIcon: ({ focused }) => (
                    <TabIcon
                        focused={focused}
                        icon={icons.home}
                        // title="Home"
                    />
                )
            }}
        />
        <Tabs.Screen
            name='search'
            options={{
                title : "Search",
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon
                        focused={focused}
                        icon={icons.search}
                        // title="Search"
                    />
                )


            }}
        />


    </Tabs>
  );
};

export default _layout;
