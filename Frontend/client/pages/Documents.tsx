import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  Folder,
  Search,
  Eye,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  MoreVertical,
  Cloud,
  Globe,
  Zap,
  Database,
  Star,
  Tag,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "TXT";
  size: string;
  uploadedAt: string;
  status: "processing" | "completed" | "error" | "pending";
  category: string;
  summary?: string;
  confidence: number;
  tags: string[];
  source: "upload" | "google-drive" | "dropbox";
}

interface ProcessingJob {
  id: string;
  fileName: string;
  progress: number;
  stage: string;
  estimatedTime: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Employment Contract - John Doe.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedAt: "2024-01-15T10:30:00Z",
    status: "completed",
    category: "Legal Contracts",
    summary:
      "Standard employment agreement for software engineer position with competitive compensation package and benefits.",
    confidence: 0.95,
    tags: ["Employment", "Contract", "Engineer", "Benefits"],
    source: "upload",
  },
  {
    id: "2",
    name: "Financial Report Q4 2023.docx",
    type: "DOCX",
    size: "1.8 MB",
    uploadedAt: "2024-01-15T09:15:00Z",
    status: "completed",
    category: "Financial Reports",
    summary:
      "Quarterly financial performance showing 12% revenue growth and improved operational efficiency.",
    confidence: 0.89,
    tags: ["Q4", "Financial", "Revenue", "Growth"],
    source: "google-drive",
  },
  {
    id: "3",
    name: "Meeting Notes - Strategy Session.txt",
    type: "TXT",
    size: "45 KB",
    uploadedAt: "2024-01-15T08:45:00Z",
    status: "processing",
    category: "Meeting Notes",
    summary: "",
    confidence: 0,
    tags: [],
    source: "upload",
  },
];

const mockProcessingJobs: ProcessingJob[] = [
  {
    id: "1",
    fileName: "Meeting Notes - Strategy Session.txt",
    progress: 65,
    stage: "Extracting metadata and key terms",
    estimatedTime: "2 minutes",
  },
  {
    id: "2",
    fileName: "Legal Brief - Case 2024-001.pdf",
    progress: 25,
    stage: "OCR text extraction",
    estimatedTime: "5 minutes",
  },
];

const categories = [
  "All Documents",
  "Legal Contracts",
  "Financial Reports",
  "Meeting Notes",
  "Research Papers",
  "Compliance Documents",
  "Client Communications",
];

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "processing":
      return "text-blue-600";
    case "error":
      return "text-red-600";
    case "pending":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "processing":
      return RefreshCw;
    case "error":
      return AlertTriangle;
    case "pending":
      return Clock;
    default:
      return Clock;
  }
}

function getSourceIcon(source: string) {
  switch (source) {
    case "google-drive":
      return Globe;
    case "dropbox":
      return Cloud;
    default:
      return Upload;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function Documents() {
  const [selectedCategory, setSelectedCategory] = useState("All Documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesCategory =
      selectedCategory === "All Documents" || doc.category === selectedCategory;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesCategory && matchesSearch;
  });

  const simulateFileUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const renderUploadArea = () => (
    <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
      <CardContent className="p-8">
        {!isUploading ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, DOCX, TXT • Max 50MB per file
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <Button className="flex-1" onClick={simulateFileUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <Button variant="outline" className="flex-1">
                <Folder className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Uploading Documents
              </h3>
              <Progress
                value={uploadProgress}
                className="w-full max-w-sm mx-auto"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {uploadProgress}% complete
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProcessingQueue = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <span>Processing Queue</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockProcessingJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No documents currently processing</p>
          </div>
        ) : (
          mockProcessingJobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{job.fileName}</p>
                <Badge variant="outline">{job.estimatedTime} remaining</Badge>
              </div>
              <Progress value={job.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{job.stage}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderSyncIntegrations = () => (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Storage Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-sm text-muted-foreground">Auto-sync enabled</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">Connected</Badge>
            <Button size="sm" variant="outline">
              Configure
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Cloud className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium">Dropbox</p>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
          </div>
          <Button size="sm" variant="outline">
            Connect
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium">SharePoint</p>
              <p className="text-sm text-muted-foreground">
                Enterprise feature
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" disabled>
            Coming Soon
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentLibrary = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, summaries, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDocuments.map((doc) => {
          const StatusIcon = getStatusIcon(doc.status);
          const SourceIcon = getSourceIcon(doc.source);

          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">{doc.name}</h4>
                        <Badge variant="outline">{doc.type}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <span>{doc.size}</span>
                        <span className="flex items-center space-x-1">
                          <SourceIcon className="h-3 w-3" />
                          <span>{formatDate(doc.uploadedAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Tag className="h-3 w-3" />
                          <span>{doc.category}</span>
                        </span>
                      </div>
                      {doc.summary && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {doc.summary}
                        </p>
                      )}
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {doc.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        className={`h-4 w-4 ${getStatusColor(doc.status)} ${doc.status === "processing" ? "animate-spin" : ""}`}
                      />
                      <span
                        className={`text-sm ${getStatusColor(doc.status)} capitalize`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    {doc.confidence > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(doc.confidence * 100)}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Search className="h-3 w-3 mr-1" />
                      Search in Doc
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Upload your first document to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Document Processing
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload, process, and manage your AI-powered document library
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {renderUploadArea()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Text Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    OCR for scanned documents and images
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Database className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Auto-Embedding</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic chunking and vector storage
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">AI Summarization</h4>
                  <p className="text-sm text-muted-foreground">
                    Key insights and metadata extraction
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="processing">
            {renderProcessingQueue()}
          </TabsContent>

          <TabsContent value="library">{renderDocumentLibrary()}</TabsContent>

          <TabsContent value="sync">{renderSyncIntegrations()}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
