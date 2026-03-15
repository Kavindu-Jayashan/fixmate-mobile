import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

interface Location {
    lat: number;
    lng: number;
}

interface MapPickerProps {
    value: Location | null;
    onChange: (location: Location) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
    const defaultLat = 5.9496;
    const defaultLng = 80.5353;

    const lat = value?.lat || defaultLat;
    const lng = value?.lng || defaultLng;

    const webViewRef = useRef<WebView>(null);
    const lastValueRef = useRef<{lat: number, lng: number}>({ lat, lng });

    useEffect(() => {
        if (value && (value.lat !== lastValueRef.current.lat || value.lng !== lastValueRef.current.lng)) {
            lastValueRef.current = { lat: value.lat, lng: value.lng };
            const script = `
                try {
                   var evt = new MessageEvent('message', {
                       data: JSON.stringify({ lat: ${value.lat}, lng: ${value.lng} })
                   });
                   document.dispatchEvent(evt);
                } catch(e) {}
                true;
            `;
            webViewRef.current?.injectJavaScript(script);
        }
    }, [value]);

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data && data.lat && data.lng) {
                lastValueRef.current = { lat: data.lat, lng: data.lng };
                onChange({ lat: data.lat, lng: data.lng });
            }
        } catch (e) {
            console.error("Failed to parse map message", e);
        }
    };

    if (Platform.OS === 'web') {
        return (
            <View className="w-full overflow-hidden rounded-2xl border border-white/10 mb-4 h-[250px] bg-white/5 items-center justify-center p-4">
                <Text className="text-light-300 text-sm text-center">
                    Map is disabled on the web version.
                    Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                </Text>
            </View>
        );
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #1a1a1a; }
        #map { height: 100%; width: 100%; }
        /* Map styling to match dark theme */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {zoomControl: false}).setView([${lat}, ${lng}], 14);
        
        // CartoDB Voyager tiles map well with inversion
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var marker = L.marker([${lat}, ${lng}], {draggable: true}).addTo(map);

        function sendCoords(newLat, newLng) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ lat: newLat, lng: newLng }));
            }
        }

        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendCoords(e.latlng.lat, e.latlng.lng);
        });
        
        marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            sendCoords(position.lat, position.lng);
        });

        document.addEventListener('message', function(event) {
            try {
                var data = JSON.parse(event.data);
                if(data.lat && data.lng) {
                    marker.setLatLng([data.lat, data.lng]);
                    map.setView([data.lat, data.lng], map.getZoom());
                }
            } catch(e) {}
        });
    </script>
</body>
</html>
    `;

    return (
        <View className="w-full overflow-hidden rounded-2xl border border-white/10 mb-4 h-[250px] bg-white/5">
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                onMessage={handleMessage}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({});