import { StyleSheet } from 'react-native'

export const appStyles = StyleSheet.create({

  // ─── Auth Screen ─────────────────────────────────────────────────────────
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

  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },

  forgotPasswordText: {
    color: '#435d81',
    fontSize: 13,
    fontWeight: '600',
  },

  signInButton: {
    backgroundColor: '#435d81',
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  buttonDisabled: {
    backgroundColor: '#C4B5FD',
  },

  buttonTextWhite: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },

  orText: {
    marginHorizontal: 12,
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
  },

  socialButton: {
    flexDirection: 'row',
    height: 55,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  socialButtonText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },

  footerText: {
    color: '#AAAAAA',
    fontSize: 14,
  },

  signUpLink: {
    color: '#476774',
    fontWeight: '700',
    fontSize: 14,
  },

  // ─── Account Screen ──────────────────────────────────────────────────────
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

  mt20: {
    marginTop: 20,
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

  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#AAAAAA',
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
    letterSpacing: 0.4,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 16,
  },

  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1A1A1A',
  },

  screenSubtitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#AAAAAA',
    fontWeight: '600',
    marginTop: 4,
  },

  // ─── Product List Screen ─────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  filterChipText: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '600',
    color: '#888888',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  productCard: {
    width: '48.5%',
    backgroundColor: '#FAFAFA',
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
  productCategory: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#AAAAAA',
    fontWeight: '600',
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  // ─── Product List Additions ───────────────────────────────────────────────

  // F16 — Realtime Stock Badge
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
    letterSpacing: 0.8,
  },

  // F11 — Wishlist Heart Button
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 5,
  },

  // F5 — Add to Cart Button
  addToCartBtn: {
    marginTop: 8,
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // F5 — Cart Badge on header icon
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
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
})