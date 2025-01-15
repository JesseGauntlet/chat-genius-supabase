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
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full p-0 hover:bg-accent/50"
        >
          <span className={cn(
            "h-2.5 w-2.5 rounded-full",
            value === "active" && "bg-green-500",
            value === "away" && "bg-yellow-500",
            value === "busy" && "bg-red-500",
            value === "offline" && "bg-gray-500",
          )} />
          <span className="sr-only">Change status</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" side="right" align="start">
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
                <div className="flex items-center gap-2 flex-1">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    status.value === "active" && "bg-green-500",
                    status.value === "away" && "bg-yellow-500",
                    status.value === "busy" && "bg-red-500",
                    status.value === "offline" && "bg-gray-500",
                  )} />
                  {status.label}
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === status.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 