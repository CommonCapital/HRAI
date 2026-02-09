"use client";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MeetingGetOne } from "../../types";
import { meetingsInsertSchema } from "../../schemas";
import { useEffect, useState } from "react";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";
import { Check, Copy, ExternalLink, PlusCircle, Video } from "lucide-react";

interface MeetingFormProps {
  onCancel?: () => void;
  initialValues?: MeetingGetOne;
  onSuccess?: (id: string) => void;
}

export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: MeetingFormProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState<string>("");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const agents = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100,
      search: agentSearch,
    }),
  );

  const createMeeting = useMutation(
    trpc.meetings.create.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({}),
        );
        setCreatedId(data.id);
        onSuccess?.(data.id);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMeeting = useMutation(
    trpc.meetings.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({}),
        );
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.meetings.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        setUpdatedId(initialValues?.id ?? "");
        onSuccess?.(initialValues?.id ?? "");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<z.infer<typeof meetingsInsertSchema>>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      agentId: initialValues?.agentId ?? "",
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = createMeeting.isPending || updateMeeting.isPending;

  const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) => {
    if (isEdit) {
      updateMeeting.mutate({ ...values, id: initialValues?.id });
    } else {
      createMeeting.mutate(values);
    }
  };

  useEffect(() => {
    if (createdId) {
      setMeetingLink(`${process.env.NEXT_PUBLIC_APP_URL}/meeting-call/${createdId}`);
    } else if (updatedId) {
      setMeetingLink(`${process.env.NEXT_PUBLIC_APP_URL}/meeting-call/${updatedId}`);
    }
  }, [createdId, updatedId]);

  // Success State - Solid Background
  if (createdId || updatedId) {
    return (
      <div className="bg-white border-2 border-primary/10 shadow-orange-lg">
        <div className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
              <Check className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-primary tracking-tight">
              Meeting {createdId ? "Created" : "Updated"}
            </h2>
            <p className="text-sm font-light opacity-80">
              Share this link with participants to join the meeting
            </p>
          </div>

          {/* Link Copy Section */}
          <div className="max-w-md mx-auto pt-4">
            <div className="flex gap-0">
              <Input
                value={meetingLink}
                readOnly
                className="h-12 rounded-r-none border-r-0 border-primary/30 focus:border-primary font-light text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="h-12 rounded-l-none border-2 border-primary/30 hover:border-primary hover:bg-primary/5 px-4"
              >
                {copied ? (
                  <Check size={18} strokeWidth={1.5} className="text-primary" />
                ) : (
                  <Copy size={18} strokeWidth={1.5} className="text-primary" />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t border-primary/10">
            <Button
              onClick={() => router.push(`/meeting-call/${createdId || updatedId}`)}
              className="h-12 px-8 bg-primary hover:bg-amber-500 hover:text-black border-2 border-black text-black font-light tracking-widest uppercase text-sm transition-all"
            >
              <ExternalLink size={18} strokeWidth={1.5} className="mr-2" />
              Preview Meeting
            </Button>

            {onCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel()}
                className="h-12 px-8 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-light tracking-widest uppercase text-sm transition-all"
              >
                <PlusCircle size={18} strokeWidth={1.5} className="mr-2" />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form State - Solid Background
  return (
    <>
      <NewAgentDialog open={openNewAgentDialog} onOpenChange={setOpenNewAgentDialog} />
      
      <div className="bg-white border-2 border-primary/10 shadow-orange-lg">
        <Form {...form}>
          <form className="space-y-6 p-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Icon Header */}
            <div className="flex justify-center pb-6 border-b border-primary/10">
              <div className="w-20 h-20 border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
                <Video size={40} className="text-primary" strokeWidth={1.5} />
              </div>
            </div>

            {/* Meeting Name */}
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                    Meeting Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Business Strategy Consultation"
                      className="h-12 border-primary/30 focus:border-primary font-light"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agent Selection */}
            <FormField
              name="agentId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                    Assigned Agent
                  </FormLabel>
                  <FormControl className="bg-amber-500">
                    <CommandSelect className="bg-amber-500"
                      options={(agents.data?.items ?? []).map((agent) => ({
                        id: agent.id,
                        value: agent.id,
                        children: (
                          <div className="flex items-center gap-2 ">
                            <GeneratedAvatar
                              seed={agent.name}
                              variant="initials"
                              className="border-2 border-primary/20 size-6"
                            />
                            <span className="font-light">{agent.name}</span>
                          </div>
                        ),
                      }))}
                      onSelect={field.onChange}
                      onSearch={setAgentSearch}
                      value={field.value}
                      placeholder="Select your agent"
                    />
                  </FormControl>
                  <FormDescription className="text-xs font-light opacity-60">
                    Not found your agent?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-semibold"
                      onClick={() => setOpenNewAgentDialog(true)}
                    >
                      Create a new Agent
                    </button>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-primary/10">
              {onCancel && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  type="button"
                  onClick={() => onCancel()}
                  className="h-12 px-6 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-light tracking-wide uppercase text-sm"
                >
                  Cancel
                </Button>
              )}
              
              <Button
                disabled={isPending}
                type="submit"
                className="h-12 px-6 border-2 border-primary/20  hover:border-black text-primary font-light tracking-wide uppercase text-sm hover:bg-amber-500 "
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {isEdit ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  isEdit ? "Update Meeting" : "Create Meeting"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};