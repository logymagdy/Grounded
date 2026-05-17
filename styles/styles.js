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

  // ─── Account / Profile & Common Container ──────────────────
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

  // ─── App Global Header ─────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // ─── Category Filter Chips ──────────────────────────────────
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#1A1A1A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // ─── Product Feed Grid ──────────────────────────────────────
  productCard: {
    width: '48.5%',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#EEEEEE',
  },
  productInfo: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  addToCartBtn: {
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── Functional Badge Elements ──────────────────────────────
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    top: -2,
    right: -2,
    backgroundColor: '#476774',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // ─── Fallback Loading Wrapper ──────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
})