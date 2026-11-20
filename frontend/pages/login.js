import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  startLoginApi,
  sendOtpApi,
  verifyOtpApi,
} from "../lib/apiEndpoints";
import { isAuthenticated, setToken } from "../lib/auth";
import { requestHandler } from "../lib/requestHandler";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  
  // --- State ---
  const [step, setStep] = useState(1); // 1 = Email/Password, 2 = OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stampVisible, setStampVisible] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (!router.isReady) return;

    if (isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }

    setAuthChecked(true);
  }, [router, router.isReady]);

  // --- Timer Logic for Resend OTP ---
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!authChecked) return null;

  // --- API Calls ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await requestHandler(
      () => startLoginApi(email, password),
      setLoading,
      () => {
        setStep(2);
        setStampVisible(true);
        setTimer(300);
        setCanResend(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      },
      setError,
      "Login"
    );
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    
    if (code.length !== 6) {
      setError("Enter all 6 digits of the OTP.");
      return;
    }

    setLoading(true);
    await requestHandler(
      () => verifyOtpApi(email, code),
      setLoading,
      (data) => {
        if (!data?.access_token) {
          setError("OTP was verified, but no access token was returned.");
          return;
        }

        setToken(data.access_token);
        router.push("/dashboard");
      },
      setError,
      "OTP verification"
    );
  };

  const handleResend = async () => {
    setError("");
    setCanResend(false);
    setLoading(true);
    await requestHandler(
      () => sendOtpApi(email),
      setLoading,
      () => {
        setStampVisible(false);
        setTimeout(() => setStampVisible(true), 50);
        setTimer(300);
      },
      () => setError("We could not resend the OTP."),
      "Resend OTP"
    );
  };

  // --- OTP Input Handlers ---
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep the last digit
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6).split("");
    const newOtp = [...otp];
    pastedData.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    // Focus the next empty input or the last one
    const nextEmpty = newOtp.findIndex((val) => !val);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen font-['IBM_Plex_Sans',sans-serif] text-[#16304f] bg-[#f6f3ec]">
      
      {/* ================= LEFT: BRAND PANEL ================= */}
      <div className="hidden md:flex flex-col justify-between p-14 relative overflow-hidden bg-[#0d1b2f] text-[#f6f3ec]"
           style={{
             backgroundImage: `linear-gradient(180deg, rgba(13,27,47,0.2), #0d1b2f 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 48px)`
           }}>
        
        {/* Logo */}
        <div className="flex items-center gap-4">
          <img src="https://horibacare.in/resources/images/scm-logo.png" alt="Horiba Care logo" className="w-[150px] h-[100px] rounded-md bg-white p-1" />
          <span className="font-['Zilla_Slab',serif] font-semibold text-lg tracking-wide">
            HORIBA &nbsp;Care
          </span>
        </div>

        {/* Copy */}
        <div className="max-w-[420px]">
          <p className="font-['IBM_Plex_Mono',monospace] text-xs tracking-[0.18em] uppercase text-[#c98a3f] mb-4">
            Supply Chain Management
          </p>
          <h1 className="font-['Zilla_Slab',serif] font-bold text-4xl leading-tight mb-5">
            Purchasing&nbsp;Portal
          </h1>
          <p className="text-[15px] leading-relaxed text-[#c3cddc]">
            Access purchase orders, vendor records, and approvals through two-step verification &mdash; your
            password, followed by a one-time OTP send to your official email.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between text-[11px] text-[#6f84a0] border-t border-white/10 pt-4 mt-12">
          <span>&copy; {new Date().getFullYear()} horibacare.in</span>
          <span>Authorised access only</span>
        </div>
      </div>

      {/* ================= RIGHT: FORM PANEL ================= */}
      <div className="flex items-center justify-center p-8 bg-[#f6f3ec]">
        <div className="w-full max-w-[380px]">

          {/* Error Banner */}
          {error && (
            <div className="bg-[#fbeeeb] text-[#ac4638] border border-[#f0d4cd] rounded p-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* STEP 1: Email & Password */}
          {step === 1 && (
            <div>
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[0.16em] uppercase text-[#a86f2c] mb-2 flex items-center gap-2 before:content-[''] before:w-4 before:h-[1px] before:bg-[#a86f2c]">
                Step 01 &middot; Sign in
              </p>
              <h2 className="font-['Zilla_Slab',serif] text-3xl font-semibold text-[#0d1b2f] mb-2">
                Sign in to your account
              </h2>
              <p className="text-sm text-[#5c6b7d] mb-8 leading-relaxed">
                Enter your official email and password. Once verified, we'll send a 6-digit OTP to confirm it's you.
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#16304f] mb-2">Official email address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@horiba.com"
                    className="w-full px-4 py-3 border border-[#d5cfbe] rounded bg-white text-sm text-[#16304f] outline-none focus:border-[#c98a3f] focus:ring-2 focus:ring-[#c98a3f]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16304f] mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-[#d5cfbe] rounded bg-white text-sm text-[#16304f] outline-none focus:border-[#c98a3f] focus:ring-2 focus:ring-[#c98a3f]/20 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 accent-[#16304f]"
                  />
                  <label htmlFor="remember" className="text-xs text-[#5c6b7d] cursor-pointer">Remember me</label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-[#0d1b2f] text-[#f6f3ec] rounded font-semibold text-sm hover:bg-[#16304f] transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : null}
                  {loading ? "Verifying..." : "Continue"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <div>
              <p className="font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[0.16em] uppercase text-[#a86f2c] mb-2 flex items-center gap-2 before:content-[''] before:w-4 before:h-[1px] before:bg-[#a86f2c]">
                Step 02 &middot; Verify
              </p>
              <h2 className="font-['Zilla_Slab',serif] text-3xl font-semibold text-[#0d1b2f] mb-2">
                Enter your OTP
              </h2>
              <p className="text-sm text-[#5c6b7d] mb-6 leading-relaxed">
                We send a 6-digit code to <strong className="text-[#0d1b2f]">{email}</strong>. It expires in 5 minutes.
              </p>

              {/* Stamp */}
              <div className={`flex items-center gap-3 bg-[#f1f7f3] border border-[#cfe3d5] text-[#3f7a5c] rounded p-3 text-sm mb-6 transition-all ${stampVisible ? "opacity-100 transform scale-100" : "opacity-0 transform scale-95"}`}>
                <span className="flex-none w-8 h-8 border-2 border-[#3f7a5c] rounded-full flex items-center justify-center -rotate-6">&#10003;</span>
                <span>OTP send Check your Mail inbox .</span>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#16304f] mb-2">6-digit OTP</label>
                  <div className="flex gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-full aspect-square text-center font-['IBM_Plex_Mono',monospace] text-xl font-semibold text-[#0d1b2f] bg-white border border-[#d5cfbe] rounded outline-none focus:border-[#c98a3f] focus:ring-2 focus:ring-[#c98a3f]/20"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mb-6">
                  <span className="text-[#5c6b7d]">
                    {timer > 0 ? `Resend available in ${formatTime(timer)}` : ""}
                  </span>
                  <button 
                    type="button" 
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className="text-[#a86f2c] font-semibold hover:underline disabled:text-[#5c6b7d] disabled:no-underline disabled:cursor-default"
                  >
                    Resend OTP
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-[#0d1b2f] text-[#f6f3ec] rounded font-semibold text-sm hover:bg-[#16304f] transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : null}
                  {loading ? "Verifying..." : "Verify & sign in"}
                </button>
              </form>

              <div className="text-center mt-4 text-xs text-[#5c6b7d]">
                Wrong account?{" "}
                <button 
                  onClick={() => { setStep(1); setPassword(""); setOtp(["","","","","",""]); }}
                  className="text-[#16304f] font-semibold underline hover:text-[#c98a3f]"
                >
                  Sign in again
                </button>
              </div>
            </div>
          )}

          <p className="text-center mt-8 text-sm">
            <Link href="/reset-password" className="text-[#16304f] hover:text-[#c98a3f] underline">Forgotten Password?</Link>
          </p>

          <p className="text-center text-[11px] text-[#5c6b7d] mt-8">
            &copy; {new Date().getFullYear()} horibacare.in
          </p>
        </div>
      </div>
    </div>
  );
}