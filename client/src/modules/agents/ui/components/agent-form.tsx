"use client";
import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

  const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
      instructions2: initialValues?.instructions2 ?? ""
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

          {/* Training Data */}
          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                  Training Data
                </FormLabel>
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

          {/* Report Template */}
          <FormField
            name="instructions2"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-primary tracking-tight">
                  Report Template
                </FormLabel>
                <FormControl>
                  <Textarea 
                    className="min-h-[200px] max-h-[400px] overflow-y-auto resize-none border-primary/30 focus:border-primary font-light text-sm leading-relaxed"
                    {...field} 
                    placeholder="Define the structure and format of evaluation reports..."
                  />
                </FormControl>
                <p className="text-xs font-light opacity-60 mt-2">
                  This defines the format of insights and recommendations your agent produces.
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