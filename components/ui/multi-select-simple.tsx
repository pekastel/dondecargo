'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
  searchPlaceholder = 'Search...',
  noResultsText = 'No items found.',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((i) => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-auto min-h-10 p-2', className)}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm py-1">{placeholder}</span>
            ) : (
              <>
                {selected.slice(0, 3).map((item) => {
                  const option = options.find((opt) => opt.value === item);
                  return (
                    <Badge
                      variant="secondary"
                      key={item}
                      className="mr-1 mb-1 px-2 py-1 text-xs flex items-center gap-1 hover:bg-secondary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      <span className="max-w-[100px] truncate">
                        {option?.label}
                      </span>
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                    </Badge>
                  );
                })}
                {selected.length > 3 && (
                  <Badge variant="outline" className="mr-1 mb-1 px-2 py-1 text-xs">
                    +{selected.length - 3} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {noResultsText}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    selected.includes(option.value) && 'bg-accent/50'
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-primary',
                      selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-2 bg-muted/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selected.length} selected</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="text-destructive hover:text-destructive/80"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}