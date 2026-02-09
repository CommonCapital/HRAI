"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required" }),
});

// HRAI Logo Component
const HRAILogo = ({ inverted = false }: { inverted?: boolean }) => {
  const strokeColor = inverted ? "#FFFFFF" : "#FF6A00";
  const fillColor = inverted ? "#FFFFFF" : "#FF6A00";
  const bgFill = inverted ? "#FF6A00" : "#FFFFFF";
  
  return (
    <div className="flex flex-col items-center gap-4">
      <svg 
        width="80" 
        height="80" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect 
          x="2" 
          y="2" 
          width="36" 
          height="36" 
          stroke={strokeColor} 
          strokeWidth="2"
          fill="none"
        />
        <path 
          d="M 20 8 L 32 14 L 32 26 L 20 32 L 8 26 L 8 14 Z" 
          fill={fillColor}
        />
        <circle 
          cx="20" 
          cy="20" 
          r="4" 
          fill={bgFill}
        />
        <line x1="20" y1="8" x2="20" y2="16" stroke={bgFill} strokeWidth="1.5" />
        <line x1="20" y1="24" x2="20" y2="32" stroke={bgFill} strokeWidth="1.5" />
        <line x1="8" y1="14" x2="16" y2="18" stroke={bgFill} strokeWidth="1.5" />
        <line x1="24" y1="22" x2="32" y2="26" stroke={bgFill} strokeWidth="1.5" />
      </svg>
      
      <div className="flex flex-col items-center leading-none">
        <span className={`text-3xl font-semibold tracking-tight ${inverted ? 'text-white' : 'text-primary'}`}>
          HRAI
        </span>
        <span className={`text-xs uppercase tracking-widest font-light mt-2 ${inverted ? 'text-white/80' : 'opacity-60'}`}>
          Autonomous HR Intelligence
        </span>
      </div>
    </div>
  );
};

export const SignInView = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: "/"
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };
  
  const onSocial = (provider: "github" | "google") => {
    setError(null);
    setPending(true);
    authClient.signIn.social({
      provider: provider,
      callbackURL: "/"
    },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };
  
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 border-2 border-primary/10 shadow-orange-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Welcome back
                  </h1>
                  <p className="text-sm font-light opacity-60">
                    Login to your account to proceed.
                  </p>
                </div>
                
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-light tracking-wide">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            className="h-12 border-primary/30 focus:border-primary font-light"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-light tracking-wide">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Password"
                            className="h-12 border-primary/30 focus:border-primary font-light"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!!error && (
                  <Alert className="bg-primary/10 border-primary/30">
                    <OctagonAlertIcon className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-light">{error}</AlertTitle>
                  </Alert>
                )}

                <Button 
                  disabled={pending} 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-white hover:text-primary border-2 border-primary text-white font-light tracking-widest uppercase text-sm transition-all"
                >
                  {pending ? "Signing In..." : "Sign In"}
                </Button>
                
                <div className="relative my-6 text-center text-sm after:content-[''] after:absolute after:inset-0 after:top-1/2 after:border-t after:border-primary/10 after:z-0">
                  <span className="relative z-10 bg-card px-2 text-foreground/60 font-light text-xs uppercase tracking-widest">
                    Or Continue With
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    disabled={pending}
                    onClick={() => onSocial("google")}
                    variant="outline"
                    type="button"
                    className="w-full h-12 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <FaGoogle className="text-primary" />
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() => onSocial("github")}
                    variant="outline"
                    type="button"
                    className="w-full h-12 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <FaGithub className="text-primary" />
                  </Button>
                </div>

                <div className="text-center text-sm font-light">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="text-primary font-normal underline underline-offset-4 hover:opacity-80 transition-opacity"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            </form>
          </Form>
          
          {/* Right Panel - Orange Background with Logo */}
          <div className="bg-primary relative hidden md:flex flex-col gap-y-6 items-center justify-center p-8 border-l-2 border-white/10">
            <HRAILogo inverted={true} />
            
            <div className="text-center space-y-4 mt-8">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Hiring that runs itself
              </h2>
              <p className="text-sm font-light text-white/80 max-w-xs leading-relaxed">
                Autonomous AI agents trained on your standards. No black boxes. 
                Just structured intelligence at scale.
              </p>
            </div>
            
            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                               linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
        </CardContent>
      </Card>

      <div className="text-foreground/60 text-center text-xs text-balance font-light">
        By clicking continue, you agree to our{" "}
        <a href="/terms" className="text-primary hover:opacity-80 underline underline-offset-4 transition-opacity">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/policy" className="text-primary hover:opacity-80 underline underline-offset-4 transition-opacity">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};