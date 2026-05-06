import { Card, CardContent } from '@/components/ui/card'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Savings Goals</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Coming in Phase 3.</p>
      </div>
      <Card className="border-dashed border-neutral-200">
        <CardContent className="pt-10 pb-10 text-center">
          <p className="text-sm text-neutral-400">
            Goal tracking with velocity projections — planned for Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
