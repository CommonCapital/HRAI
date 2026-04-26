"use client";
import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CommandSelect } from "@/components/command-select";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({}),
        );
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
        if (error.data?.code === "FORBIDDEN") {
          router.push('/settings');
        }
      },
    }),
  );

  const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({}),
        );
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const autoFillAgent = useMutation(
    trpc.agents.autoFill.mutationOptions(),
  );

  const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      agentType: initialValues?.agentType ?? "active", // 🆕 NEW
      instructions: initialValues?.instructions ?? "",
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
      updateAgent.mutate({ ...values, id: initialValues?.id });
    } else {
      createAgent.mutate(values);
    }
  };

  return (
    <div className="bg-white border-2 border-primary/10 shadow-orange-lg">
      <Form {...form}>
        <form className="space-y-6 p-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Avatar Preview */}
          <div className="flex justify-center pb-6 border-b border-primary/10">
            <GeneratedAvatar 
              seed={form.watch("name")} 
              variant="initials" 
              className="size-20 border-2 border-primary/20" 
            />
          </div>

          {/* Agent Name */}
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                  Agent Name
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="e.g. Senior Engineer Screener"
                    className="h-12 border-primary/30 focus:border-primary font-light"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🆕 NEW: Agent Type Selection */}
          <FormField
            name="agentType"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                  Agent Type
                </FormLabel>
                <FormControl>
                  <CommandSelect
                    options={[
                      {
                        id: "active",
                        value: "active",
                        children: (
                          <div className="space-y-1 py-2">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <span className="text-lg">🎙️</span>
                              Active Interviewer
                            </div>
                            <div className="text-xs text-muted-foreground pl-7">
                              Speaks first, asks questions, drives the conversation proactively
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: "passive",
                        value: "passive",
                        children: (
                          <div className="space-y-1 py-2">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <span className="text-lg">📝</span>
                              Passive Assistant
                            </div>
                            <div className="text-xs text-muted-foreground pl-7">
                              Takes notes silently, only speaks when directly addressed by name or "AI"
                            </div>
                          </div>
                        ),
                      },
                    ]}
                    onSelect={field.onChange}
                    value={field.value}
                    placeholder="Select agent type"
                  />
                </FormControl>
                <FormDescription className="text-xs font-light opacity-60">
                  {field.value === "active" ? (
                    <>
                      <span className="font-semibold">Active agents</span> conduct interviews and drive conversations. 
                      Best for: structured interviews, assessments, candidate screening.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Passive agents</span> observe and take notes. They only respond when explicitly called by name. 
                      Best for: team meetings, note-taking, Q&A support.
                    </>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Training Data */}
          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                    Training Data
                  </FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-[10px] uppercase tracking-wider text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    onClick={async () => {
                      const name = form.getValues("name");
                      if (!name) {
                        toast.error("Please enter an agent name first");
                        return;
                      }
                      const promise = autoFillAgent.mutateAsync({ 
                        name,
                        instructions: form.getValues("instructions")
                      });
                      toast.promise(promise, {
                        loading: "AI is thinking...",
                        success: (data: any) => {
                          form.setValue("instructions", data.instructions);
                          if (data.name) form.setValue("name", data.name);
                          return "Agent instructions improved!";
                        },
                        error: "Failed to generate instructions",
                      });
                    }}
                  >
                    ✨ Smart AI-autofill
                  </Button>
                </div>
                <FormControl>
                  <Textarea 
                    className="min-h-[200px] max-h-[400px] overflow-y-auto resize-none border-primary/30 focus:border-primary font-light text-sm leading-relaxed"
                    {...field} 
                    placeholder="Define your agent's evaluation criteria, red flags, and decision-making logic..."
                  />
                </FormControl>
                <p className="text-xs font-light opacity-60 mt-2">
                  This defines how your agent evaluates candidates and makes decisions.
                </p>
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
              className="h-12 px-6 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-light tracking-wide uppercase text-sm"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isEdit ? "Updating..." : "Creating..."}
                </span>
              ) : (
                isEdit ? "Update Agent" : "Create Agent"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};