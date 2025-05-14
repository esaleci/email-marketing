"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { importRecipients, getRecipients } from "@/app/actions/recipient-actions"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Upload, FileUp, Users, Plus } from "lucide-react"

export default function RecipientsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [recipients, setRecipients] = useState<any[]>([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 10 })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("list")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadRecipients(1)
  }, [])

  async function loadRecipients(page: number) {
    setIsLoading(true)
    const result = await getRecipients(page)

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setRecipients(result.recipients)
      setPagination(result.pagination)
    }

    setIsLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleQuickImport = async (selectedFile: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const result = await importRecipients(formData)

      if ("error" in result) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Upload successful",
          description: result.message,
        })

        setFile(null)
        // Reset the file input
        if (fileInputRef.current) fileInputRef.current.value = ""

        // Reload recipients
        loadRecipients(1)
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleUpload(formData: FormData) {
    setIsUploading(true)

    try {
      const result = await importRecipients(formData)

      if ("error" in result) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Upload successful",
          description: result.message,
        })

        setFile(null)
        // Reset the file input
        const fileInput = document.getElementById("csv-file") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        // Reload recipients
        loadRecipients(1)

        // Switch back to list tab
        setActiveTab("list")
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        )
      case "Unsubscribed":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Unsubscribed
          </Badge>
        )
      case "Bounced":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Bounced
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Recipients</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportClick} className="flex items-center gap-2">
            <Upload size={16} />
            <span>Import CSV</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleQuickImport(e.target.files[0])
              }
            }}
          />
          <Button>
            <Plus size={16} className="mr-2" />
            Add Recipient
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users size={16} />
            Recipient List
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileUp size={16} />
            Import Recipients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Recipients</CardTitle>
              <CardDescription>Manage your recipient list and view their status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <p>Loading recipients...</p>
                </div>
              ) : recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <p>No recipients found. Import some recipients to get started.</p>
                  <Button onClick={() => setActiveTab("import")} className="flex items-center gap-2">
                    <FileUp size={16} />
                    Import Recipients
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Email Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((recipient) => (
                        <TableRow key={recipient.id}>
                          <TableCell className="font-medium">{recipient.email}</TableCell>
                          <TableCell>{recipient.name || "-"}</TableCell>
                          <TableCell>{recipient.company || "-"}</TableCell>
                          <TableCell>{getStatusBadge(recipient.status)}</TableCell>
                          <TableCell>
                            {recipient.last_sent ? new Date(recipient.last_sent).toLocaleDateString() : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {pagination.pages > 1 && (
              <CardFooter>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (pagination.page > 1) {
                            loadRecipients(pagination.page - 1)
                          }
                        }}
                        className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            loadRecipients(page)
                          }}
                          isActive={page === pagination.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (pagination.page < pagination.pages) {
                            loadRecipients(pagination.page + 1)
                          }
                        }}
                        className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Recipients</CardTitle>
              <CardDescription>Upload a CSV file to import recipients</CardDescription>
            </CardHeader>
            <form action={handleUpload}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input id="csv-file" name="file" type="file" accept=".csv" onChange={handleFileChange} required />
                  <p className="text-sm text-muted-foreground">
                    The CSV file should have the following columns: email (required), name, company, phone
                  </p>
                </div>
                {file && (
                  <div className="rounded-md bg-muted p-4">
                    <p className="font-medium">Selected file:</p>
                    <p className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
                <div className="rounded-md border border-dashed p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-medium">Drag and drop your CSV file here</h3>
                    <p className="text-sm text-muted-foreground">Or click the button below to browse files</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById("csv-file")?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                </div>
                <div className="bg-muted rounded-md p-4">
                  <h3 className="font-medium mb-2">CSV Format Example:</h3>
                  <pre className="text-xs overflow-auto p-2 bg-background rounded border">
                    email,name,company,phone
                    <br />
                    john@example.com,John Doe,Acme Inc,555-1234
                    <br />
                    jane@example.com,Jane Smith,XYZ Corp,555-5678
                    <br />
                  </pre>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!file || isUploading} className="w-full">
                  {isUploading ? "Uploading..." : "Upload and Import"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
