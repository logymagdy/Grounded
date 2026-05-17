import { StyleSheet } from 'react-native'

export const appStyles = StyleSheet.create({
  // ─── Auth & Layout ──────────────────────────────────────────
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 480,
    height: 180,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 21,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 30,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  signInButton: {
    backgroundColor: '#435d81',
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonTextWhite: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ─── Account / Profile ──────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '600',
    color: '#AAAAAA',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#010a0d',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Product Feed ───────────────────────────────────────────
  productCard: {
    width: '48.5%',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#EEEEEE',
  },
  productInfo: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // ─── Functional Elements (Cart/Wishlist/Stock) ──────────────
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#476774',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})