'use client'

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const statuses = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "away",
    label: "Away",
  },
  {
    value: "busy",
    label: "Do not disturb",
  },
  {
    value: "offline",
    label: "Offline",
  },
]

export function StatusMenu() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("active")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          role="combobox"
          aria-expanded={open}
          className="w-fit justify-start p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <span className={cn(
              "h-2 w-2 rounded-full",
              value === "active" && "bg-green-500",
              value === "away" && "bg-yellow-500",
              value === "busy" && "bg-red-500",
              value === "offline" && "bg-gray-500",
            )} />
            {statuses.find((status) => status.value === value)?.label}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Change status..." />
          <CommandEmpty>No status found.</CommandEmpty>
          <CommandGroup>
            {statuses.map((status) => (
              <CommandItem
                key={status.value}
                value={status.value}
                onSelect={(currentValue) => {
                  setValue(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === status.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    status.value === "active" && "bg-green-500",
                    status.value === "away" && "bg-yellow-500",
                    status.value === "busy" && "bg-red-500",
                    status.value === "offline" && "bg-gray-500",
                  )} />
                  {status.label}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 