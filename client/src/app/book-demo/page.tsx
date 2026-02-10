"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDemoBooking, demoBookingSchema } from "./actions/booking-action";
import { Calendar, Building2, Mail, User, Phone, Briefcase, MessageSquare, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DemoFormData = z.infer<typeof demoBookingSchema>;

export default function BookDemoPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoBookingSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      jobTitle: "",
      phoneNumber: "",
      companySize: undefined,
      message: "",
    },
  });

  const onSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createDemoBooking(data);
      
      if (result.success) {
        setIsSubmitted(true);
        form.reset();
      } else {
        // Show error toast or message
        console.error(result.error);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Success State */}
          <div className="bg-white border-2 border-primary/10 shadow-orange-lg p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-3xl font-semibold text-primary tracking-tight mb-4">
              Demo Request Received
            </h1>
            <p className="text-lg font-light opacity-80 mb-8 max-w-xl mx-auto">
              Thank you for your interest in HRAI. Our team will review your request and contact you within 24 hours to schedule your personalized demo.
            </p>

            <div className="border-t-2 border-primary/10 pt-8 mt-8">
              <p className="text-sm font-light opacity-60 mb-6">
                What happens next?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-mono text-primary">1</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">Review</span>
                  </div>
                  <p className="text-xs font-light opacity-60">
                    Our team reviews your request and requirements
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-mono text-primary">2</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">Contact</span>
                  </div>
                  <p className="text-xs font-light opacity-60">
                    We'll reach out to schedule a convenient time
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-mono text-primary">3</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">Demo</span>
                  </div>
                  <p className="text-xs font-light opacity-60">
                    Experience HRAI's autonomous hiring intelligence
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsSubmitted(false)}
              className="mt-8 h-12 px-8 bg-primary hover:bg-white hover:text-primary border-2 border-primary text-white font-light tracking-wide uppercase text-sm transition-all"
            >
              Submit Another Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="border-b-2 border-primary/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={20} strokeWidth={1.5} className="text-primary" />
              <span className="text-xs uppercase tracking-widest font-semibold text-primary">
                Experience HRAI
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-primary tracking-tight mb-6">
              Book Your Demo
            </h1>
            <p className="text-xl font-light opacity-80 leading-relaxed">
              See how autonomous AI agents can transform your hiring process. Screen, interview, and evaluate candidates 24/7 with precision and consistency.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Benefits Column */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8">
              <h2 className="text-2xl font-semibold text-primary mb-6 tracking-tight">
                What You'll See
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-1 bg-primary flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Autonomous Screening</h3>
                    <p className="text-sm font-light opacity-80">
                      Watch AI agents automatically screen resumes against your specific criteria with human-level understanding
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1 bg-primary flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Live Interviews</h3>
                    <p className="text-sm font-light opacity-80">
                      See how agents conduct natural, conversational interviews that adapt to candidate responses
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1 bg-primary flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Detailed Analysis</h3>
                    <p className="text-sm font-light opacity-80">
                      Review comprehensive candidate reports with skills assessment, red flag detection, and hiring recommendations
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1 bg-primary flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Custom Training</h3>
                    <p className="text-sm font-light opacity-80">
                      Learn how to train agents on your company's specific requirements and evaluation criteria
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 border-2 border-primary/10 bg-primary/5">
                <p className="text-xs uppercase tracking-widest font-semibold text-primary mb-3">
                  Demo Stats
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-mono text-primary mb-1">45m</div>
                    <div className="text-xs font-light opacity-60">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-primary mb-1">1:1</div>
                    <div className="text-xs font-light opacity-60">Personal</div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-primary mb-1">Live</div>
                    <div className="text-xs font-light opacity-60">Platform</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-3">
            <div className="bg-white border-2 border-primary/10 shadow-orange-lg">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                  {/* Header */}
                  <div className="pb-6 border-b border-primary/10">
                    <h3 className="text-xl font-semibold text-primary tracking-tight mb-2">
                      Request Your Demo
                    </h3>
                    <p className="text-sm font-light opacity-60">
                      Fill out the form below and we'll be in touch within 24 hours
                    </p>
                  </div>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                            <Input
                              {...field}
                              placeholder="John Smith"
                              className="h-12 pl-12 border-primary/30 focus:border-primary font-light"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                          Work Email *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@company.com"
                              className="h-12 pl-12 border-primary/30 focus:border-primary font-light"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company & Job Title Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                            Company
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                              <Input
                                {...field}
                                placeholder="Acme Corp"
                                className="h-12 pl-12 border-primary/30 focus:border-primary font-light"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                            Job Title
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Briefcase size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                              <Input
                                {...field}
                                placeholder="Head of HR"
                                className="h-12 pl-12 border-primary/30 focus:border-primary font-light"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone & Company Size Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                              <Input
                                {...field}
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                className="h-12 pl-12 border-primary/30 focus:border-primary font-light"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                            Company Size
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-primary/30 focus:border-primary font-light">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-2 border-primary/20">
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-500">201-500 employees</SelectItem>
                              <SelectItem value="500+">500+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Message */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                          Message
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MessageSquare size={18} strokeWidth={1.5} className="absolute left-4 top-4 text-primary opacity-50" />
                            <Textarea
                              {...field}
                              placeholder="Tell us about your hiring needs..."
                              className="min-h-[120px] pl-12 pt-4 border-primary/30 focus:border-primary font-light resize-none"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs font-light opacity-60">
                          Optional: Share any specific questions or requirements
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-primary/10">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-primary hover:bg-orange-400 hover:text-black border-2 border-black text-white font-light tracking-widest uppercase text-sm transition-all"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Request Demo
                          <ArrowRight size={18} strokeWidth={1.5} />
                        </span>
                      )}
                    </Button>
                    <p className="text-xs font-light opacity-60 text-center mt-4">
                      By submitting, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}