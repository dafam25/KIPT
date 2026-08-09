import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  label: string;
}

export function Stepper({ steps, currentStep }: { steps: StepperStep[]; currentStep: number }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <div key={step.label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  isActive && !isDone && 'border-primary text-primary',
                  !isDone && !isActive && 'border-border text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-2 h-px flex-1', isDone ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
