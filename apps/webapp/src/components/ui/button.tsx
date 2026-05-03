import { type ButtonVariants, buttonVariants } from '@dfs/ui/variants/button'
import { Slot as SlotPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = React.ComponentProps<'button'> &
  ButtonVariants & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
