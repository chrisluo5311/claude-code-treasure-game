import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { signIn, signUp, setToken, User } from '../lib/api';
import keyImg from '../assets/key.png';

export type AuthMode = 'signin' | 'signup';

interface AuthDialogProps {
  open: boolean;
  mode: AuthMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthMode) => void;
  onSignedIn: (user: User) => void;
}

export default function AuthDialog({
  open,
  mode,
  onOpenChange,
  onModeChange,
  onSignedIn,
}: AuthDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Start each visit to the dialog with a clean form
  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setError('');
    }
  }, [open]);

  const switchMode = () => {
    setError('');
    onModeChange(mode === 'signin' ? 'signup' : 'signin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const action = mode === 'signin' ? signIn : signUp;
      const { token, user } = await action(username.trim(), password);
      setToken(token);
      onSignedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-amber-200 p-8">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-300 ring-1 ring-amber-300/60 shadow-sm">
            <img src={keyImg} alt="" className="size-8 object-contain drop-shadow" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-amber-950">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === 'signin'
              ? 'Sign in to continue your treasure hunt.'
              : 'Join the hunt and keep your scores forever.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-username" className="text-amber-950">
              Username
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="pirate_pete"
                autoComplete="username"
                className="h-11 pl-10 text-base"
                required
              />
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground">
                3–20 characters — letters, numbers, underscore.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-password" className="text-amber-950">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="h-11 px-10 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full bg-amber-600 text-base text-white hover:bg-amber-700"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-amber-700 underline-offset-4 hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
