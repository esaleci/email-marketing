"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getTemplateById, updateTemplate } from "@/app/actions/template-actions"
import { TemplateEditorWithPreview } from "@/components/template-editor-with-preview"

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [emailContent, setEmailContent] = useState("")
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
      setEmailContent(result.template.content)
    }

    setIsLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    formData.set("content", emailContent) // Use the state we've been tracking

    try {
      const result = await updateTemplate(templateId, formData)

      if ("error" in result) {
        toast({
          title: "Failed to update template",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Template updated",
          description: "The email template has been updated successfully.",
        })

        setTemplate(result.template)
      }
    } catch (error) {
      toast({
        title: "Failed to update template",
        description: "There was a problem updating the template.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Edit Template</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Edit Template</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/templates")}>
            Back to Templates
          </Button>
          <Button variant="outline" asChild>
            <a href={`/dashboard/templates/${templateId}/preview`} target="_blank" rel="noreferrer">
              Open Full Preview
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Email Template</CardTitle>
          <CardDescription>Update your email template details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" name="name" defaultValue={template.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input id="subject" name="subject" defaultValue={template.subject} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Email Content</Label>
              <TemplateEditorWithPreview initialContent={template.content} onContentChange={setEmailContent} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/dashboard/templates")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
