import { Button } from "@/components/ui/button";
import SigninButton from "@/components/SigninButton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Page Header */}
      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4  ">
          Welcome to Oration AI
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-2">
          Your intelligent career counselor powered by artificial intelligence
        </p>
        <p className="text-sm md:text-base text-muted-foreground/80">
          Get personalized career guidance, skill assessments, and professional
          development insights tailored just for you
        </p>
      </div>

      <Card className="w-full max-w-md hover:shadow-xl hover:scale-105 shadow-md transition-all duration-300 backdrop-blur-xl bg-card/80 border-white/20">
        <CardHeader className="space-y-1">
          {/* Back Button */}
          <div className="flex justify-start mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-white/5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <CardTitle className="text-2xl text-center">
            Sign In to Continue
          </CardTitle>
          <CardDescription className="text-center">
            Access your personalized career dashboard and AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SigninButton />
        </CardContent>
      </Card>
    </div>
  );
}
