import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, TextInput, Platform, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { FONTS, COLORS as colors } from '../../constants/theme';
import { ScrollView } from 'react-native-gesture-handler';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import SearchService from '../../Services/SearchService';
const IMAGE_BASE_URL = "https://app.bmgjewellers.com";
const FALLBACK_IMAGE = IMAGES.item11;

;

const SearchHistoryData = [
    { title: "Rings" },
    { title: "Bracelet" },
    { title: "Pendant" },
    { title: "Earrings" },
    { title: "Chains" },
];

type ProductItem = {
    MaterialFinish: string;
    Description: string;
    TAGNO: string;
    Occasion: string;
    RATE: string;
    GSTAmount: string;
    TAGKEY: string;
    Gender: string;
    SIZEID: number;
    Best_Design: boolean;
    SNO: string;
    CollectionType: string;
    ImagePath: string;
    NewArrival: boolean;
    GrossAmount: string;
    Featured_Products: boolean;
    SIZENAME: string | null;
    Rate: string;
    StoneType: string | null;
    SUBITEMNAME: string;
    CATNAME: string;
    NETWT: string;
    GSTPer: string;
    GrandTotal: string;
    ColorAccents: string;
    ITEMID: string;
    ITEMNAME: string;
};

type SearchScreenProps = StackScreenProps<RootStackParamList, 'Search'>;

const Search = ({ navigation }: SearchScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    const [items, setItems] = useState(SearchHistoryData);
    const [show, setShow] = useState(SearchHistoryData);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const searchTimeoutRef = useRef<NodeJS.Timeout>();
    const pageSize = 20; // Increased page size for better UX

    const debounce = (func: Function, delay: number) => {
        return (...args: any[]) => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => func(...args), delay);
        };
    };

    const searchProducts = async (text: string, page: number = 1, isNewSearch: boolean = true) => {
        if (text.trim().length === 0) {
            setSearchResults([]);
            setHasMorePages(true);
            setCurrentPage(1);
            setTotalResults(0);
            return;
        }

        if (isNewSearch) {
            setIsSearching(true);
            setCurrentPage(1);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const searchParams = {
                subItemName: text,
                page: 0,
                pageSize: 100000,
                ...(selectedCategory !== 'All' && { category: selectedCategory })
            };

            const response = await SearchService.searchProducts(searchParams);

            if (isNewSearch) {
                setSearchResults(response.data || []);
            } else {
                setSearchResults(prevResults => [...prevResults, ...(response.data || [])]);
            }

            // Assuming the API returns total count and current page info
            const totalCount = response.totalCount || response.data?.length || 0;
            const hasMore = response.hasMore !== undefined ? response.hasMore :
                (response.data && response.data.length === pageSize);

            setTotalResults(totalCount);
            setHasMorePages(hasMore);
            setCurrentPage(page);

            // Add to search history if it's a new search and has results
            if (isNewSearch && response.data && response.data.length > 0) {
                addToSearchHistory(text);
            }

        } catch (error) {
            console.error('Search error:', error);
            if (isNewSearch) {
                setSearchResults([]);
            }
            setHasMorePages(false);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    const handleSearch = useCallback(debounce(async (text: string) => {
        await searchProducts(text, 1, true);
    }, 300), [selectedCategory]);

    const loadMoreResults = async () => {
        if (!isLoadingMore && hasMorePages && searchText.trim().length > 0) {
            const nextPage = currentPage + 1;
            await searchProducts(searchText, nextPage, false);
        }
    };

    const addToSearchHistory = (searchTerm: string) => {
        const trimmedTerm = searchTerm.trim();
        if (trimmedTerm && !show.some(item => item.title.toLowerCase() === trimmedTerm.toLowerCase())) {
            const newHistoryItem = { title: trimmedTerm };
            setShow(prevShow => [newHistoryItem, ...prevShow.slice(0, 4)]); // Keep only last 5 searches
            setItems(prevItems => [newHistoryItem, ...prevItems.slice(0, 4)]);
        }
    };

    const handleSearchHistoryPress = (searchTerm: string) => {
        setSearchText(searchTerm);
    };

    // const handleCategoryPress = (category: string) => {
    //     setSelectedCategory(category);
    //     if (searchText.trim().length > 0) {
    //         searchProducts(searchText, 1, true);
    //     }
    // };

    useEffect(() => {
        handleSearch(searchText);
    }, [searchText, handleSearch]);

    const removeItem = () => {
        setItems([]);
        setShow([]);
    };

    const removeItem2 = (indexToRemove: number) => {
        setShow(prevItems => prevItems.filter((item, index) => index !== indexToRemove));
    };

    const getImageUrl = (imagePath: string) => {
        try {
            const images = JSON.parse(imagePath);
            if (images && images.length > 0) {
                const firstImage = images[0];
                return { uri: firstImage.startsWith("http") ? firstImage : `${IMAGE_BASE_URL}${firstImage}` };
            }
        } catch {
            if (imagePath.startsWith("http")) return { uri: imagePath };
            return { uri: `${IMAGE_BASE_URL}${imagePath}` };
        }
        return FALLBACK_IMAGE;
    };


    const renderSearchItem = ({ item, index }: { item: ProductItem; index: number }) => (
        <TouchableOpacity
            style={{
                width: '48%',
                marginBottom: 16,
                marginHorizontal: '1%',
                backgroundColor: colors.card,
                borderRadius: 12,
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
                elevation: 3,
            }}
            onPress={() => navigation.navigate('ProductDetails', { sno: item.SNO })}
        >
            <View style={{ padding: 12 }}>
                {getImageUrl(item.ImagePath) ? (
                    <Image
                        source={getImageUrl(item.ImagePath)}
                        defaultSource={FALLBACK_IMAGE} // iOS only
                        onError={(e) => e.currentTarget.setNativeProps({ src: [FALLBACK_IMAGE] })}
                        style={{
                            width: '100%',
                            height: 160,
                            borderRadius: 8,
                            resizeMode: 'cover',
                            marginBottom: 8,
                        }}
                    />

                ) : (
                    <View
                        style={{
                            width: '100%',
                            height: 160,
                            borderRadius: 8,
                            backgroundColor: colors.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ ...FONTS.fontRegular, fontSize: 12, color: colors.text, opacity: 0.7 }}>
                            No Image
                        </Text>
                    </View>
                )}

                <Text
                    style={{
                        ...FONTS.fontMedium,
                        fontSize: 13,
                        color: colors.title,
                        lineHeight: 16,
                        marginBottom: 4,
                    }}
                    numberOfLines={2}
                >
                    {item.SUBITEMNAME}
                </Text>

                <Text
                    style={{
                        ...FONTS.fontRegular,
                        fontSize: 11,
                        color: colors.text,
                        opacity: 0.8,
                        marginBottom: 4,
                    }}
                    numberOfLines={1}
                >
                    {item.CATNAME}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text
                        style={{
                            ...FONTS.fontSemiBold,
                            fontSize: 14,
                            color: colors.title,
                        }}
                    >
                        ₹{item.GrandTotal}
                    </Text>
                    <Text
                        style={{
                            ...FONTS.fontRegular,
                            fontSize: 10,
                            color: colors.text,
                            opacity: 0.7,
                        }}
                        numberOfLines={1}
                    >
                        {item.MaterialFinish}
                    </Text>
                </View>

                {item.NewArrival && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#FF6B6B',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}
                    >
                        <Text style={{ ...FONTS.fontMedium, fontSize: 8, color: 'white' }}>NEW</Text>
                    </View>
                )}

                {item.Best_Design && (
                    <View
                        style={{
                            position: 'absolute',
                            top: item.NewArrival ? 28 : 8,
                            right: 8,
                            backgroundColor: '#4ECDC4',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}
                    >
                        <Text style={{ ...FONTS.fontMedium, fontSize: 8, color: 'white' }}>BEST</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary || '#C37B5F'} />
                <Text style={{ ...FONTS.fontRegular, fontSize: 12, color: colors.text, marginTop: 8 }}>
                    Loading more products...
                </Text>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Image
                source={IMAGES.search || { uri: 'https://via.placeholder.com/100x100' }}
                style={{ width: 80, height: 80, opacity: 0.3, marginBottom: 16 }}
            />
            <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title, marginBottom: 8 }}>
                No results found
            </Text>
            <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text, textAlign: 'center' }}>
                Try adjusting your search or browse our categories
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
            {theme.dark ? null : (
                <LinearGradient
                    colors={['#C37B5F', '#F9F5F3']}
                    style={{ width: '100%', height: 230, top: 0, position: 'absolute' }}
                />
            )}
            <View style={[GlobalStyleSheet.container, { flex: 1 }]}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 20 }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            GlobalStyleSheet.background,
                            {
                                height: 48,
                                width: 48,
                                backgroundColor: colors.card,
                                borderRadius: 15,

                            },
                        ]}
                    >
                        <Image
                            style={{ height: 18, width: 18, resizeMode: 'contain', tintColor: colors.text }}
                            source={IMAGES.arrowleft}
                        />
                    </TouchableOpacity>
                    <View style={{ height: 48, flex: 1, backgroundColor: colors.card, borderRadius: 15, flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{ ...FONTS.fontRegular, fontSize: 16, color: colors.text, paddingLeft: 20, flex: 1 }}
                            placeholder='Search jewelry, rings, necklaces...'
                            placeholderTextColor={colors.title}
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchText('')}
                                style={{ paddingRight: 15 }}
                            >
                                <Image
                                    style={{ height: 16, width: 16, tintColor: colors.text, opacity: 0.5 }}
                                    source={IMAGES.close}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Search Results */}
                {searchText.length > 0 && (
                    <View style={{ flex: 1 }}>
                        {/* Results Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title }}>
                                {isSearching ? 'Searching...' : `${totalResults} Results`}
                            </Text>
                            {totalResults > 0 && (
                                <Text style={{ ...FONTS.fontRegular, fontSize: 12, color: colors.text }}>
                                    Page {currentPage}
                                </Text>
                            )}
                        </View>



                        {/* Results List */}
                        {isSearching ? (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <ActivityIndicator size="large" color={colors.primary || '#C37B5F'} />
                                <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text, marginTop: 16 }}>
                                    Searching for "{searchText}"...
                                </Text>
                            </View>
                        ) : searchResults.length > 0 ? (
                            <FlatList
                                data={searchResults}
                                renderItem={renderSearchItem}
                                keyExtractor={(item) => item.TAGKEY}
                                numColumns={2}
                                showsVerticalScrollIndicator={false}
                                onEndReached={loadMoreResults}
                                onEndReachedThreshold={0.3}
                                ListFooterComponent={renderFooter}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        ) : (
                            renderEmptyState()
                        )}
                    </View>
                )}

                {/* Default Content (Categories and History) */}
                {searchText.length === 0 && (
                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                        {/* Search History */}
                        {show.length > 0 && (
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>
                                        Recent Searches
                                    </Text>
                                    <TouchableOpacity activeOpacity={0.7} onPress={removeItem}>
                                        <Text style={{ ...FONTS.fontMedium, fontSize: 12, color: colors.primary || '#C37B5F' }}>
                                            Clear All
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View>
                                    {show.map((data, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => handleSearchHistoryPress(data.title)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 12,
                                                paddingHorizontal: 4,
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                <Image
                                                    source={IMAGES.search}
                                                    style={{ width: 16, height: 16, tintColor: colors.text, opacity: 0.5, marginRight: 12 }}
                                                />
                                                <Text style={{ ...FONTS.fontRegular, fontSize: 15, color: colors.title, flex: 1 }}>
                                                    {data.title}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => removeItem2(index)}
                                                style={{ padding: 4 }}
                                            >
                                                <Image
                                                    style={{ height: 16, width: 16, resizeMode: 'contain', opacity: 0.5, tintColor: colors.title }}
                                                    source={IMAGES.close}
                                                />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

export default Search;