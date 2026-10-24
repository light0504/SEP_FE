import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function PasswordLoginScreen({ onBack, onSubmit }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('Nhập tài khoản và mật khẩu.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(username, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹  Quay lại</Text></TouchableOpacity>
        <View style={styles.brandMark}><Text style={styles.brandLetter}>F</Text></View>
        <Text style={styles.title}>Đăng nhập tài khoản</Text>

        <Text style={styles.label}>TÊN ĐĂNG NHẬP HOẶC EMAIL</Text>
        <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="username / email" placeholderTextColor="#929BA4" style={styles.input} returnKeyType="next" />

        <Text style={styles.label}>MẬT KHẨU</Text>
        <View style={styles.passwordWrap}>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} placeholder="Nhập mật khẩu" placeholderTextColor="#929BA4" style={styles.passwordInput} returnKeyType="done" onSubmitEditing={submit} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setPasswordVisible((visible) => !visible)} style={styles.visibilityButton}><Text style={styles.visibilityText}>{passwordVisible ? 'Ẩn' : 'Hiện'}</Text></TouchableOpacity>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <TouchableOpacity accessibilityRole="button" disabled={submitting} onPress={submit} style={[styles.submitButton, submitting && styles.disabled]}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Đăng nhập</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F4F8' }, content: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 16, paddingBottom: 28, justifyContent: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 9, marginBottom: 25 }, backText: { color: '#41586A', fontSize: 13, fontWeight: '700' },
  brandMark: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#19324A', alignItems: 'center', justifyContent: 'center', marginBottom: 19 }, brandLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  title: { color: '#1A2B3C', fontSize: 25, fontWeight: '800', marginBottom: 20 },
  label: { color: '#566573', fontSize: 10, fontWeight: '800', marginBottom: 8, marginTop: 13, letterSpacing: .3 }, input: { minHeight: 50, paddingHorizontal: 13, borderWidth: 1, borderColor: '#DDE3E8', borderRadius: 12, backgroundColor: '#fff', color: '#263A4D', fontSize: 13 },
  passwordWrap: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDE3E8', borderRadius: 12, backgroundColor: '#fff' }, passwordInput: { flex: 1, paddingHorizontal: 13, paddingVertical: 12, color: '#263A4D', fontSize: 13 }, visibilityButton: { paddingHorizontal: 13, paddingVertical: 10 }, visibilityText: { color: '#337B62', fontSize: 11, fontWeight: '700' },
  error: { color: '#B63F45', fontSize: 11, lineHeight: 16, marginTop: 12 }, submitButton: { minHeight: 50, borderRadius: 12, backgroundColor: '#19324A', justifyContent: 'center', alignItems: 'center', marginTop: 21 }, submitText: { color: '#fff', fontSize: 13, fontWeight: '800' }, disabled: { opacity: .6 },
});
