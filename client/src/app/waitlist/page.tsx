"use client";

import { Button } from "@/components/ui/button";
import { Users, Sparkles, Zap, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function WaitlistPage() {
  const router = useRouter();
  const [totalWaitlist, setTotalWaitlist] = useState(0);

  // Simulate waitlist counter (replace with real data)
  useEffect(() => {
    const count = Math.floor(Math.random() * 500) + 1200;
    setTotalWaitlist(count);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-2 border-[#FF6A00]/10">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6A00]/5 via-white to-[#FF6A00]/3" />
        
        {/* Animated Orange Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#FF6A00]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#FF6A00]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#FF6A00] rounded-full shadow-lg shadow-[#FF6A00]/20">
              <Sparkles className="w-4 h-4 text-[#FF6A00]" />
              <span className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">
                Early Access Program
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl lg:text-7xl font-bold text-center mb-6 leading-tight">
            The Future of
            <br />
            <span className="text-[#FF6A00]">AI-Powered Hiring</span>
            <br />
            Starts Here
          </h1>

          {/* Subheading */}
          <p className="text-xl lg:text-2xl text-gray-600 text-center max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            Join thousands of forward-thinking companies revolutionizing their recruitment process with autonomous AI agents that interview, screen, and analyze candidates 24/7.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={() => router.push("/auth/sign-up")}
              className="h-16 px-12 bg-[#FF6A00] text-white text-lg font-semibold uppercase tracking-wider border-2 border-[#FF6A00] hover:bg-white hover:text-[#FF6A00] transition-all duration-300 shadow-xl shadow-[#FF6A00]/30 hover:shadow-2xl hover:shadow-[#FF6A00]/40 group"
            >
              Join the Waitlist
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Waitlist Counter */}
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5 text-[#FF6A00]" />
              <span className="font-light">
                <span className="font-semibold text-[#FF6A00]">{totalWaitlist.toLocaleString()}</span> innovators already on the list
              </span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 items-center opacity-60">
            <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Trusted By</div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="text-sm font-light text-gray-600">Fortune 500 Companies</div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="text-sm font-light text-gray-600">Fast-Growing Startups</div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="text-sm font-light text-gray-600">HR Professionals</div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Why Join <span className="text-[#FF6A00]">Early?</span>
          </h2>
          <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
            Be among the first to experience the next generation of recruitment technology and shape its future.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative bg-white border-2 border-[#FF6A00]/20 rounded-2xl p-8 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6A00]/20">
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-3">Priority Access</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Get exclusive early access before the public launch. Be the first to leverage autonomous AI interviews for your hiring pipeline.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-white border-2 border-[#FF6A00]/20 rounded-2xl p-8 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6A00]/20">
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-3">Founding Member Benefits</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Enjoy special pricing, extended trial periods, and exclusive features reserved only for our earliest adopters and champions.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-white border-2 border-[#FF6A00]/20 rounded-2xl p-8 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6A00]/20">
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-3">Shape the Product</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Your feedback matters. Help us build the perfect recruitment solution by influencing features and roadmap decisions.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="group relative bg-white border-2 border-[#FF6A00]/20 rounded-2xl p-8 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6A00]/20">
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-3">No Commitment Required</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Joining the waitlist is free and comes with no strings attached. Cancel anytime, explore at your own pace.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="group relative bg-white border-2 border-[#FF6A00]/20 rounded-2xl p-8 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6A00]/20">
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-3">Exclusive Community</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Join a private community of HR leaders, recruiters, and innovators sharing best practices and insights.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="group relative bg-white border-2 border-[#FF6A00]/20 rounded-2xl p-8 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6A00]/20">
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/40 group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-3">Premium Support</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Get white-glove onboarding, dedicated account management, and 24/7 priority support from our team.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Get Section */}
      <div className="bg-gradient-to-br from-[#FF6A00]/5 via-white to-[#FF6A00]/5 border-t-2 border-b-2 border-[#FF6A00]/10">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              What You'll <span className="text-[#FF6A00]">Experience</span>
            </h2>
            <p className="text-xl text-gray-600 font-light">
              The complete AI recruitment platform built for modern teams
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                title: "Autonomous AI Interviews",
                description: "AI agents conduct natural, conversational interviews 24/7, asking relevant follow-up questions and adapting to each candidate."
              },
              {
                title: "Intelligent Candidate Screening",
                description: "Automatically evaluate skills, experience, and cultural fit using advanced AI analysis and custom criteria you define."
              },
              {
                title: "Real-Time Insights Dashboard",
                description: "Track interview progress, view detailed analytics, and make data-driven hiring decisions with comprehensive reporting."
              },
              {
                title: "Seamless ATS Integration",
                description: "Connect with your existing tools like Greenhouse, Lever, or Workday. No disruption to your current workflow."
              },
              {
                title: "Custom Training Capabilities",
                description: "Train AI agents on your company values, interview questions, and evaluation criteria for perfectly aligned hiring."
              },
              {
                title: "Multi-Language Support",
                description: "Conduct interviews in 50+ languages, expanding your talent pool globally without language barriers."
              }
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white border-2 border-[#FF6A00]/20 rounded-xl p-6 hover:border-[#FF6A00] transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6A00]/10"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6A00] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative bg-gradient-to-br from-[#FF6A00] to-[#FF8A00] rounded-3xl p-12 lg:p-16 shadow-2xl shadow-[#FF6A00]/40 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-white/90 font-light mb-10 max-w-2xl mx-auto">
              Join the waitlist today and be among the first to experience the future of recruitment. No credit card required, no commitment needed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push("/auth/sign-up")}
                className="h-16 px-12 bg-white text-[#FF6A00] text-lg font-semibold uppercase tracking-wider border-2 border-white hover:bg-[#FF6A00] hover:text-white hover:border-white transition-all duration-300 shadow-xl hover:shadow-2xl group"
              >
                Secure Your Spot Now
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <p className="mt-8 text-white/70 text-sm font-light">
              ⚡ Limited spots available • 🎯 Early bird pricing • ✨ Exclusive benefits
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-[#FF6A00]/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm font-light">
          <p>© 2026 HRAI. All rights reserved. • Building the future of recruitment, one interview at a time.</p>
        </div>
      </div>
    </div>
  );
}