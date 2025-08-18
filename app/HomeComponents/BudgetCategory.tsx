import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { fetchBudgetCategories } from "../Services/BudgetService";
import { useNavigation } from "@react-navigation/native";

const BudgetCategoriesScreen = ({ token }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const loadCategories = async () => {
            const data = await fetchBudgetCategories(token);
            setCategories(data);
            setLoading(false);
        };
        loadCategories();
    }, [token]);

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#C89D28" />
            </View>
        );
    }

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                navigation.navigate("Products", {
                    itemName: "",
                    subItemName: "",
                    initialFilters: {
                        minGrandTotal: Number(item.min_price),
                        maxGrandTotal: Number(item.max_price)
                    }
                });
            }}
        >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Budget Categories</Text>
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCategory}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

export default BudgetCategoriesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
    },
    card: {
        flex: 1,
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        marginBottom: 16,
        marginHorizontal: 4,
        alignItems: "center",
        padding: 10,
        elevation: 3, // shadow for Android
        shadowColor: "#000", // shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    image: {
        width: "100%",
        height: 120,
        borderRadius: 10,
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});