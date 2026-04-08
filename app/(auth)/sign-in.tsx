import SSOButtons from "@/components/SSOButtons"
import { colors } from "@/constants/theme"
import { useSignIn } from "@clerk/clerk-expo"
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
  general?: string
}

/**
 * Render the sign-in screen with email and password inputs, client-side validation, and Clerk authentication.
 *
 * Attempts to authenticate using Clerk with the entered credentials; on successful sign-in it activates the created session and navigates to "/(tabs)". Shows field-level and general error messages, tracks touched state for validation, and disables submission while loading or when inputs are invalid.
 *
 * @returns The sign-in screen React element.
 */
export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Touched states for validation
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Client-side validation
  const emailValid =
    email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length > 0
  const formValid = email.length > 0 && password.length > 0 && emailValid

  /**
   * Validate the current email and password values and produce field-specific error messages.
   *
   * @returns An object with optional `email` and `password` properties containing validation messages; returns an empty object when both fields are valid.
   */
  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!email) e.email = "Email is required"
    else if (!emailValid) e.email = "Please enter a valid email address"
    if (!password) e.password = "Password is required"
    return e
  }

  /**
   * Validate input, attempt email/password sign-in with Clerk, and navigate on success.
   *
   * Validates the current email and password, updates field error state and touched flags when validation fails,
   * and when valid attempts to create a sign-in session via Clerk. On successful completion it activates the created session
   * and replaces navigation to the app root. Server-side/auth errors are mapped into field-specific (`email`, `password`)
   * or a general `general` error and stored in state. The `loading` state is set for the duration of the request and
   * always cleared when the operation finishes.
   */
  async function handleSignIn() {
    if (!isLoaded || !formValid) return
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      setEmailTouched(true)
      setPasswordTouched(true)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.replace("/(tabs)")
      }
    } catch (err: any) {
      const newErrors: FormErrors = {}
      if (err?.errors) {
        err.errors.forEach((error: any) => {
          const field = error.meta?.paramName
          if (field === "identifier") {
            newErrors.email = error.longMessage || error.message
          } else if (field === "password") {
            newErrors.password = error.longMessage || error.message
          } else {
            newErrors.general = error.longMessage || error.message
          }
        })
      } else {
        newErrors.general = "Invalid email or password"
      }
      setErrors(newErrors)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-accent" style={{ paddingTop: insets.top }}>
      {/* Hero */}
      <View className="items-center justify-center py-10 gap-1">
        <View className="flex-row items-center gap-3.5">
          <View className="size-14 rounded-2xl bg-white/20 items-center justify-center">
            <Text className="text-[26px] font-sans-extrabold text-white">
              R
            </Text>
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

      {/* Sheet */}
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
            Welcome back
          </Text>
          <Text className="text-[15px] font-sans-medium text-muted-foreground mb-7">
            Sign in to continue managing your subscriptions
          </Text>

          {errors.general && (
            <View className="bg-destructive/10 rounded-xl px-4 py-3 mb-4">
              <Text className="text-[13px] font-sans-medium text-destructive">
                {errors.general}
              </Text>
            </View>
          )}

          {/* Email */}
          <View className="gap-1.5 mb-3.5">
            <Text className="text-[13px] font-sans-semibold text-primary">
              Email
            </Text>
            <TextInput
              style={[INPUT_STYLE, (errors.email || (emailTouched && !emailValid)) ? { borderColor: colors.destructive } : {}]}
              value={email}
              onChangeText={setEmail}
              onBlur={() => setEmailTouched(true)}
              placeholder="Enter your email"
              placeholderTextColor="rgba(8,17,38,0.35)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailTouched && !emailValid && !errors.email && (
              <Text className="text-xs font-sans-medium text-destructive">
                Please enter a valid email address
              </Text>
            )}
            {errors.email && (
              <Text className="text-xs font-sans-medium text-destructive">
                {errors.email}
              </Text>
            )}
          </View>

          {/* Password */}
          <View className="gap-1.5 mb-6">
            <Text className="text-[13px] font-sans-semibold text-primary">
              Password
            </Text>
            <TextInput
              style={[INPUT_STYLE, (errors.password || (passwordTouched && !passwordValid)) ? { borderColor: colors.destructive } : {}]}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setPasswordTouched(true)}
              placeholder="Enter your password"
              placeholderTextColor="rgba(8,17,38,0.35)"
              secureTextEntry
            />
            {passwordTouched && !passwordValid && !errors.password && (
              <Text className="text-xs font-sans-medium text-destructive">
                Password is required
              </Text>
            )}
            {errors.password && (
              <Text className="text-xs font-sans-medium text-destructive">
                {errors.password}
              </Text>
            )}
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading || !formValid}
            className={
              loading || !formValid
                ? "bg-accent rounded-2xl py-4 items-center mb-5 opacity-50"
                : "bg-accent rounded-2xl py-4 items-center mb-5"
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-sans-bold text-white">
                Sign in
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className="flex-1 h-px bg-black/10" />
            <Text className="text-[11px] font-sans-semibold text-muted-foreground uppercase tracking-widest">
              or
            </Text>
            <View className="flex-1 h-px bg-black/10" />
          </View>

          <SSOButtons />

          {/* Link */}
          <View className="flex-row justify-center items-center gap-1 mt-7">
            <Text className="text-sm font-sans-medium text-muted-foreground">
              New to Recurrly?
            </Text>
            <Link href="/(auth)/sign-up">
              <Text className="text-sm font-sans-bold text-accent">
                Create an account
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
