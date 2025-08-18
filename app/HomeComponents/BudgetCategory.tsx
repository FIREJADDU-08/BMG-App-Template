import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { fetchBudgetCategories } from '../Services/BudgetService';
import { useNavigation } from '@react-navigation/native';

const BudgetCategoriesScreen = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchBudgetCategories('yourAuthToken');
                setCategories(data);
                console.log('Fetched categories:', data);
                setError(null);
            } catch (err) {
                console.error('Failed to load categories:', err);
                setError('Failed to load categories. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    // Calculate dimensions for grid layout
    const { width } = Dimensions.get('window');
    const itemSize = (width - 30) / 2; // 30 = padding (10*2) + margin (5*2)

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2a52be" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (categories.length === 0 && !loading) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No categories found</Text>
            </View>
        );
    }

    // Function to chunk array into groups of 2 for 2x2 rows
    const chunkArray = (array, chunkSize) => {
        const result = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    };

    const rows = chunkArray(categories, 2);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
        >
            {rows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                    {row.map((item) => (
                        <TouchableOpacity
                            key={item.id.toString()}
                            style={[styles.card, { width: itemSize, height: itemSize }]}
                            onPress={() => {
                                const params = {
                                    initialFilters: {
                                        minGrandTotal: item.min,
                                        maxGrandTotal: item.max,
                                        // categoryId: item.id,
                                        // itemName: item.title,
            
                                    },
                                };

                                console.log("🔎 Navigation Params:", params);

                                navigation.navigate('Products', params);
                            }}
                            activeOpacity={0.7}
                        >

                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {/* Add empty view if row has only 1 item */}
                    {row.length === 1 && <View style={{ width: itemSize }} />}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        padding: 10,
        paddingBottom: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imageContainer: {
        height: '70%', // 70% of card height for image
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        height: '30%', // 30% of card height for text
        padding: 8,
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default BudgetCategoriesScreen;