"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getTemplateById } from "@/app/actions/template-actions"
import { TemplateEditorWithPreview } from "@/components/template-editor-with-preview"

export default function PreviewTemplatePage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const templateId = Number.parseInt(params.id)

  useEffect(() => {
    loadTemplate()
  }, [])

  async function loadTemplate() {
    setIsLoading(true)
    const result = await getTemplateById(templateId)

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      router.push("/dashboard/templates")
    } else {
      setTemplate(result.template)
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Template Preview</h2>
        </div>
        <div className="flex justify-center py-8">
          <p>Loading template...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Template Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/dashboard/templates/${templateId}`}>Edit</a>
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/templates")}>
            Back to Templates
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>Subject: {template.subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateEditorWithPreview initialContent={template.content} onContentChange={() => {}} readOnly />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Last modified: {new Date(template.updated_at).toLocaleDateString()}
          </div>
          <Button variant="outline" asChild>
            <a href={`/dashboard/campaigns/new?template=${templateId}`}>Use in Campaign</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
