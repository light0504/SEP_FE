import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { AppRole } from '../types';

interface Props { onSignIn: (role: AppRole) => void; onPasswordLogin: () => void }

export function LoginScreen({ onSignIn, onPasswordLogin }: Props) {

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.shapeTop} />
        <View pointerEvents="none" style={styles.shapeLeft} />
        <View pointerEvents="none" style={styles.shapeRight} />
        <View pointerEvents="none" style={styles.shapeBottom} />

        <View style={styles.identity}>
          <Image source={require('../assets/logo.png')} style={styles.logoPlaceholder} resizeMode="contain" accessibilityLabel="FPT University logo" />
          <Text style={styles.universityName}>FPT University</Text>
          <Text style={styles.productName}>Fbus</Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Sign In</Text>

          <View style={styles.divider} />

          <TouchableOpacity accessibilityRole="button" onPress={() => onSignIn('student')} style={styles.googleButton}>
            <View style={styles.googleIcon}><Text style={styles.googleG}>G</Text></View>
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" onPress={() => onSignIn('student')} style={styles.feidButton}>
            <View style={styles.feidIcon}><Text style={styles.feidIconText}>FE</Text></View>
            <Text style={styles.feidText}>Sign in with FEID</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => onSignIn('driver')} style={styles.driverDemoButton}>
            <Text style={styles.driverDemoText}>Đăng nhập tài xế · bản demo</Text>
          </TouchableOpacity>
          <View style={styles.accountDivider}><View style={styles.accountDividerLine}/><Text style={styles.accountDividerText}>HOẶC</Text><View style={styles.accountDividerLine}/></View>
          <TouchableOpacity accessibilityRole="button" onPress={onPasswordLogin} style={styles.passwordLoginLink}>
            <Text style={styles.passwordLoginText}>Tài khoản / mật khẩu</Text>
          </TouchableOpacity>
          <Text style={styles.demoNote}>Google / FEID · Demo</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#687487' },
  hero: { flex: 1.2, minHeight: 300, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#687487' },
  shapeTop: { position: 'absolute', width: '125%', height: '82%', top: '-43%', left: '-12%', borderRadius: 220, backgroundColor: '#604C2E', transform: [{ rotate: '-9deg' }] },
  shapeLeft: { position: 'absolute', width: '88%', height: '68%', left: '-54%', top: '26%', borderRadius: 220, backgroundColor: '#798392', transform: [{ rotate: '-12deg' }] },
  shapeRight: { position: 'absolute', width: '64%', height: '76%', right: '-36%', top: '13%', borderRadius: 210, backgroundColor: '#69532D', transform: [{ rotate: '7deg' }] },
  shapeBottom: { position: 'absolute', width: '102%', height: '48%', left: '-27%', bottom: '-31%', borderRadius: 220, backgroundColor: '#768293', transform: [{ rotate: '-11deg' }] },
  identity: { alignItems: 'center', marginTop: 12 },
  logoPlaceholder: { width: 112, height: 112, borderRadius: 24, backgroundColor: colors.white, marginBottom: 29 },
  universityName: { color: colors.white, fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  productName: { color: '#D8DDE3', fontSize: 17, marginTop: 6, fontWeight: '400' },
  sheet: { flex: 0.92, minHeight: 340, maxHeight: 470, backgroundColor: colors.white, borderTopLeftRadius: 34, borderTopRightRadius: 34, overflow: 'hidden' },
  sheetContent: { paddingHorizontal: 28, paddingTop: 30, paddingBottom: 18 },
  title: { color: '#1A2B3C', fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: '#ECEFF1', marginTop: 24, marginBottom: 20 },
  googleButton: { height: 65, borderRadius: 20, borderWidth: 1.5, borderColor: '#D9DDE1', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', backgroundColor: colors.white },
  googleIcon: { width: 62, height: '100%', backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleG: { color: colors.white, fontSize: 23, fontWeight: '800' },
  googleText: { flex: 1, textAlign: 'center', color: '#343A40', fontSize: 15, fontWeight: '700', marginRight: 58 },
  feidButton: { height: 65, borderRadius: 20, backgroundColor: '#F39800', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginTop: 15 },
  feidIcon: { width: 62, height: '100%', backgroundColor: '#D98200', alignItems: 'center', justifyContent: 'center' },
  feidIconText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  feidText: { flex: 1, textAlign: 'center', color: colors.white, fontSize: 15, fontWeight: '700', marginRight: 58 },
  driverDemoButton: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  driverDemoText: { color: '#516577', fontSize: 12, fontWeight: '700' },
  accountDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  accountDividerLine: { height: 1, backgroundColor: '#ECEFF1', flex: 1 },
  accountDividerText: { color: '#A0A8AF', fontSize: 9, fontWeight: '700' },
  passwordLoginLink: { alignItems: 'center', flexWrap: 'wrap', paddingTop: 13, paddingBottom: 4 },
  passwordLoginText: { color: '#1976B9', fontSize: 11, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  demoNote: { textAlign: 'center', color: '#A0A8AF', fontSize: 10, marginTop: 10 },
});
