import { useState, useEffect, useRef } from "react";
import { Leaf, Lock, Mail, Shield, Eye, EyeOff, Loader2, Smartphone, Copy, Check } from "lucide-react";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const { login, verifyTotp, setupTotp, requiresTwoFactor, requiresTotpSetup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"login" | "totp" | "totp-setup">("login");
  const [totpSetupData, setTotpSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const totpSetupInitiated = useRef(false);

  useEffect(() => {
    if (requiresTotpSetup && step === "login" && !totpSetupInitiated.current) {
      totpSetupInitiated.current = true;
      initTotpSetup();
    }
  }, [requiresTotpSetup, step]);

  useEffect(() => {
    if (requiresTwoFactor && step === "login") {
      setStep("totp");
    }
  }, [requiresTwoFactor, step]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.requiresTotpSetup) {
        await initTotpSetup();
      } else if (result.requiresTwoFactor) {
        setStep("totp");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const initTotpSetup = async () => {
    try {
      const data = await setupTotp();
      setTotpSetupData(data);
      setStep("totp-setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize 2FA setup");
    }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await verifyTotp(totpCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    if (totpSetupData?.secret) {
      await navigator.clipboard.writeText(totpSetupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/auth-bg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-background via-background/95 to-background/50" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-wide">
            ESL <span className="text-primary font-light">Intelligence</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Environmental & Social Lending Platform
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-lg">
          {step === "login" && !requiresTwoFactor && !requiresTotpSetup && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      placeholder="analyst@eslplatform.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "totp-setup" && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Set Up Two-Factor Authentication</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Two-factor authentication is required. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the verification code.
              </p>

              {totpSetupData && (
                <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={totpSetupData.qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                  </div>

                  <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-lg p-3">
                    <code className="text-xs font-mono text-foreground flex-1 break-all">
                      {totpSetupData.secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy secret"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <form onSubmit={handleTotp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-lg text-center text-xl font-mono text-foreground tracking-[0.5em] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                        autoComplete="one-time-code"
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || totpCode.length !== 6}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                        </>
                      ) : (
                        "Activate 2FA & Continue"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {!totpSetupData && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </>
          )}

          {step === "totp" && requiresTwoFactor && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Enter the 6-digit code from your authenticator app.
              </p>

              <form onSubmit={handleTotp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-lg text-center text-xl font-mono text-foreground tracking-[0.5em] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("login");
                    setTotpCode("");
                    setError("");
                  }}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to login
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Secure access for authorized personnel only
        </p>
      </div>
    </div>
  );
}
