"use client"
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Check, Copy, ExternalLink, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Url } from "url";

interface MeetingFormProps {
    
    onCancel?: () => void;
    initialValues?: MeetingGetOne;
    onSuccess?: (id: string) => void
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
   
  const [agentSearch, setAgentSearch] = useState("")
   const [copied, setCopied] = useState(false)
    const [createdId, setCreatedId] = useState<string | null>(null);
    const [updatedId, setUpdatedId] = useState<string | null>(null);
    const [meetingLink, setMeetingLink] = useState<string>("");
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(meetingLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
  
  
   const agents = useQuery(
    trpc.agents.getMany.queryOptions({
        pageSize: 100,
        search: agentSearch,
    }),
   );

   const createMeeting = useMutation(
    trpc.meetings.create.mutationOptions({
        onSuccess: async(data) => {
               await queryClient.invalidateQueries(
                trpc.meetings.getMany.queryOptions({}),
                
            );
           // await queryClient.invalidateQueries(
           //     trpc.premium.getFreeUsage.queryOptions(),

          //  );
           setCreatedId(data.id);
            onSuccess?.(data.id);
            
         
            

        },
        onError: (error) => {
            toast.error(error.message)
        },
    }),
   );

   const updateMeeting = useMutation(
    trpc.meetings.update.mutationOptions({
        onSuccess: async() => {
               await queryClient.invalidateQueries(
                trpc.meetings.getMany.queryOptions({}),

            );
            if (initialValues?.id) {
                   await queryClient.invalidateQueries(
                    trpc.meetings.getOne.queryOptions({ id: initialValues.id}),
                );

            }
            setUpdatedId(initialValues?.id ?? "")
            onSuccess?.(initialValues?.id ?? "");
            
           
        },
        onError: (error) => {
            toast.error(error.message)
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
        updateMeeting.mutate({...values, id: initialValues?.id})
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
 if (createdId || updatedId) {
  return (
    <div className="relative text-center space-y-6 py-8 px-6">
      <div className="flex items-center justify-center">
        <div className="bg-green-500 rounded-full p-2">
          <Check className="h-6 w-6 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold">
        Your meeting has been {createdId ? "created" : "updated"}
      </h2>
      <p>You can share the link below with your audience for them to join</p>

      <div className="flex mt-4 max-w-md mx-auto">
        <Input value={meetingLink} readOnly className="text-black border-input rounded-r-none" />
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="rounded-l-none border-l-0 border-gray-800"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          variant={"outline"}
          className="text-black hover:bg-input"
          onClick={() =>
            router.push(`/meeting-call/${createdId || updatedId}`)
          }
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Preview Meeting
        </Button>
      </div>

      {onCancel && (
        <div className="mt-8">
          <Button
            variant={"outline"}
            className="border-gray-300 text-black"
            onClick={() => onCancel()}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

   return (
    <>
    <NewAgentDialog open={openNewAgentDialog} onOpenChange={setOpenNewAgentDialog} />
    <Form {...form}>
      <form className="space-y-4"  onSubmit={form.handleSubmit(onSubmit)}>
        
         
         <FormField 
          name="name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>
                    Meeting name
                </FormLabel>
                <FormControl>
                    <Input {...field} placeholder="e.g. Business strategy consultation "/>
                </FormControl>
                <FormMessage />
              </FormItem>
          )}
         />

         
         <FormField 
          name="agentId" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>
                    Agent
                </FormLabel>
                <FormControl>
                    <CommandSelect
                        options={(agents.data?.items ?? []).map((agent) => ({
                            id: agent.id,
                            value: agent.id,
                            children: (
                                <div>
                                    <GeneratedAvatar seed={agent.name} variant="initials" className="border size-6"/>
                                    <span>{agent.name}</span>
                                </div>
                            )
                        }))}
                        onSelect={field.onChange}
                        onSearch={setAgentSearch}
                        value={field.value}
                        placeholder="Select your agent"
                    />
                </FormControl>
                <FormDescription>
                   Not found your agent? You can <button type="button" className="text-primary hover:underline" onClick={() => setOpenNewAgentDialog(true)}>Create a new Agent</button>
                </FormDescription>
                <FormMessage />
              </FormItem>
          )}
         />
        
          <div className="flex justify-between gap-x-2">
            {onCancel && (
                <Button variant={'ghost'} disabled={isPending} type="button" onClick={() => onCancel()}>
                    Cancel
                </Button>
            )}
            
            <Button disabled={isPending} type="submit">
              {isEdit ? "Update" : "Generate"}
            </Button>
           
            
            
          </div>
      </form>
      
    </Form>
    </>
   );
};