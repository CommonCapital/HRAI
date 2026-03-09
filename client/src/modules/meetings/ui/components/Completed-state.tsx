"use client";

import {
  BookOpenTextIcon,
  BotIcon,
  CameraIcon,
  CheckCircle2,
  ClockFadingIcon,
  FileTextIcon,
} from "lucide-react";
import { MeetingGetOne } from "../../types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-y-6 p-6">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-[rgba(255,106,0,0.12)]"
        style={{ boxShadow: "0 1px 6px rgba(255,106,0,0.06)" }}>
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(255,106,0,0.08)] border border-[rgba(255,106,0,0.15)] shrink-0">
          <CheckCircle2 className="w-5 h-5 text-[#FF6A00]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#FF6A00] leading-tight">Meeting Completed</h1>
          <p className="text-sm text-[rgba(255,106,0,0.55)] font-light mt-0.5">
            Review the report, transcript, recording, or chat below.
          </p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white rounded-xl border border-[rgba(255,106,0,0.12)] overflow-hidden"
        style={{ boxShadow: "0 1px 6px rgba(255,106,0,0.06)" }}>
        <Tabs defaultValue="ViewReport" className="w-full">

          {/* Tab bar */}
          <ScrollArea className="w-full whitespace-nowrap border-b border-[rgba(255,106,0,0.1)]">
            <TabsList className="flex w-max min-w-full p-0 bg-white h-12 gap-0">
              {[
                { value: "ViewReport", icon: BookOpenTextIcon, label: "Report"     },
                { value: "Transcript", icon: FileTextIcon,     label: "Transcript" },
                { value: "recording",  icon: CameraIcon,       label: "Video"      },
                { value: "chat",       icon: BotIcon,          label: "Chat"       },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="
                    flex items-center gap-2 px-5 h-12 text-sm font-medium rounded-none
                    border-b-2 border-transparent
                    text-[rgba(255,106,0,0.45)]
                    data-[state=active]:text-[#FF6A00]
                    data-[state=active]:border-[#FF6A00]
                    data-[state=active]:bg-[rgba(255,106,0,0.03)]
                    hover:text-[#FF6A00] hover:bg-[rgba(255,106,0,0.04)]
                    transition-all duration-150
                  "
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Report */}
          <TabsContent value="ViewReport" className="mt-0 focus-visible:outline-none">
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-[#FF6A00] capitalize tracking-tight leading-snug">
                {data.name}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href={`/agents/${data.agent.id}`}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[rgba(255,106,0,0.06)] transition-colors font-medium text-[#334e68]"
                >
                  <GeneratedAvatar
                    variant="initials"
                    seed={data.agent.name}
                    className="size-7 border border-[rgba(255,106,0,0.2)] rounded-full"
                  />
                  <span className="text-sm">{data.agent.name}</span>
                </Link>

                {data.startedAt && (
                  <span className="text-[rgba(255,106,0,0.55)] flex items-center gap-1.5 text-xs font-light">
                    <ClockFadingIcon className="w-3.5 h-3.5" />
                    {format(data.startedAt, "PPP")}
                  </span>
                )}

                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium
                    border-[rgba(255,106,0,0.2)] bg-[rgba(255,106,0,0.03)]
                    text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white
                    transition-colors w-max rounded-md"
                >
                  <ClockFadingIcon className="w-3.5 h-3.5" />
                  {data.duration ? formatDuration(data.duration) : "No duration"}
                </Badge>
              </div>

              <div className="w-full h-px bg-[rgba(255,106,0,0.08)]" />

              <div className="prose prose-sm max-w-none text-left
                prose-headings:font-bold prose-headings:text-[#FF6A00]
                prose-p:my-2 prose-p:text-[rgba(10,31,51,0.75)] prose-p:font-light prose-p:leading-relaxed
                prose-ul:my-2 prose-ol:my-2
                prose-li:text-[rgba(10,31,51,0.75)] prose-li:font-light
                prose-strong:font-bold prose-strong:text-[#FF6A00]
                prose-a:text-[#FF6A00] prose-a:font-medium
                prose-blockquote:border-l-4 prose-blockquote:border-[rgba(255,106,0,0.2)]
                prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[rgba(255,106,0,0.8)]
                prose-code:bg-[rgba(255,106,0,0.05)] prose-code:text-[#FF6A00]
                prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
              >
                <Markdown
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-5 mb-2 text-[#FF6A00]" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2 text-[#FF6A00]" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1.5 text-[#FF6A00]" {...props} />,
                    p:  ({ node, ...props }) => <p className="text-[rgba(10,31,51,0.75)] font-light leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-[rgba(10,31,51,0.75)] font-light" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-[#FF6A00]" {...props} />,
                    code:   ({ node, ...props }) => <code className="bg-[rgba(255,106,0,0.05)] text-[#FF6A00] px-1 py-0.5 rounded font-mono text-sm" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[rgba(255,106,0,0.2)] pl-4 italic my-3 py-1" {...props} />,
                    a: ({ node, ...props }) => <a className="text-[#FF6A00] font-medium hover:bg-[#FF6A00] hover:text-white px-0.5 rounded transition-colors" {...props} />,
                  }}
                >
                  {data.summary}
                </Markdown>
              </div>
            </div>
          </TabsContent>

          {/* Transcript */}
          <TabsContent value="Transcript" className="mt-0 focus-visible:outline-none">
            <Transcript meetingId={data.id} />
          </TabsContent>

          {/* Video */}
          <TabsContent value="recording" className="mt-0 focus-visible:outline-none">
            <div className="relative pt-[56.25%] h-0 bg-black rounded-b-xl overflow-hidden">
              <video
                src={data.recordingUrl!}
                controls
                playsInline
                className="absolute top-0 left-0 w-full h-full object-contain"
              />
            </div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
            <ChatProvider meetingId={data.id} meetingName={data.name} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};