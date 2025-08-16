import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadFile {
  file: File;
  progress: number;
  id: string;
}

export function DocumentUpload() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest("POST", "/api/documents/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Upload successful",
        description: "Document has been uploaded and is being processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    // Simulate upload progress and then actually upload
    newUploads.forEach((upload) => {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === upload.id
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 95) }
              : f
          )
        );
      }, 500);

      // Actually upload the file
      uploadMutation.mutate(upload.file, {
        onSettled: () => {
          clearInterval(interval);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === upload.id ? { ...f, progress: 100 } : f
            )
          );
          
          // Remove from list after a delay
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== upload.id));
          }, 2000);
        },
      });
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Document Processing</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Upload and process documents for your AI systems</p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? "border-primary bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          data-testid="dropzone-upload"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <CloudUpload className="text-gray-400 text-2xl" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? "Drop files here" : "Drop files here or click to upload"}
              </p>
              <p className="text-sm text-gray-500">Support for PDF, DOC, TXT files up to 50MB each</p>
            </div>
            {!isDragActive && (
              <Button 
                className="bg-primary text-white hover:bg-blue-700"
                data-testid="button-select-files"
              >
                Select Files
              </Button>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadingFiles.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                data-testid={`upload-progress-${upload.id}`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{upload.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(upload.file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32">
                    <Progress value={upload.progress} className="h-2" />
                  </div>
                  <span className="text-xs text-gray-600 w-10">
                    {Math.round(upload.progress)}%
                  </span>
                  {upload.progress < 100 && (
                    <button
                      onClick={() => removeFile(upload.id)}
                      className="text-gray-400 hover:text-gray-600"
                      data-testid={`button-remove-upload-${upload.id}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
