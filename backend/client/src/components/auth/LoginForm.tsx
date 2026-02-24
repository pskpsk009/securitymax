
import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { deriveDisplayName, resolveRole } from "@/lib/auth-helpers";

interface LoginFormProps {
  onLogin: (user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "coordinator" | "advisor";
  }) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mapFirebaseError = (error: unknown): string => {
    if (typeof error === "object" && error !== null && "code" in error) {
      const { code } = error as FirebaseError;
      switch (code) {
        case AuthErrorCodes.INVALID_PASSWORD:
        case AuthErrorCodes.INVALID_EMAIL:
        case AuthErrorCodes.USER_DELETED:
        case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
          return "Invalid email or password. Please try again.";
        case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
          return "Too many attempts. Please wait a moment before trying again.";
        default:
          return "Failed to sign in. Please check your credentials and try again.";
      }
    }

    return "Unexpected error while trying to sign in.";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await credential.user.getIdTokenResult(true);

  localStorage.setItem("firebaseAuthToken", idTokenResult.token);
  localStorage.setItem("authToken", idTokenResult.token);

      const normalizedRole = resolveRole(idTokenResult.claims.role);
      const resolvedEmail = credential.user.email ?? email;

      onLogin({
        id: credential.user.uid,
        name: deriveDisplayName(credential.user.email, credential.user.displayName),
        email: resolvedEmail,
        role: normalizedRole,
      });
    } catch (error) {
      setErrorMessage(mapFirebaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GraduationCap className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Student Project Archive
          </CardTitle>
          <CardDescription>
            Sign in to access your academic projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
