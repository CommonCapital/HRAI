
'use client';
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, FileText, Database, Shield, Server, Lock, Zap, X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import "./App.css";
import { useState } from "react";
import Link from "next/link";

const queryClient = new QueryClient();

const Page = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-background">
          {/* Navigation */}
          <motion.nav 
            className="top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="container mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 4L4 10L16 16L28 10L16 4Z" className="fill-primary"/>
                    <path d="M4 16L16 22L28 16" className="stroke-primary" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4 22L16 28L28 22" className="stroke-primary" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-lg sm:text-xl font-semibold text-black">Advisora</span>
                 
                </motion.div>
                
                <motion.div 
                  className="hidden md:flex items-center gap-8"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <a href="#platform" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline">Platform</a>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline">Capabilities</a>
                  <a href="#security" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline">Security</a>
                  <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline">Pricing</a>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button variant="secondary" size="lg" className="hidden sm:flex bg-gradient-to-r from-blue-700 to-blue-800">
                    Request Demo
                  </Button>
                  <Button variant="secondary" size="sm" className="sm:hidden bg-gradient-to-r from-blue-700 to-blue-800">
                    Demo
                  </Button>
                  <button 
                    className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </motion.div>
              </div>
              
              {/* Mobile Menu */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div 
                    className="md:hidden mt-4 pb-4 space-y-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link href="/platform" className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 hover:bg-primary/5 px-2 rounded">Platform</Link>
                    <Link href="/features" className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 hover:bg-primary/5 px-2 rounded">Capabilities</Link>
                    <Link href="/security" className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 hover:bg-primary/5 px-2 rounded">Security</Link>
                    <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 hover:bg-primary/5 px-2 rounded">Pricing</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.nav>

          <main>
            {/* Hero Section */}
            <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
              <div className="container mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                  <div className="space-y-6 sm:space-y-8">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <span className="text-xs sm:text-sm font-medium text-primary bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                        AI OS for Venture Capital
                        
                      </span>
                    </motion.div>
                    
                    <motion.h1 
                      className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-charcoal-dark"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    >
                      Let AI <span className="italic">lead the call</span><br />
                      You lead the fund
                    </motion.h1>
                    
                    <motion.p 
                      className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-xl"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    >
                      Advisora doesn't just attend meetings—<span className="italic">it runs them</span>. Trained on your fund's proprietary data, it interviews founders, challenges assumptions, and delivers structured insights—<span className="italic">without you on the line</span>.
                    </motion.p>
                    
                    <motion.div 
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    >
                      <Button variant="secondary" size="lg" className="group w-full sm:w-auto hover:scale-[1.03] transition-transform duration-300 bg-gradient-to-r from-blue-700 to-blue-800">
                        Request Demo
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button variant="outline" size="lg" className="w-full sm:w-auto hover:scale-[1.03] transition-transform duration-300">
                        Watch Overview
                      </Button>
                    </motion.div>
                    
                    <motion.div 
                      className="grid grid-cols-3 gap-4 sm:gap-8 pt-4"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    >
                      <div className="text-center sm:text-left">
                        <div className="text-2xl sm:text-3xl font-bold text-gray-700">90+%</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Call accuracy</div>
                      </div>
                      <div className="text-center sm:text-left border-l border-border pl-4 sm:pl-0 sm:border-l-0">
                        <div className="text-2xl sm:text-3xl font-bold text-gray-700">+3hrs</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Saved per call</div>
                      </div>
                      <div className="text-center sm:text-left border-l border-border pl-4 sm:pl-0 sm:border-l-0">
                        <div className="text-2xl sm:text-3xl font-bold text-gray-700">24%</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Higher response rate</div>
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="relative mt-8 lg:mt-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 blur-3xl opacity-20 rounded-full"></div>
                    <img 
                      src={'/Pitch-review.png'} 
                      alt="Advisora AI autonomously conducting a founder interview and generating insights"
                      className="relative rounded-2xl shadow-xl border border-border hover:scale-[1.02] transition-transform duration-500 ease-out"
                    />
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Value Proposition */}
            <section className="py-12 sm:py-24 px-4 sm:px-6 bg-secondary/30">
              <div className="container mx-auto">
                <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <span className="text-xs sm:text-sm font-medium text-primary bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                      Foundation
                    </span>
                  </motion.div>
                  <motion.h2 
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  >
                    Built for those who delegate wisely
                  </motion.h2>
                  <motion.p 
                    className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  >
                    The best investors don't scale by working more—they scale by trusting the right systems. Advisora is your autonomous deal screener, trained exclusively on your fund's history, voice, and judgment.
                  </motion.p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-8">
                  {[
                    { icon: Brain, title: "Autonomous Agent", description: "Your AI doesn't wait for prompts—it initiates, interviews, and evaluates based on your investment DNA.", badge: "Self-operating" },
                    { icon: FileText, title: "Full-Call Ownership", description: "From scheduling to insight delivery—Advisora owns the entire workflow. You receive decisions, not drafts.", badge: "End-to-end" },
                    { icon: Database, title: "Proprietary Scoring", description: "Trained on your memos, past deals, and partner notes—it thinks like your team, not a public model.", badge: "Your DNA" },
                    { icon: Shield, title: "Enterprise Privacy", description: "Your data never leaves your control—run offline, on-premise, or in your VPC. Zero external exposure.", badge: "Air-gapped" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index, ease: "easeOut" }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card className="p-6 sm:p-8 border-2 bg-card group cursor-pointer hover:shadow-lg transition-all duration-400 ease-out">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-700">{item.title}</h3>
                              <span className="text-xs font-medium text-primary bg-primary/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Tech Stack */}
            <section className="py-12 sm:py-24 px-4 sm:px-6">
              <div className="container mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
                  <div className="space-y-6 sm:space-y-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium border-primary text-primary px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-primary/10 transition-colors">
                        Technology & Privacy
                      </Badge>
                    </motion.div>
                    
                    <motion.h2 
                      className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700 leading-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    >
                      Engineered for trust, built to scale
                    </motion.h2>
                    
                    <motion.p 
                      className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                    >
                      Every layer—from inference to storage—is designed for funds that demand control, consistency, and confidentiality.
                    </motion.p>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {[
                        { icon: Server, title: "On-Premise & Offline", description: "Deploy in your environment—no internet required." },
                        { icon: Lock, title: "SOC 2 Compliant", description: "End-to-end encryption and granular access controls—by design." },
                        { icon: Zap, title: "Fine-Tuned Intelligence", description: "Models trained only on your data—never on public corpora." }
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                          whileHover={{ x: 5, transition: { duration: 0.2 } }}
                          className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-primary/5 transition-colors group cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-transform duration-200">
                            <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-1">{item.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-700">{item.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <motion.div 
                    className="bg-gray-800 rounded-2xl p-6 sm:p-8 text-white space-y-4 sm:space-y-6 hover:shadow-2xl transition-shadow duration-500 mt-8 lg:mt-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                  >
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm text-white/60">Data Room Connectors</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {['Dropbox', 'Box', 'Google Drive', 'OneDrive', 'S3'].map((tool, index) => (
                          <motion.span 
                            key={tool}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                            className="px-2 sm:px-3 py-1 bg-white/10 rounded-md text-xs sm:text-sm hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            {tool}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm text-white/60">CRM Integrations</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {['Affinity', 'Salesforce', 'HubSpot', 'Airtable'].map((tool, index) => (
                          <motion.span 
                            key={tool}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                            className="px-2 sm:px-3 py-1 bg-white/10 rounded-md text-xs sm:text-sm hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            {tool}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm text-white/60">AI Stack</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {['Custom LLMs', 'Vector DB', 'Proprietary Embeddings', 'On-Device Inference'].map((tool, index) => (
                          <motion.span 
                            key={tool}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                            className="px-2 sm:px-3 py-1 bg-white/10 rounded-md text-xs sm:text-sm hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            {tool}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                    
                    <motion.div 
                      className="pt-3 sm:pt-4 border-t border-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      <div className="text-xs sm:text-sm text-white/80">
                        Seamless integration. Zero workflow disruption.
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 sm:py-24 px-4 sm:px-6">
              <div className="container mx-auto">
                <motion.div 
                  className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center text-white relative overflow-hidden hover:shadow-2xl transition-shadow duration-500"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
                  
                  <div className="relative z-10 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                    <motion.h2 
                      className="text-3xl sm:text-4xl md:text-5xl font-bold"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      Ready to delegate with confidence?
                    </motion.h2>
                    <motion.p 
                      className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      Join leading venture teams who trust Advisora to screen deals—<span className="italic">so they can focus on what only humans can do</span>.
                    </motion.p>
                    
                    <motion.div 
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="bg-white hover:bg-white/90 hover:scale-[1.03] text-primary border-white group transition-transform duration-300 w-full sm:w-auto"
                      >
                        Request Demo
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="lg"
                        className="text-white hover:bg-white/10 hover:scale-[1.03] border border-white/20 transition-transform duration-300 w-full sm:w-auto"
                      >
                        Schedule Call
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border">
            <div className="container mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                <motion.div 
                  className="space-y-3 sm:space-y-4 col-span-2 md:col-span-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-7 sm:h-7">
                      <path d="M16 4L4 10L16 16L28 10L16 4Z" className="fill-primary"/>
                      <path d="M4 16L16 22L28 16" className="stroke-primary" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M4 22L16 28L28 22" className="stroke-primary" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-base sm:text-lg font-semibold text-charcoal">Advisora</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700">
                    AI OS for Venture Capital
                  </p>
                </motion.div>
                
                {[
                  { title: "Platform", links: ["Capabilities", "Integrations", "Security", "Pricing"] },
                  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                  { title: "Resources", links: ["Documentation", "API Reference", "Support", "Status"] }
                ].map((section, sectionIndex) => (
                  <motion.div 
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * (sectionIndex + 1) }}
                  >
                    <h4 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">{section.title}</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                      {section.links.map((link) => (
                        <li key={link}>
                          <a href="#" className="hover:text-primary transition-colors hover:underline">{link}</a>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="text-xs sm:text-sm text-gray-700">
                  © 2025 Advisora. All rights reserved.
                </p>
                <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-gray-700 justify-center">
                  <a href="#" className="hover:text-primary transition-colors hover:underline">Privacy Policy</a>
                  <a href="#" className="hover:text-primary transition-colors hover:underline">Terms of Service</a>
                  <a href="#" className="hover:text-primary transition-colors hover:underline">Cookie Policy</a>
                </div>
              </motion.div>
            </div>
          </footer>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default Page;
