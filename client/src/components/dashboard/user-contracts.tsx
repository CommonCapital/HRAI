'use client'
import { ContractAnalysis } from "@/lib/contract.interface";

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

export default function UserContracts() {
  
const trpc = useTRPC()
  const {data: contracts} = useSuspenseQuery(trpc.contracts.getUserContracts.queryOptions());

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const verdictColors: { [key: string]: string } = {
    "Strong Lead": "bg-green-100 text-green-800 hover:bg-green-200",
    Invest: "bg-green-100 text-green-800 hover:bg-green-200",
    Track: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    Monitor: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    Pass: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  const sectorColors: { [key: string]: string } = {
    FinTech: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    HealthTech: "bg-green-100 text-green-800 hover:bg-green-200",
    SaaS: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    "E-commerce": "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    DeepTech: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    Other: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "overview.companyName",
      header: () => {
        return <Button variant="ghost">Company</Button>;
      },
      cell: ({ row }) => (
  <div className="font-medium">
    {row.original.overview?.companyName || row.original.id.substring(0, 8)}
    {/* ✅ CORRECT - using id */}
  </div>
),
    },
    {
      accessorKey: "overview.sector",
      header: "Sector",
      cell: ({ row }) => {
        const sector = row.original.overview?.sector || "Other";
        const colorClass = sectorColors[sector] || sectorColors["Other"];
        return (
          <Badge className={cn("rounded-md", colorClass)}>{sector}</Badge>
        );
      },
    },
    {
      accessorKey: "verdict",
      header: () => {
        return <Button variant="ghost">Verdict</Button>;
      },
      cell: ({ row }) => {
        const verdict = row.getValue("verdict") as string;
        const colorClass = verdictColors[verdict] || verdictColors["Pass"];
        return (
          <Badge className={cn("rounded-md font-semibold", colorClass)}>
            {verdict}
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
      accessorKey: "fundAlignment.score",
      header: "Fund Fit",
      cell: ({ row }) => {
        const score = row.original.fundAlignment?.score || 0;
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
      accessorKey: "dataQualityScore",
      header: "Data Quality",
      cell: ({ row }) => {
        const score = row.getValue("dataQualityScore") as number || 0;
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
        const contract = row.original;
const queryClient = useQueryClient();
    const trpc = useTRPC();

    // ✅ Add delete mutation
    const deleteMutation = useMutation(
      trpc.contracts.deleteContract.mutationOptions({
        onSuccess: () => {
          toast.success("Analysis deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
        },
        onError: (error) => {
          toast.error("Failed to delete analysis");
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
            <Link href={`/contract/${contract.id}`}>
              View Analysis
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
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
                  this pitch deck analysis and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {/* ✅ Add onClick handler */}
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate({ id: contract.id })}
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
    data: contracts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const totalDecks = contracts?.length || 0;
  const averageScore =
    totalDecks > 0
      ? (contracts?.reduce(
          (sum, contract) => sum + (contract.overallScore ?? 0),
          0
        ) ?? 0) / totalDecks
      : 0;

  const investableDecks =
    contracts?.filter((contract) => 
      contract.verdict === "Invest" || contract.verdict === "Strong Lead"
    ).length ?? 0;

  const highRiskDecks =
    contracts?.filter(
      (contract) =>
        contract.risks?.tier1 && contract.risks.tier1.length > 0
    ).length ?? 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header - Simplified with only Analyze button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pitch Deck Analysis</h1>
          <p className="text-gray-600 mt-1">
            VC-grade startup evaluation
          </p>
        </div>
        <Button  
      onClick={() => setIsUploadModalOpen(true)}
      className="bg-black hover:bg-gray-900 text-white"
      >
      <Sparkles className="mr-2 size-4" />
       Analyze New Deck
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
            <div className="text-2xl font-bold">{totalDecks}</div>
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
              Strong Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{investableDecks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Risk (Tier 1)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRiskDecks}</div>
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
                  No pitch decks analyzed yet. Upload one to get started!
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

