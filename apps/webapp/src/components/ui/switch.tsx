import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          onChange={(e) => {
            props.onChange?.(e)
            onCheckedChange?.(e.target.checked)
          }}
          {...props}
        />
        <div
          className={cn(
            'relative w-11 h-6 bg-gray-200 rounded-full peer',
            'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300',
            'peer-checked:after:translate-x-full peer-checked:after:border-white',
            'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
            'after:bg-white after:border-gray-300 after:border after:rounded-full',
            'after:h-5 after:w-5 after:transition-all',
            'peer-checked:bg-blue-600',
            'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
            className
          )}
        />
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
