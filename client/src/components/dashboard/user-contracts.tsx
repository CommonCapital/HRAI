'use client'


import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploadModal } from "@/modules/upload-modal/ui/components/upload-modal";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, MoreHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

export default function UserCVAnalyses() {
  
const trpc = useTRPC()
  const {data: analyses} = useSuspenseQuery(trpc.candidates.getUserCVAnalyses.queryOptions());

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const recommendationColors: { [key: string]: string } = {
    "Strong Hire": "bg-green-100 text-green-800 hover:bg-green-200",
    Hire: "bg-green-100 text-green-800 hover:bg-green-200",
    Interview: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    Maybe: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    Pass: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  const industryColors: { [key: string]: string } = {
    Tech: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    Technology: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    Finance: "bg-green-100 text-green-800 hover:bg-green-200",
    Healthcare: "bg-green-100 text-green-800 hover:bg-green-200",
    SaaS: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    Engineering: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    "B2B Software": "bg-purple-100 text-purple-800 hover:bg-purple-200",
    Other: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "candidateName",
      header: () => {
        return <Button variant="ghost">Candidate</Button>;
      },
      cell: ({ row }) => (
        <div className="font-medium">
          {/* ✅ SCHEMA: candidateName is top-level text field */}
          {row.original.candidateName || row.original.id.substring(0, 8)}
        </div>
      ),
    },
    {
      accessorKey: "currentRole",
      header: "Current Role",
      cell: ({ row }) => {
        /* ✅ SCHEMA: currentRole is top-level text field */
        const role = row.original.currentRole || "Not specified";
        return (
          <div className="text-sm text-gray-700">{role}</div>
        );
      },
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => {
        /* ✅ SCHEMA: industry is top-level text field */
        const industry = row.original.industry || "Other";
        const colorClass = industryColors[industry] || industryColors["Other"];
        return (
          <Badge className={cn("rounded-md", colorClass)}>{industry}</Badge>
        );
      },
    },
    {
      accessorKey: "recommendation",
      header: () => {
        return <Button variant="ghost">Recommendation</Button>;
      },
      cell: ({ row }) => {
        /* ✅ SCHEMA: recommendation is top-level enum field
         * Values: "Strong Hire" | "Hire" | "Interview" | "Maybe" | "Pass"
         */
        const recommendation = row.getValue("recommendation") as string;
        const colorClass = recommendationColors[recommendation] || recommendationColors["Pass"];
        return (
          <Badge className={cn("rounded-md font-semibold", colorClass)}>
            {recommendation}
          </Badge>
        );
      },
    },
    {
      accessorKey: "overallScore",
      header: () => {
        return <Button variant="ghost">Score</Button>;
      },
      cell: ({ row }) => {
        /* ✅ SCHEMA: overallScore is top-level integer field */
        const score = parseFloat(row.getValue("overallScore") || "0");
        const scoreColorClass =
          score > 70
            ? "bg-green-100 text-green-800"
            : score < 50
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800";

        return (
          <Badge className={cn("rounded-md", scoreColorClass)}>
            {score.toFixed(0)}/100
          </Badge>
        );
      },
    },
    {
      accessorKey: "roleAlignment.score",
      header: "Role Fit",
      cell: ({ row }) => {
        /* ✅ SCHEMA: roleAlignment is JSONB field with score: number */
        const score = row.original.roleAlignment?.score || 0;
        const scoreColorClass =
          score >= 7
            ? "bg-green-100 text-green-800"
            : score < 5
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800";

        return (
          <Badge className={cn("rounded-md", scoreColorClass)}>
            {score}/10
          </Badge>
        );
      },
    },
    {
      accessorKey: "completenessScore",
      header: "CV Quality",
      cell: ({ row }) => {
        /* ✅ SCHEMA: completenessScore is top-level integer field
         * ✅ SCHEMA: missingCriticalInfo is top-level JSONB array of strings
         */
        const score = row.getValue("completenessScore") as number || 0;
        const missingCount = row.original.missingCriticalInfo?.length || 0;
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{score}%</Badge>
            {missingCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {missingCount}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const analysis = row.original;
        const queryClient = useQueryClient();
        const trpc = useTRPC();

        const deleteMutation = useMutation(
          trpc.candidates.deleteCVAnalysis.mutationOptions({
            onSuccess: () => {
              toast.success("CV analysis deleted successfully");
              queryClient.invalidateQueries({ queryKey: ["candidates"] });
            },
            onError: (error) => {
              toast.error("Failed to delete CV analysis");
            },
          })
        );
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/candidate/${analysis.id}`}>
                  View Analysis
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog >
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e: any) => e.preventDefault()}>
                    <span className="text-destructive">Delete Analysis</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this CV analysis and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ id: analysis.id })}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Continue"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: analyses ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const totalCVs = analyses?.length || 0;
  const averageScore =
    totalCVs > 0
      ? (analyses?.reduce(
          (sum, analysis) => sum + (analysis.overallScore ?? 0),
          0
        ) ?? 0) / totalCVs
      : 0;

  /* ✅ SCHEMA: recommendation is enum with values "Strong Hire" | "Hire" | "Interview" | "Maybe" | "Pass" */
  const recommendedCandidates =
    analyses?.filter((analysis) => 
      analysis.recommendation === "Strong Hire" || analysis.recommendation === "Hire"
    ).length ?? 0;

  /* ✅ SCHEMA: redFlags is JSONB with structure:
   * {
   *   critical?: { issue: string; description: string; recommendation?: string }[];
   *   moderate?: { issue: string; description: string; mitigatingFactors?: string }[];
   *   minor?: string[];
   * }
   */
  const criticalRedFlags =
    analyses?.filter(
      (analysis) =>
        analysis.redFlags?.critical && analysis.redFlags.critical.length > 0
    ).length ?? 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CV Analysis</h1>
          <p className="text-gray-600 mt-1">
            Professional candidate evaluation
          </p>
        </div>
        <Button  
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-black hover:bg-gray-900 text-white"
        >
          <Sparkles className="mr-2 size-4" />
          Analyze New CV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCVs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(0)}/100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recommended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{recommendedCandidates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalRedFlags}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No CVs analyzed yet. Upload one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
      
      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => table.reset()}
      />
    </div>
  );
}