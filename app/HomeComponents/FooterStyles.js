import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 32,
  },
  
  logo: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 20,
  },
  
  textContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontWeight: '400',
  },
  
  powered: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  
  brand: {
    color: '#0d6efd',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default styles;