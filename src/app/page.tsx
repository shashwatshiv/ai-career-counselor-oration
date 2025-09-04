import { StartChatButton } from "@/components/StartChatButton";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TrendingUp, Users, BookOpen } from "lucide-react";
export default async function HomePage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto h-full mt-10">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to Career Counselor AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized career guidance powered by AI. Whether
              you&apos;re starting your career, looking to make a change, or
              seeking advancement, I&apos;m here to help you succeed.
            </p>
            <StartChatButton />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-xl hover:scale-105 shadow-md transition-all duration-300">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Career Planning</CardTitle>
                <CardDescription>
                  Set clear goals and create actionable plans for your career
                  advancement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl hover:scale-105 shadow-md transition-all duration-300">
              <CardHeader>
                <Users className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle>Interview & Networking</CardTitle>
                <CardDescription>
                  Master interviews and build professional networks that advance
                  your career
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl hover:scale-105 shadow-md transition-all duration-300">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle>Skill Development</CardTitle>
                <CardDescription>
                  Identify skill gaps and get recommendations for continuous
                  learning
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          <Card className="hover:shadow-xl hover:scale-105 shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle>Getting Started Tips</CardTitle>
              <CardDescription>
                Make the most of your career counseling sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-sm">
                  <strong>Be specific:</strong> Share details about your current
                  situation, goals, and challenges
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-sm">
                  <strong>Ask follow-up questions:</strong> Dive deeper into
                  recommendations and advice
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-sm">
                  <strong>Return anytime:</strong> Your conversations are saved,
                  so you can continue where you left off
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
