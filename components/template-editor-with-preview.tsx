"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EyeIcon, CodeIcon, RefreshCw } from "lucide-react"

interface TemplateEditorProps {
  initialContent: string
  onContentChange: (content: string) => void
  readOnly?: boolean
}

export function TemplateEditorWithPreview({ initialContent, onContentChange, readOnly = false }: TemplateEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [cssContent, setCssContent] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [activeTab, setActiveTab] = useState("editor")

  // Parse out CSS and HTML from the content
  useEffect(() => {
    // Extract CSS from <style> tags
    const cssMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
    const css = cssMatch ? cssMatch[1] : ""
    setCssContent(css)

    // Get HTML without the <style> tags
    const htmlWithoutCss = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    setHtmlContent(htmlWithoutCss)
  }, [content])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange(newContent)
  }

  const handleCssChange = (newCss: string) => {
    // Replace existing CSS or add new style tag if none exists
    const hasStyle = /<style[^>]*>[\s\S]*?<\/style>/i.test(content)

    let newContent
    if (hasStyle) {
      newContent = content.replace(/<style[^>]*>[\s\S]*?<\/style>/i, `<style>${newCss}</style>`)
    } else {
      newContent = `<style>${newCss}</style>\n${content}`
    }

    handleContentChange(newContent)
  }

  const handleHtmlChange = (newHtml: string) => {
    // Keep the existing CSS, just update the HTML
    const cssMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
    const cssTag = cssMatch ? `<style>${cssMatch[1]}</style>` : ""

    const newContent = cssTag ? `${cssTag}\n${newHtml}` : newHtml
    handleContentChange(newContent)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="editor" className="flex items-center gap-1">
              <CodeIcon className="h-4 w-4" />
              HTML Editor
            </TabsTrigger>
            <TabsTrigger value="css" className="flex items-center gap-1">
              <CodeIcon className="h-4 w-4" />
              CSS Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {activeTab === "preview" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("editor")}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>

        <TabsContent value="editor" className="space-y-2">
          <Label htmlFor="html-content">HTML Content</Label>
          <Textarea
            id="html-content"
            className="min-h-[400px] font-mono"
            value={htmlContent}
            onChange={(e) => handleHtmlChange(e.target.value)}
            placeholder="Enter your HTML email content here"
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="css" className="space-y-2">
          <Label htmlFor="css-content">CSS Styles</Label>
          <Textarea
            id="css-content"
            className="min-h-[400px] font-mono"
            value={cssContent}
            onChange={(e) => handleCssChange(e.target.value)}
            placeholder="Enter your CSS styles here"
            readOnly={readOnly}
          />
          <div className="text-xs text-muted-foreground">
            These styles will be included within a &lt;style&gt; tag in your email.
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="p-4 bg-white">
            <div className="border rounded-md p-4 bg-white overflow-auto" style={{ minHeight: "400px" }}>
              <div
                className="email-preview"
                dangerouslySetInnerHTML={{
                  __html: `<style>${cssContent}</style>${htmlContent}`,
                }}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
