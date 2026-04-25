"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Share2,
    Copy,
    Check,
    ExternalLink,
    Loader2,
    Plus,
    Clock,
    CalendarDays,
    LinkIcon,
} from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type MeetingType } from "@/db/schema";

type MeetingDuration = 15 | 30 | 45 | 60 | 90;

const DURATION_OPTIONS: Array<{ value: MeetingDuration; label: string }> = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "60 minutes" },
    { value: 90, label: "90 minutes" },
];

export function ShareLinkDialog() {
    const [open, setOpen] = useState(false);
    const [meetingTypes, setMeetingTypes] = useState<any[]>([]);
    const [selectedMeetingType, setSelectedMeetingType] =
        useState<any | null>(null);
    const [bookingUrl, setBookingUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCreatingType, setIsCreatingType] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [newTypeDuration, setNewTypeDuration] = useState<MeetingDuration>(30);
    const [quota, setQuota] = useState<any>(null); // Mocked for now
    const [hasAccount, setHasAccount] = useState<boolean | null>(true); // Assume true for now

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const getTypesQuery = useQuery(trpc.scheduling.getMeetingTypes.queryOptions(undefined, {
        enabled: open,
    }));

    const createMutation = useMutation(
        trpc.scheduling.createMeetingType.mutationOptions({
            onSuccess: (newType) => {
                queryClient.invalidateQueries({
                    queryKey: trpc.scheduling.getMeetingTypes.queryKey(),
                });
                setSelectedMeetingType(newType);
                setIsCreatingType(false);
                setNewTypeName("");
            }
        })
    );

    const isPending = getTypesQuery.isLoading || createMutation.isPending;

    const generateBookingUrl = (slug: string) => {
        if (typeof window === "undefined") return "";
        return `${window.location.origin}/schedule/${slug}`;
    };

    const handleOpen = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            // Data is fetched via useQuery (getTypesQuery)
        } else {
            setIsCreatingType(false);
            setNewTypeName("");
            setNewTypeDuration(30);
        }
    };

    // Effect to sync meetingTypes from query
    useEffect(() => {
        if (getTypesQuery.data) {
            const types = getTypesQuery.data as any[];
            setMeetingTypes(types);
            const defaultType = types.find(t => t.isDefault) || types[0];
            if (defaultType && !selectedMeetingType) {
                setSelectedMeetingType(defaultType);
                setBookingUrl(generateBookingUrl(defaultType.slug));
            }
        }
    }, [getTypesQuery.data, selectedMeetingType]);

    const handleMeetingTypeChange = (typeId: string) => {
        const type = getTypesQuery.data?.find((t) => t.id === typeId);
        if (type) {
            setSelectedMeetingType(type);
            setBookingUrl(generateBookingUrl(type.slug));
        }
    };

    const handleCreateMeetingType = async () => {
        if (!newTypeName.trim()) return;

        const newType = await createMutation.mutateAsync({
            name: newTypeName.trim(),
            slug: newTypeName.toLowerCase().replace(/\s+/g, '-'),
            duration: newTypeDuration,
            isDefault: meetingTypes.length === 0,
        });

        setBookingUrl(generateBookingUrl(newType.slug));
    };

    const handleCopy = async () => {
        if (!bookingUrl) return;

        try {
            await navigator.clipboard.writeText(bookingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const handleVisit = () => {
        if (bookingUrl) {
            window.open(bookingUrl, "_blank");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Link
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Your Booking Link</DialogTitle>
                    <DialogDescription>
                        Select a meeting type and share the link with anyone who wants to
                        book time with you.
                    </DialogDescription>
                </DialogHeader>

                {/* No Connected Account Warning */}
                {hasAccount === false && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                                <LinkIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-amber-900">
                                    Connect a calendar first
                                </p>
                                <p className="text-sm text-amber-700">
                                    You need to connect a Google Calendar account before you can
                                    share your booking link with others.
                                </p>
                            </div>
                            <Button asChild className="mt-2">
                                <Link href="/settings">Go to Settings</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Booking Quota Display */}
                {quota && hasAccount !== false && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {quota.limit === Infinity ? (
                                    "Unlimited bookings"
                                ) : (
                                    <>
                                        {quota.remaining} of {quota.limit} bookings left
                                    </>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {quota.limit === Infinity
                                    ? `${quota.used} received this month`
                                    : `${quota.used} used this month · ${quota.plan} plan`}
                            </p>
                        </div>
                        {quota.limit !== Infinity && quota.remaining <= 1 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {quota.remaining === 0 ? "Limit reached" : "Almost full"}
                            </span>
                        )}
                    </div>
                )}

                {hasAccount !== false && (
                    <div className="space-y-4">
                        {isPending && !selectedMeetingType && !isCreatingType ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : isCreatingType ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="meeting-name">Meeting Name</Label>
                                    <Input
                                        id="meeting-name"
                                        placeholder="e.g., Quick Chat, Consultation"
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="meeting-duration">Duration</Label>
                                    <Select
                                        value={newTypeDuration.toString()}
                                        onValueChange={(v) =>
                                            setNewTypeDuration(Number.parseInt(v) as MeetingDuration)
                                        }
                                    >
                                        <SelectTrigger id="meeting-duration">
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DURATION_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value.toString()}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {option.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleCreateMeetingType}
                                        disabled={!newTypeName.trim() || isPending}
                                        className="flex-1"
                                    >
                                        {isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        Create Meeting Type
                                    </Button>
                                    {meetingTypes.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreatingType(false)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Meeting Type Selector */}
                                <div className="space-y-2">
                                    <Label>Meeting Type</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={selectedMeetingType?.id ?? ""}
                                            onValueChange={handleMeetingTypeChange}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select meeting type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getTypesQuery.data?.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        <span className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {type.name} ({type.duration} min)
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setIsCreatingType(true)}
                                            title="Create new meeting type"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Duration Badge */}
                                {selectedMeetingType && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{selectedMeetingType.duration} minute meeting</span>
                                    </div>
                                )}

                                {/* Booking URL */}
                                {bookingUrl ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={bookingUrl}
                                                readOnly
                                                className="flex-1 font-mono text-sm"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                onClick={handleCopy}
                                                className="shrink-0"
                                            >
                                                {copied ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={handleCopy}
                                                className="flex-1"
                                                variant={copied ? "outline" : "default"}
                                                disabled={isPending}
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copy Link
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleVisit}
                                                className="flex-1"
                                                disabled={isPending}
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Visit Page
                                            </Button>
                                        </div>
                                    </>
                                ) : isPending ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}