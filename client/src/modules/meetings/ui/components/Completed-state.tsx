"use client";

import {
  BookOpenTextIcon,
  BotIcon,
  CameraIcon,
  CheckCircle2,
  ClockFadingIcon,
  FileTextIcon,
  ListCheckIcon,
} from "lucide-react";
import { MeetingGetOne } from "../../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TabsContent } from "@radix-ui/react-tabs";
import Markdown from "react-markdown";
import Link from "next/link";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { Transcript } from "./transcript";
import { ChatProvider } from "./chat-provider";

interface Props {
  data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-xl px-4 py-6 flex flex-col gap-y-6 shadow-sm w-full mx-auto max-w-3xl">
      {/* Success Header - Centered on all screens */}
      <div className="w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-800 mt-4">Meeting completed</h1>
        <p className="text-gray-600 mt-2 text-base max-w-2xl mx-auto">
          This meeting has ended. View the report, transcript, recording, or chat below.
        </p>
      </div>

      {/* Tabs Section - Mobile optimized scrollable tabs */}
      <div className="w-full">
        <Tabs defaultValue="ViewReport" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-lg border mb-6">
            <TabsList className="flex w-max min-w-full p-0 bg-background h-14">
              <TabsTrigger
                value="ViewReport"
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium
                data-[state=active]:text-primary
                data-[state=active]:border-b-2
                data-[state=active]:border-primary
                data-[state=active]:bg-background
                min-w-[100px]"
              >
                <BookOpenTextIcon className="w-5 h-5" />
                <span className="hidden xs:inline">Report</span>
              </TabsTrigger>

              <TabsTrigger
                value="recording"
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium
                data-[state=active]:text-primary
                data-[state=active]:border-b-2
                data-[state=active]:border-primary
                data-[state=active]:bg-background
                min-w-[100px]"
              >
                <CameraIcon className="w-5 h-5" />
                <span className="hidden xs:inline">Video</span>
              </TabsTrigger>

              <TabsTrigger
                value="chat"
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium
                data-[state=active]:text-primary
                data-[state=active]:border-b-2
                data-[state=active]:border-primary
                data-[state=active]:bg-background
                min-w-[100px]"
              >
                <BotIcon className="w-5 h-5" />
                <span className="hidden xs:inline">ChatBot</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Tab Content - Full width with responsive padding */}
          <TabsContent value="chat" className="mt-0">
            <div className="bg-white rounded-lg border overflow-hidden">
              <ChatProvider meetingId={data.id} meetingName={data.name} />
            </div>
          </TabsContent>

          <TabsContent value="recording" className="mt-0">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="relative pt-[56.25%] h-0"> {/* 16:9 Aspect Ratio */}
                <video
                  src={data.recordingUrl!}
                  controls
                  playsInline
                  className="absolute top-0 left-0 w-full h-full object-contain"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ViewReport" className="mt-0">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4">
                <h2 className="text-xl font-bold capitalize">{data.name}</h2>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                  <Link
                    href={`/agents/${data.agent.id}`}
                    className="flex items-center gap-2 hover:underline transition-colors"
                  >
                    <GeneratedAvatar
                      variant="initials"
                      seed={data.agent.name}
                      className="size-7 sm:size-8"
                    />
                    <span className="font-medium">{data.agent.name}</span>
                  </Link>
                  <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                    <ClockFadingIcon className="w-3 h-3 mr-1 hidden sm:inline" />
                    {data.startedAt ? format(data.startedAt, "PPP") : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <ListCheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">Meeting Report</span>
                </div>

                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 py-1.5 px-3 text-sm font-medium
                  border-blue-200 bg-blue-50 text-blue-700 w-max"
                >
                  <ClockFadingIcon className="w-4 h-4" />
                  {data.duration ? formatDuration(data.duration) : "No duration"}
                </Badge>

                {/* Responsive Markdown Content */}
                <div className="prose prose-sm sm:prose-base max-w-none text-left
                  prose-headings:font-semibold
                  prose-p:my-2
                  prose-ul:my-2
                  prose-ol:my-2
                  prose-li:my-0.5
                  prose-blockquote:my-2
                  prose-a:text-primary hover:prose-a:underline">
                  <Markdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-lg font-bold mt-4 mb-2" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-base font-bold mt-3 mb-1.5" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-gray-700 leading-relaxed" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1 my-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-gray-700" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-gray-900" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-100 pl-4 italic my-3 py-1 bg-blue-50" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a className="text-primary hover:underline font-medium" {...props} />
                      ),
                    }}
                  >
                    {data.summary}
                  </Markdown>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};