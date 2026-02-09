import { ReactNode, useState } from "react";
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandResponsiveDialog
} from '@/components/ui/command';

interface Props {
  options: Array<{
    id: string;
    value: string;
    children: ReactNode;
  }>
  onSelect: (value: string) => void;
  onSearch?: (value: string) => void;
  value: string;
  placeholder?: string;
  isSearchable?: boolean;
  className?: string;
}

export const CommandSelect = ({
  options,
  onSelect,
  onSearch,
  value,
  placeholder = "Select an option",
  className,
  isSearchable
}: Props) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const handleOpenChange = (open: boolean) => {
    onSearch?.("");
    setOpen(open);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
        className={cn(
          "h-12 justify-between font-light px-4 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary",
          !selectedOption && "text-muted-foreground opacity-60",
          className
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.children ?? placeholder}
        </div>
        <ChevronsUpDown size={16} strokeWidth={1.5} className="ml-2 opacity-50 flex-shrink-0" />
      </Button>

      <CommandResponsiveDialog
        shouldFilter={!onSearch}
        open={open}
        onOpenChange={handleOpenChange}
        className="bg-white border-2 border-primary/20"

      >
        <CommandInput
          placeholder="Search..."
          onValueChange={onSearch}
          className="h-12 border-b border-primary/10 font-light bg-white"
        />
        <CommandList className="bg-white max-h-[300px]">
          <CommandEmpty className="py-6 bg-white">
            <span className="text-sm font-light opacity-60">
              No options found
            </span>
          </CommandEmpty>
          {options.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              className={cn(
                "cursor-pointer font-light hover:bg-primary/5 data-[selected=true]:bg-primary/10 py-3 px-4",
                "flex items-center gap-2"
              )}
            >
              <Check
                size={16}
                strokeWidth={1.5}
                className={cn(
                  "text-primary flex-shrink-0",
                  value === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex-1 min-w-0">
                {option.children}
              </div>
            </CommandItem>
          ))}
        </CommandList>
      </CommandResponsiveDialog>
    </>
  );
};