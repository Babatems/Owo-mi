'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CategoryTree } from '@/lib/actions/categories'

interface CategoryComboboxProps {
  categories: CategoryTree[]
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
}

function flattenCategories(
  cats: CategoryTree[],
  parentName?: string
): { id: string; label: string; icon: string | null; color: string | null }[] {
  return cats.flatMap((cat) => [
    {
      id: cat.id,
      label: parentName ? `${parentName} › ${cat.name}` : cat.name,
      icon: cat.icon,
      color: cat.color,
    },
    ...flattenCategories(cat.children, cat.name),
  ])
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = 'Select category…',
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const flat = flattenCategories(categories)
  const selected = flat.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between font-normal')}
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            {selected.icon && <span>{selected.icon}</span>}
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 opacity-40" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories…" />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {flat.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.label}
                  onSelect={() => {
                    onChange(cat.id === value ? undefined : cat.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('mr-2 size-4', cat.id === value ? 'opacity-100' : 'opacity-0')}
                  />
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  <span className="truncate text-sm">{cat.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
