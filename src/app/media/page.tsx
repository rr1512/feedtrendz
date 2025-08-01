'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select'
import { Badge } from '@/frontend/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/frontend/components/ui/dialog'
import { 
  Search, 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
  Filter,
  Plus,
  FolderPlus,
  MoreHorizontal
} from 'lucide-react'
import { formatFileSize, formatDateTime, isImageFile, isVideoFile } from '@/frontend/lib/utils'
import { cn } from '@/frontend/lib/utils'

interface MediaFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedBy: {
    id: string
    name: string
    avatar?: string
  }
  uploadedAt: string
  folder: string
  tags: string[]
}

interface MediaFolder {
  id: string
  name: string
  fileCount: number
  createdAt: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  useEffect(() => {
    fetchMediaFiles()
    fetchFolders()
  }, [])

  useEffect(() => {
    filterAndSortFiles()
  }, [files, searchTerm, typeFilter, folderFilter, sortBy])

  const fetchMediaFiles = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      const mockData: MediaFile[] = [
        {
          id: '1',
          name: 'product-hero-image.jpg',
          type: 'image/jpeg',
          size: 2048576,
          url: '/mock-images/product-hero.jpg',
          uploadedBy: { id: '1', name: 'Sarah Johnson' },
          uploadedAt: '2024-01-15T10:00:00Z',
          folder: 'Product Images',
          tags: ['product', 'hero', 'marketing']
        },
        {
          id: '2',
          name: 'tutorial-video.mp4',
          type: 'video/mp4',
          size: 15728640,
          url: '/mock-videos/tutorial.mp4',
          uploadedBy: { id: '2', name: 'Mike Chen' },
          uploadedAt: '2024-01-14T14:30:00Z',
          folder: 'Video Content',
          tags: ['tutorial', 'education', 'video']
        },
        {
          id: '3',
          name: 'brand-guidelines.pdf',
          type: 'application/pdf',
          size: 1024000,
          url: '/mock-files/brand-guidelines.pdf',
          uploadedBy: { id: '1', name: 'Sarah Johnson' },
          uploadedAt: '2024-01-13T09:15:00Z',
          folder: 'Brand Assets',
          tags: ['brand', 'guidelines', 'document']
        },
        {
          id: '4',
          name: 'social-media-template.psd',
          type: 'application/photoshop',
          size: 5242880,
          url: '/mock-files/template.psd',
          uploadedBy: { id: '3', name: 'Design Team' },
          uploadedAt: '2024-01-12T16:45:00Z',
          folder: 'Templates',
          tags: ['template', 'social', 'design']
        }
      ]

      setFiles(mockData)
    } catch (error) {
      console.error('Failed to fetch media files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      // TODO: Replace with actual API call
      const mockFolders: MediaFolder[] = [
        { id: '1', name: 'Product Images', fileCount: 15, createdAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Video Content', fileCount: 8, createdAt: '2024-01-02T00:00:00Z' },
        { id: '3', name: 'Brand Assets', fileCount: 12, createdAt: '2024-01-03T00:00:00Z' },
        { id: '4', name: 'Templates', fileCount: 6, createdAt: '2024-01-04T00:00:00Z' }
      ]

      setFolders(mockFolders)
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }

  const filterAndSortFiles = () => {
    let filtered = files

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => {
        switch (typeFilter) {
          case 'images':
            return isImageFile(file.name)
          case 'videos':
            return isVideoFile(file.name)
          case 'documents':
            return !isImageFile(file.name) && !isVideoFile(file.name)
          default:
            return true
        }
      })
    }

    // Folder filter
    if (folderFilter !== 'all') {
      filtered = filtered.filter(file => file.folder === folderFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        case 'oldest':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return b.size - a.size
        default:
          return 0
      }
    })

    setFilteredFiles(filtered)
  }

  const getFileIcon = (file: MediaFile) => {
    if (isImageFile(file.name)) {
      return <Image className="h-4 w-4" />
    } else if (isVideoFile(file.name)) {
      return <Video className="h-4 w-4" />
    } else {
      return <FileText className="h-4 w-4" />
    }
  }

  const getFileTypeColor = (file: MediaFile) => {
    if (isImageFile(file.name)) {
      return 'bg-green-100 text-green-800'
    } else if (isVideoFile(file.name)) {
      return 'bg-blue-100 text-blue-800'
    } else {
      return 'bg-gray-100 text-gray-800'
    }
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleDeleteSelected = async () => {
    // TODO: Implement bulk delete
    console.log('Deleting files:', selectedFiles)
    setFiles(files.filter(f => !selectedFiles.includes(f.id)))
    setSelectedFiles([])
  }

  const handleDownloadFile = (file: MediaFile) => {
    // TODO: Implement file download
    console.log('Downloading file:', file.name)
  }

  const handleUploadFiles = async (uploadedFiles: File[]) => {
    // TODO: Implement file upload
    console.log('Uploading files:', uploadedFiles)
    setShowUploadDialog(false)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-muted-foreground mt-2">
              Shared media storage for your team collaboration
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Upload files to your media library
                  </DialogDescription>
                </DialogHeader>
                {/* TODO: Add upload form */}
                <div className="p-4">
                  <p>File upload form will be implemented here</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats and Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Images</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {files.filter(f => isImageFile(f.name)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {files.filter(f => isVideoFile(f.name)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
            </SelectContent>
          </Select>

          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.name}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Files Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">
              {selectedFiles.length} file(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Files Display */}
        <div className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No files found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' || folderFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Upload your first file to get started'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedFiles.includes(file.id) && "ring-2 ring-primary"
                  )}
                  onClick={() => handleFileSelect(file.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {/* File Preview */}
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                        {isImageFile(file.name) ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-md flex items-center justify-center">
                            <Image className="h-8 w-8 text-white" />
                          </div>
                        ) : isVideoFile(file.name) ? (
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-500 rounded-md flex items-center justify-center">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-md flex items-center justify-center">
                            <FileText className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="space-y-1">
                        <div className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer",
                        selectedFiles.includes(file.id) && "bg-primary/5"
                      )}
                      onClick={() => handleFileSelect(file.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file)}
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {file.folder} • {formatFileSize(file.size)} • 
                              Uploaded by {file.uploadedBy.name} on {formatDateTime(file.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadFile(file)
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}