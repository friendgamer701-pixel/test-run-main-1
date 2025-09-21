import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useAdminRole } from "@/hooks/useAdminRole.tsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CiviLinkLogo from "@/assets/logo.png";

const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { setAsAdmin } = useAdminRole();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Authentication failed. Please check your credentials.");
      }

      const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (isAdmin) {
        login();
        setAsAdmin();
        toast.success("Login Successful", {
          description: "Welcome back, admin!",
        });
        // Navigation is now handled by useEffect
      } else {
        await supabase.auth.signOut();
        throw new Error("You are not authorized to access this page.");
      }
    } catch (error: any) {
      toast.error("Authentication Failed", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="relative w-full max-w-md">
        <div className="absolute top-4 left-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardHeader className="text-center space-y-4 pt-16">
          <div className="flex justify-center">
            <img src={CiviLinkLogo} alt="CiviLink Logo" className="w-20" />
          </div>
          <CardTitle className="text-3xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Please enter your credentials to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@CiviLink.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full gradient-primary hover:shadow-glow transition-smooth transform hover:scale-105" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
