import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Lock, User as UserIcon, Mail, Sparkles, Bot, Swords, EyeOff, CircuitBoard, AlertCircle } from 'lucide-react';
import { cyberAudio } from '../lib/cyberFx';

interface AuthModalProps {
  onLoginSuccess: (user: any, token: string) => void;
  onDemoLogin: () => Promise<void>;
  onLogin: (identifier: string, pass: string) => Promise<void>;
  onRegister: (username: string, email: string, pass: string, avatar: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onDemoLogin,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('cyber-runner');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(identifier, password);
      } else {
        await onRegister(username, email, password, selectedAvatar);
      }
      cyberAudio.playCreditsGained();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication directive failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await onDemoLogin();
      cyberAudio.playCreditsGained();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo neural link connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0a12] cyber-grid relative overflow-hidden">
      {/* Background neon ambient glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#ff007f]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-[#0f111e]/95 border-2 border-cyan-500/40 p-6 sm:p-8 glow-cyan shadow-2xl relative z-10 backdrop-blur-xl"
      >
        {/* Terminal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/40 glow-cyan mb-3">
            <Terminal className="w-7 h-7 text-[#00f2fe]" />
          </div>
          <h1 className="font-cyber font-black text-2xl text-slate-100 tracking-wider">
            <span className="text-[#00f2fe] text-glow-cyan">LIFE</span> RPG
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            // NEURAL UPLINK SECURITY GATEWAY
          </p>
        </div>

        {/* Demo Netrunner 1-Click Access Button */}
        <div className="mb-6">
          <button
            id="demo-login-btn"
            type="button"
            disabled={isLoading}
            onClick={handleDemoClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff007f] to-[#d946ef] hover:from-[#ff007f]/90 hover:to-[#d946ef]/90 text-white font-mono font-bold text-xs glow-magenta transition-all flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>INSTANT TEST ACCESS (DEMO NETRUNNER)</span>
          </button>
          <div className="text-center text-[10px] font-mono text-slate-500 mt-1.5">
            Instant 1-click test operative with seeded quests, XP & credits
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] font-mono uppercase">
            <span className="bg-[#0f111e] px-3 text-slate-500">Or Authenticate</span>
          </div>
        </div>

        {/* Login / Register Toggle Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Operative
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {mode === 'login' ? (
            <div>
              <label className="block uppercase text-slate-400 font-bold mb-1">
                Codename or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  placeholder="e.g. Neo_Cipher or user@domain.com"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block uppercase text-slate-400 font-bold mb-1">
                  Operative Codename
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-username"
                    type="text"
                    required
                    placeholder="Cyber operative handle"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-slate-400 font-bold mb-1">
                  Secure Comlink Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    placeholder="agent@netrunner.grid"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block uppercase text-slate-400 font-bold mb-1.5">
                  Initial Neural Shell (Avatar)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cyber-runner', label: 'Runner', icon: <Bot className="w-4 h-4" /> },
                    { id: 'neon-samurai', label: 'Samurai', icon: <Swords className="w-4 h-4" /> },
                    { id: 'shadow-operative', label: 'Stealth', icon: <EyeOff className="w-4 h-4" /> },
                    { id: 'ai-android', label: 'Synth', icon: <CircuitBoard className="w-4 h-4" /> },
                  ].map(av => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                        selectedAvatar === av.id
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold glow-cyan'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {av.icon}
                      <span className="text-[10px]">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block uppercase text-slate-400 font-bold mb-1">
              Terminal Passphrase (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#00f2fe]/90 hover:to-[#0284c7]/90 text-slate-950 font-bold text-xs glow-cyan transition-all shadow-lg active:scale-98 disabled:opacity-50"
          >
            {isLoading
              ? 'Verifying Biometrics...'
              : mode === 'login'
              ? 'INITIALIZE TERMINAL LINK'
              : 'COMMISSION OPERATIVE RECORD'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
