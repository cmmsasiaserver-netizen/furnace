import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PlaceholderPageProps {
    title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed bg-muted/50">
                        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                            <span className="text-lg font-semibold">Coming Soon</span>
                            <span className="text-sm">This module is under development.</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
