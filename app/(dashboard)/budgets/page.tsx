import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Budgets</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Coming in Phase 3.</p>
      </div>
      <Card className="border-dashed border-neutral-200">
        <CardContent className="pt-10 pb-10 text-center">
          <p className="text-sm text-neutral-400">
            Envelope budgeting with rollover and overspend alerts — planned for Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
