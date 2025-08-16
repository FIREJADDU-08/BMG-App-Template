import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import CardStyle1 from './Card/CardStyle1';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addTowishList } from '../redux/reducer/wishListReducer';

interface ProductItem {
  id: string | number;
  image?: string;
  title?: string;
  price?: string;
  discount?: string;
  offer?: string;
  // more fields as needed
}

const ImageSwper2 = ({ data }: { data: ProductItem[] }) => {
  const [newData] = useState([{ key: 'space-left' }, ...data, { key: 'space-right' }]);

  const { width } = useWindowDimensions();
  const SIZE = width * 0.6;
  const SPACER = (width - SIZE) / 2;
  const x = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const addItemToWishList = (item: ProductItem) => {
    dispatch(addTowishList(item));
  };

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      scrollEventThrottle={16}
      snapToInterval={SIZE}
      decelerationRate="fast"
      onScroll={scrollHandler}
    >
      {newData.map((item, index) => {
        if (!item.image) {
          return <View key={`spacer-${index}`} style={{ width: SPACER }} />;
        }

        const style = useAnimatedStyle(() => {
          const scale = interpolate(
            x.value,
            [(index - 2) * SIZE, (index - 1) * SIZE, index * SIZE],
            [0.8, 1, 0.8]
          );
          return {
            transform: [{ scale }],
          };
        });

        return (
          <View key={item.id} style={{ width: SIZE, alignItems: 'center' }}>
            <Animated.View style={[style, { overflow: 'hidden' }]}>
              <CardStyle1
                id={item.id}
                image={item.image!}
                title={item.title || ''}
                price={item.price || ''}
                discount={item.discount || ''}
                offer={item.offer || ''}
                onPress={() => navigation.navigate('ProductDetails', { sno: item.id })}
                Cardstyle4
                onPress1={() => addItemToWishList(item)}
              />
            </Animated.View>
          </View>
        );
      })}
    </Animated.ScrollView>
  );
};

export default ImageSwper2;
