import SSOButtons from "@/components/SSOButtons"
import { colors } from "@/constants/theme"
import { useSignUp } from "@clerk/clerk-expo"
import { Link, useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const INPUT_STYLE = {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 15,
  fontSize: 15,
  fontFamily: "sans-medium",
  color: colors.primary
} as const

type FormErrors = {
  email?: string
  password?: string
  code?: string
  general?: string
}

function Hero() {
  return (
    <View className="items-center justify-center py-10">
      <View className="flex-row items-center gap-3.5">
        <View className="size-14 rounded-2xl bg-white/20 items-center justify-center">
          <Text className="text-[26px] font-sans-extrabold text-white">R</Text>
        </View>
        <View>
          <Text className="text-[30px] font-sans-extrabold text-white leading-[34px]">
            Recurrly
          </Text>
          <Text className="text-[10px] font-sans-semibold text-white/65 tracking-[2.5px] uppercase">
            Smart Billing
          </Text>
        </View>
      </View>
    </View>
  )
}

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [pendingVerification, setPendingVerification] = useState(false)

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!email) e.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email"
    if (!password) e.password = "Password is required"
    else if (password.length < 8)
      e.password = "Password must be at least 8 characters"
    return e
  }

  async function handleSignUp() {
    if (!isLoaded) return
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
    } catch (err: any) {
      setErrors({
        general:
          err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Something went wrong"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!isLoaded) return
    if (!code) {
      setErrors({ code: "Verification code is required" })
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.replace("/(tabs)")
      }
    } catch (err: any) {
      setErrors({
        code:
          err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Invalid code"
      })
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-accent" style={{ paddingTop: insets.top }}>
        <Hero />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 bg-background rounded-tl-[36px] rounded-tr-[36px]"
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop: 36,
              paddingBottom: insets.bottom + 32
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-[28px] font-sans-extrabold text-primary mb-1.5">
              Check your email
            </Text>
            <Text className="text-[15px] font-sans-medium text-muted-foreground mb-7">
              We sent a 6-digit code to {email}
            </Text>

            <View className="gap-1.5 mb-6">
              <Text className="text-[13px] font-sans-semibold text-primary">
                Verification Code
              </Text>
              <TextInput
                style={[INPUT_STYLE, { letterSpacing: 8, fontSize: 20, textAlign: "center" }, errors.code ? { borderColor: colors.destructive } : {}]}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor="rgba(8,17,38,0.25)"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              {errors.code && (
                <Text className="text-xs font-sans-medium text-destructive">
                  {errors.code}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading}
              className={loading ? "bg-accent rounded-2xl py-4 items-center mb-3.5 opacity-50" : "bg-accent rounded-2xl py-4 items-center mb-3.5"}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-sans-bold text-white">
                  Verify Email
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                signUp?.prepareEmailAddressVerification({
                  strategy: "email_code"
                })
              }
              className="items-center py-3"
            >
              <Text className="text-sm font-sans-semibold text-accent">
                Resend code
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-accent" style={{ paddingTop: insets.top }}>
      <Hero />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 bg-background rounded-tl-[36px] rounded-tr-[36px]"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 36,
            paddingBottom: insets.bottom + 32
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[28px] font-sans-extrabold text-primary mb-1.5">
            Create your account
          </Text>
          <Text className="text-[15px] font-sans-medium text-muted-foreground mb-7">
            Track every subscription in one place.
          </Text>

          {errors.general && (
            <View className="bg-destructive/10 rounded-xl px-4 py-3 mb-4">
              <Text className="text-[13px] font-sans-medium text-destructive">
                {errors.general}
              </Text>
            </View>
          )}

          <View className="gap-1.5 mb-3.5">
            <Text className="text-[13px] font-sans-semibold text-primary">
              Email
            </Text>
            <TextInput
              style={[INPUT_STYLE, errors.email ? { borderColor: colors.destructive } : {}]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="rgba(8,17,38,0.35)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text className="text-xs font-sans-medium text-destructive">
                {errors.email}
              </Text>
            )}
          </View>

          <View className="gap-1.5 mb-6">
            <Text className="text-[13px] font-sans-semibold text-primary">
              Password
            </Text>
            <TextInput
              style={[INPUT_STYLE, errors.password ? { borderColor: colors.destructive } : {}]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor="rgba(8,17,38,0.35)"
              secureTextEntry
            />
            {errors.password && (
              <Text className="text-xs font-sans-medium text-destructive">
                {errors.password}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className={loading ? "bg-accent rounded-2xl py-4 items-center mb-5 opacity-50" : "bg-accent rounded-2xl py-4 items-center mb-5"}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-sans-bold text-white">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center gap-3 mb-5">
            <View className="flex-1 h-px bg-black/10" />
            <Text className="text-[11px] font-sans-semibold text-muted-foreground uppercase tracking-widest">
              or
            </Text>
            <View className="flex-1 h-px bg-black/10" />
          </View>

          <SSOButtons />

          <View className="flex-row justify-center items-center gap-1 mt-7">
            <Text className="text-sm font-sans-medium text-muted-foreground">
              Already have an account?
            </Text>
            <Link href="/(auth)/sign-in">
              <Text className="text-sm font-sans-bold text-accent">
                Sign in
              </Text>
            </Link>
          </View>

          <View nativeID="clerk-captcha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
