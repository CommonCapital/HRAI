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
    <div 
      className="bg-white rounded border border-[rgba(255,106,0,0.1)] p-8 flex flex-col gap-y-8 w-full mx-auto max-w-3xl"
      style={{ boxShadow: '0 2px 8px rgba(255,106,0,0.08)' }}
    >
      {/* SUCCESS HEADER - ORANGE EDITION */}
      <div className="w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-[#FF6A00] mx-auto" />
        <h1 className="text-2xl font-bold text-[#FF6A00] mt-4 tracking-tight">Meeting Completed</h1>
        <p className="text-[rgba(255,106,0,0.6)] font-light mt-2 text-base max-w-2xl mx-auto leading-relaxed">
          This meeting has concluded. Review the report, transcript, recording, or chat below.
        </p>
      </div>

      {/* TABS SECTION - BRUTALIST ORANGE HIERARCHY */}
      <div className="w-full">
        <Tabs defaultValue="ViewReport" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded border border-[rgba(255,106,0,0.1)] mb-6">
            <TabsList className="flex w-max min-w-full p-0 bg-white h-14">
              {/* REPORT TAB */}
              <TabsTrigger
                value="ViewReport"
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium
                  data-[state=active]:text-[#FF6A00]
                  data-[state=active]:border-b-2
                  data-[state=active]:border-[#FF6A00]
                  data-[state=inactive]:text-[rgba(255,106,0,0.5)]
                  hover:bg-[#FF6A00] hover:text-white transition-colors
                  min-w-[100px]"
              >
                <BookOpenTextIcon className="w-5 h-5" />
                <span className="hidden xs:inline">Report</span>
              </TabsTrigger>
 
              {/* VIDEO TAB */}
              <TabsTrigger
                value="recording"
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium
                  data-[state=active]:text-[#FF6A00]
                  data-[state=active]:border-b-2
                  data-[state=active]:border-[#FF6A00]
                  data-[state=inactive]:text-[rgba(255,106,0,0.5)]
                  hover:bg-[#FF6A00] hover:text-white transition-colors
                  min-w-[100px]"
              >
                <CameraIcon className="w-5 h-5" />
                <span className="hidden xs:inline">Video</span>
              </TabsTrigger>

              {/* CHAT TAB */}
              <TabsTrigger
                value="chat"
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium
                  data-[state=active]:text-[#FF6A00]
                  data-[state=active]:border-b-2
                  data-[state=active]:border-[#FF6A00]
                  data-[state=inactive]:text-[rgba(255,106,0,0.5)]
                  hover:bg-[#FF6A00] hover:text-white transition-colors
                  min-w-[100px]"
              >
                <BotIcon className="w-5 h-5" />
                <span className="hidden xs:inline">ChatBot</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* TAB CONTENT - ORANGE MONOCHROME */}
          <TabsContent value="chat" className="mt-0">
            <div className="bg-white rounded border border-[rgba(255,106,0,0.1)] overflow-hidden">
              <ChatProvider meetingId={data.id} meetingName={data.name} />
            </div>
          </TabsContent>
  
          <TabsContent value="recording" className="mt-0">
            <div className="bg-white rounded border border-[rgba(255,106,0,0.1)] overflow-hidden">
              <div className="relative pt-[56.25%] h-0">
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
            <div className="bg-white rounded border border-[rgba(255,106,0,0.1)] overflow-hidden">
              <div className="p-6 space-y-5">
                <h2 className="text-xl font-bold text-[#FF6A00] capitalize tracking-tight">{data.name}</h2>

                {/* METADATA - ORANGE HIERARCHY */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    href={`/agents/${data.agent.id}`}
                    className="flex items-center gap-2 hover:bg-[#FF6A00] hover:text-white px-2 py-1 rounded transition-colors font-medium"
                  >
                    <GeneratedAvatar
                      variant="initials"
                      seed={data.agent.name}
                      className="size-8 border-2 border-[rgba(255,106,0,0.2)]"
                     
                    />
                    <span>{data.agent.name}</span>
                  </Link>
                  <span className="text-[rgba(255,106,0,0.6)] flex items-center font-light">
                    <ClockFadingIcon className="w-3.5 h-3.5 mr-1.5" />
                    {data.startedAt ? format(data.startedAt, "PPP") : ""}
                  </span>
                </div>

                {/* DURATION BADGE - ORANGE EDITION */}
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 py-1.5 px-3 text-sm font-medium
                    border-[rgba(255,106,0,0.2)] 
                    bg-[rgba(255,106,0,0.03)]
                    text-[#FF6A00]
                    hover:bg-[#FF6A00] hover:text-white transition-colors
                    w-max"
                >
                  <ClockFadingIcon className="w-4 h-4" />
                  {data.duration ? formatDuration(data.duration) : "No duration"}
                </Badge>

                {/* ORANGE MONOCHROME MARKDOWN */}
                <div className="prose prose-sm max-w-none text-left
                  prose-headings:font-bold
                  prose-headings:text-[#FF6A00]
                  prose-p:my-2
                  prose-p:text-[rgba(255,106,0,0.85)]
                  prose-p:font-light
                  prose-ul:my-2
                  prose-ol:my-2
                  prose-li:text-[rgba(255,106,0,0.85)]
                  prose-li:font-light
                  prose-strong:font-bold
                  prose-strong:text-[#FF6A00]
                  prose-a:text-[#FF6A00]
                  prose-a:font-medium
                  hover:prose-a:bg-[#FF6A00]
                  hover:prose-a:text-white
                  hover:prose-a:px-0.5
                  hover:prose-a:py-0.5
                  hover:prose-a:rounded
                  prose-blockquote:border-l-4
                  prose-blockquote:border-[rgba(255,106,0,0.2)]
                  prose-blockquote:pl-4
                  prose-blockquote:italic
                  prose-blockquote:text-[rgba(255,106,0,0.8)]
                  prose-code:bg-[rgba(255,106,0,0.05)]
                  prose-code:text-[#FF6A00]
                  prose-code:px-1
                  prose-code:py-0.5
                  prose-code:rounded"
                >
                  <Markdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-xl font-bold mt-5 mb-2 text-[#FF6A00]" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-lg font-bold mt-4 mb-2 text-[#FF6A00]" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-base font-bold mt-3 mb-1.5 text-[#FF6A00]" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-[rgba(255,106,0,0.85)] font-light leading-relaxed" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1 my-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-[rgba(255,106,0,0.85)] font-light" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-[#FF6A00]" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-[rgba(255,106,0,0.05)] text-[#FF6A00] px-1 py-0.5 rounded font-mono text-sm" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-[rgba(255,106,0,0.2)] pl-4 italic my-3 py-1" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a className="text-[#FF6A00] font-medium hover:bg-[#FF6A00] hover:text-white px-0.5 py-0.5 rounded transition-colors" {...props} />
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