import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StyleSheet, Alert } from 'react-native';
import { FONTS, COLORS } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import { IMAGES } from '../../constants/Images';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, Ionicons } from '@expo/vector-icons';
import { addProductToWishList, removeProductFromWishList } from '../../redux/reducer/wishListReducer';
import { addItemToCart, removeItemFromCart } from '../../redux/reducer/cartReducer';

type Props = {
    id: string;
    title: string;
    price: string;
    image?: any;
    discount?: string;
    review?: string;
    closebtn?: boolean;
    Cardstyle4?: boolean;
    removelikebtn?: boolean;
    wishlist?: boolean;
    card3?: boolean;
    likebtn?: boolean;
    onPress?: () => void;
    wishlistActive?: boolean;
    cartActive?: boolean;
    product: any;
    cartItemId?: string; // Add cart item ID for removal
};

const CardStyle1 = ({
    id,
    image,
    title,
    price,
    discount,
    review,
    onPress,
    closebtn,
    removelikebtn,
    likebtn,
    card3,
    Cardstyle4,
    wishlistActive = false,
    cartActive = false,
    product,
    cartItemId,
}: Props) => {
    const theme = useTheme();
    const { colors } = theme;
    const dispatch = useDispatch();

    const FALLBACK_IMAGE = IMAGES.item12
    const [imageSrc, setImageSrc] = useState(
        typeof image === 'string' ? { uri: image } : image || FALLBACK_IMAGE
    );

    const handleWishlistPress = () => {
        if (wishlistActive) {
            dispatch(removeProductFromWishList(id));
            // Alert.alert('Removed', 'Item removed from wishlist');
        } else {
            dispatch(addProductToWishList(product));
            // Alert.alert('Added', 'Item added to wishlist');
        }
    };

    const handleCartPress = () => {
        if (cartActive && cartItemId) {
            // Show confirmation dialog for removal
            Alert.alert(
                'Remove Item',
                'Are you sure you want to remove this item from your cart?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                            dispatch(removeItemFromCart(cartItemId));
                            Alert.alert('Removed', 'Item removed from cart');
                        },
                    },
                ]
            );
        } else {
            // Add to cart logic
            dispatch(addItemToCart({
                itemTagSno: id,
                imagePath: typeof image === 'string' ? image : '',
                productData: product // Include full product data
            }));
            Alert.alert('Added', 'Item added to cart');
        }
    };

    return (
        <View style={[
            styles.cardContainer,
            Platform.OS === 'ios' && {
                backgroundColor: card3 ? null : colors.card,
                borderRadius: 20,
            },
            { shadowColor: 'rgba(195, 123, 95, 0.25)' },
        ]}>
            <TouchableOpacity
                activeOpacity={0.9}
                style={[
                    styles.cardTouchable,
                    {
                        backgroundColor: card3 ? null : colors.card,
                        alignItems: card3 ? 'center' : null,
                    }
                ]}
                onPress={onPress}
            >
                {/* Image Container */}
                <View style={[
                    styles.imageContainer,
                    {
                        backgroundColor: card3 ? colors.card : null,
                        width: card3 ? 127 : null,
                        height: card3 ? 127 : Cardstyle4 ? null : 170,
                        borderRadius: card3 ? 40 : null,
                    }
                ]}>
                    <Image
                        style={styles.productImage}
                        source={imageSrc}
                        onError={() => setImageSrc(FALLBACK_IMAGE)}
                    />
                </View>

                {/* Product Info */}
                <View style={[
                    styles.infoContainer,
                    {
                        backgroundColor: card3 ? null : colors.card,
                        alignItems: card3 ? 'center' : null,
                    }
                ]}>
                    <Text
                        style={[
                            styles.titleText,
                            {
                                fontSize: card3 ? 16 : 18,
                                color: colors.title,
                                textAlign: card3 ? 'center' : 'left',
                                paddingRight: card3 ? 0 : 20,
                            }
                        ]}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>

                    {review && (
                        <Text style={styles.reviewText}>
                            {review}
                        </Text>
                    )}

                    <View style={[
                        styles.priceContainer,
                        Cardstyle4 && styles.priceContainerCard4
                    ]}>
                        <Text
                            style={[
                                styles.priceText,
                                { fontSize: card3 ? 16 : 18, color: colors.title }
                            ]}
                        >
                            {price}
                        </Text>

                        {discount && (
                            <Text
                                style={[
                                    styles.discountText,
                                    {
                                        color: theme.dark
                                            ? 'rgba(255,255,255, .4)'
                                            : 'rgba(0, 0, 0, 0.40)',
                                    }
                                ]}
                            >
                                {discount}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Wishlist Button */}
                {!removelikebtn && !likebtn && (
                    <View style={styles.wishlistButtonContainer}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleWishlistPress}
                        >
                            <Ionicons
                                name={wishlistActive ? "heart" : "heart-outline"}
                                size={20}
                                color={wishlistActive ? COLORS.danger : colors.title}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Cart Button */}
                {closebtn && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.cartButtonContainer}
                        onPress={handleCartPress}
                    >
                        <View
                            style={[
                                styles.cartButton,
                                {
                                    backgroundColor: cartActive ? COLORS.danger : COLORS.primary,
                                }
                            ]}
                        >
                            <Feather
                                name={cartActive ? "trash-2" : "shopping-cart"}
                                size={18}
                                color={colors.card}
                            />
                        </View>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        shadowOffset: { width: 2, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 15,
    },
    cardTouchable: {
        borderRadius: 20,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    productImage: {
        height: undefined,
        width: '100%',
        aspectRatio: 1 / 1,
        borderRadius: 10,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        resizeMode: 'contain',
    },
    infoContainer: {
        padding: 10,
        paddingTop: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    titleText: {
        ...FONTS.Marcellus,
        marginBottom: 4,
    },
    reviewText: {
        ...FONTS.fontXs,
        color: COLORS.gray,
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 5,
    },
    priceContainerCard4: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'column',
    },
    priceText: {
        ...FONTS.Marcellus,
    },
    discountText: {
        ...FONTS.Marcellus,
        fontSize: 14,
        textDecorationLine: 'line-through',
        marginRight: 5,
    },
    wishlistButtonContainer: {
        position: 'absolute',
        right: 5,
        top: 5,
    },
    iconButton: {
        height: 38,
        width: 38,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    cartButtonContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    cartButton: {
        height: 35,
        width: 35,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 20,
    },
});

export default CardStyle1;